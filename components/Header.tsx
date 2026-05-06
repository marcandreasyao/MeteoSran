import React, { useState, useEffect, useRef } from 'react';
import { Theme } from '../App';
import { Message, ResponseMode } from '../types';
import { generateChatPdf } from '../services/pdfService';
import { auth } from '../src/firebase';
import { signOut } from 'firebase/auth';

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
  messages: Message[]; // Pass messages to determine if download is possible and to pass to PDF generator
  selectedMode: ResponseMode;
  onModeChange: (mode: ResponseMode) => void;
  onToggleSidebar?: () => void;
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

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, messages, selectedMode, onModeChange, onToggleSidebar }) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // Notification and location preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem('notificationsEnabled');
    return stored ? stored === 'true' : false;
  });
  const [locationMode, setLocationMode] = useState<'auto' | 'manual' | 'ip' | 'fixed'>(() => {
    const stored = localStorage.getItem('locationMode');
    if (stored === 'manual' || stored === 'ip' || stored === 'fixed') return stored;
    return 'auto';
  });
  const [notificationType, setNotificationType] = useState(() => {
    return localStorage.getItem('notificationType') || 'Daily Summary';
  });
  // Request notification permission if enabled
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission !== 'granted') {
          setNotificationsEnabled(false);
          localStorage.setItem('notificationsEnabled', 'false');
        }
      });
    }
  }, [notificationsEnabled]);
  // Persist preferences
  useEffect(() => {
    localStorage.setItem('notificationsEnabled', notificationsEnabled.toString());
  }, [notificationsEnabled]);
  useEffect(() => {
    localStorage.setItem('locationMode', locationMode);
  }, [locationMode]);
  useEffect(() => {
    localStorage.setItem('notificationType', notificationType);
  }, [notificationType]);

  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setIsModeDropdownOpen(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setShowSettings(false);
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

  // Handler for sending a test notification
  const handleSendTestNotification = () => {
    if (!notificationsEnabled) return;
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('MeteoSran Test Notification', {
          body: `This is a test notification (${notificationType})!`,
          icon: '/Meteosran-logo.png',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('MeteoSran Test Notification', {
              body: `This is a test notification (${notificationType})!`,
              icon: '/Meteosran-logo.png',
            });
          }
        });
      }
    }
  };

  return (
    <header
      className="p-2 sm:p-4 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] w-full z-20
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
              <span className="material-symbols-outlined text-xl sm:text-2xl">menu</span>
            </button>
          )}
          {/* <img src="./Meteosran-logo.png" alt="MeteoSran-Logo" className="h-8 sm:h-10 w-auto mr-1 sm:mr-2" /> */}
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            MeteoSran
          </span>

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
              aria-label={`Current response style: ${selectedModeDetails.name}. Click to change style.`}
              title={`Response Style: ${selectedModeDetails.name}`}
            >
              <span className="text-sm sm:text-base leading-none">{selectedModeDetails.icon}</span>
              <span className="hidden sm:inline">{selectedModeDetails.name}</span>
              <span
                className={`material-symbols-outlined transition-transform duration-200 ${isModeDropdownOpen ? 'rotate-180' : ''}`}
                style={{ fontSize: '16px' }}
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
                    return (
                      <button
                        key={modeKey}
                        onClick={() => {
                          onModeChange(modeKey as ResponseMode);
                          setIsModeDropdownOpen(false);
                        }}
                        className={`w-full flex items-start text-left p-1.5 sm:p-2 md:p-3 rounded-lg
                                    hover:bg-sky-100/70 dark:hover:bg-sky-700/50 
                                    focus:bg-sky-100/70 dark:focus:bg-sky-700/50 
                                    focus:outline-none transition-colors
                                    ${isSelected ? 'bg-sky-100/50 dark:bg-sky-700/30 ring-2 ring-sky-500' : 'text-slate-800 dark:text-slate-100'}`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="text-base sm:text-lg md:text-xl mr-1.5 sm:mr-2 md:mr-3 flex-shrink-0 mt-0.5">{modeDetails.icon}</span>
                        <div className="min-w-0">
                          <p className={`font-medium text-xs sm:text-sm ${isSelected ? 'text-sky-700 dark:text-sky-300' : ''} truncate`}>
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

        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={!canDownload}
              className="p-1.5 sm:p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 
                        focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 
                        disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={isDownloadingPdf ? "Generating PDF..." : "Download chat as PDF"}
              title={messages.length <= 1 ? "Send a message to enable download" : (isDownloadingPdf ? "Generating PDF..." : "Download chat as PDF")}
            >
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-200 text-lg sm:text-xl">
                {isDownloadingPdf ? 'hourglass_top' : 'download'}
              </span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 
                        focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 
                        transition-colors"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-200 text-lg sm:text-xl">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
            <button
              className="p-1.5 sm:p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 transition-colors"
              onClick={() => signOut(auth)}
              aria-label="Log out"
              title="Log out"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">logout</span>
            </button>
            <div className="relative" ref={settingsDropdownRef}>
              <button
                className="p-1.5 sm:p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 transition-colors"
                onClick={() => setShowSettings(!showSettings)}
                aria-label="Open settings"
                aria-expanded={showSettings}
              >
                <span className="material-symbols-outlined text-lg sm:text-xl">settings</span>
              </button>

              {showSettings && (
                <div className="absolute right-0 mt-4 w-[280px] sm:w-[340px] md:w-[380px] origin-top-right 
                                rounded-3xl bg-white/95 dark:bg-[#1a1b1e]/95 backdrop-blur-3xl
                                shadow-2xl border border-white/50 dark:border-white/10 focus:outline-none z-30 
                                overflow-hidden p-5 sm:p-6 animate-settings-drop-down max-h-[85vh] overflow-y-auto custom-scrollbar">

                  <button
                    className="absolute top-3 right-3 z-50 rounded-full p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 
                               hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                    onClick={() => setShowSettings(false)}
                    aria-label="Close settings"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>

                  <div className="flex flex-col items-start mb-6 pr-12">
                    <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mb-1">
                      Preferences
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Customize your MeteoSran experience
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Notification toggle */}
                    <div className="group flex items-center justify-between">
                      <div className="flex flex-col pr-4">
                        <span className="text-sm sm:text-base text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-slate-400">notifications</span>
                          Notifications
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 ml-7">
                          Real-time weather alerts
                        </span>
                      </div>
                      <label className="flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
                        <input
                          type="checkbox"
                          checked={notificationsEnabled}
                          onChange={e => setNotificationsEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sky-500"></div>
                      </label>
                    </div>

                    <div className="h-px bg-slate-200/50 dark:bg-slate-700/50 w-full" />

                    {/* Location preference */}
                    <div className="group flex flex-col">
                      <span className="text-sm sm:text-base text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-slate-400">location_on</span>
                        Location Source
                      </span>

                      <div className="flex p-1 space-x-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl overflow-x-auto hide-scrollbar">
                        {[
                          { id: 'auto', label: 'Auto' },
                          { id: 'manual', label: 'Manual' },
                          { id: 'ip', label: 'IP' },
                          { id: 'fixed', label: 'Fixed' }
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition-all duration-200 min-h-[44px] min-w-[60px]
                              ${locationMode === mode.id
                                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            onClick={() => setLocationMode(mode.id as any)}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-slate-200/50 dark:bg-slate-700/50 w-full" />

                    {/* Notification type */}
                    <div className="group flex flex-col">
                      <span className="text-sm sm:text-base text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-slate-400">list_alt</span>
                        Update Type
                      </span>
                      <div className="relative">
                        <select
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 
                                     bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200
                                     focus:outline-none focus:ring-2 focus:ring-sky-500/50 appearance-none cursor-pointer font-medium transition-all min-h-[44px]"
                          value={notificationType}
                          onChange={e => setNotificationType(e.target.value)}
                        >
                          <option value="Daily Summary">Daily Summary</option>
                          <option value="Severe Alerts">Severe Alerts</option>
                          <option value="Rain Warnings">Rain Warnings</option>
                        </select>
                        <div className="absolute inset-y-0 right-3 top-0 flex items-center pointer-events-none text-slate-400">
                          <span className="material-symbols-outlined text-lg">expand_more</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 sm:pt-4">
                      <button
                        className="w-full py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 
                                   font-medium shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                        disabled={!notificationsEnabled}
                        onClick={handleSendTestNotification}
                      >
                        Send Test Notification
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
