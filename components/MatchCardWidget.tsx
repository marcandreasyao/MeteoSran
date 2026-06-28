import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';

interface Team {
    name: string;
    flag: string;
    code: string;
}

interface MatchEvent {
    type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
    team: 'home' | 'away';
    minute: number;
    player?: string;
    assist?: string | null;
    playerOut?: string;
    playerIn?: string;
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
    events?: MatchEvent[];
    momentum?: number[];
}

interface MatchCardWidgetProps {
    matchId: string;
    defaultShowWeather?: boolean;
    onVoteCompleted?: (matchId: string, choice: string) => void;
}

const TEAM_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
    FR: { primary: '#1e40af', secondary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.2)' }, // France: Blue
    SN: { primary: '#10b981', secondary: '#059669', glow: 'rgba(16, 185, 129, 0.2)' }, // Senegal: Green
    AR: { primary: '#0ea5e9', secondary: '#38bdf8', glow: 'rgba(14, 165, 233, 0.2)' }, // Argentina: Sky Blue
    DZ: { primary: '#047857', secondary: '#10b981', glow: 'rgba(16, 185, 129, 0.2)' }, // Algeria: Green
    PT: { primary: '#dc2626', secondary: '#ea580c', glow: 'rgba(239, 68, 68, 0.2)' }, // Portugal: Red
    NO: { primary: '#e11d48', secondary: '#f43f5e', glow: 'rgba(225, 29, 72, 0.2)' }, // Norway: Red
    EG: { primary: '#be123c', secondary: '#e11d48', glow: 'rgba(225, 29, 72, 0.2)' }, // Egypt: Red
    DE: { primary: '#111827', secondary: '#4b5563', glow: 'rgba(75, 85, 99, 0.2)' }, // Germany: Dark Gray
    ES: { primary: '#b91c1c', secondary: '#ea580c', glow: 'rgba(239, 68, 68, 0.2)' }, // Spain: Red
    "GB-ENG": { primary: '#1e3a8a', secondary: '#2563eb', glow: 'rgba(30, 58, 138, 0.2)' }, // England: Navy
    NL: { primary: '#ea580c', secondary: '#f97316', glow: 'rgba(249, 115, 22, 0.2)' }, // Netherlands: Orange
    BR: { primary: '#eab308', secondary: '#22c55e', glow: 'rgba(234, 179, 8, 0.2)' }, // Brazil: Yellow
    CI: { primary: '#f97316', secondary: '#f59e0b', glow: 'rgba(249, 115, 22, 0.2)' }, // Ivory Coast: Orange
    US: { primary: '#1e3a8a', secondary: '#dc2626', glow: 'rgba(59, 130, 246, 0.2)' }, // USA: Navy
    CA: { primary: '#dc2626', secondary: '#b91c1c', glow: 'rgba(239, 68, 68, 0.2)' }, // Canada: Red
    MX: { primary: '#047857', secondary: '#065f46', glow: 'rgba(16, 185, 129, 0.2)' }, // Mexico: Green
    UY: { primary: '#0284c7', secondary: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.2)' }, // Uruguay: Sky Blue
    CO: { primary: '#eab308', secondary: '#ca8a04', glow: 'rgba(234, 179, 8, 0.2)' }, // Colombia: Yellow
    HR: { primary: '#b91c1c', secondary: '#dc2626', glow: 'rgba(239, 68, 68, 0.2)' }, // Croatia: Red
    BE: { primary: '#991b1b', secondary: '#111827', glow: 'rgba(153, 27, 27, 0.2)' }, // Belgium: Red
    JP: { primary: '#1d4ed8', secondary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.2)' }, // Japan: Blue
    KR: { primary: '#be123c', secondary: '#e11d48', glow: 'rgba(225, 29, 72, 0.2)' }, // South Korea: Red
    GH: { primary: '#ca8a04', secondary: '#eab308', glow: 'rgba(234, 179, 8, 0.2)' }, // Ghana: Yellow
    SA: { primary: '#047857', secondary: '#10b981', glow: 'rgba(16, 185, 129, 0.2)' }, // Saudi Arabia: Green
};

