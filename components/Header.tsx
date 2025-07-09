import React, { useState, useRef, useEffect } from 'react';
import { Theme } from '../App';
import { Message, ResponseMode } from '../types';
import { generateChatPdf } from '../services/pdfService'; // Import the PDF generation service

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
  messages: Message[]; // Pass messages to determine if download is possible and to pass to PDF generator
  selectedMode: ResponseMode;
  onModeChange: (mode: ResponseMode) => void;
}

const ResponseModeDetails = {
  [ResponseMode.DEFAULT]: {
    name: "Default",
    icon: "🌤️",
    description: "Balanced, friendly, and informative responses"
  },
  [ResponseMode.CONCISE]: {
    name: "Concise",
    icon: "📝",
    description: "Brief, to-the-point explanations"
  },
  [ResponseMode.SHORT]: {
    name: "Short",
    icon: "⚡",
    description: "Very brief responses with essential information"
  },
  [ResponseMode.STRAIGHT]: {
    name: "Straight",
    icon: "🎯",
    description: "Direct, no-nonsense answers"
  },
  [ResponseMode.FUNNY]: {
    name: "Funny",
    icon: "😄",
    description: "Humorous explanations with weather-related jokes"
  },
  [ResponseMode.EINSTEIN]: {
    name: "Einstein",
    icon: "🧠",
    description: "Complex, detailed scientific explanations"
  }
};

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, messages, selectedMode, onModeChange }) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownloadPdf = async () => {
    // Prevent download if only the initial welcome message exists or if already downloading
    if (messages.length <= 1 || isDownloadingPdf) return;

    setIsDownloadingPdf(true);
    try {
      await generateChatPdf(messages);
    } catch (error) {
      console.error("PDF Download failed:", error);
      alert("Could not download PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const canDownload = messages.length > 1 && !isDownloadingPdf;
  const selectedModeDetails = ResponseModeDetails[selectedMode];

  return (
    <header 
      className="p-4 w-full z-20
                 bg-white/30 dark:bg-slate-800/60 backdrop-blur-lg 
                 shadow-lg border-b border-white/20 dark:border-slate-700/60"
      role="banner"
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src="/Meteosran-logo.png" alt="MeteoSran Logo" className="h-10 w-auto mr-2" />
          <span className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            MeteoSran
          </span>

          {/* Mode Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
              className="p-2 px-3 rounded-full flex items-center space-x-2
                         hover:bg-black/10 dark:hover:bg-white/10 
                         focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400
                         text-slate-700 dark:text-slate-200 transition-colors text-sm"
              aria-haspopup="listbox"
              aria-expanded={isModeDropdownOpen}
              aria-label={`Current response style: ${selectedModeDetails.name}. Click to change style.`}
              title={`Response Style: ${selectedModeDetails.name}`}
            >
              <span className="text-base leading-none">{selectedModeDetails.icon}</span>
              <span className="hidden sm:inline">{selectedModeDetails.name}</span>
              <span 
                className={`material-symbols-outlined transition-transform duration-200 ${isModeDropdownOpen ? 'rotate-180' : ''}`}
                style={{ fontSize: '20px'}}
              >
                arrow_drop_down
              </span>
            </button>

            {isModeDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-[280px] sm:w-[320px] md:w-[360px] origin-top-right rounded-xl 
                           bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl 
                           shadow-2xl border border-white/30 dark:border-slate-700/40
                           ring-1 ring-black ring-opacity-5 focus:outline-none z-30 overflow-hidden
                           max-h-[80vh] overflow-y-auto"
                role="listbox"
                aria-orientation="vertical"
                aria-labelledby="mode-selector-button"
              >
                <div className="p-2 space-y-1">
                  {Object.values(ResponseMode).map((modeKey) => {
                    const modeDetails = ResponseModeDetails[modeKey as ResponseMode];
                    const isSelected = selectedMode === modeKey;
                    return (
                      <button
                        key={modeKey}
                        onClick={() => {
                          onModeChange(modeKey as ResponseMode);
                          setIsModeDropdownOpen(false);
                        }}
                        className={`w-full flex items-start text-left p-2 sm:p-3 rounded-lg
                                    hover:bg-sky-100/70 dark:hover:bg-sky-700/50 
                                    focus:bg-sky-100/70 dark:focus:bg-sky-700/50 
                                    focus:outline-none transition-colors
                                    ${isSelected ? 'bg-sky-100/50 dark:bg-sky-700/30 ring-2 ring-sky-500' : 'text-slate-800 dark:text-slate-100'}`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="text-lg sm:text-xl mr-2 sm:mr-3 flex-shrink-0 mt-0.5">{modeDetails.icon}</span>
                        <div className="min-w-0">
                          <p className={`font-medium text-sm ${isSelected ? 'text-sky-700 dark:text-sky-300' : ''} truncate`}>
                            {modeDetails.name}
                          </p>
                          <p className={`text-xs ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'} line-clamp-2`}>
                            {modeDetails.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadPdf}
            disabled={!canDownload}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 
                      focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 
                      disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={isDownloadingPdf ? "Generating PDF..." : "Download chat as PDF"}
            title={messages.length <= 1 ? "Send a message to enable download" : (isDownloadingPdf ? "Generating PDF..." : "Download chat as PDF")}
          >
            <span className="material-symbols-outlined text-slate-700 dark:text-slate-200">
              {isDownloadingPdf ? 'hourglass_top' : 'download'}
            </span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 
                      focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 
                      transition-colors"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            <span className="material-symbols-outlined text-slate-700 dark:text-slate-200">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
