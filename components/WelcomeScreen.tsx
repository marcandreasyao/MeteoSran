import React, { useState, useEffect, useRef } from 'react';
import { SparklesText } from './magicui/SparklesText';
import { useLanguage } from '../src/contexts/LanguageContext';

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
  const { t } = useLanguage();

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

  return (
    <div className={`flex flex-col flex-1 overflow-y-auto px-4 sm:px-8 h-full custom-scrollbar ${isKeyboardOpen ? 'pt-2 pb-2' : 'pt-8 sm:pt-16 pb-32'}`}>
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
          {t('welcome.subtitle')}
        </p>

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
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
