import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const handleClickOutside = () => {
      if (false) { // dropdownRef removed, so this block is now unreachable
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
          <div className="relative">
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
                style={{ fontSize: '16px'}}
              >
                arrow_drop_down
              </span>
            </button>

            {isModeDropdownOpen && (
              <div 
                className="absolute left-0 sm:right-0 mt-2 w-[250px] sm:w-[280px] md:w-[320px] lg:w-[360px] origin-top-left sm:origin-top-right rounded-xl 
                           bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl 
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
            <div className="relative">
              <button
                className="p-1.5 sm:p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 transition-colors"
                onClick={() => setShowSettings(!showSettings)}
                aria-label="Open settings"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl">settings</span>
              </button>

              {showSettings && (
                <>
                  {/* Click-outside backdrop */}
                  <div 
                    className="fixed inset-0 z-20 bg-black/5 dark:bg-black/20 animate-fade-in"
                    onClick={() => setShowSettings(false)}
                  />
                  
                  {/* Settings Menu Content */}
                  <div className="absolute right-0 mt-3 w-[290px] sm:w-[340px] md:w-[400px] origin-top-right 
                                  rounded-3xl bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl
                                  shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]
                                  border border-white/20 dark:border-slate-800/80 focus:outline-none z-30 
                                  overflow-hidden p-6 sm:p-8 animate-settings-drop-down">
                    
                    <button
                      className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white 
                                 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all focus:outline-none"
                      onClick={() => setShowSettings(false)}
                      aria-label="Close settings"
                    >
                      <span className="material-symbols-outlined text-xl sm:text-2xl">close</span>
                    </button>

                    <div className="flex flex-col items-center mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-sky-500/10 dark:bg-sky-500/10 flex items-center justify-center mb-4 ring-1 ring-sky-500/20">
                        <span className="material-symbols-outlined text-3xl sm:text-4xl text-sky-500 align-middle">settings</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        User Preferences
                      </h2>
                    </div>

                    <div className="space-y-8">
                      {/* Notification toggle */}
                      <div className="group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm sm:text-base text-slate-700 dark:text-slate-200 font-bold flex items-center gap-3">
                            <span className="material-symbols-outlined text-xl sm:text-2xl text-slate-400 group-hover:text-sky-500 transition-colors">notifications</span>
                            Notifications
                          </span>
                          <label className="relative inline-block w-12 h-6.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={notificationsEnabled}
                              onChange={e => setNotificationsEnabled(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="block bg-slate-200 dark:bg-slate-700 peer-checked:bg-sky-500 w-12 h-6.5 rounded-full transition-all duration-300"></div>
                            <div className="absolute left-1 top-1 bg-white w-4.5 h-4.5 rounded-full shadow-md transition-all duration-300 peer-checked:translate-x-5.5"></div>
                          </label>
                        </div>
                        <p className="ml-11 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium opacity-80">
                          Stay updated with real-time weather alerts.
                        </p>
                      </div>

                      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

                      {/* Location preference */}
                      <div className="group">
                        <div className="flex items-center mb-1">
                          <span className="text-sm sm:text-base text-slate-700 dark:text-slate-200 font-bold flex items-center gap-3">
                            <span className="material-symbols-outlined text-xl sm:text-2xl text-slate-400 group-hover:text-sky-500 transition-colors">location_on</span>
                            Location Source
                          </span>
                        </div>
                        <p className="ml-11 mb-4 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium opacity-80">
                          Choose how your location is discovered for local accuracy.
                        </p>
                        <div className="grid grid-cols-2 gap-3 ml-11">
                          {[
                            { id: 'auto', label: 'Auto' },
                            { id: 'manual', label: 'Manual' },
                            { id: 'ip', label: 'IP-based' },
                            { id: 'fixed', label: 'Fixed' }
                          ].map((mode) => (
                            <button
                              key={mode.id}
                              className={`px-4 py-2.5 text-[11px] sm:text-xs rounded-2xl font-bold transition-all
                                ${locationMode === mode.id 
                                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' 
                                  : 'bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent dark:hover:border-slate-700'}`}
                              onClick={() => setLocationMode(mode.id as any)}
                            >
                              {mode.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

                      {/* Notification type */}
                      <div className="group flex flex-col items-center text-center">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="material-symbols-outlined text-xl sm:text-2xl text-slate-400 group-hover:text-sky-500 transition-colors">list_alt</span>
                          <span className="text-sm sm:text-base text-slate-700 dark:text-slate-200 font-bold">
                            Update Type
                          </span>
                        </div>
                        <div className="w-full max-w-[280px]">
                          <select
                            className="w-full p-3 text-xs sm:text-sm rounded-2xl border border-slate-200/50 dark:border-slate-800 
                                       bg-slate-100/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-center
                                       focus:outline-none focus:ring-2 focus:ring-sky-500/50 appearance-none cursor-pointer font-semibold transition-all"
                            value={notificationType}
                            onChange={e => setNotificationType(e.target.value)}
                          >
                            <option value="Daily Summary">Daily Summary</option>
                            <option value="Severe Alerts">Severe Alerts</option>
                            <option value="Rain Warnings">Rain Warnings</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-center">
                        <button
                          className="w-full max-w-[320px] py-4 text-sm sm:text-base rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 
                                     font-bold shadow-2xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={!notificationsEnabled}
                          onClick={handleSendTestNotification}
                        >
                          Send Test Notification
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
