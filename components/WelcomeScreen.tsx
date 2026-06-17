import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SparklesText } from './magicui/SparklesText';
import { useLanguage } from '../src/contexts/LanguageContext';
import { MatchCardWidget } from './MatchCardWidget';

interface WelcomeScreenProps {
  firstName: string;
  onSuggestionClick: (text: string) => void;
  isKeyboardOpen?: boolean;
}

const allQuestions = [
  { key: "q1", icon: "today" },
  { key: "q2", icon: "rainy" },
  { key: "q3", icon: "public" },
  { key: "q4", icon: "cloud" },
  { key: "q5", icon: "thunderstorm" },
  { key: "q6", icon: "air" },
  { key: "q7", icon: "wb_sunny" },
  { key: "q8", icon: "waves" },
  { key: "q9", icon: "foggy" },
  { key: "q10", icon: "wb_cloudy" },
  { key: "q11", icon: "air" },
  { key: "q12", icon: "warning" },
  { key: "q13", icon: "speed" },
  { key: "q14", icon: "water_drop" },
  { key: "q15", icon: "looks" },
  { key: "q16", icon: "filter_drama" },
  { key: "q17", icon: "cyclone" },
  { key: "q18", icon: "water_drop" },
  { key: "q19", icon: "thunderstorm" },
  { key: "q20", icon: "looks" },
];

