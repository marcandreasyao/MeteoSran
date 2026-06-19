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
        <div className="flex items-center gap-4 whitespace-nowrap py-1 pr-6 h-full">
            {dateKeys.map((dateKey, index) => (
                <React.Fragment key={dateKey}>
                    {/* Date separator (not needed for the very first item if we want, but fine to keep) */}
                    {index > 0 && <span className="w-1 h-1 rounded-full bg-white/40 dark:bg-white/40 flex-shrink-0"></span>}
                    
                    <span className="text-[12px] md:text-[13px] font-bold text-white tracking-wide select-none drop-shadow-sm">
                        {dateKey}
                    </span>

                    {/* Matches on this date */}
                    {matchesByDate[dateKey].map(match => {
                        const isLive = match.status === 'live';
                        const isFinished = match.status === 'finished';
                        
                        // Base classes for all match pills
                        const pillClasses = "inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-bold focus:outline-none cursor-pointer flex-shrink-0 border border-transparent hover:border-white/20 " + 
                            (isLive 
                                ? "bg-[#d4142a] text-white shadow-[0_0_12px_rgba(212,20,42,0.6)]" 
                                : "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md shadow-sm");

                        return (
                            <button
                                key={match.id}
                                onClick={() => onMatchClick?.(match)}
                                className={pillClasses}
                                title={`${match.home.name} vs ${match.away.name}`}
                            >
                                {/* Left Side: Time, Elapsed, or Status */}
                                {(() => {
                                    if (isLive && match.score) {
                                        return (
                                            <span className="flex items-center gap-1.5 min-w-[20px] justify-center">
                                                <span className="text-[12px] font-black">{match.elapsed ? `${match.elapsed}'` : '1\''}</span>
                                            </span>
                                        );
                                    }
                                    if (isFinished && match.score) {
                                        return <span className="text-[10px] text-white/70 uppercase tracking-wider font-extrabold mr-0.5">FIN</span>;
                                    }
                                    const timeStr = formatTime(match.kickoff);
                                    return <span className="text-[12px] font-semibold opacity-90">{timeStr}</span>;
                                })()}

                                {/* Middle/Right: Flags & Score */}
                                <div className="flex items-center gap-1.5 ml-1">
                                    <img 
                                        src={`https://flagcdn.com/w40/${match.home.code.toLowerCase()}.png`} 
                                        alt={match.home.code} 
                                        className="w-4 h-4 object-cover rounded-full border border-white/20 shadow-sm" 
                                    />
                                    {isLive || isFinished ? (
                                        <div className="flex items-center mx-0.5">
                                            <span className="font-jersey text-[14px] tracking-wider">{match.score?.home}</span>
                                            <span className="font-sans text-[11px] font-bold mx-1 opacity-80">-</span>
                                            <span className="font-jersey text-[14px] tracking-wider">{match.score?.away}</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] opacity-60 font-bold mx-0.5">-</span>
                                    )}
                                    <img 
                                        src={`https://flagcdn.com/w40/${match.away.code.toLowerCase()}.png`} 
                                        alt={match.away.code} 
                                        className="w-4 h-4 object-cover rounded-full border border-white/20 shadow-sm" 
                                    />
                                </div>
                            </button>
                        );
                    })}
                </React.Fragment>
            ))}
            {/* Added an extra dot at the very end of a block for seamless transition to the next block */}
            <span className="w-1 h-1 rounded-full bg-white/40 dark:bg-white/40 flex-shrink-0 ml-4"></span>
        </div>
    );

    return (
        <div className="w-full relative overflow-hidden bg-gradient-to-r from-[#4a1010] via-[#1a1c29] to-[#0f2c1a] border-y border-white/5 flex items-center h-12 md:h-14 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            {/* Absolute positioning overlays to fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 md:w-32 bg-gradient-to-r from-[#4a1010] via-[#4a1010]/80 to-transparent pointer-events-none z-10 opacity-100"></div>
            <div className="absolute right-0 top-0 bottom-0 w-24 md:w-32 bg-gradient-to-l from-[#0f2c1a] via-[#0f2c1a]/80 to-transparent pointer-events-none z-10 opacity-100"></div>

            {/* Marquee Scroller */}
            <div 
                className="flex-1 overflow-hidden relative w-full h-full flex items-center"
                onMouseEnter={() => setIsPlaying(false)}
                onMouseLeave={() => setIsPlaying(true)}
            >
                <div 
                    className="flex whitespace-nowrap animate-marquee items-center"
                    style={{ 
                        animationPlayState: isPlaying ? 'running' : 'paused',
                        animationDuration: '100s',
                        animationTimingFunction: 'linear',
                        animationIterationCount: 'infinite'
                    }}
                >
                    {renderMarqueeContent()}
                    {renderMarqueeContent()} {/* Duplicated for loop coverage */}
                </div>
            </div>

            {/* Play/Pause Button on the Right */}
            <div className="absolute right-2 top-0 bottom-0 flex items-center z-30 pointer-events-auto">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-black/40 hover:bg-black/60 text-white/90 shadow-lg border border-white/10 backdrop-blur-md focus:outline-none transition-all cursor-pointer"
                    aria-label={isPlaying ? "Mettre en pause le défilement" : "Lancer le défilement"}
                >
                    <span className="material-symbols-outlined notranslate text-[14px]" translate="no">
                        {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                </button>
            </div>

            {/* Global style keyframe injector */}
            <style>{`
                @keyframes marquee {
                    0% { transform: translate3d(0%, 0, 0); }
                    100% { transform: translate3d(-50%, 0, 0); }
                }
                .animate-marquee {
                    animation: marquee linear infinite;
                    will-change: transform;
                    backface-visibility: hidden;
                    -webkit-font-smoothing: antialiased;
                }
            `}</style>
        </div>
    );
};
export default UpcomingMatchesTicker;
