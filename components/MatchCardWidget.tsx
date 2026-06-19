import React, { useState, useEffect } from 'react';

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
    votes: { home: number; draw: number; away: number };
    percentages?: { home: number; draw: number; away: number; total: number };
    status?: 'scheduled' | 'live' | 'finished';
    score?: { home: number; away: number };
    elapsed?: number | null;
    stats?: {
        possession: { home: number; away: number };
        shots: { home: number; away: number };
        shotsOnTarget: { home: number; away: number };
        fouls: { home: number; away: number };
        yellowCards: { home: number; away: number };
        corners: { home: number; away: number };
    };
}

interface MatchCardWidgetProps {
    matchId: string;
    onVoteCompleted?: (matchId: string, choice: string) => void;
}

export const MatchCardWidget: React.FC<MatchCardWidgetProps> = ({ matchId, onVoteCompleted }) => {
    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState("");
    const [votedChoice, setVotedChoice] = useState<string | null>(null);
    const [showStats, setShowStats] = useState(false);

    // Fetch match details on load, then refresh every 60s for live score updates
    useEffect(() => {
        let isMounted = true;

        const fetchMatch = async (showLoading = false) => {
            try {
                if (showLoading) setLoading(true);
                const response = await fetch(`/api/worldcup/match/${matchId}`);
                if (response.ok && isMounted) {
                    const data = await response.json();
                    setMatch(data);

                    // Check if already voted in localStorage
                    const voted = localStorage.getItem(`voted_${matchId}`);
                    if (voted) {
                        setVotedChoice(voted);
                    }
                }
            } catch (err) {
                console.error("Error fetching match details:", err);
            } finally {
                if (showLoading && isMounted) setLoading(false);
            }
        };

        fetchMatch(true);

        // Background refresh every 60 seconds — no loading flash
        const refreshInterval = setInterval(() => fetchMatch(false), 60 * 1000);

        return () => {
            isMounted = false;
            clearInterval(refreshInterval);
        };
    }, [matchId]);

    // Countdown effect — respects the live match.status from the server
    useEffect(() => {
        if (!match) return;

        // If the server already says finished, no countdown needed
        if (match.status === 'finished') {
            setCountdown('');
            return;
        }

        const updateCountdown = () => {
            const kickoffTime = new Date(match.kickoff).getTime();
            const now = new Date().getTime();
            const difference = kickoffTime - now;

            if (difference <= 0) {
                // Past kickoff — the server will eventually flip to 'finished'
                // Show live elapsed from server data
                let elapsed = match.elapsed;
                if (elapsed == null) {
                    const rawElapsed = Math.floor((now - kickoffTime) / 60000);
                    if (rawElapsed <= 45) {
                        elapsed = rawElapsed;
                    } else if (rawElapsed <= 60) {
                        elapsed = 45; // Halftime
                    } else {
                        elapsed = rawElapsed - 15;
                    }
                }
                setCountdown(`${Math.min(elapsed, 120)}'`);
                return;
            }

            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            // Format double digits
            const pad = (num: number) => String(num).padStart(2, '0');
            setCountdown(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [match]);

    const handleVote = async (choice: 'home' | 'draw' | 'away') => {
        if (votedChoice || !match) return;

        try {
            const response = await fetch(`/api/worldcup/match/${match.id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ choice })
            });

            if (response.ok) {
                const updatedMatch = await response.json();
                setMatch(updatedMatch);
                setVotedChoice(choice);
                localStorage.setItem(`voted_${match.id}`, choice);
                onVoteCompleted?.(match.id, choice);
            }
        } catch (err) {
            console.error("Error submitting vote:", err);
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-md mx-auto p-6 rounded-3xl bg-slate-900/60 border border-slate-700/30 backdrop-blur-md animate-pulse h-48 flex items-center justify-center">
                <span className="text-slate-400 text-sm">Chargement du match...</span>
            </div>
        );
    }

    if (!match) return null;

    // Format display time
    const getMatchTimeLabel = (kickoffStr: string) => {
        const date = new Date(kickoffStr);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        if (date.toDateString() === today.toDateString()) {
            return `${timeStr} Aujourd'hui`;
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return `${timeStr} Demain`;
        } else {
            return `${timeStr} ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
        }
    };

    const totalVotes = match.votes.home + match.votes.draw + match.votes.away;
    const percentages = match.percentages || { home: 33, draw: 33, away: 34 };

    const renderVotesCount = (votes: number) => {
        const formatted = votes.toLocaleString('en-US');
        if (formatted.includes(',')) {
            const parts = formatted.split(',');
            return (
                <span className="inline-flex items-baseline">
                    {parts.map((part, index) => (
                        <React.Fragment key={index}>
                            <span>{part}</span>
                            {index < parts.length - 1 && (
                                <span className="font-sans text-[10px] text-slate-500 mx-[0.5px] font-bold">,</span>
                            )}
                        </React.Fragment>
                    ))}
                </span>
            );
        }
        return <span>{formatted}</span>;
    };

    const renderKickoffTime = () => {
        const timeLabel = getMatchTimeLabel(match.kickoff);
        const spaceIndex = timeLabel.indexOf(' ');
        if (spaceIndex === -1) {
            return (
                <span className="text-[11px] font-jersey text-slate-400 tracking-wider uppercase mb-1">
                    {timeLabel}
                </span>
            );
        }
        
        const timePart = timeLabel.substring(0, spaceIndex); // e.g. "01:00"
        const datePart = timeLabel.substring(spaceIndex + 1); // e.g. "Demain" or "Aujourd'hui"
        
        if (timePart.includes(':')) {
            const parts = timePart.split(':');
            return (
                <span className="flex items-center gap-1.5 text-[11px] font-jersey text-slate-400 tracking-wider uppercase mb-1 select-none">
                    <span className="flex items-center text-xs text-slate-300">
                        <span>{parts[0]}</span>
                        <span className="font-sans text-[10px] text-slate-500 mx-0.5 select-none translate-y-[-1px] font-bold">:</span>
                        <span>{parts[1]}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 tracking-widest uppercase">{datePart.toUpperCase()}</span>
                </span>
            );
        }
        
        return (
            <span className="text-[11px] font-jersey text-slate-400 tracking-wider uppercase mb-1">
                {timeLabel}
            </span>
        );
    };

    return (
        <div className="w-full max-w-md mx-auto rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md text-white font-sans transition-all duration-300 hover:border-slate-700">
            {/* Header with vibrant World Cup color gradient */}
            <div className="bg-gradient-to-r from-red-600 via-emerald-600 to-indigo-600 px-4 py-3.5 flex items-center justify-between border-b border-white/10 shadow-inner">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md p-1">
                        <img src="/tournaments_fifa-world-cup-2026.football-logos.cc.svg" alt="FIFA WC 2026" className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm tracking-tight text-white leading-none">FIFA World Cup 2026</h3>
                        <span className="text-[10px] text-white/80 font-medium">{match.group} • {match.round}</span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-worldcup-hub'));
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/15 active:scale-90 transition-all text-white/70 hover:text-white cursor-pointer select-none focus:outline-none"
                    title="Standings & Bracket"
                >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
            </div>

            {/* Match Teams & Countdown Area */}
            <div className="p-5 flex flex-col items-center justify-center bg-black/10">
                <div className="w-full flex items-center justify-between gap-2 px-2">
                    {/* Home Team */}
                    <div className="flex flex-col items-center w-28 text-center">
                        <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 shadow-md flex items-center justify-center overflow-hidden mb-2 hover:scale-105 transition-transform">
                            <img 
                                src={`https://flagcdn.com/${match.home.code.toLowerCase()}.svg`} 
                                alt={match.home.name} 
                                className="w-full h-full object-cover scale-[1.05]" 
                            />
                        </div>
                        <span className="font-bold text-xs md:text-sm text-slate-100 truncate w-full">{match.home.name}</span>
                    </div>

                    {/* Middle Score/Time */}
                    <div className="flex flex-col items-center flex-1">
                        {(match.status === 'live' || match.status === 'finished') && match.score ? (
                            <>
                                {/* Score Display */}
                                <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner flex items-center justify-center min-h-[38px]">
                                    <div className="flex items-center justify-center select-none">
                                        <span className="text-3xl font-jersey text-white">{match.score.home}</span>
                                        <span className="font-sans text-slate-500 mx-2">-</span>
                                        <span className="text-3xl font-jersey text-white">{match.score.away}</span>
                                    </div>
                                </div>
                                {/* Status Badge */}
                                {match.status === 'live' ? (
                                    <span className="flex items-center gap-1.5 mt-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
                                            EN DIRECT <span className="font-jersey text-xs">{match.elapsed != null ? match.elapsed : ''}</span>{match.elapsed != null && <span className="font-sans text-[9px]">&apos;</span>}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1.5">TERMINÉ</span>
                                )}
                            </>
                        ) : (
                            <>
                                {renderKickoffTime()}
                                {/* Monospace Countdown */}
                                <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-fluid-lg font-jersey tracking-widest text-emerald-400 shadow-inner flex items-center justify-center min-h-[38px]">
                                    {countdown.includes(':') ? (
                                        (() => {
                                            const parts = countdown.split(':');
                                            return (
                                                <div className="flex items-center justify-center gap-0.5 select-none">
                                                    <span className="font-jersey">{parts[0]}</span>
                                                    <span className="font-sans text-sm text-emerald-500/85 mx-0.5 select-none translate-y-[-2px] font-bold">:</span>
                                                    <span className="font-jersey">{parts[1]}</span>
                                                    <span className="font-sans text-sm text-emerald-500/85 mx-0.5 select-none translate-y-[-2px] font-bold">:</span>
                                                    <span className="font-jersey">{parts[2]}</span>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <span className="font-sans text-xs uppercase tracking-wider">{countdown}</span>
                                    )}
                                </div>
                                <span className="text-[9px] text-slate-500 font-semibold mt-1 uppercase tracking-wider">{match.venue.city}</span>
                            </>
                        )}
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center w-28 text-center">
                        <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 shadow-md flex items-center justify-center overflow-hidden mb-2 hover:scale-105 transition-transform">
                            <img 
                                src={`https://flagcdn.com/${match.away.code.toLowerCase()}.svg`} 
                                alt={match.away.name} 
                                className="w-full h-full object-cover scale-[1.05]" 
                            />
                        </div>
                        <span className="font-bold text-xs md:text-sm text-slate-100 truncate w-full">{match.away.name}</span>
                    </div>
                </div>
            </div>

            {/* Interactive Poll Section */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/20">
                <div className="flex items-center justify-between mb-3.5 px-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[13px]" translate="no">ballot</span>
                        Qui va gagner ?
                    </h4>
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-900/50 px-2 py-0.5 rounded-md border border-slate-800/30 flex items-baseline gap-1 select-none font-jersey">
                        <span className="text-xs text-slate-400 flex items-baseline">{renderVotesCount(totalVotes)}</span>
                        <span className="text-[8.5px] uppercase tracking-wider text-slate-500">votes</span>
                    </span>
                </div>

                <div className="flex flex-col gap-2.5">
                    {/* Home Vote Option */}
                    <button
                        onClick={() => handleVote('home')}
                        disabled={!!votedChoice}
                        className={`relative w-full overflow-hidden rounded-xl py-2 px-3 flex items-center justify-between border transition-all text-xs font-semibold
                            ${votedChoice 
                                ? 'bg-slate-900/40 border-slate-800/40' 
                                : 'bg-slate-900 hover:bg-slate-850 hover:border-slate-600 border-slate-800 cursor-pointer active:scale-[0.99]'}`}
                    >
                        {/* Animated Percentage Fill */}
                        {votedChoice && (
                            <div 
                                className={`absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out 
                                    ${votedChoice === 'home' ? 'bg-emerald-500/15' : 'bg-slate-800/20'}`}
                                style={{ width: `${percentages.home}%` }}
                            />
                        )}
                        <span className="relative flex items-center gap-2">
                            <img 
                                src={`https://flagcdn.com/${match.home.code.toLowerCase()}.svg`} 
                                alt={match.home.name} 
                                className="w-5 h-3.5 object-cover rounded-[2px] border border-slate-700/30 shadow-sm" 
                            />
                            <span className={votedChoice === 'home' ? 'text-emerald-400 font-bold' : ''}>
                                {match.home.name}
                            </span>
                        </span>
                        {votedChoice && (
                            <span className={`relative flex items-center font-jersey text-sm ${votedChoice === 'home' ? 'text-emerald-400' : 'text-slate-450'}`}>
                                <span>{percentages.home}</span>
                                <span className="font-sans text-[10px] ml-0.5 text-slate-500/80 font-bold select-none">%</span>
                            </span>
                        )}
                    </button>

                    {/* Draw Option */}
                    <button
                        onClick={() => handleVote('draw')}
                        disabled={!!votedChoice}
                        className={`relative w-full overflow-hidden rounded-xl py-2 px-3 flex items-center justify-between border transition-all text-xs font-semibold
                            ${votedChoice 
                                ? 'bg-slate-900/40 border-slate-800/40' 
                                : 'bg-slate-900 hover:bg-slate-850 hover:border-slate-600 border-slate-800 cursor-pointer active:scale-[0.99]'}`}
                    >
                        {/* Animated Percentage Fill */}
                        {votedChoice && (
                            <div 
                                className={`absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out 
                                    ${votedChoice === 'draw' ? 'bg-emerald-500/15' : 'bg-slate-800/20'}`}
                                style={{ width: `${percentages.draw}%` }}
                            />
                        )}
                        <span className="relative flex items-center gap-2">
                            <span>🤝</span>
                            <span className={votedChoice === 'draw' ? 'text-emerald-400 font-bold' : ''}>Match nul (N)</span>
                        </span>
                        {votedChoice && (
                            <span className={`relative flex items-center font-jersey text-sm ${votedChoice === 'draw' ? 'text-emerald-400' : 'text-slate-450'}`}>
                                <span>{percentages.draw}</span>
                                <span className="font-sans text-[10px] ml-0.5 text-slate-500/80 font-bold select-none">%</span>
                            </span>
                        )}
                    </button>

                    {/* Away Vote Option */}
                    <button
                        onClick={() => handleVote('away')}
                        disabled={!!votedChoice}
                        className={`relative w-full overflow-hidden rounded-xl py-2 px-3 flex items-center justify-between border transition-all text-xs font-semibold
                            ${votedChoice 
                                ? 'bg-slate-900/40 border-slate-800/40' 
                                : 'bg-slate-900 hover:bg-slate-850 hover:border-slate-600 border-slate-800 cursor-pointer active:scale-[0.99]'}`}
                    >
                        {/* Animated Percentage Fill */}
                        {votedChoice && (
                            <div 
                                className={`absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out 
                                    ${votedChoice === 'away' ? 'bg-emerald-500/15' : 'bg-slate-800/20'}`}
                                style={{ width: `${percentages.away}%` }}
                            />
                        )}
                        <span className="relative flex items-center gap-2">
                            <img 
                                src={`https://flagcdn.com/${match.away.code.toLowerCase()}.svg`} 
                                alt={match.away.name} 
                                className="w-5 h-3.5 object-cover rounded-[2px] border border-slate-700/30 shadow-sm" 
                            />
                            <span className={votedChoice === 'away' ? 'text-emerald-400 font-bold' : ''}>
                                {match.away.name}
                            </span>
                        </span>
                        {votedChoice && (
                            <span className={`relative flex items-center font-jersey text-sm ${votedChoice === 'away' ? 'text-emerald-400' : 'text-slate-450'}`}>
                                <span>{percentages.away}</span>
                                <span className="font-sans text-[10px] ml-0.5 text-slate-500/80 font-bold select-none">%</span>
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Collapsible Stats Section */}
            {match.stats && (match.status === 'live' || match.status === 'finished') && (
                <div className="border-t border-slate-800/80">
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors cursor-pointer"
                    >
                        <span>Statistiques</span>
                        <span className="material-symbols-outlined text-sm" translate="no">
                            {showStats ? 'expand_less' : 'expand_more'}
                        </span>
                    </button>
                    <div
                        className="transition-all duration-300 ease-in-out overflow-hidden"
                        style={{ maxHeight: showStats ? '500px' : '0px' }}
                    >
                        <div className="px-5 pb-4 flex flex-col gap-3">
                            {([
                                { label: 'Possession', home: match.stats.possession.home, away: match.stats.possession.away, suffix: '%' },
                                { label: 'Tirs', home: match.stats.shots.home, away: match.stats.shots.away },
                                { label: 'Tirs cadrés', home: match.stats.shotsOnTarget.home, away: match.stats.shotsOnTarget.away },
                                { label: 'Fautes', home: match.stats.fouls.home, away: match.stats.fouls.away },
                                { label: 'Cartons jaunes', home: match.stats.yellowCards.home, away: match.stats.yellowCards.away },
                                { label: 'Corners', home: match.stats.corners.home, away: match.stats.corners.away },
                            ] as const).map((stat) => {
                                const total = stat.home + stat.away || 1;
                                const homePct = (stat.home / total) * 100;
                                const awayPct = (stat.away / total) * 100;
                                return (
                                    <div key={stat.label} className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-jersey text-sm text-white w-8 text-left">
                                                {stat.home}{'suffix' in stat && stat.suffix ? <span className="font-sans text-[10px] text-slate-500 font-bold">{stat.suffix}</span> : null}
                                            </span>
                                            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider flex-1 text-center">{stat.label}</span>
                                            <span className="font-jersey text-sm text-white w-8 text-right">
                                                {stat.away}{'suffix' in stat && stat.suffix ? <span className="font-sans text-[10px] text-slate-500 font-bold">{stat.suffix}</span> : null}
                                            </span>
                                        </div>
                                        <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-800">
                                            <div
                                                className="bg-emerald-500 transition-all duration-500 rounded-l-full"
                                                style={{ width: `${homePct}%` }}
                                            />
                                            <div
                                                className="bg-sky-500 transition-all duration-500 rounded-r-full"
                                                style={{ width: `${awayPct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default MatchCardWidget;
