import React, { useState, useEffect } from 'react';
import { useLanguage } from '../src/contexts/LanguageContext';

interface Team {
    name: string;
    flag: string;
    code: string;
}

interface Match {
    id: string;
    group: string;
    round: string;
    home: Team;
    away: Team;
    kickoff: string;
    venue: { name: string; city: string };
    status?: 'scheduled' | 'live' | 'finished';
    score?: { home: number; away: number };
    elapsed?: number | null;
}

interface UpcomingMatchesTickerProps {
    onMatchClick?: (match: Match) => void;
}

export const UpcomingMatchesTicker: React.FC<UpcomingMatchesTickerProps> = ({ onMatchClick }) => {
    const { language } = useLanguage();
    const [matches, setMatches] = useState<Match[]>([]);
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const response = await fetch('/api/worldcup/matches');
                if (response.ok) {
                    const data = await response.json();
                    setMatches(data);
                }
            } catch (err) {
                console.error("Failed to fetch matches for ticker:", err);
            }
        };
        fetchMatches();

        // Re-fetch every 60 seconds to reflect server-side status and score updates
        const refreshInterval = setInterval(fetchMatches, 60 * 1000);
        return () => clearInterval(refreshInterval);
    }, []);

    if (matches.length === 0) return null;

    // Helper to format date label
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterdayDate = new Date(today);
        yesterdayDate.setDate(today.getDate() - 1);
        const tomorrowDate = new Date(today);
        tomorrowDate.setDate(today.getDate() + 1);

        const isSameDay = (d1: Date, d2: Date) => 
            d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();

        if (isSameDay(date, today)) return language === 'fr' ? "Aujourd'hui" : "Today";
        if (isSameDay(date, yesterdayDate)) return language === 'fr' ? "Hier" : "Yesterday";
        if (isSameDay(date, tomorrowDate)) return language === 'fr' ? "Demain" : "Tomorrow";

        return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' });
    };

    // Helper to format time label
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // Group matches by date for display
    const matchesByDate: { [key: string]: Match[] } = {};
    
    // Filter matches: from yesterday up to 10 days in the future
    const now = new Date();
    const startOfYesterday = new Date(now);
    startOfYesterday.setDate(now.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfTenDays = new Date(now);
    endOfTenDays.setDate(now.getDate() + 10);
    endOfTenDays.setHours(23, 59, 59, 999);

    const filteredMatches = matches.filter(m => {
        const matchDate = new Date(m.kickoff);
        return matchDate >= startOfYesterday && matchDate <= endOfTenDays;
    });

    filteredMatches.forEach(m => {
        const dateKey = formatDate(m.kickoff);
        if (!matchesByDate[dateKey]) {
            matchesByDate[dateKey] = [];
        }
        matchesByDate[dateKey].push(m);
    });

    // Duplicate list of items to create seamless loop marquee effect
    const dateKeys = Object.keys(matchesByDate);

    const renderMarqueeContent = () => (
        <div className="flex items-center gap-6 whitespace-nowrap py-1 pr-6">
            {dateKeys.map(dateKey => (
                <React.Fragment key={dateKey}>
                    {/* Date separator */}
                    <span className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 select-none transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                        {dateKey}
                    </span>

                    {/* Matches on this date */}
                    {matchesByDate[dateKey].map(match => (
                        <button
                            key={match.id}
                            onClick={() => onMatchClick?.(match)}
                            className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 transition-all text-left text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                        >
                            {(() => {
                                if (match.status === 'live' && match.score) {
                                    return (
                                        <span className="text-[10px] md:text-[11px] font-jersey text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md select-none inline-flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span>{match.score.home}</span>
                                            <span className="font-sans text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mx-[0.5px] select-none font-bold">-</span>
                                            <span>{match.score.away}</span>
                                        </span>
                                    );
                                }
                                if (match.status === 'finished' && match.score) {
                                    return (
                                        <span className="text-[10px] md:text-[11px] font-jersey text-slate-500 dark:text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-md select-none inline-flex items-center gap-1.5">
                                            <span>{match.score.home}</span>
                                            <span className="font-sans text-[10px] text-slate-500/70 dark:text-slate-400/70 mx-[0.5px] select-none font-bold">-</span>
                                            <span>{match.score.away}</span>
                                            <span className="font-sans text-[8px] uppercase tracking-wider font-bold text-slate-500 ml-0.5">FIN</span>
                                        </span>
                                    );
                                }
                                const timeStr = formatTime(match.kickoff);
                                if (timeStr.includes(':')) {
                                    const parts = timeStr.split(':');
                                    return (
                                        <span className="text-[10px] md:text-[11px] font-jersey text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md select-none inline-flex items-center">
                                            <span>{parts[0]}</span>
                                            <span className="font-sans text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mx-[0.5px] select-none translate-y-[-1px] font-bold">:</span>
                                            <span>{parts[1]}</span>
                                        </span>
                                    );
                                }
                                return (
                                    <span className="text-[10px] md:text-[11px] font-jersey text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md select-none">
                                        {timeStr}
                                    </span>
                                );
                            })()}
                            <span className="flex items-center gap-1.5">
                                <img 
                                    src={`https://flagcdn.com/${match.home.code.toLowerCase()}.svg`} 
                                    alt={match.home.name} 
                                    className="w-5 h-3.5 object-cover rounded-[2px] border border-slate-300/20 dark:border-slate-700/20 shadow-sm" 
                                />
                                <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-black tracking-wider uppercase">vs</span>
                                <img 
                                    src={`https://flagcdn.com/${match.away.code.toLowerCase()}.svg`} 
                                    alt={match.away.name} 
                                    className="w-5 h-3.5 object-cover rounded-[2px] border border-slate-300/20 dark:border-slate-700/20 shadow-sm" 
                                />
                            </span>
                            <span className="text-[10px] md:text-[11px] text-slate-600 dark:text-slate-300 font-bold truncate max-w-[150px] hidden sm:block">
                                {match.home.name} - {match.away.name}
                            </span>
                        </button>
                    ))}
                    
                    {/* Dot separator */}
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400/30 dark:bg-slate-600/30 mx-1 flex-shrink-0"></span>
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className="w-full relative overflow-hidden bg-gradient-to-r from-red-500/10 via-emerald-500/10 to-indigo-500/10 dark:from-red-500/20 dark:via-emerald-500/20 dark:to-indigo-500/20 border-y border-slate-200/30 dark:border-white/5 flex items-center h-11 md:h-13 z-20 backdrop-blur-md transition-colors duration-300">
            {/* Absolute positioning overlays to fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-white dark:from-[#0a1020] to-transparent pointer-events-none z-10 opacity-70"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-white dark:from-[#0a1020] to-transparent pointer-events-none z-10 opacity-70"></div>

            {/* Marquee Scroller */}
            <div className="flex-1 overflow-hidden relative w-full h-full flex items-center">
                <div 
                    className="flex whitespace-nowrap animate-marquee items-center"
                    style={{ 
                        animationPlayState: isPlaying ? 'running' : 'paused',
                        animationDuration: '180s',
                        animationTimingFunction: 'linear',
                        animationIterationCount: 'infinite'
                    }}
                >
                    {renderMarqueeContent()}
                    {renderMarqueeContent()} {/* Duplicated for loop coverage */}
                </div>
            </div>

            {/* Play/Pause Button */}
            <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 mr-2 z-25 focus:outline-none transition-colors cursor-pointer"
                aria-label={isPlaying ? "Mettre en pause le défilement" : "Lancer le défilement"}
            >
                <span className="material-symbols-outlined notranslate text-base" translate="no">
                    {isPlaying ? 'pause' : 'play_arrow'}
                </span>
            </button>

            {/* Global style keyframe injector */}
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee linear infinite;
                    will-change: transform;
                    transform: translateZ(0);
                    backface-visibility: hidden;
                }
            `}</style>
        </div>
    );
};
export default UpcomingMatchesTicker;
