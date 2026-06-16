import React, { useState, useEffect, useRef } from 'react';
import { Theme } from '../App';
import { Message, ResponseMode } from '../types';
import { auth } from '../src/firebase';
import { signOut } from 'firebase/auth';
import { AnimatedThemeToggler } from './magicui/AnimatedThemeToggler';
import { useLanguage } from '../src/contexts/LanguageContext';
interface HeaderProps {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  messages: Message[]; // Pass messages to determine if download is possible and to pass to PDF generator
  selectedMode: ResponseMode;
  onModeChange: (mode: ResponseMode) => void;
  onToggleSidebar?: () => void;
  onOpenNotifications?: () => void;
  hasUnreadNotifications?: boolean;
  showSettings: boolean;
  onOpenSettings: () => void;
  isAuthenticated?: boolean;
  onSignIn?: () => void;
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

export const Header: React.FC<HeaderProps> = ({ 
  theme, toggleTheme, messages, selectedMode, onModeChange, onToggleSidebar, onOpenNotifications, hasUnreadNotifications,
  showSettings, onOpenSettings, isAuthenticated, onSignIn
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

  const modeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setIsModeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedModeDetails = ResponseModeDetails[selectedMode];

  return (
    <header
      className="p-2 sm:p-4 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] w-full z-50
                 bg-white/30 dark:bg-slate-800/60 backdrop-blur-lg 
                 relative transition-colors duration-300"
      role="banner"
    >
      {/* Premium Decorative Border Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] w-full overflow-hidden pointer-events-none select-none">
        {/* Subtle base line - theme aware */}
        <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-r from-transparent via-slate-300/40 dark:via-slate-700/60 to-transparent" />

        {/* Focused accent hotspot - responsive width and intensity */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] sm:w-1/3 h-full 
                        bg-gradient-to-r from-transparent via-sky-400/30 dark:via-sky-400/40 to-transparent 
                        blur-[0.5px] transition-all duration-700" />

        {/* Meshed ambient depth - very subtle */}
        <div className="absolute -bottom-1 left-0 right-0 h-[10px] 
                        bg-gradient-to-b from-transparent via-sky-400/5 dark:via-sky-400/10 to-transparent 
                        opacity-50 sm:opacity-70" />
      </div>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 sm:p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 focus:outline-none transition-colors"
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <span className="material-symbols-outlined notranslate text-xl sm:text-2xl" translate="no">menu</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              MeteoSran
            </span>
            <div className="flex items-center h-7 sm:h-9 px-2 rounded-lg bg-gradient-to-r from-red-500/10 via-emerald-500/10 to-indigo-500/10 dark:from-red-500/20 dark:via-emerald-500/20 dark:to-indigo-500/20 border border-slate-500/20 shadow-sm gap-1 select-none">
              <img src="/tournaments_fifa-world-cup-2026.football-logos.cc.svg" alt="FIFA WC 2026 Logo" className="h-5 sm:h-6 w-auto object-contain" />
              <span className="text-[10px] sm:text-[11px] font-black tracking-tight text-slate-800 dark:text-slate-100">WC26</span>
            </div>
          </div>

          {/* Mode Selector Dropdown */}
          <div className="relative" ref={modeDropdownRef}>
            <button
              type="button"
              onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
              className="p-1.5 sm:p-2 px-2 sm:px-3 rounded-full flex items-center space-x-1 sm:space-x-2
                         hover:bg-black/10 dark:hover:bg-white/10 
                         focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400
                         text-slate-700 dark:text-slate-200 transition-colors text-xs sm:text-sm"
              aria-haspopup="listbox"
              aria-expanded={isModeDropdownOpen}
              aria-label={`Current response style: ${t('header.modes.' + selectedMode + '.name')}. Click to change style.`}
              title={`${t('header.responseStyle')}: ${t('header.modes.' + selectedMode + '.name')}`}
            >
              <span className="text-sm sm:text-base leading-none">{selectedModeDetails.icon}</span>
              <span className="hidden sm:inline">{t('header.modes.' + selectedMode + '.name')}</span>
              <span
                className={`material-symbols-outlined notranslate transition-transform duration-200 ${isModeDropdownOpen ? 'rotate-180' : ''}`}
                style={{ fontSize: '16px' }}
                translate="no"
              >
                arrow_drop_down
              </span>
            </button>

            {isModeDropdownOpen && (
              <div
                className="absolute left-0 sm:right-0 mt-2 w-[250px] sm:w-[280px] md:w-[320px] lg:w-[360px] origin-top-left sm:origin-top-right rounded-xl 
                           bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl 
                           shadow-2xl border border-white/30 dark:border-slate-700/40
                           ring-1 ring-black ring-opacity-5 focus:outline-none z-30 overflow-hidden
                           max-h-[80vh] overflow-y-auto max-w-[calc(100vw-1rem)]"
                role="listbox"
                aria-orientation="vertical"
                aria-labelledby="mode-selector-button"
              >
                <div className="p-1.5 sm:p-2 space-y-0.5 sm:space-y-1">
                  {Object.values(ResponseMode).map((modeKey) => {
                    const modeDetails = ResponseModeDetails[modeKey as ResponseMode];
                    const isSelected = selectedMode === modeKey;
                    const isGated = isAuthenticated === false && modeKey !== ResponseMode.CONCISE;
                    return (
                      <button
                        key={modeKey}
                        disabled={isGated}
                        onClick={() => {
                          if (isGated) return;
                          onModeChange(modeKey as ResponseMode);
                          setIsModeDropdownOpen(false);
                        }}
                        className={`w-full flex items-start text-left p-1.5 sm:p-2 md:p-3 rounded-lg transition-colors
                                    ${isGated
                                      ? 'opacity-40 cursor-not-allowed select-none'
                                      : 'hover:bg-sky-100/70 dark:hover:bg-sky-700/50 focus:bg-sky-100/70 dark:focus:bg-sky-700/50 focus:outline-none'
                                    }
                                    ${isSelected ? 'bg-sky-100/50 dark:bg-sky-700/30 ring-2 ring-sky-500' : 'text-slate-800 dark:text-slate-100'}`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="text-base sm:text-lg md:text-xl mr-1.5 sm:mr-2 md:mr-3 flex-shrink-0 mt-0.5">{modeDetails.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium text-xs sm:text-sm ${isSelected ? 'text-sky-700 dark:text-sky-300' : ''} truncate`}>
                              {t('header.modes.' + modeKey + '.name')}
                            </p>
                            {isGated && (
                              <span className="material-symbols-outlined notranslate text-xs text-slate-400 dark:text-slate-500 ml-1.5 flex-shrink-0" translate="no" style={{ fontSize: '14px' }}>
                                lock
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'} line-clamp-2`}>
                            {t('header.modes.' + modeKey + '.description')}
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

        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated === false ? (
              <>
                <AnimatedThemeToggler theme={theme} toggleTheme={toggleTheme} />
                <button
                  onClick={onSignIn}
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-[0.97]"
                >
                  {t('common.signIn')}
                </button>
              </>
            ) : (
              <>
                <div className="relative">
                  <button
                    onClick={onOpenNotifications}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 transition-colors"
                    aria-label={t('header.campaignTitle')}
                    title={t('header.campaignUnread')}
                  >
                    <span className="material-symbols-outlined notranslate text-lg sm:text-xl" translate="no">campaign</span>
                    {hasUnreadNotifications && (
                      <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-white dark:border-slate-800"></span>
                    )}
                  </button>
                </div>
                <AnimatedThemeToggler theme={theme} toggleTheme={toggleTheme} />
                <button
                  className="p-1.5 sm:p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 transition-colors"
                  onClick={() => signOut(auth)}
                  aria-label={t('header.logout')}
                  title={t('header.logout')}
                >
                  <span className="material-symbols-outlined notranslate text-lg sm:text-xl" translate="no">logout</span>
                </button>
                <div>
                  <button
                    className="p-1.5 sm:p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 transition-colors flex items-center justify-center"
                    onClick={onOpenSettings}
                    aria-label={t('header.openSettings')}
                    aria-expanded={showSettings}
                  >
                    <span className="material-symbols-outlined notranslate text-lg sm:text-xl" translate="no">settings</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