const AnimatedStatRow: React.FC<{
    label: string;
    home: number;
    away: number;
    suffix?: string;
    active: boolean;
}> = ({ label, home, away, suffix, active }) => {
    const [animatedHome, setAnimatedHome] = useState(0);
    const [animatedAway, setAnimatedAway] = useState(0);
    const [progressWidth, setProgressWidth] = useState({ home: 0, away: 0 });

    useEffect(() => {
        if (!active) {
            setAnimatedHome(0);
            setAnimatedAway(0);
            setProgressWidth({ home: 0, away: 0 });
            return;
        }

        const total = home + away || 1;
        const targetHomePct = (home / total) * 100;
        const targetAwayPct = (away / total) * 100;
        
        const t1 = setTimeout(() => {
            setProgressWidth({ home: targetHomePct, away: targetAwayPct });
        }, 50);

        let startTimestamp: number | null = null;
        const duration = 1200;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const elapsed = timestamp - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = progress * (2 - progress); // easeOutQuad

            setAnimatedHome(Math.round(easeProgress * home));
            setAnimatedAway(Math.round(easeProgress * away));

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        const animationFrameId = window.requestAnimationFrame(step);

        return () => {
            clearTimeout(t1);
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [active, home, away]);

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
                <span className="font-jersey text-sm text-white w-8 text-left select-none">
                    {animatedHome}{suffix ? <span className="font-sans text-[10px] text-slate-500 font-bold">{suffix}</span> : null}
                </span>
                <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider flex-1 text-center select-none">{label}</span>
                <span className="font-jersey text-sm text-white w-8 text-right select-none">
                    {animatedAway}{suffix ? <span className="font-sans text-[10px] text-slate-500 font-bold">{suffix}</span> : null}
                </span>
            </div>
            <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-800">
                <div
                    className="bg-emerald-500 transition-all duration-[1200ms] rounded-l-full"
                    style={{ width: `${progressWidth.home}%`, transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                />
                <div
                    className="bg-sky-500 transition-all duration-[1200ms] rounded-r-full"
                    style={{ width: `${progressWidth.away}%`, transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                />
            </div>
        </div>
    );
};

export const MatchCardWidget: React.FC<MatchCardWidgetProps> = ({ matchId, defaultShowWeather = false, onVoteCompleted }) => {
    const { user } = useAuth();
    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState("");
    const [votedChoice, setVotedChoice] = useState<string | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [activeTab, setActiveTab] = useState<'stats' | 'timeline'>('timeline');
    const [showWeatherPanel, setShowWeatherPanel] = useState(defaultShowWeather);
    const [weatherData, setWeatherData] = useState<any | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [kickoffAlertDismissed, setKickoffAlertDismissed] = useState(false);
    const [voteSubmitting, setVoteSubmitting] = useState<string | null>(null); // which choice is being submitted
    const [voteError, setVoteError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchWeather = async () => {
            try {
                if (isMounted) setWeatherLoading(true);
                const response = await fetch(`/api/worldcup/match/${matchId}/weather`);
                if (response.ok && isMounted) {
                    const data = await response.json();
                    setWeatherData(data);
                }
            } catch (e) {
                console.error("Failed to fetch match weather:", e);
            } finally {
                if (isMounted) setWeatherLoading(false);
            }
        };
        fetchWeather();
        return () => {
            isMounted = false;
        };
    }, [matchId]);

    useEffect(() => {
        if (defaultShowWeather) {
            setShowWeatherPanel(true);
        }
    }, [defaultShowWeather]);

    // Fetch match details on load, then refresh every 60s for live score updates
    useEffect(() => {
        let isMounted = true;

        const fetchMatch = async (showLoading = false) => {
            try {
                if (showLoading) setLoading(true);
                const url = user?.uid ? `/api/worldcup/match/${matchId}?userId=${user.uid}` : `/api/worldcup/match/${matchId}`;
                const response = await fetch(url);
                if (response.ok && isMounted) {
                    const data = await response.json();
                    setMatch(data);

                    // Restore voted state: server-side prediction takes precedence,
                    // then localStorage. Never wipe a locally-known vote on re-fetch.
                    if (data.userPrediction) {
                        setVotedChoice(data.userPrediction);
                    } else {
                        const voted = localStorage.getItem(`voted_${matchId}`);
                        // Only set from localStorage — don't call setVotedChoice(null) here,
                        // because the 60s re-fetch would clear an in-flight or fresh vote.
                        if (voted) setVotedChoice(voted);
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
    }, [matchId, user?.uid]);

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
        // Block if already voted, already submitting, or match isn't open for votes
        if (votedChoice || voteSubmitting || !match) return;
        // Block votes after kickoff (live or finished)
        if (match.status === 'live' || match.status === 'finished') return;

        setVoteError(null);
        setVoteSubmitting(choice);

        try {
            if (user) {
                const username = user.displayName || user.email?.split('@')[0] || 'Anonyme';
                const response = await fetch(`/api/worldcup/match/${match.id}/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.uid, username, choice })
                });

                if (response.ok) {
                    const data = await response.json();
                    setMatch(data.match);
                    setVotedChoice(choice);
                    localStorage.setItem(`voted_${match.id}`, choice);
                    onVoteCompleted?.(match.id, choice);
                } else {
                    const errData = await response.json().catch(() => ({}));
                    setVoteError(errData.error || 'Erreur réseau. Réessayez.');
                    console.error('Prediction submission failed:', errData.error);
                }
            } else {
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
                } else {
                    setVoteError('Erreur réseau. Réessayez.');
                }
            }
        } catch (err) {
            setVoteError('Connexion perdue. Réessayez.');
            console.error('Error submitting vote/prediction:', err);
        } finally {
            setVoteSubmitting(null);
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
                    onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
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
                        
                        {/* WEATHER BADGE BUTTON */}
                        {weatherData ? (
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowWeatherPanel(!showWeatherPanel); }}
                                className={`mt-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold select-none cursor-pointer transition-all active:scale-95 border ${
                                    showWeatherPanel 
                                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400' 
                                        : 'bg-slate-950/50 hover:bg-slate-900 border-slate-850 hover:border-slate-800 text-slate-350'
                                }`}
                            >
                                <span className="text-[10px] leading-none">
                                    {weatherData.impact.uiWeatherType === 'rain' ? '🌧️' :
                                     weatherData.impact.uiWeatherType === 'wind' ? '💨' :
                                     weatherData.impact.uiWeatherType === 'heat' ? '🔥' :
                                     weatherData.impact.uiWeatherType === 'cloudy' ? '☁️' :
                                     weatherData.impact.uiWeatherType === 'snow' ? '❄️' : '☀️'}
                                </span>
                                <span>{Math.round(weatherData.weather.temperature)}°C • {weatherData.impact.ratingText.fr.split(' ')[0]}</span>
                                <span className="material-symbols-outlined text-[9px] leading-none transition-transform duration-300" style={{ transform: showWeatherPanel ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                            </button>
                        ) : weatherLoading ? (
                            <div className="mt-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950/20 border border-slate-900 text-[9px] text-slate-500 font-semibold select-none animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full border border-slate-600 border-t-slate-400 animate-spin" />
                                <span>Météo...</span>
                            </div>
                        ) : null}
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

            {/* SENSORY PITCH WEATHER PANEL */}
            {showWeatherPanel && weatherData && (
                <div className="border-t border-slate-800 bg-slate-950/40 px-5 py-4 flex flex-col gap-4 animate-fade-in select-none">
                    {/* Section Header */}
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[13px] text-emerald-400">thermostat</span>
                            Analyse Climat Stade ({weatherData.stadium.name})
                        </h4>
                        <span className="text-[9px] text-slate-500 font-bold bg-slate-900 border border-slate-800/60 px-2 py-0.5 rounded-md">
                            Toit: {weatherData.stadium.roof}
                        </span>
                    </div>

                    {/* Pitch Sensory Stage */}
                    <div className="relative w-full h-[140px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner flex items-center justify-center">
                        
                        {/* 3D-Like Football Pitch Visual */}
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/60 via-emerald-900/60 to-emerald-950/60 flex flex-col justify-between p-3">
                            <div className="absolute inset-2 border border-white/10 rounded-lg pointer-events-none flex flex-col justify-between">
                                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10" />
                                <div className="absolute top-1/2 left-1/2 w-14 h-14 border border-white/10 rounded-full translate-x-[-50%] translate-y-[-50%]" />
                                <div className="absolute top-0 left-1/2 w-20 h-6 border-b border-x border-white/10 translate-x-[-50%]" />
                                <div className="absolute bottom-0 left-1/2 w-20 h-6 border-t border-x border-white/10 translate-x-[-50%]" />
                            </div>
                        </div>

                        {/* Sensory Weather Overlays */}
                        {/* 1. RAIN ANIMATION (Hardware-accelerated) */}
                        {weatherData.impact.uiWeatherType === 'rain' && (
                            <div className="absolute inset-0 rain-container pointer-events-none">
                                {Array.from({ length: 40 }).map((_, i) => {
                                    const delay = (Math.random() * 2).toFixed(2);
                                    const duration = (0.5 + Math.random() * 0.4).toFixed(2);
                                    const left = (Math.random() * 100).toFixed(1);
                                    return (
                                        <div 
                                            key={i} 
                                            className="absolute rain-drop w-[1.5px] h-[14px] will-change-transform"
                                            style={{
                                                left: `${left}%`,
                                                animation: `fall ${duration}s linear infinite`,
                                                animationDelay: `${delay}s`,
                                                transform: 'rotate(15deg)'
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {/* 2. SNOW ANIMATION */}
                        {weatherData.impact.uiWeatherType === 'snow' && (
                            <div className="absolute inset-0 snow-container pointer-events-none">
                                {Array.from({ length: 25 }).map((_, i) => {
                                    const delay = (Math.random() * 5).toFixed(2);
                                    const duration = (3 + Math.random() * 2).toFixed(2);
                                    const left = (Math.random() * 100).toFixed(1);
                                    const size = (2 + Math.random() * 3).toFixed(1);
                                    return (
                                        <div 
                                            key={i} 
                                            className="absolute bg-white/60 rounded-full will-change-transform"
                                            style={{
                                                left: `${left}%`,
                                                top: `-5px`,
                                                width: `${size}px`,
                                                height: `${size}px`,
                                                animation: `fall-slow ${duration}s linear infinite`,
                                                animationDelay: `${delay}s`
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {/* 3. WIND ANIMATION */}
                        {weatherData.impact.uiWeatherType === 'wind' && (
                            <div className="absolute inset-0 wind-container pointer-events-none overflow-hidden">
                                {Array.from({ length: 5 }).map((_, i) => {
                                    const top = (15 + Math.random() * 70).toFixed(1);
                                    const delay = (Math.random() * 3).toFixed(2);
                                    const duration = (1.5 + Math.random() * 1).toFixed(2);
                                    return (
                                        <div 
                                            key={i} 
                                            className="absolute h-[1.5px] bg-gradient-to-r from-transparent via-white/15 to-transparent w-3/4 will-change-transform"
                                            style={{
                                                top: `${top}%`,
                                                left: '-75%',
                                                animation: `blow ${duration}s ease-in-out infinite`,
                                                animationDelay: `${delay}s`
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {/* 4. SUN/HEAT GLOW & SHIMMER */}
                        {weatherData.impact.uiWeatherType === 'heat' && (
                            <div className="absolute inset-0 heat-container pointer-events-none overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400/25 via-amber-500/10 to-transparent blur-2xl animate-pulse-glow" />
                                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-amber-500/[0.04] to-transparent shimmer-waves will-change-transform" />
                            </div>
                        )}

                        {/* 5. CLOUDY / FOG PARALLAX */}
                        {weatherData.impact.uiWeatherType === 'cloudy' && (
                            <div className="absolute inset-0 cloudy-container pointer-events-none overflow-hidden">
                                <div className="absolute top-1/4 w-[200%] h-12 bg-white/[0.04] blur-md will-change-transform" style={{ animation: 'drift 25s linear infinite' }} />
                                <div className="absolute bottom-1/4 w-[200%] h-16 bg-slate-300/[0.05] blur-lg will-change-transform" style={{ animation: 'drift 40s linear infinite', animationDelay: '-10s' }} />
                            </div>
                        )}

                        {/* 6. NIGHT / STARS TWINKLING */}
                        {!weatherData.weather.isDayTime && (
                            <div className="absolute inset-0 stars-container pointer-events-none">
                                {Array.from({ length: 15 }).map((_, i) => {
                                    const top = (5 + Math.random() * 50).toFixed(1);
                                    const left = (5 + Math.random() * 90).toFixed(1);
                                    const delay = (Math.random() * 4).toFixed(2);
                                    return (
                                        <div 
                                            key={i} 
                                            className="absolute w-0.5 h-0.5 bg-white rounded-full will-change-opacity animate-star-twinkle"
                                            style={{
                                                top: `${top}%`,
                                                left: `${left}%`,
                                                animationDelay: `${delay}s`
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {/* Pitch Foreground Overlay */}
                        <div className="absolute z-10 bottom-3 left-3 right-3 flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/5 backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">
                                    {weatherData.impact.uiWeatherType === 'rain' ? '🌧️' :
                                     weatherData.impact.uiWeatherType === 'wind' ? '💨' :
                                     weatherData.impact.uiWeatherType === 'heat' ? '🔥' :
                                     weatherData.impact.uiWeatherType === 'cloudy' ? '☁️' :
                                     weatherData.impact.uiWeatherType === 'snow' ? '❄️' : '☀️'}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Actuel</span>
                                    <span className="text-[11px] font-jersey font-black tracking-wide leading-none">{weatherData.weather.weatherText}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-baseline gap-1 select-none font-jersey text-emerald-400">
                                <span className="text-lg font-black">{Math.round(weatherData.weather.temperature)}</span>
                                <span className="text-[10px] font-sans font-bold text-emerald-500/70">°C</span>
                                <span className="text-slate-500 mx-1.5 font-sans font-normal text-[9px] select-none">|</span>
                                <span className="text-[9px] font-sans font-black uppercase tracking-wider text-slate-400">Ressenti {Math.round(weatherData.weather.feelsLike)}°C</span>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {/* Altitude */}
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2 flex flex-col justify-between h-[64px]">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Altitude</span>
                            <span className="font-jersey font-black text-sm text-slate-200 leading-tight">{weatherData.stadium.altitude}m</span>
                            <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                                <div 
                                    className="bg-sky-400 h-full rounded-full" 
                                    style={{ width: `${Math.min((weatherData.stadium.altitude / 2500) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                        
                        {/* Fatigue Risk */}
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2 flex flex-col justify-between h-[64px]">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Usure Physique</span>
                            <span className={`font-jersey font-black text-sm uppercase tracking-wide leading-tight ${
                                weatherData.impact.fatigueRisk === 'high' ? 'text-red-400' :
                                weatherData.impact.fatigueRisk === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                                {weatherData.impact.fatigueRisk === 'high' ? 'Élevée' :
                                 weatherData.impact.fatigueRisk === 'medium' ? 'Modérée' : 'Basse'}
                            </span>
                            <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${
                                        weatherData.impact.fatigueRisk === 'high' ? 'bg-red-500' :
                                        weatherData.impact.fatigueRisk === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`} 
                                    style={{ width: weatherData.impact.fatigueRisk === 'high' ? '100%' : weatherData.impact.fatigueRisk === 'medium' ? '60%' : '25%' }}
                                />
                            </div>
                        </div>

                        {/* Ball Physics */}
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2 flex flex-col justify-between h-[64px]">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Balle</span>
                            <span className="font-jersey font-black text-sm uppercase tracking-wide leading-tight text-slate-200">
                                {weatherData.impact.ballPhysics === 'fast_thin_air' ? 'Rapide (Air)' :
                                 weatherData.impact.ballPhysics === 'fast_skip' ? 'Fusante (Pluie)' :
                                 weatherData.impact.ballPhysics === 'slow_heavy' ? 'Lourde' : 'Standard'}
                            </span>
                            <span className="text-[8px] font-semibold text-slate-500 truncate leading-none">
                                {weatherData.impact.ballPhysics === 'fast_thin_air' ? 'Densité réduite' :
                                 weatherData.impact.ballPhysics === 'fast_skip' ? 'Gazon humide' : 'Physique normale'}
                            </span>
                        </div>
                    </div>

                    {/* AI Playbook Bubble */}
                    <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 relative flex gap-3 items-start">
                        <div className="w-7 h-7 rounded-full bg-slate-950 flex items-center justify-center p-1 border border-slate-800 flex-shrink-0">
                            <img src="/Meteosran-logo.png" alt="AI" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Consignes Tactiques (AI Analyst)</span>
                            <p className="text-[11px] text-slate-350 italic leading-relaxed select-text">&ldquo;{weatherData.impact.punditComment.fr}&rdquo;</p>
                            
                            <ul className="mt-1.5 space-y-1">
                                {weatherData.impact.tips.fr.map((tip: string, idx: number) => (
                                    <li key={idx} className="text-[10px] text-slate-300 flex items-start gap-1.5 leading-normal">
                                        <span className="text-emerald-400 flex-shrink-0 mt-0.5">•</span>
                                        <span className="select-text">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* HYPER-LOCAL KICKOFF WEATHER ALERT BANNER */}
            {/* Shows for scheduled matches when we have a kickoff-time forecast */}
            {match.status === 'scheduled' &&
             weatherData?.kickoffForecast &&
             !kickoffAlertDismissed && (() => {
                const kf = weatherData.kickoffForecast;
                const hoursLeft = kf.hoursUntilKickoff;
                const impact = kf.impact;
                
                // Severity-based color palette
                const isExtreme = impact?.rating === 'extreme';
                const isDemanding = impact?.rating === 'demanding';
                const isRain = impact?.uiWeatherType === 'rain';
                const isWind = impact?.uiWeatherType === 'wind';
                
                const bannerBg = isExtreme
                    ? 'from-rose-950/80 via-rose-900/60 to-slate-950/80 border-rose-500/30'
                    : isDemanding
                    ? 'from-amber-950/80 via-amber-900/60 to-slate-950/80 border-amber-500/30'
                    : isRain
                    ? 'from-sky-950/80 via-sky-900/60 to-slate-950/80 border-sky-500/30'
                    : isWind
                    ? 'from-slate-950/80 via-slate-800/60 to-slate-950/80 border-slate-500/30'
                    : 'from-emerald-950/80 via-emerald-900/40 to-slate-950/80 border-emerald-500/20';
                
                const accentColor = isExtreme ? 'text-rose-400' :
                    isDemanding ? 'text-amber-400' :
                    isRain ? 'text-sky-400' : 'text-emerald-400';
                
                const accentBorder = isExtreme ? 'border-rose-500/40' :
                    isDemanding ? 'border-amber-500/40' :
                    isRain ? 'border-sky-500/40' : 'border-emerald-500/40';

                const weatherEmoji = impact?.uiWeatherType === 'rain' ? '🌧️' :
                    impact?.uiWeatherType === 'wind' ? '💨' :
                    impact?.uiWeatherType === 'heat' ? '🔥' :
                    impact?.uiWeatherType === 'cloudy' ? '☁️' :
                    impact?.uiWeatherType === 'snow' ? '❄️' : '☀️';

                return (
                    <div className={`border-t bg-gradient-to-r ${bannerBg} border`}>
                        <div className="px-4 py-3 flex flex-col gap-2">
                            {/* Alert Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-base leading-none">{weatherEmoji}</span>
                                    <div className="flex flex-col">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${accentColor}`}>
                                            Prévision Coup d'Envoi
                                        </span>
                                        <span className="text-[8.5px] text-slate-400 font-semibold">
                                            {hoursLeft > 24
                                                ? `dans ${Math.round(hoursLeft / 24)}j · ${weatherData.stadium?.city}`
                                                : hoursLeft > 1
                                                ? `dans ${Math.round(hoursLeft)}h · ${weatherData.stadium?.city}`
                                                : `Bientôt · ${weatherData.stadium?.city}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Forecasted temp pill */}
                                    <div className={`flex items-baseline gap-0.5 px-2 py-0.5 rounded-lg bg-slate-950/40 border ${accentBorder}`}>
                                        <span className={`font-jersey text-base font-black ${accentColor}`}>
                                            {Math.round(kf.temperature)}
                                        </span>
                                        <span className="font-sans text-[9px] text-slate-500 font-bold">°C</span>
                                        {kf.chanceOfRain > 20 && (
                                            <span className="text-[8px] text-sky-400 font-bold ml-1">💧{kf.chanceOfRain}%</span>
                                        )}
                                    </div>
                                    {/* Dismiss button */}
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setKickoffAlertDismissed(true); }}
                                        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all text-slate-500 hover:text-slate-300 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[12px]">close</span>
                                    </button>
                                </div>
                            </div>

                            {/* Condition + Wind row */}
                            <div className="flex items-center justify-between text-[9px] font-semibold">
                                <span className="text-slate-300">{kf.conditionText}</span>
                                {kf.windKph > 20 && (
                                    <span className="text-slate-400 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[10px]">air</span>
                                        {Math.round(kf.windKph)} km/h {kf.windDir}
                                    </span>
                                )}
                            </div>

                            {/* Impact Rating pill + pundit snippet */}
                            {impact && (
                                <div className={`flex items-start gap-2 p-2 rounded-xl bg-slate-950/30 border ${accentBorder}`}>
                                    <span className="material-symbols-outlined text-[14px] text-slate-400 flex-shrink-0 mt-0.5">smart_toy</span>
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <span className={`text-[8.5px] font-black uppercase tracking-widest ${accentColor}`}>
                                            {impact.ratingText?.fr || impact.ratingText}
                                        </span>
                                        {impact.punditComment?.fr && (
                                            <p className="text-[9.5px] text-slate-300 italic leading-snug line-clamp-2">
                                                &ldquo;{impact.punditComment.fr}&rdquo;
                                            </p>
                                        )}
                                        {impact.tips?.fr?.slice(0, 1).map((tip: string, idx: number) => (
                                            <span key={idx} className="text-[8.5px] text-slate-400 flex items-start gap-1">
                                                <span className={`${accentColor} flex-shrink-0`}>•</span>
                                                {tip}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* ── INTERACTIVE POLL SECTION ─────────────────────────────────────────── */}
            {(() => {
                // Votes are always visible for live/finished matches.
                // For scheduled matches, visible after user has voted.
                const isMatchOver = match.status === 'live' || match.status === 'finished';
                const showResults = !!(votedChoice) || isMatchOver;
                // Voting is only open for scheduled matches before kickoff
                const votingOpen = match.status === 'scheduled' && !votedChoice;
                const isVotingLocked = isMatchOver && !votedChoice; // match started but user never voted

                const VoteButton = ({ choice, label, icon }: {
                    choice: 'home' | 'draw' | 'away';
                    label: string;
                    icon: React.ReactNode;
                }) => {
                    const pct = percentages[choice];
                    const isChosen = votedChoice === choice;
                    const isSubmittingThis = voteSubmitting === choice;
                    const isSubmittingOther = voteSubmitting !== null && voteSubmitting !== choice;
                    const isDisabled = !votingOpen || isSubmittingOther || !!voteSubmitting;

                    return (
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote(choice); }}
                            disabled={isDisabled || showResults}
                            className={`relative w-full overflow-hidden rounded-xl py-2 px-3 flex items-center justify-between border transition-all duration-200 text-xs font-semibold select-none
                                ${ showResults
                                    ? isChosen
                                        ? 'bg-emerald-950/30 border-emerald-500/50 cursor-default'
                                        : 'bg-slate-900/40 border-slate-800/40 cursor-default'
                                    : isSubmittingThis
                                    ? 'bg-emerald-950/20 border-emerald-700/40 cursor-wait'
                                    : 'bg-slate-900 hover:bg-slate-850 hover:border-slate-600 border-slate-800 cursor-pointer active:scale-[0.99]'
                                }`}
                        >
                            {/* Percentage fill bar — always shown for live/finished, or after voting */}
                            {showResults && (
                                <div
                                    className={`absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out
                                        ${isChosen ? 'bg-emerald-500/18' : 'bg-slate-800/25'}`}
                                    style={{ width: `${pct}%` }}
                                />
                            )}

                            {/* Label */}
                            <span className="relative flex items-center gap-2">
                                {icon}
                                <span className={isChosen ? 'text-emerald-400 font-bold' : isMatchOver && !votedChoice ? 'text-slate-500' : ''}>
                                    {label}
                                </span>
                            </span>

                            {/* Right side: % or spinner or ✓ badge */}
                            <span className="relative flex items-center gap-1.5">
                                {isSubmittingThis ? (
                                    <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
                                ) : showResults ? (
                                    <span className={`flex items-center font-jersey text-sm ${
                                        isChosen ? 'text-emerald-400' : 'text-slate-500'
                                    }`}>
                                        <span>{pct}</span>
                                        <span className="font-sans text-[10px] ml-0.5 text-slate-500/80 font-bold">%</span>
                                    </span>
                                ) : null}
                                {isVotingLocked && !isChosen && (
                                    <span className="material-symbols-outlined text-[12px] text-slate-700">lock</span>
                                )}
                            </span>
                        </button>
                    );
                };

                return (
                    <div className="p-4 border-t border-slate-800/80 bg-slate-950/20">
                        {/* Poll Header */}
                        <div className="flex items-center justify-between mb-3.5 px-1">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[13px]" translate="no">
                                    {showResults ? 'bar_chart' : 'ballot'}
                                </span>
                                {showResults
                                    ? `Pronostics (${totalVotes} votes)`
                                    : user ? 'Votre Pronostic' : 'Qui va gagner ?'}
                            </h4>
                            <div className="flex items-center gap-2">
                                {votedChoice && !isMatchOver && (
                                    <span className="text-[8.5px] text-emerald-500 font-black uppercase tracking-wider bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-fade-in">
                                        <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        Enregistré
                                    </span>
                                )}
                                {isVotingLocked && (
                                    <span className="text-[8.5px] text-slate-500 font-black uppercase tracking-wider bg-slate-900/60 border border-slate-700/40 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <span className="material-symbols-outlined text-[10px]">lock</span>
                                        Votes fermés
                                    </span>
                                )}
                                <span className="text-[10px] text-slate-500 font-semibold bg-slate-900/50 px-2 py-0.5 rounded-md border border-slate-800/30 flex items-baseline gap-1 select-none font-jersey">
                                    <span className="text-xs text-slate-400 flex items-baseline">{renderVotesCount(totalVotes)}</span>
                                    <span className="text-[8.5px] uppercase tracking-wider text-slate-500">votes</span>
                                </span>
                            </div>
                        </div>

                        {/* Error message */}
                        {voteError && (
                            <div className="mb-2.5 px-3 py-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[10px] text-rose-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                                <span className="material-symbols-outlined text-[12px]">error</span>
                                {voteError}
                            </div>
                        )}

                        {/* Vote Buttons */}
                        <div className="flex flex-col gap-2.5">
                            <VoteButton
                                choice="home"
                                label={match.home.name}
                                icon={
                                    <img
                                        src={`https://flagcdn.com/${match.home.code.toLowerCase()}.svg`}
                                        alt={match.home.name}
                                        className="w-5 h-3.5 object-cover rounded-[2px] border border-slate-700/30 shadow-sm"
                                    />
                                }
                            />
                            <VoteButton
                                choice="draw"
                                label="Match nul"
                                icon={<span className="text-base leading-none">🤝</span>}
                            />
                            <VoteButton
                                choice="away"
                                label={match.away.name}
                                icon={
                                    <img
                                        src={`https://flagcdn.com/${match.away.code.toLowerCase()}.svg`}
                                        alt={match.away.name}
                                        className="w-5 h-3.5 object-cover rounded-[2px] border border-slate-700/30 shadow-sm"
                                    />
                                }
                            />
                        </div>

                        {/* Guest sign-in nudge for scheduled matches without a vote */}
                        {!user && votingOpen && (
                            <p className="mt-2.5 text-center text-[9px] text-slate-600 font-semibold">
                                Connectez-vous pour un pronostic officiel avec classement 🏆
                            </p>
                        )}
                    </div>
                );
            })()}

            {/* Collapsible Tabs Section */}
            {(match.status === 'live' || match.status === 'finished') && (
                <div className="border-t border-slate-800/80">
                    {/* Tab Selectors */}
                    <div className="flex border-b border-slate-800/40 bg-black/10">
                        <button
                            onClick={(e) => {
                                e.preventDefault(); e.stopPropagation();
                                if (showStats && activeTab === 'stats') {
                                    setShowStats(false);
                                } else {
                                    setActiveTab('stats');
                                    setShowStats(true);
                                }
                            }}
                            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none ${
                                showStats && activeTab === 'stats'
                                    ? 'text-emerald-400 border-b border-emerald-500 bg-emerald-500/5'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm" translate="no">bar_chart</span>
                            Statistiques
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault(); e.stopPropagation();
                                if (showStats && activeTab === 'timeline') {
                                    setShowStats(false);
                                } else {
                                    setActiveTab('timeline');
                                    setShowStats(true);
                                }
                            }}
                            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none ${
                                showStats && activeTab === 'timeline'
                                    ? 'text-emerald-400 border-b border-emerald-500 bg-emerald-500/5'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm" translate="no">history</span>
                            Fil du match
                        </button>
                    </div>

                    {/* Expandable Content Container */}
                    <div
                        className="transition-all duration-300 ease-in-out overflow-hidden"
                        style={{ maxHeight: showStats ? '1200px' : '0px' }}
                    >
                        {/* Tab Content 1: Statistics */}
                        {activeTab === 'stats' && match.stats && (
                            <div className="px-5 py-4 flex flex-col gap-3 bg-black/10">
                                {([
                                    { label: 'Possession', home: match.stats.possession.home, away: match.stats.possession.away, suffix: '%' },
                                    { label: 'Tirs', home: match.stats.shots.home, away: match.stats.shots.away },
                                    { label: 'Tirs cadrés', home: match.stats.shotsOnTarget.home, away: match.stats.shotsOnTarget.away },
                                    { label: 'Fautes', home: match.stats.fouls.home, away: match.stats.fouls.away },
                                    { label: 'Cartons jaunes', home: match.stats.yellowCards.home, away: match.stats.yellowCards.away },
                                    { label: 'Corners', home: match.stats.corners.home, away: match.stats.corners.away },
                                ] as const).map((stat) => (
                                    <AnimatedStatRow
                                        key={stat.label}
                                        label={stat.label}
                                        home={stat.home}
                                        away={stat.away}
                                        suffix={'suffix' in stat ? stat.suffix : undefined}
                                        active={showStats && activeTab === 'stats'}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Tab Content 2: Live Match Timeline & Net Deviation Chart */}
                        {activeTab === 'timeline' && (
                            <div className="px-4 py-4 bg-slate-950/40 flex flex-col gap-4 max-h-[1100px] overflow-y-auto custom-scrollbar">
                                {/* Game Momentum Chart */}
                                {match.momentum && match.momentum.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[13px] text-emerald-400">stacked_line_chart</span>
                                                Pression Terrain {match.stats ? '(Stats Live)' : '(Projection)'}
                                            </span>
                                            <div className="flex items-center gap-3 text-[8.5px] font-bold uppercase tracking-wider">
                                                <span className="flex items-center gap-1 text-emerald-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    {match.home.name}
                                                    {match.stats && <span className="font-jersey text-[9px] ml-0.5 opacity-70">{match.stats.possession.home}%</span>}
                                                </span>
                                                <span className="flex items-center gap-1 text-sky-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                                    {match.away.name}
                                                    {match.stats && <span className="font-jersey text-[9px] ml-0.5 opacity-70">{match.stats.possession.away}%</span>}
                                                </span>
                                            </div>
                                        </div>

                                        {/* SVG Momentum Wave */}
                                        {(() => {
                                            const momentum = match.momentum || [];
                                            const homeColor = TEAM_COLORS[match.home.code] || { primary: '#10b981', secondary: '#34d399', glow: 'rgba(16,185,129,0.2)' };
                                            const awayColor = TEAM_COLORS[match.away.code] || { primary: '#38bdf8', secondary: '#7dd3fc', glow: 'rgba(56,189,248,0.2)' };

                                            const homeGradId = `homeGrad_${match.id}`;
                                            const awayGradId = `awayGrad_${match.id}`;

                                            let homePath = `M 10 60 `;
                                            for (let idx = 0; idx < 90; idx++) {
                                                const x = 10 + idx * (480 / 89);
                                                const val = momentum[idx] || 0;
                                                const y = 60 - (val > 0 ? val : 0) * (50 / 60);
                                                homePath += `L ${x} ${y} `;
                                            }
                                            homePath += `L 490 60 Z`;

                                            let awayPath = `M 10 60 `;
                                            for (let idx = 0; idx < 90; idx++) {
                                                const x = 10 + idx * (480 / 89);
                                                const val = momentum[idx] || 0;
                                                const y = 60 - (val < 0 ? val : 0) * (50 / 60);
                                                awayPath += `L ${x} ${y} `;
                                            }
                                            awayPath += `L 490 60 Z`;

                                            let linePath = `M 10 ${60 - (momentum[0] || 0) * (50 / 60)} `;
                                            for (let idx = 1; idx < 90; idx++) {
                                                const x = 10 + idx * (480 / 89);
                                                const val = momentum[idx] || 0;
                                                const y = 60 - val * (50 / 60);
                                                linePath += `L ${x} ${y} `;
                                            }

                                            const liveX = match.status === 'live' && match.elapsed != null
                                                ? 10 + Math.min(89, match.elapsed - 1) * (480 / 89)
                                                : null;

                                            return (
                                                <div className="relative w-full rounded-2xl border border-slate-800/80 bg-slate-950 p-2 shadow-inner">
                                                    <svg viewBox="0 0 500 132" className="w-full h-auto overflow-visible">
                                                        <defs>
                                                            <linearGradient id={homeGradId} x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor={homeColor.primary} stopOpacity="0.5" />
                                                                <stop offset="100%" stopColor={homeColor.secondary} stopOpacity="0.0" />
                                                            </linearGradient>
                                                            <linearGradient id={awayGradId} x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor={awayColor.secondary} stopOpacity="0.0" />
                                                                <stop offset="100%" stopColor={awayColor.primary} stopOpacity="0.5" />
                                                            </linearGradient>
                                                        </defs>

                                                        {/* Center line */}
                                                        <line x1="10" y1="60" x2="490" y2="60" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="3,3" />

                                                        {/* Grid vertical markers */}
                                                        {[15, 30, 45, 60, 75, 90].map((min) => {
                                                            const x = 10 + (min - 1) * (480 / 89);
                                                            return (
                                                                <g key={min}>
                                                                    <line x1={x} y1="10" x2={x} y2="110" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
                                                                    <text x={x} y="122" fill="#475569" fontSize="8" textAnchor="middle" className="font-semibold select-none font-sans">{min === 45 ? 'MT' : min === 90 ? '90\'' : `${min}'`}</text>
                                                                </g>
                                                            );
                                                        })}

                                                        {/* Gradient fills */}
                                                        <path d={homePath} fill={`url(#${homeGradId})`} />
                                                        <path d={awayPath} fill={`url(#${awayGradId})`} />

                                                        {/* Momentum trend line */}
                                                        <path d={linePath} fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

                                                        {/* Live vertical line */}
                                                        {liveX !== null && (
                                                            <g>
                                                                <line x1={liveX} y1="10" x2={liveX} y2="110" stroke="#10b981" strokeWidth="1.5" strokeDasharray="1,1" className="animate-pulse" />
                                                                <circle cx={liveX} cy={60} r="3" fill="#10b981" />
                                                            </g>
                                                        )}

                                                        {/* Goal & Red Card Event Points */}
                                                        {(match.events || []).filter(e => e.type === 'goal' || e.type === 'red_card').map((e, index) => {
                                                            const eventMin = Math.max(1, Math.min(90, e.minute));
                                                            const x = 10 + (eventMin - 1) * (480 / 89);
                                                            const val = momentum[eventMin - 1] || 0;
                                                            const y = 60 - val * (50 / 60);

                                                            if (e.type === 'goal') {
                                                                return (
                                                                    <g key={`marker_${index}`}>
                                                                        <circle cx={x} cy={y} r="5.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                                                                        <text x={x} y={y + 2.2} fontSize="6.5" textAnchor="middle" fill="#ffffff" className="font-sans select-none pointer-events-none">⚽</text>
                                                                    </g>
                                                                );
                                                            } else {
                                                                return (
                                                                    <g key={`marker_${index}`}>
                                                                        <rect x={x - 2.5} y={y - 4} width="5" height="8" rx="1.2" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
                                                                    </g>
                                                                );
                                                            }
                                                        })}
                                                    </svg>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Events List Timeline */}
                                <div className="relative mt-2 flex flex-col">
                                    {/* Central Connecting Vertical Track */}
                                    <div className="absolute top-4 bottom-4 left-1/2 w-[1.5px] -translate-x-1/2 bg-slate-800 pointer-events-none z-0" />

                                    {(!match.events || match.events.length === 0) ? (
                                        <div className="py-6 text-center text-xs text-slate-500">
                                            Aucun événement marquant pour le moment.
                                        </div>
                                    ) : (
                                        <div className="space-y-5 relative z-10">
                                            {match.events.map((e, index) => {
                                                const isHome = e.team === 'home';

                                                // Colors matching ReleaseNotesModal design system styles
                                                const eventStyles = {
                                                    goal: {
                                                        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30',
                                                        text: 'text-emerald-500 dark:text-emerald-400',
                                                        icon: 'sports_soccer'
                                                    },
                                                    yellow_card: {
                                                        bg: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30',
                                                        text: 'text-amber-500 dark:text-amber-400',
                                                        icon: 'square'
                                                    },
                                                    red_card: {
                                                        bg: 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30',
                                                        text: 'text-rose-500 dark:text-rose-400',
                                                        icon: 'square'
                                                    },
                                                    substitution: {
                                                        bg: 'bg-sky-500/10 dark:bg-sky-500/20 border-sky-500/30',
                                                        text: 'text-sky-500 dark:text-sky-400',
                                                        icon: 'cached'
                                                    }
                                                }[e.type];

                                                return (
                                                    <div key={index} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                                                        {/* Left Side: Home Events (Right Aligned) */}
                                                        <div className="text-right pr-1">
                                                            {isHome && (
                                                                <div className="flex flex-col">
                                                                    {e.type === 'goal' && (
                                                                        <>
                                                                            <span className="font-bold text-[11px] text-white leading-tight">{e.player}</span>
                                                                            {e.assist && <span className="text-[9px] text-slate-400">Passe de {e.assist}</span>}
                                                                        </>
                                                                    )}
                                                                    {(e.type === 'yellow_card' || e.type === 'red_card') && (
                                                                        <>
                                                                            <span className="font-semibold text-[11px] text-white leading-tight">{e.player}</span>
                                                                            <span className="text-[9px] text-slate-400">{e.type === 'yellow_card' ? 'Carton jaune' : 'Carton rouge'}</span>
                                                                        </>
                                                                    )}
                                                                    {e.type === 'substitution' && (
                                                                        <div className="flex flex-col leading-tight">
                                                                            <span className="text-[10px] text-slate-300 font-medium">⬆️ {e.playerIn}</span>
                                                                            <span className="text-[9px] text-slate-500">⬇️ {e.playerOut}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Center Column: Circular Material Icon Wrapper + Minute Badge */}
                                                        <div className="flex flex-col items-center justify-center relative">
                                                            <div className={`w-8 h-8 rounded-full border ${eventStyles.bg} flex items-center justify-center relative z-10 shadow-sm transition-transform hover:scale-110 duration-200 bg-[#0f172a]`}>
                                                                {e.type === 'yellow_card' || e.type === 'red_card' ? (
                                                                    <span
                                                                        className={`material-symbols-outlined notranslate text-[10px] ${eventStyles.text} select-none`}
                                                                        style={{ fontVariationSettings: '"FILL" 1' }}
                                                                        translate="no"
                                                                    >
                                                                        {eventStyles.icon}
                                                                    </span>
                                                                ) : (
                                                                    <span className={`material-symbols-outlined notranslate text-sm ${eventStyles.text} select-none`} translate="no">
                                                                        {eventStyles.icon}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="absolute -bottom-4 text-[8px] font-jersey font-bold text-slate-400 bg-[#0f172a] border border-slate-800/80 px-1 rounded-md mt-0.5 z-20">
                                                                {e.minute}&apos;
                                                            </span>
                                                        </div>

                                                        {/* Right Side: Away Events (Left Aligned) */}
                                                        <div className="text-left pl-1">
                                                            {!isHome && (
                                                                <div className="flex flex-col">
                                                                    {e.type === 'goal' && (
                                                                        <>
                                                                            <span className="font-bold text-[11px] text-white leading-tight">{e.player}</span>
                                                                            {e.assist && <span className="text-[9px] text-slate-400">Passe de {e.assist}</span>}
                                                                        </>
                                                                    )}
                                                                    {(e.type === 'yellow_card' || e.type === 'red_card') && (
                                                                        <>
                                                                            <span className="font-semibold text-[11px] text-white leading-tight">{e.player}</span>
                                                                            <span className="text-[9px] text-slate-400">{e.type === 'yellow_card' ? 'Carton jaune' : 'Carton rouge'}</span>
                                                                        </>
                                                                    )}
                                                                    {e.type === 'substitution' && (
                                                                        <div className="flex flex-col leading-tight">
                                                                            <span className="text-[10px] text-slate-300 font-medium">⬆️ {e.playerIn}</span>
                                                                            <span className="text-[9px] text-slate-500">⬇️ {e.playerOut}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* STADIUM WEATHER ANIMATIONS */}
            <style>{`
                @keyframes fall {
                    0% {
                        transform: translate3d(0, -20px, 0) rotate(15deg);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.7;
                    }
                    90% {
                        opacity: 0.7;
                    }
                    100% {
                        transform: translate3d(25px, 160px, 0) rotate(15deg);
                        opacity: 0;
                    }
                }
                @keyframes fall-slow {
                    0% {
                        transform: translate3d(0, -10px, 0) rotate(0deg);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.8;
                    }
                    90% {
                        opacity: 0.8;
                    }
                    100% {
                        transform: translate3d(30px, 160px, 0) rotate(360deg);
                        opacity: 0;
                    }
                }
                @keyframes blow {
                    0% {
                        transform: translate3d(-100%, 0, 0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.5;
                    }
                    90% {
                        opacity: 0.5;
                    }
                    100% {
                        transform: translate3d(150%, 0, 0);
                        opacity: 0;
                    }
                }
                @keyframes pulse-glow {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.6;
                    }
                    50% {
                        transform: scale(1.2);
                        opacity: 0.85;
                    }
                }
                @keyframes heat-shimmer {
                    0%, 100% {
                        transform: scaleY(1) translate3d(0, 0, 0);
                    }
                    50% {
                        transform: scaleY(1.06) translate3d(0, -4px, 0);
                    }
                }
                @keyframes drift {
                    0% {
                        transform: translate3d(-50%, 0, 0);
                    }
                    100% {
                        transform: translate3d(0%, 0, 0);
                    }
                }
                @keyframes star-twinkle {
                    0%, 100% {
                        opacity: 0.2;
                        transform: scale(0.7);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.3);
                    }
                }
                .shimmer-waves {
                    background: repeating-linear-gradient(
                        0deg,
                        rgba(245, 158, 11, 0.05),
                        rgba(245, 158, 11, 0.05) 12px,
                        rgba(245, 158, 11, 0.01) 12px,
                        rgba(245, 158, 11, 0.01) 24px
                    );
                    background-size: 100% 200%;
                    animation: heat-shimmer 2.2s ease-in-out infinite;
                }
                .rain-drop {
                    background: linear-gradient(transparent, rgba(14, 165, 233, 0.6));
                }
                .animate-star-twinkle {
                    animation: star-twinkle 2.5s infinite ease-in-out;
                }
                .animate-pulse-glow {
                    animation: pulse-glow 4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
export default MatchCardWidget;
