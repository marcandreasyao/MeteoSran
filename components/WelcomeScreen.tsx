import React, { useState, useEffect, useRef } from 'react';

interface WelcomeScreenProps {
  firstName: string;
  onSuggestionClick: (text: string) => void;
}

const allQuestions = [
  { text: "What's the forecast for today?", icon: "today" },
  { text: "Is it going to rain this week?", icon: "rainy" },
  { text: "Explain the Coriolis effect.", icon: "public" },
  { text: "How are clouds formed?", icon: "cloud" },
  { text: "What is a supercell thunderstorm?", icon: "thunderstorm" },
  { text: "Tell me about the jet stream.", icon: "air" },
  { text: "What's the UV index right now?", icon: "wb_sunny" },
  { text: "How does El Niño affect weather?", icon: "waves" },
  { text: "What are the different types of fog?", icon: "foggy" },
  { text: "Why is the sky blue?", icon: "wb_cloudy" },
  { text: "What's the wind speed and direction?", icon: "air" },
  { text: "Are there any weather alerts for my area?", icon: "warning" },
  { text: "How is barometric pressure measured?", icon: "speed" },
  { text: "What is the dew point?", icon: "water_drop" },
  { text: "Explain the science behind a rainbow.", icon: "looks" },
  { text: "What are cirrus clouds?", icon: "filter_drama" },
  { text: "How do hurricanes form?", icon: "cyclone" },
  { text: "Explain precipitation types.", icon: "water_drop" },
  { text: "Tell me about thunderstorms.", icon: "thunderstorm" },
  { text: "What causes rainbows?", icon: "looks" },
];

const getRandomQuestions = (count: number) => {
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ firstName, onSuggestionClick }) => {
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

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
          const currentQuestionTexts = newQuestions.map(q => q.text);

          let newQuestion;
          do {
            newQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)];
          } while (currentQuestionTexts.includes(newQuestion.text));

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
    <div className="flex flex-col flex-1 overflow-y-auto px-4 sm:px-8 pt-8 sm:pt-16 pb-32 h-full custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center sm:items-start text-center sm:text-left">

        {/* Header Greetings */}
        <h1 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 md:mb-4 tracking-tight leading-tight text-[clamp(2.5rem,8vw,4.5rem)]">
          {greeting},{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-indigo-500">
            {firstName || 'there'}!
          </span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 md:mb-12 text-[clamp(1.25rem,4vw,1.75rem)]">
          How can I assist you with the weather today?
        </p>

        {/* Suggestion List wrapped in Fade Mask */}
        <div className="w-[calc(100%+2rem)] -ml-4 sm:w-[calc(100%+4rem)] sm:-ml-8 relative"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
            maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)'
          }}>
          <div className="w-full flex gap-4 overflow-x-auto pb-4 pt-2 px-4 sm:px-8 snap-x snap-mandatory hide-scrollbar">
            {questions.map((suggestion, index) => (
              <button
                key={`${suggestion.text}-${index}`}
                onClick={() => onSuggestionClick(suggestion.text)}
                className={`group relative flex flex-col justify-between text-left p-5 min-w-[200px] w-56 sm:w-64 aspect-[4/3] h-auto flex-shrink-0
                           rounded-2xl snap-start cursor-pointer transition-all duration-500
                           bg-white/40 sm:hover:bg-white/70 active:bg-white/70 dark:bg-slate-800/40 dark:sm:hover:bg-slate-700/60 dark:active:bg-slate-700/60                           border border-slate-200/50 hover:border-slate-300 dark:border-slate-700/50 dark:hover:border-slate-600
                           shadow-sm hover:shadow-md backdrop-blur-sm
                           ${fadingIndex === index ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                aria-label={`Suggestion: ${suggestion.text}`}
              >
                <h4 className="text-fluid-base text-slate-700 dark:text-slate-300 font-medium leading-snug">
                  {suggestion.text}
                </h4>

                <div className="absolute bottom-4 right-4 w-10 h-10 flex flex-col items-center justify-center 
                              rounded-full bg-white dark:bg-slate-900 
                              text-slate-600 dark:text-slate-300 shadow-sm
                              group-hover:scale-110 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-transform duration-200">
                  <span className="material-symbols-outlined text-[1.3rem]">
                    {suggestion.icon}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

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