const getRandomQuestions = (count: number) => {
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ firstName, onSuggestionClick, isKeyboardOpen = false }) => {
  const { language, t } = useLanguage();
  const [subtitleIndex] = useState(() => Math.floor(Math.random() * 11));
  const [otherMatches, setOtherMatches] = useState<any[]>([]);
  const [featuredMatchId, setFeaturedMatchId] = useState<string>("arg_alg_2026");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch('/api/worldcup/matches');
        if (response.ok) {
          const data = await response.json();
          setAllMatches(data);
          
          // Determine the featured match of the day dynamically
          const todayStr = new Date().toISOString().split('T')[0];
          const todayMatches = data.filter((m: any) => m.kickoff.startsWith(todayStr));
          
          let featured = null;
          if (todayMatches.length > 0) {
            // 1. Look for live match first
            featured = todayMatches.find((m: any) => m.status === 'live');
            // 2. Look for scheduled match next
            if (!featured) {
              featured = todayMatches.find((m: any) => m.status === 'scheduled');
            }
            // 3. Fallback to finished match today
            if (!featured) {
              featured = todayMatches[0];
            }
          }
          
          // If no matches today, find the first scheduled match overall
          if (!featured) {
            featured = data.find((m: any) => m.status === 'scheduled');
          }
          
          // Fallback to first match overall
          if (!featured && data.length > 0) {
            featured = data[0];
          }
          
          const finalFeaturedId = featured ? featured.id : "arg_alg_2026";
          setFeaturedMatchId(finalFeaturedId);
          
          // Other matches of the day are today's matches except the featured one
          const otherGames = data.filter((m: any) => m.id !== finalFeaturedId && m.kickoff.startsWith(todayStr));
          setOtherMatches(otherGames);
        }
      } catch (err) {
        console.error("Error fetching other matches:", err);
      }
    };
    fetchMatches();
  }, []);

  const getGreetingKey = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'welcome.greetingMorning';
    if (hour < 18) return 'welcome.greetingAfternoon';
    return 'welcome.greetingEvening';
  };

  const numQuestions = 4;
  const [questions, setQuestions] = useState(getRandomQuestions(numQuestions));
  const [fadingIndex, setFadingIndex] = useState<number | null>(null);
  const questionIndexToUpdate = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const indexToUpdate = questionIndexToUpdate.current;
      setFadingIndex(indexToUpdate);

      setTimeout(() => {
        setQuestions(currentQuestions => {
          const newQuestions = [...currentQuestions];
          const currentQuestionKeys = newQuestions.map(q => q.key);

          let newQuestion;
          do {
            newQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)];
          } while (currentQuestionKeys.includes(newQuestion.key));

          newQuestions[indexToUpdate] = newQuestion;
          return newQuestions;
        });

        setTimeout(() => {
          setFadingIndex(null);
        }, 500);
      }, 500);

      questionIndexToUpdate.current = (indexToUpdate + 1) % numQuestions;
    }, 15000); // Rotate every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Lock body scroll when history modal is open
  useEffect(() => {
    if (showHistoryModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showHistoryModal]);

  return (
    <div 
      className={`flex flex-col flex-1 overflow-y-auto px-4 sm:px-8 h-full custom-scrollbar ${isKeyboardOpen ? 'pt-2 pb-2' : 'pt-8 sm:pt-16 pb-32'}`}
      style={{
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 24px, black calc(100% - 40px), transparent 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 24px, black calc(100% - 40px), transparent 100%)'
      }}
    >
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center sm:items-start text-center sm:text-left">

        {/* Header Greetings */}
        <h1 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 md:mb-4 tracking-tight leading-tight text-[clamp(2.5rem,8vw,4.5rem)]" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15))' }}>
          {t(getGreetingKey())},{' '}
          <SparklesText colors={{ first: '#0ea5e9', second: '#6366f1' }} sparklesCount={6}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-indigo-500">
              {firstName || t('welcome.greetingThere')}!
            </span>
          </SparklesText>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 md:mb-12 text-[clamp(1.25rem,4vw,1.75rem)]" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.12)' }}>
          {t(`welcome.subtitle${subtitleIndex}`)}
        </p>
        {/* Match à l'affiche / World Cup Featured Match */}
        <div className="w-full mb-8 flex flex-col items-center sm:items-start z-10">
          <div className="flex items-center gap-2 mb-3 px-1 text-slate-700 dark:text-slate-300 font-bold text-xs md:text-sm tracking-wider uppercase select-none">
            <span className="animate-pulse flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <img src="/tournaments_fifa-world-cup-2026.football-logos.cc.svg" alt="FIFA WC 2026" className="w-5 h-5 object-contain" />
            <span>Match Vedette Mondial 2026</span>
          </div>
          <MatchCardWidget matchId={featuredMatchId} />
        </div>

        {/* Autres Matchs du Jour / Other Games of the Day */}
        {otherMatches.length > 0 && (
          <div className="w-full mb-8 z-10">
            <div className="flex items-center justify-between w-full mb-3 px-1">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs md:text-sm tracking-wider uppercase select-none">
                <img src="/tournaments_fifa-world-cup-2026.football-logos.cc.svg" alt="FIFA WC 2026" className="w-4 h-4 object-contain" />
                <span>Autres Matchs du Jour</span>
              </div>
              <button 
                onClick={() => setShowHistoryModal(true)}
                className="text-[11px] md:text-xs font-bold text-white bg-gradient-to-br from-red-600 via-emerald-600 to-indigo-600 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer select-none px-3.5 py-1.5 rounded-full border border-white/10 shadow-sm"
              >
                <span className="material-symbols-outlined text-xs leading-none" style={{ fontSize: '14px' }}>history</span>
                <span>{language === 'fr' ? 'Matchs Précédents' : 'Previous Matches'}</span>
              </button>
            </div>
            
            <div className="w-[calc(100%+2rem)] -ml-4 sm:w-[calc(100%+4rem)] sm:-ml-8 relative"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
                maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)'
              }}>
              <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-4 sm:px-8 snap-x snap-mandatory scroll-smooth hide-scrollbar">
                {otherMatches.map(match => {
                  const kickoffDate = new Date(match.kickoff);
                  const timeLabel = kickoffDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div 
                      key={match.id} 
                      className="min-w-[280px] sm:min-w-[320px] rounded-2xl p-5 flex flex-col justify-between transition-all duration-500 bg-white/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md backdrop-blur-sm hover:border-slate-300 dark:hover:border-slate-600 snap-start"
                    >
                      <div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-4 select-none">
                          <span className="tracking-wider uppercase opacity-85">{match.group} • {match.round}</span>
                          <span className="bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border border-slate-200/55 dark:border-slate-800/55 px-2.5 py-0.5 rounded-full font-bold shadow-sm">{match.venue.city}</span>
                        </div>
                        
                        <div className="flex items-center justify-between my-2 px-1">
                          <div className="flex items-center gap-2.5 w-[42%]">
                            <span className="text-2xl drop-shadow-sm select-none">{match.home.flag}</span>
                            <span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 truncate">{match.home.name}</span>
                          </div>
                          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black tracking-widest bg-white/70 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 px-2 py-0.5 rounded shadow-sm select-none">VS</span>
                          <div className="flex items-center gap-2.5 justify-end w-[42%] text-right">
                            <span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 truncate">{match.away.name}</span>
                            <span className="text-2xl drop-shadow-sm select-none">{match.away.flag}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-5 pt-3.5 border-t border-slate-200/40 dark:border-slate-700/40">
                        {(() => {
                          if (timeLabel.includes(':')) {
                            const parts = timeLabel.split(':');
                            return (
                              <span className="text-[11px] font-jersey text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md shadow-sm select-none inline-flex items-center">
                                <span>{parts[0]}</span>
                                <span className="font-sans text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mx-[0.5px] select-none translate-y-[-1px] font-bold">:</span>
                                <span>{parts[1]}</span>
                              </span>
                            );
                          }
                          return (
                            <span className="text-[11px] font-jersey text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md shadow-sm select-none">
                              {timeLabel}
                            </span>
                          );
                        })()}
                        <button 
                          onClick={() => {
                            const isFr = language === 'fr';
                            const dateLabel = kickoffDate.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' });
                            const question = isFr
                              ? `Parle-moi du match de Coupe du Monde : ${match.home.name} ${match.home.flag} vs ${match.away.name} ${match.away.flag} le ${dateLabel}. Est-ce que la météo va impacter le jeu à ${match.venue.city} (${match.venue.name}) ?`
                              : `Tell me about the World Cup match: ${match.home.name} ${match.home.flag} vs ${match.away.name} ${match.away.flag} on ${dateLabel}. Will the weather impact the game in ${match.venue.city} (${match.venue.name})?`;
                            onSuggestionClick(question);
                          }}
                          className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer select-none"
                        >
                          <span>Analyse Météo</span>
                          <span className="material-symbols-outlined text-xs leading-none" style={{ fontSize: '13px' }}>arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Suggestion List wrapped in Fade Mask */}
        {!isKeyboardOpen && (
          <div className="w-[calc(100%+2rem)] -ml-4 sm:w-[calc(100%+4rem)] sm:-ml-8 relative"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
              maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)'
            }}>
            <div className="w-full flex gap-4 overflow-x-auto pb-4 pt-2 px-4 sm:px-8 snap-x snap-mandatory hide-scrollbar">
              {questions.map((suggestion, index) => {
                const suggestionText = t('welcome.' + suggestion.key);
                return (
                  <button
                    key={`${suggestion.key}-${index}`}
                    onClick={() => onSuggestionClick(suggestionText)}
                    className={`group relative flex flex-col justify-between text-left p-5 min-w-[200px] w-56 sm:w-64 aspect-[4/3] h-auto flex-shrink-0
                               rounded-2xl snap-start cursor-pointer transition-all duration-500
                               bg-white/40 sm:hover:bg-white/70 active:bg-white/70 dark:bg-slate-800/40 dark:sm:hover:bg-slate-700/60 dark:active:bg-slate-700/60                           border border-slate-200/50 hover:border-slate-300 dark:border-slate-700/50 dark:hover:border-slate-600
                               shadow-sm hover:shadow-md backdrop-blur-sm
                               ${fadingIndex === index ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                    aria-label={`Suggestion: ${suggestionText}`}
                  >
                    <h4 className="text-fluid-base text-slate-700 dark:text-slate-300 font-medium leading-snug">
                      {suggestionText}
                    </h4>

                    <div className="absolute bottom-4 right-4 w-10 h-10 flex flex-col items-center justify-center 
                                  rounded-full bg-white dark:bg-slate-900 
                                  text-slate-600 dark:text-slate-300 shadow-sm
                                  group-hover:scale-110 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-transform duration-200">
                      <span className="material-symbols-outlined notranslate text-[1.3rem]" translate="no">
                        {suggestion.icon}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Required CSS to hide scrollbar for suggestions but keep them scrollable */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
      `}</style>

      {/* Previous Games Modal */}
      {showHistoryModal && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowHistoryModal(false);
              setExpandedMatchId(null);
            }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
        >
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {language === 'fr' ? 'Matchs Précédents' : 'Previous Matches'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === 'fr' ? 'Historique et statistiques des rencontres terminées' : 'History and statistics of completed fixtures'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowHistoryModal(false);
                  setExpandedMatchId(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <span className="material-symbols-outlined notranslate text-lg" translate="no">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {(() => {
                const finishedMatches = allMatches.filter((m: any) => m.status === 'finished');
                if (finishedMatches.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      {language === 'fr' ? 'Aucun match précédent enregistré.' : 'No previous matches recorded.'}
                    </div>
                  );
                }

                return finishedMatches.map((match: any) => {
                  const isExpanded = expandedMatchId === match.id;
                  const kickoffDate = new Date(match.kickoff);
                  const dateLabel = kickoffDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' });
                  
                  return (
                    <div 
                      key={match.id}
                      className="rounded-2xl border border-slate-800/60 bg-slate-950/40 overflow-hidden transition-all duration-300 hover:border-slate-700/60"
                    >
                      {/* Match row */}
                      <div 
                        onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors select-none"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            {match.group} • {match.round}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium bg-slate-850 border border-slate-800/80 px-2.5 py-0.5 rounded-md w-fit">
                            {dateLabel} • {match.venue.city}
                          </span>
                        </div>

                        {/* Center Teams and Score */}
                        <div className="flex items-center gap-4 flex-1 justify-center px-4">
                          <div className="flex items-center gap-2 w-28 justify-end">
                            <span className="font-bold text-xs truncate max-w-[90px] text-slate-200">{match.home.name}</span>
                            <span className="text-xl select-none">{match.home.flag}</span>
                          </div>
                          
                          <div className="px-3 py-1 rounded-xl bg-slate-950/90 border border-slate-850/80 flex items-center justify-center font-jersey text-base min-w-[50px] shadow-inner select-none text-emerald-400">
                            <span>{match.score.home}</span>
                            <span className="font-sans text-[10px] text-slate-500 mx-1.5 font-bold">-</span>
                            <span>{match.score.away}</span>
                          </div>

                          <div className="flex items-center gap-2 w-28 justify-start">
                            <span className="text-xl select-none">{match.away.flag}</span>
                            <span className="font-bold text-xs truncate max-w-[90px] text-slate-200">{match.away.name}</span>
                          </div>
                        </div>

                        <span className="material-symbols-outlined text-slate-500 text-sm select-none transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          expand_more
                        </span>
                      </div>

                      {/* Expandable Stats drawer */}
                      {isExpanded && match.stats && (
                        <div className="px-6 pb-5 pt-2 border-t border-slate-800/50 bg-slate-950/60 animate-slide-down">
                          
                          {/* Stats Comparison Header */}
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-wider select-none">
                            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{match.home.name}</span>
                            <span>Statistiques</span>
                            <span className="flex items-center gap-1.5 text-right"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" />{match.away.name}</span>
                          </div>

                          {/* Stats rows */}
                          <div className="space-y-3">
                            {(() => {
                              const statsList = [
                                { key: 'possession', label: language === 'fr' ? 'Possession' : 'Possession', unit: '%' },
                                { key: 'shots', label: language === 'fr' ? 'Tirs' : 'Shots', unit: '' },
                                { key: 'shotsOnTarget', label: language === 'fr' ? 'Tirs cadrés' : 'Shots on target', unit: '' },
                                { key: 'fouls', label: language === 'fr' ? 'Fautes' : 'Fouls', unit: '' },
                                { key: 'yellowCards', label: language === 'fr' ? 'Cartons jaunes' : 'Yellow cards', unit: '' },
                                { key: 'corners', label: language === 'fr' ? 'Corners' : 'Corners', unit: '' }
                              ];

                              return statsList.map(st => {
                                const homeVal = match.stats[st.key]?.home ?? 0;
                                const awayVal = match.stats[st.key]?.away ?? 0;
                                const totalVal = homeVal + awayVal === 0 ? 1 : homeVal + awayVal;
                                const homePct = Math.round((homeVal / totalVal) * 100);
                                const awayPct = 100 - homePct;

                                return (
                                  <div key={st.key} className="space-y-1">
                                    <div className="flex justify-between text-xs select-none">
                                      <span className="font-jersey text-emerald-400">{homeVal}{st.unit}</span>
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{st.label}</span>
                                      <span className="font-jersey text-sky-400">{awayVal}{st.unit}</span>
                                    </div>
                                    
                                    {/* Progress track */}
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                                      <div 
                                        className="h-full bg-emerald-500 rounded-l-full transition-all duration-500" 
                                        style={{ width: `${homePct}%` }}
                                      />
                                      <div 
                                        className="h-full bg-sky-500 rounded-r-full transition-all duration-500" 
                                        style={{ width: `${awayPct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>

                          {/* Quick weather analysis inside modal */}
                          <div className="mt-5 pt-3.5 border-t border-slate-800/40 flex justify-end">
                            <button
                              onClick={() => {
                                const isFr = language === 'fr';
                                const fullDateStr = kickoffDate.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' });
                                const question = isFr
                                  ? `Parle-moi du match de Coupe du Monde : ${match.home.name} ${match.home.flag} vs ${match.away.name} ${match.away.flag} le ${fullDateStr}. Est-ce que la météo va impacter le jeu à ${match.venue.city} (${match.venue.name}) ?`
                                  : `Tell me about the World Cup match: ${match.home.name} ${match.home.flag} vs ${match.away.name} ${match.away.flag} on ${fullDateStr}. Will the weather impact the game in ${match.venue.city} (${match.venue.name})?`;
                                setShowHistoryModal(false);
                                onSuggestionClick(question);
                              }}
                              className="text-xs font-bold text-sky-400 hover:text-sky-305 transition-colors flex items-center gap-1 cursor-pointer select-none"
                            >
                              <span>{language === 'fr' ? 'Analyse Tactique & Météo' : 'Tactical & Weather Analysis'}</span>
                              <span className="material-symbols-outlined text-xs leading-none" style={{ fontSize: '13px' }}>arrow_forward</span>
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 flex justify-end bg-slate-950/40">
              <button 
                onClick={() => {
                  setShowHistoryModal(false);
                  setExpandedMatchId(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-800"
              >
                {language === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
