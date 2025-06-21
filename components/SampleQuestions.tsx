
import React from 'react';

interface SampleQuestionsProps {
  onQuestionSelect: (question: string) => void;
}

const questions = [
  "What are cirrus clouds?",
  "How do hurricanes form?",
  "Explain the different types of precipitation.",
  "Tell me about thunderstorms.",
  "What causes rainbows?",
];

const QuestionIcon: React.FC = () => (
    <span className="material-symbols-outlined text-lg mr-2 text-blue-600 dark:text-sky-400 group-hover:text-blue-700 dark:group-hover:text-sky-300 transition-colors">
      quiz
    </span>
);

export const SampleQuestions: React.FC<SampleQuestionsProps> = ({ onQuestionSelect }) => {
  return (
    <div className="p-4 border-t border-white/20 dark:border-slate-700/30 bg-transparent">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 text-center">
        Ask a question or try one of these:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => onQuestionSelect(q)}
            className="group flex items-center text-left w-full 
                       bg-white/30 dark:bg-slate-700/40 backdrop-blur-md 
                       hover:bg-white/50 dark:hover:bg-slate-700/60 
                       border border-slate-300/50 dark:border-slate-600/50 
                       text-slate-700 dark:text-slate-200 
                       p-3 rounded-lg shadow-md hover:shadow-lg 
                       transition-all duration-150 text-sm 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-sky-500 focus:ring-offset-1 dark:focus:ring-offset-slate-800"
            aria-label={`Ask: ${q}`}
          >
            <QuestionIcon />
            <span className="flex-1">{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
