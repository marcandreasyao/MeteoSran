import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useAuth } from '../src/contexts/AuthContext';
import { triggerCelebration, getConfettiColors } from './ConfettiHelper';


interface Team {
    name: string;
    code: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
}

interface BracketMatch {
    id: string;
    home: { name: string; code: string } | null;
    away: { name: string; code: string } | null;
    predictedWinner: { name: string; code: string } | null;
}

interface WorldCupHubModalProps {
    onClose: () => void;
}

export const WorldCupHubModal: React.FC<WorldCupHubModalProps> = ({ onClose }) => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'standings' | 'bracket' | 'opinion' | 'leaderboard'>('standings');
    
    // Tab indicator refs and sliding logic
    const standingsRef = useRef<HTMLButtonElement>(null);
    const bracketRef = useRef<HTMLButtonElement>(null);
    const opinionRef = useRef<HTMLButtonElement>(null);
    const leaderboardRef = useRef<HTMLButtonElement>(null);
    const tabContainerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        const updateIndicator = () => {
            let activeEl: HTMLButtonElement | null = null;
            if (activeTab === 'standings') activeEl = standingsRef.current;
            else if (activeTab === 'bracket') activeEl = bracketRef.current;
            else if (activeTab === 'opinion') activeEl = opinionRef.current;
            else if (activeTab === 'leaderboard') activeEl = leaderboardRef.current;

            if (activeEl) {
                setIndicatorStyle({
                    left: activeEl.offsetLeft,
                    width: activeEl.offsetWidth
                });

                // Smoothly scroll the active tab into center of the visible area in the tab container on mobile
                if (tabContainerRef.current) {
                    const container = tabContainerRef.current;
                    const scrollLeft = activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;
                    container.scrollTo({
                        left: scrollLeft,
                        behavior: 'smooth'
                    });
                }
            }
        };

        updateIndicator();
        // Wait one frame to ensure layout sizing has stabilized
        const rafId = requestAnimationFrame(updateIndicator);
        window.addEventListener('resize', updateIndicator);
        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', updateIndicator);
        };
    }, [activeTab]);
    
    // Standings state
    const [standings, setStandings] = useState<{ [key: string]: Team[] }>({});
    const [standingsLoading, setStandingsLoading] = useState(true);

    // Leaderboard state
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);

    // AI Opinion state
    const [opinion, setOpinion] = useState('');
    const [opinionLoading, setOpinionLoading] = useState(false);

    // Bracket State
    const [activeRound, setActiveRound] = useState<'r32' | 'r16' | 'qf' | 'sf' | 'final'>('r32');
    const [r32Matches, setR32Matches] = useState<BracketMatch[]>([]);
    const [r16Matches, setR16Matches] = useState<BracketMatch[]>([]);
    const [qfMatches, setQfMatches] = useState<BracketMatch[]>([]);
    const [sfMatches, setSfMatches] = useState<BracketMatch[]>([]);
    const [finalMatch, setFinalMatch] = useState<BracketMatch | null>(null);
    const [champion, setChampion] = useState<{ name: string; code: string } | null>(null);

    // Fetch Standings on load
    useEffect(() => {
        const fetchStandings = async () => {
            try {
                setStandingsLoading(true);
                const response = await fetch('/api/worldcup/standings');
                if (response.ok) {
                    const data = await response.json();
                    setStandings(data);
                    seedBracket(data);
                }
            } catch (err) {
                console.error("Error fetching standings:", err);
            } finally {
                setStandingsLoading(false);
            }
        };
        fetchStandings();
    }, []);

    // Fetch AI Opinion when tab changes
    useEffect(() => {
        if (activeTab === 'opinion' && !opinion) {
            const fetchOpinion = async () => {
                try {
                    setOpinionLoading(true);
                    const response = await fetch(`/api/worldcup/opinion?lang=${language}`);
                    if (response.ok) {
                        const data = await response.json();
                        setOpinion(data.text);
                    }
                } catch (err) {
                    console.error("Error fetching AI opinion:", err);
                } finally {
                    setOpinionLoading(false);
                }
            };
            fetchOpinion();
        }
    }, [activeTab, language, opinion]);

    // Fetch Leaderboard when tab changes
    useEffect(() => {
        if (activeTab === 'leaderboard') {
            const fetchLeaderboard = async () => {
                try {
                    setLeaderboardLoading(true);
                    const response = await fetch('/api/worldcup/leaderboard');
                    if (response.ok) {
                        const data = await response.json();
                        setLeaderboard(data);
                    }
                } catch (err) {
                    console.error("Error fetching leaderboard:", err);
                } finally {
                    setLeaderboardLoading(false);
                }
            };
            fetchLeaderboard();
        }
    }, [activeTab]);

    // Seed Bracket based on current standings
    const seedBracket = (standingsData: { [key: string]: Team[] }) => {
        // Find qualified teams (1st, 2nd, and top 8 3rd-placed)
        const winners: { [key: string]: { name: string; code: string } } = {};
        const runnersUp: { [key: string]: { name: string; code: string } } = {};
        const thirdPlacedList: { name: string; code: string; points: number; gd: number; gf: number; group: string }[] = [];

        const groupNames = [
            'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F',
            'Group I', 'Group G', 'Group H', 'Group J', 'Group K', 'Group L'
        ];

        // Process groups
        Object.entries(standingsData).forEach(([grpName, teams]) => {
            const cleanGrp = grpName.replace('Group ', '');
            if (teams[0]) winners[cleanGrp] = { name: teams[0].team, code: teams[0].code };
            if (teams[1]) runnersUp[cleanGrp] = { name: teams[1].team, code: teams[1].code };
            if (teams[2]) {
                thirdPlacedList.push({
                    name: teams[2].team,
                    code: teams[2].code,
                    points: teams[2].points,
                    gd: teams[2].goalDifference,
                    gf: teams[2].goalsFor,
                    group: cleanGrp
                });
            }
        });

        // Sort third placed teams to get top 8
        thirdPlacedList.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
        const top8Third = thirdPlacedList.slice(0, 8);

        // Fallbacks if groups don't have enough teams seeded yet
        const getWinner = (g: string) => winners[g] || { name: `Winner ${g}`, code: 'UN' };
        const getRunner = (g: string) => runnersUp[g] || { name: `Runner-up ${g}`, code: 'UN' };
        const get3rd = (idx: number, fallbackLabel: string) => top8Third[idx] ? { name: top8Third[idx].name, code: top8Third[idx].code } : { name: fallbackLabel, code: 'UN' };

        // Construct 16 Round of 32 Matches based on official pairings
        const initialR32Matches: BracketMatch[] = [
            { id: 'm1', home: getRunner('A'), away: getRunner('B'), predictedWinner: null },
            { id: 'm2', home: getWinner('C'), away: getRunner('F'), predictedWinner: null },
            { id: 'm3', home: getWinner('E'), away: get3rd(0, '3rd A/B/C/D/F'), predictedWinner: null },
            { id: 'm4', home: getWinner('F'), away: getRunner('C'), predictedWinner: null },
            { id: 'm5', home: getRunner('E'), away: getRunner('I'), predictedWinner: null },
            { id: 'm6', home: getWinner('I'), away: get3rd(1, '3rd C/D/F/G/H'), predictedWinner: null },
            { id: 'm7', home: getWinner('A'), away: get3rd(2, '3rd C/E/F/H/I'), predictedWinner: null },
            { id: 'm8', home: getWinner('L'), away: get3rd(3, '3rd E/H/I/J/K'), predictedWinner: null },
            { id: 'm9', home: getWinner('G'), away: get3rd(4, '3rd A/E/H/I/J'), predictedWinner: null },
            { id: 'm10', home: getWinner('D'), away: get3rd(5, '3rd B/E/F/I/J'), predictedWinner: null },
            { id: 'm11', home: getWinner('H'), away: getRunner('J'), predictedWinner: null },
            { id: 'm12', home: getRunner('K'), away: getRunner('L'), predictedWinner: null },
            { id: 'm13', home: getWinner('B'), away: get3rd(6, '3rd E/F/G/I/J'), predictedWinner: null },
            { id: 'm14', home: getRunner('D'), away: getRunner('G'), predictedWinner: null },
            { id: 'm15', home: getWinner('J'), away: getRunner('H'), predictedWinner: null },
            { id: 'm16', home: getWinner('K'), away: get3rd(7, '3rd D/E/I/J/L'), predictedWinner: null }
        ];

        // Seed subsequent rounds as empty matches
        const initialR16: BracketMatch[] = Array.from({ length: 8 }, (_, i) => ({ id: `r16_${i+1}`, home: null, away: null, predictedWinner: null }));
        const initialQF: BracketMatch[] = Array.from({ length: 4 }, (_, i) => ({ id: `qf_${i+1}`, home: null, away: null, predictedWinner: null }));
        const initialSF: BracketMatch[] = Array.from({ length: 2 }, (_, i) => ({ id: `sf_${i+1}`, home: null, away: null, predictedWinner: null }));
        const initialFinal: BracketMatch = { id: 'final', home: null, away: null, predictedWinner: null };

        // Attempt to load predictions from local storage if they match current standings
        const savedPredictions = localStorage.getItem('world_cup_bracket_predictions');
        if (savedPredictions) {
            try {
                const parsed = JSON.parse(savedPredictions);
                // Simple validation check: ensure R32 match home/away match current seeding
                let valid = true;
                for (let i = 0; i < 16; i++) {
                    if (parsed.r32[i]?.home?.name !== initialR32Matches[i].home?.name ||
                        parsed.r32[i]?.away?.name !== initialR32Matches[i].away?.name) {
                        valid = false;
                        break;
                    }
                }
                if (valid) {
                    setR32Matches(parsed.r32);
                    setR16Matches(parsed.r16);
                    setQfMatches(parsed.qf);
                    setSfMatches(parsed.sf);
                    setFinalMatch(parsed.final);
                    setChampion(parsed.champion);
                    return;
                }
            } catch (e) {
                console.warn("Failed to load saved bracket predictions:", e);
            }
        }

        setR32Matches(initialR32Matches);
        setR16Matches(initialR16);
        setQfMatches(initialQF);
        setSfMatches(initialSF);
        setFinalMatch(initialFinal);
        setChampion(null);
    };

    // Propagate winner selections to the next round
    const selectWinner = (round: 'r32' | 'r16' | 'qf' | 'sf' | 'final', matchIndex: number, winner: { name: string; code: string } | null) => {
        if (!winner) return;

        if (round === 'r32') {
            const updated = [...r32Matches];
            updated[matchIndex].predictedWinner = winner;
            setR32Matches(updated);

            // Propagate to Round of 16
            const nextMatchIdx = Math.floor(matchIndex / 2);
            const isHome = matchIndex % 2 === 0;
            const updatedR16 = [...r16Matches];
            
            // If the team changed, clear downstream predictions
            const prevWinner = updatedR16[nextMatchIdx][isHome ? 'home' : 'away'];
            if (prevWinner?.name !== winner.name) {
                updatedR16[nextMatchIdx][isHome ? 'home' : 'away'] = winner;
                clearDownstream('r16', nextMatchIdx, isHome, updatedR16);
            }
            setR16Matches(updatedR16);
        } else if (round === 'r16') {
            const updated = [...r16Matches];
            updated[matchIndex].predictedWinner = winner;
            setR16Matches(updated);

            const nextMatchIdx = Math.floor(matchIndex / 2);
            const isHome = matchIndex % 2 === 0;
            const updatedQf = [...qfMatches];
            
            const prevWinner = updatedQf[nextMatchIdx][isHome ? 'home' : 'away'];
            if (prevWinner?.name !== winner.name) {
                updatedQf[nextMatchIdx][isHome ? 'home' : 'away'] = winner;
                clearDownstream('qf', nextMatchIdx, isHome, updatedQf);
            }
            setQfMatches(updatedQf);
        } else if (round === 'qf') {
            const updated = [...qfMatches];
            updated[matchIndex].predictedWinner = winner;
            setQfMatches(updated);

            const nextMatchIdx = Math.floor(matchIndex / 2);
            const isHome = matchIndex % 2 === 0;
            const updatedSf = [...sfMatches];
            
            const prevWinner = updatedSf[nextMatchIdx][isHome ? 'home' : 'away'];
            if (prevWinner?.name !== winner.name) {
                updatedSf[nextMatchIdx][isHome ? 'home' : 'away'] = winner;
                clearDownstream('sf', nextMatchIdx, isHome, updatedSf);
            }
            setSfMatches(updatedSf);
        } else if (round === 'sf') {
            const updated = [...sfMatches];
            updated[matchIndex].predictedWinner = winner;
            setSfMatches(updated);

            if (finalMatch) {
                const updatedFinal = { ...finalMatch };
                const isHome = matchIndex === 0;
                
                const prevWinner = updatedFinal[isHome ? 'home' : 'away'];
                if (prevWinner?.name !== winner.name) {
                    updatedFinal[isHome ? 'home' : 'away'] = winner;
                    updatedFinal.predictedWinner = null;
                    setChampion(null);
                }
                setFinalMatch(updatedFinal);
            }
        } else if (round === 'final') {
            if (finalMatch) {
                const updatedFinal = { ...finalMatch, predictedWinner: winner };
                setFinalMatch(updatedFinal);
                setChampion(winner);
                if (winner && winner.code !== 'UN') {
                    triggerCelebration(winner.code);
                }
            }
        }
    };

    // Downstream prediction clear to keep tree valid
    const clearDownstream = (currentRound: 'r16' | 'qf' | 'sf', matchIndex: number, isHome: boolean, currentRoundMatches: BracketMatch[]) => {
        // Clear predictedWinner of the current match because its team inputs changed
        currentRoundMatches[matchIndex].predictedWinner = null;

        if (currentRound === 'r16') {
            const qfIdx = Math.floor(matchIndex / 2);
            const qfIsHome = matchIndex % 2 === 0;
            const updatedQf = [...qfMatches];
            updatedQf[qfIdx][qfIsHome ? 'home' : 'away'] = null;
            updatedQf[qfIdx].predictedWinner = null;
            setQfMatches(updatedQf);

            const sfIdx = Math.floor(qfIdx / 2);
            const sfIsHome = qfIdx % 2 === 0;
            const updatedSf = [...sfMatches];
            updatedSf[sfIdx][sfIsHome ? 'home' : 'away'] = null;
            updatedSf[sfIdx].predictedWinner = null;
            setSfMatches(updatedSf);

            if (finalMatch) {
                const updatedFinal = { ...finalMatch };
                updatedFinal[sfIdx === 0 ? 'home' : 'away'] = null;
                updatedFinal.predictedWinner = null;
                setFinalMatch(updatedFinal);
            }
            setChampion(null);
        } else if (currentRound === 'qf') {
            const sfIdx = Math.floor(matchIndex / 2);
            const sfIsHome = matchIndex % 2 === 0;
            const updatedSf = [...sfMatches];
            updatedSf[sfIdx][sfIsHome ? 'home' : 'away'] = null;
            updatedSf[sfIdx].predictedWinner = null;
            setSfMatches(updatedSf);

            if (finalMatch) {
                const updatedFinal = { ...finalMatch };
                updatedFinal[sfIdx === 0 ? 'home' : 'away'] = null;
                updatedFinal.predictedWinner = null;
                setFinalMatch(updatedFinal);
            }
            setChampion(null);
        } else if (currentRound === 'sf') {
            if (finalMatch) {
                const updatedFinal = { ...finalMatch };
                updatedFinal[matchIndex === 0 ? 'home' : 'away'] = null;
                updatedFinal.predictedWinner = null;
                setFinalMatch(updatedFinal);
            }
            setChampion(null);
        }
    };

    // Save predictions to localStorage whenever bracket state changes
    useEffect(() => {
        if (r32Matches.length > 0) {
            const state = {
                r32: r32Matches,
                r16: r16Matches,
                qf: qfMatches,
                sf: sfMatches,
                final: finalMatch,
                champion
            };
            localStorage.setItem('world_cup_bracket_predictions', JSON.stringify(state));
        }
    }, [r32Matches, r16Matches, qfMatches, sfMatches, finalMatch, champion]);

    const resetBracket = () => {
        if (Object.keys(standings).length > 0) {
            localStorage.removeItem('world_cup_bracket_predictions');
            seedBracket(standings);
        }
    };

    return createPortal(
        <div 
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
        >
            <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl flex flex-col h-[85vh] max-h-[800px] overflow-hidden animate-scale-up relative">
                
                {/* Modal Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg p-1.5 flex-shrink-0">
                            <img src="/tournaments_fifa-world-cup-2026.football-logos.cc.svg" alt="FIFA WC 2026" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                                {language === 'fr' ? 'Espace Coupe du Monde 2026' : 'FIFA World Cup 2026 Hub'}
                            </h3>
                            <p className="text-[11px] text-slate-400">
                                {language === 'fr' ? 'Classements, Bracket interactif et avis MeteoSran' : 'Standings, Interactive Bracket, and MeteoSran Opinion'}
                            </p>
                        </div>
                    </div>
                    
                    {/* Tabs & Close button */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start flex-shrink-0">
                        <div 
                            ref={tabContainerRef}
                            className="relative flex max-w-[calc(100%-40px)] sm:max-w-none sm:w-auto bg-slate-950 border border-slate-800 p-0.5 rounded-full text-xs font-bold shadow-inner select-none overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap"
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                            }}
                        >
                            <style>{`
                                .no-scrollbar::-webkit-scrollbar {
                                    display: none;
                                }
                            `}</style>
                            {/* Sliding active tab pill */}
                            <div 
                                className="absolute top-0.5 bottom-0.5 rounded-full bg-gradient-to-r from-red-600 via-emerald-600 to-indigo-600 shadow transition-all duration-300 ease-out will-change-[transform,width]"
                                style={{
                                    width: `${indicatorStyle.width}px`,
                                    transform: `translateX(${indicatorStyle.left}px)`,
                                    left: 0
                                }}
                            />
                            
                            <button 
                                ref={standingsRef}
                                onClick={() => setActiveTab('standings')}
                                className={`px-4 py-1.5 rounded-full z-10 transition-colors duration-300 cursor-pointer ${activeTab === 'standings' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                {language === 'fr' ? 'Classements' : 'Standings'}
                            </button>
                            <button 
                                ref={bracketRef}
                                onClick={() => setActiveTab('bracket')}
                                className={`px-4 py-1.5 rounded-full z-10 transition-colors duration-300 cursor-pointer ${activeTab === 'bracket' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Bracket
                            </button>
                            <button 
                                ref={opinionRef}
                                onClick={() => setActiveTab('opinion')}
                                className={`px-4 py-1.5 rounded-full z-10 transition-colors duration-305 cursor-pointer flex items-center gap-1 ${activeTab === 'opinion' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined text-[14px] leading-none">insights</span>
                                <span>Opinion</span>
                            </button>
                            <button 
                                ref={leaderboardRef}
                                onClick={() => setActiveTab('leaderboard')}
                                className={`px-4 py-1.5 rounded-full z-10 transition-colors duration-300 cursor-pointer flex items-center gap-1 ${activeTab === 'leaderboard' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined text-[14px] leading-none">trophy</span>
                                <span>{language === 'fr' ? 'Classement' : 'Leaderboard'}</span>
                            </button>
                        </div>
                        
                        <button 
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                            aria-label="Close"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/20">
                    
                    {/* STANDINGS TAB */}
                    {activeTab === 'standings' && (
                        standingsLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                <span className="text-slate-400 text-xs font-semibold">{language === 'fr' ? 'Calcul des classements en cours...' : 'Computing standings...'}</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                                {Object.entries(standings).map(([groupName, teams]) => (
                                    <div key={groupName} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between">
                                        <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                                            <span>{groupName}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        </h4>
                                        <table className="w-full text-xs font-medium text-slate-300">
                                            <thead>
                                                <tr className="text-[10px] text-slate-500 font-bold uppercase select-none border-b border-slate-800/40">
                                                    <th className="pb-1 text-left w-6">#</th>
                                                    <th className="pb-1 text-left">{language === 'fr' ? 'Équipe' : 'Team'}</th>
                                                    <th className="pb-1 text-center w-6">P</th>
                                                    <th className="pb-1 text-center w-8">GD</th>
                                                    <th className="pb-1 text-center w-8">Pts</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/30">
                                                {teams.map((t, idx) => {
                                                    const isTop2 = idx < 2;
                                                    return (
                                                        <tr key={t.team} className="hover:bg-white/5 transition-colors">
                                                            <td className="py-2.5 font-bold font-jersey text-sm text-slate-500">
                                                                <span className={isTop2 ? "text-emerald-400 font-extrabold" : ""}>{idx + 1}</span>
                                                            </td>
                                                            <td className="py-2.5 font-bold text-slate-100 flex items-center gap-2 truncate max-w-[120px]">
                                                                <img 
                                                                    src={`https://flagcdn.com/${t.code.toLowerCase()}.svg`} 
                                                                    alt={t.team} 
                                                                    className="w-4 h-3 object-cover rounded-[1px] border border-white/10 shadow-sm"
                                                                />
                                                                <span className="truncate">{t.team}</span>
                                                            </td>
                                                            <td className="py-2.5 text-center font-jersey text-slate-300">{t.played}</td>
                                                            <td className="py-2.5 text-center font-jersey text-slate-300">{t.goalDifference > 0 ? `+${t.goalDifference}` : t.goalDifference}</td>
                                                            <td className="py-2.5 text-center font-jersey font-bold text-slate-100 bg-white/5 rounded-md px-1">{t.points}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* INTERACTIVE BRACKET TAB */}
                    {activeTab === 'bracket' && (
                        <div className="flex flex-col gap-4 animate-fade-in">
                            {/* Round Selector Bar */}
                            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-inner gap-2 flex-wrap">
                                <div className="flex gap-1.5 flex-wrap">
                                    {(['r32', 'r16', 'qf', 'sf', 'final'] as const).map((round) => {
                                        const labels = {
                                            r32: language === 'fr' ? '1/16 Finales' : 'Rnd of 32',
                                            r16: language === 'fr' ? '1/8 Finales' : 'Rnd of 16',
                                            qf: language === 'fr' ? 'Quarts' : 'Quarters',
                                            sf: language === 'fr' ? 'Demies' : 'Semis',
                                            final: 'Final'
                                        };
                                        return (
                                            <button
                                                key={round}
                                                onClick={() => setActiveRound(round)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${activeRound === round ? 'bg-slate-800 border border-slate-700 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
                                            >
                                                {labels[round]}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={resetBracket}
                                    className="px-3.5 py-1.5 bg-slate-800/80 hover:bg-red-950/30 border border-slate-700 hover:border-red-900/50 text-slate-300 hover:text-red-400 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none"
                                >
                                    <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                                    <span>{language === 'fr' ? 'Réinitialiser' : 'Reset Prediction'}</span>
                                </button>
                            </div>

                            {/* Bracket Match Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-2">
                                {(() => {
                                    let matchesToRender: BracketMatch[] = [];
                                    let roundKey: 'r32' | 'r16' | 'qf' | 'sf' | 'final' = activeRound;
                                    
                                    if (activeRound === 'r32') matchesToRender = r32Matches;
                                    else if (activeRound === 'r16') matchesToRender = r16Matches;
                                    else if (activeRound === 'qf') matchesToRender = qfMatches;
                                    else if (activeRound === 'sf') matchesToRender = sfMatches;
                                    else if (activeRound === 'final' && finalMatch) matchesToRender = [finalMatch];

                                    if (matchesToRender.length === 0) {
                                        return (
                                            <div className="col-span-full py-16 text-center text-slate-500 text-xs font-semibold bg-slate-900/40 rounded-2xl border border-slate-800 border-dashed">
                                                {language === 'fr' 
                                                    ? 'Veuillez d’abord pronostiquer les tours précédents pour qualifier des équipes.'
                                                    : 'Please predict the previous rounds first to populate these matches.'}
                                            </div>
                                        );
                                    }

                                    return matchesToRender.map((match, matchIdx) => {
                                        const isHomeWinner = match.predictedWinner?.name === match.home?.name;
                                        const isAwayWinner = match.predictedWinner?.name === match.away?.name;

                                        return (
                                            <div key={match.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 shadow flex flex-col justify-between hover:border-slate-700/60 transition-all select-none">
                                                {/* Match meta details */}
                                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mb-2">
                                                    Match {match.id.replace('m','').replace('r16_','').replace('qf_','').replace('sf_','').toUpperCase()}
                                                </span>
                                                
                                                {/* Teams list */}
                                                <div className="flex flex-col gap-1.5">
                                                    {/* Home Team */}
                                                    <button
                                                        disabled={!match.home || match.home.code === 'UN'}
                                                        onClick={() => selectWinner(roundKey, matchIdx, match.home)}
                                                        className={`w-full flex items-center justify-between p-2 rounded-full border text-left cursor-pointer transition-all ${
                                                            isHomeWinner 
                                                                ? 'bg-emerald-950/20 border-emerald-500/50 text-white' 
                                                                : match.home && match.home.code !== 'UN'
                                                                    ? 'bg-slate-950/40 border-slate-850 hover:border-slate-700/60 text-slate-300' 
                                                                    : 'bg-slate-950/10 border-slate-850 text-slate-600 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 truncate max-w-[80%]">
                                                            {match.home && match.home.code !== 'UN' ? (
                                                                <img 
                                                                    src={(!match.home?.code || match.home.code.toLowerCase() === 'tbd') ? 'https://flagcdn.com/un.svg' : `https://flagcdn.com/${match.home.code.toLowerCase()}.svg`} 
                                                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://flagcdn.com/un.svg'; }}
                                                                    alt="" 
                                                                    className="w-4 h-3 object-cover rounded-[1px]"
                                                                />
                                                            ) : (
                                                                <div className="w-4 h-3 bg-slate-850 border border-slate-800 rounded-[1px]" />
                                                            )}
                                                            <span className="font-bold text-xs truncate">{match.home?.name || 'TBD'}</span>
                                                        </div>
                                                        {isHomeWinner && (
                                                            <span className="material-symbols-outlined text-[15px] text-emerald-400 font-extrabold">check_circle</span>
                                                        )}
                                                    </button>

                                                    {/* Away Team */}
                                                    <button
                                                        disabled={!match.away || match.away.code === 'UN'}
                                                        onClick={() => selectWinner(roundKey, matchIdx, match.away)}
                                                        className={`w-full flex items-center justify-between p-2 rounded-full border text-left cursor-pointer transition-all ${
                                                            isAwayWinner 
                                                                ? 'bg-emerald-950/20 border-emerald-500/50 text-white' 
                                                                : match.away && match.away.code !== 'UN'
                                                                    ? 'bg-slate-950/40 border-slate-850 hover:border-slate-700/60 text-slate-300' 
                                                                    : 'bg-slate-950/10 border-slate-850 text-slate-600 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 truncate max-w-[80%]">
                                                            {match.away && match.away.code !== 'UN' ? (
                                                                <img 
                                                                    src={(!match.away?.code || match.away.code.toLowerCase() === 'tbd') ? 'https://flagcdn.com/un.svg' : `https://flagcdn.com/${match.away.code.toLowerCase()}.svg`} 
                                                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://flagcdn.com/un.svg'; }}
                                                                    alt="" 
                                                                    className="w-4 h-3 object-cover rounded-[1px]"
                                                                />
                                                            ) : (
                                                                <div className="w-4 h-3 bg-slate-850 border border-slate-800 rounded-[1px]" />
                                                            )}
                                                            <span className="font-bold text-xs truncate">{match.away?.name || 'TBD'}</span>
                                                        </div>
                                                        {isAwayWinner && (
                                                            <span className="material-symbols-outlined text-[15px] text-emerald-400 font-extrabold">check_circle</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                            {/* Champion display block */}
                            {champion && activeRound === 'final' && (
                                <div className="mt-4 p-6 bg-gradient-to-r from-yellow-500/10 via-amber-500/15 to-yellow-500/10 border border-yellow-500/30 rounded-3xl flex flex-col items-center justify-center text-center shadow-lg animate-bounce-subtle">
                                    <span className="material-symbols-outlined text-4xl text-yellow-400 mb-2 font-black">emoji_events</span>
                                    <h5 className="font-black text-sm uppercase tracking-widest text-yellow-500 leading-none mb-2">
                                        {language === 'fr' ? 'Votre Champion Prédit' : 'Your Predicted Champion'}
                                    </h5>
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src={(!champion.code || champion.code.toLowerCase() === 'tbd') ? 'https://flagcdn.com/un.svg' : `https://flagcdn.com/${champion.code.toLowerCase()}.svg`} 
                                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://flagcdn.com/un.svg'; }}
                                            alt={champion.name} 
                                            className="w-8 h-5.5 object-cover rounded border border-yellow-500/20 shadow-md"
                                        />
                                        <span className="text-xl font-jersey font-black tracking-wide text-white select-text">{champion.name}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* METEOSRAN OPINION TAB */}
                    {activeTab === 'opinion' && (
                        opinionLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4 animate-pulse">
                                <span className="material-symbols-outlined text-4xl text-sky-400 animate-spin">cyclone</span>
                                <span className="text-slate-400 text-xs font-semibold">{language === 'fr' ? 'MeteoSran rédige son analyse du Mondial...' : 'MeteoSran is analyzing the tournament...'}</span>
                            </div>
                        ) : (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm max-w-2xl mx-auto flex flex-col gap-4 animate-fade-in select-text">
                                {/* AI Header */}
                                <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-2">
                                    <div className="w-10 h-10 rounded-full animate-morph-gradient flex items-center justify-center p-1.5 shadow-lg select-none relative overflow-hidden">
                                        <img 
                                            src="/Meteosran-logo.png" 
                                            alt="MeteoSran Logo" 
                                            className="w-7 h-7 object-contain drop-shadow-md z-10" 
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-100 flex items-center gap-1.5 leading-tight">
                                            <span>MeteoSran AI Analyst</span>
                                            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block shadow animate-pulse" />
                                        </h4>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none">
                                            {language === 'fr' ? 'Rapport Tactique & Climat' : 'Tactical & Climate Report'}
                                        </span>
                                    </div>
                                </div>

                                {/* Markdown Content */}
                                <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed font-medium space-y-4 prose-headings:font-bold prose-strong:text-emerald-400">
                                    {opinion.split('\n\n').map((paragraph, idx) => (
                                        <p key={idx}>{paragraph.split('**').map((chunk, cidx) => {
                                            if (cidx % 2 === 1) return <strong key={cidx} className="text-emerald-400 font-extrabold">{chunk}</strong>;
                                            return chunk;
                                        })}</p>
                                    ))}
                                </div>
                            </div>
                        )
                    )}

                    {/* LEADERBOARD TAB */}
                    {activeTab === 'leaderboard' && (
                        leaderboardLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                <span className="text-slate-400 text-xs font-semibold">{language === 'fr' ? 'Chargement du classement...' : 'Loading leaderboard...'}</span>
                            </div>
                        ) : (
                            <div className="max-w-2xl mx-auto flex flex-col gap-4 animate-fade-in w-full">
                                <div className="text-center mb-2 select-none">
                                    <h4 className="text-lg font-black tracking-tight text-white flex items-center justify-center gap-2">
                                        <span>🏆</span>
                                        <span>{language === 'fr' ? 'Classement des Pronostiqueurs' : 'Predictor Leaderboard'}</span>
                                    </h4>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {language === 'fr' ? 'Gagnez 10 points par bon pronostic de match !' : 'Earn 10 points for each correct match prediction!'}
                                    </p>
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-md">
                                    <table className="w-full text-xs text-slate-300 border-collapse">
                                        <thead>
                                            <tr className="text-[10px] text-slate-550 font-bold uppercase select-none border-b border-slate-800/80 bg-slate-950/60">
                                                <th className="py-3 px-4 text-center w-16">{language === 'fr' ? 'Rang' : 'Rank'}</th>
                                                <th className="py-3 px-4 text-left">{language === 'fr' ? 'Utilisateur' : 'User'}</th>
                                                <th className="py-3 px-4 text-center w-28">{language === 'fr' ? 'Corrects' : 'Correct'}</th>
                                                <th className="py-3 px-4 text-center w-28">{language === 'fr' ? 'Points' : 'Points'}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40">
                                            {leaderboard.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="py-12 text-center text-slate-500 font-semibold">
                                                        {language === 'fr' ? 'Aucun pronostic enregistré pour le moment.' : 'No predictions recorded yet.'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                leaderboard.map((u) => {
                                                    const isMe = user?.uid === u.userId;
                                                    let rankBadge = null;
                                                    if (u.rank === 1) rankBadge = <span className="text-base select-none">🥇</span>;
                                                    else if (u.rank === 2) rankBadge = <span className="text-base select-none">🥈</span>;
                                                    else if (u.rank === 3) rankBadge = <span className="text-base select-none">🥉</span>;
                                                    else rankBadge = <span className="font-jersey text-sm text-slate-400 font-bold">{u.rank}</span>;

                                                    return (
                                                        <tr 
                                                            key={u.userId} 
                                                            className={`transition-colors duration-200 ${
                                                                isMe 
                                                                    ? 'bg-sky-500/10 border-y border-sky-500/35 hover:bg-sky-500/15' 
                                                                    : 'hover:bg-white/5'
                                                            }`}
                                                        >
                                                            <td className="py-3 px-4 text-center font-bold">
                                                                <div className="flex items-center justify-center">
                                                                    {rankBadge}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4 font-bold text-slate-100">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="truncate">{u.username}</span>
                                                                    {isMe && (
                                                                        <span className="text-[9px] font-bold text-sky-400 bg-sky-500/20 border border-sky-500/30 px-1.5 py-0.5 rounded-full select-none uppercase tracking-wider">
                                                                            {language === 'fr' ? 'Vous' : 'You'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4 text-center font-jersey text-slate-300 text-sm">
                                                                {u.correctCount} <span className="font-sans text-slate-500 mx-0.5">/</span> {u.totalCount}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <span className={`font-jersey text-sm font-black px-2 py-0.5 rounded-md ${
                                                                    isMe 
                                                                        ? 'text-sky-400 bg-sky-500/10' 
                                                                        : 'text-emerald-400 bg-emerald-500/10'
                                                                }`}>
                                                                    {u.points} pts
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    )}
                </div>

                {/* Centered Premium SVG Floating Bottom Button */}
                {champion && activeRound === 'final' && activeTab === 'bracket' && (() => {
                    const flagColors = getConfettiColors(champion.code);
                    const primaryColor = flagColors[0] || '#f59e0b';
                    const secondaryColor = flagColors[flagColors.length - 1] || '#eab308';
                    
                    return (
                        <button
                            onClick={() => triggerCelebration(champion.code)}
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2.5 px-6 py-3 rounded-full border bg-slate-900/90 text-white font-extrabold text-sm tracking-wide shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-slate-850 hover:shadow-[0_0_25px_-5px_rgba(0,0,0,0.8)] cursor-pointer group"
                            style={{
                                borderColor: `${primaryColor}60`,
                                boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.4), 0 0 20px 0 ${primaryColor}20`,
                            }}
                        >
                            <div className="flex h-7 w-7 rounded-full items-center justify-center bg-gradient-to-tr from-yellow-500/20 to-amber-500/30 border border-yellow-500/30 group-hover:from-yellow-500/35 group-hover:to-amber-500/50 shadow-inner transition-all duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-yellow-400 group-hover:scale-115 group-hover:rotate-12 transition-transform duration-300">
                                    <path d="M5.8 11.3 2 22l10.7-3.8C13 18 14.3 17.7 15.6 17.7H16a4 4 0 0 0 4-4v-.4c0-1.3-.3-2.6-.5-3.9L22 2l-10.7 3.8C10 6 8.7 6.3 7.4 6.3H7a4 4 0 0 0-4 4v.4c0 1.3.3 2.6.5 3.9Z" fill="currentColor" className="opacity-10" />
                                    <path d="M4 14h.01" />
                                    <path d="M20 10h.01" />
                                    <path d="M7 17h.01" />
                                    <path d="M17 7h.01" />
                                </svg>
                            </div>
                            <span className="bg-gradient-to-r from-slate-100 to-slate-200 bg-clip-text text-transparent group-hover:to-white select-none">
                                {language === 'fr' ? 'Célébrer !' : 'Celebrate!'}
                            </span>
                            {/* Small glowing dot indicators showing the active country color */}
                            <span 
                                className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm animate-pulse"
                                style={{ backgroundColor: primaryColor }}
                            />
                        </button>
                    );
                })()}

            </div>
            
            {/* Bounce animation helper styling */}
            <style>{`
                @keyframes bounceSubtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce-subtle {
                    animation: bounceSubtle 3s ease-in-out infinite;
                }
                @keyframes morphGradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-morph-gradient {
                    background: linear-gradient(135deg, #0284c7, #4f46e5, #0ea5e9, #6366f1);
                    background-size: 300% 300%;
                    animation: morphGradient 6s ease infinite;
                    will-change: background-position;
                }
            `}</style>
        </div>,
        document.body
    );
};
export default WorldCupHubModal;

