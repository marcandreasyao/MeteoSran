
import React, { useState, useEffect, useRef } from 'react';

// A simple hook to check for media queries
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);

  return matches;
};

interface SampleQuestionsProps {
  onQuestionSelect: (question: string) => void;
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
  // Old questions for broader variety
  { text: "What are cirrus clouds?", icon: "filter_drama" },
  { text: "How do hurricanes form?", icon: "cyclone" },
  { text: "Explain precipitation types.", icon: "water_drop" },
  { text: "Tell me about thunderstorms.", icon: "thunderstorm" },
  { text: "What causes rainbows?", icon: "looks" },
];

// Function to get random questions
const getRandomQuestions = (count: number) => {
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const SampleQuestions: React.FC<SampleQuestionsProps> = ({ onQuestionSelect }) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const numQuestions = isMobile ? 3 : 4;

  const [questions, setQuestions] = useState(getRandomQuestions(numQuestions));
  const [fadingIndex, setFadingIndex] = useState<number | null>(null);
  const questionIndexToUpdate = useRef(0);

  useEffect(() => {
    setQuestions(getRandomQuestions(numQuestions));
  }, [numQuestions]);

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
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, [numQuestions]);

  return (
    <div className="w-full px-2 pb-2 md:px-4 md:pb-3">
      <p className="text-xs text-center text-slate-600 dark:text-slate-400 mb-2">
        Ask a question or try one of these:
      </p>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
        {questions.map(({ text, icon }, index) => (
          <button
            key={text}
            onClick={() => onQuestionSelect(text)}
            className={`group flex items-center
                       bg-slate-100/80 dark:bg-slate-800/60
                       hover:bg-white dark:hover:bg-slate-800
                       border border-slate-300/80 dark:border-slate-700/80
                       text-slate-700 dark:text-slate-200
                       py-1.5 px-3 rounded-full shadow-sm hover:shadow-lg
                       transition-all duration-500 text-xs sm:text-sm
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-900
                       ${fadingIndex === index ? 'opacity-0' : 'opacity-100'}`}
            aria-label={`Ask: ${text}`}
          >
            <span className="material-symbols-outlined text-sm sm:text-base mr-1.5 text-sky-600 dark:text-sky-400 transition-colors">
              {icon}
            </span>
            <span className="leading-tight whitespace-nowrap">{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
