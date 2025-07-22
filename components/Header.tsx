import React, { useState, useEffect } from 'react';
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
    const handleClickOutside = (event: MouseEvent) => {
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
      className="p-4 w-full z-20
                 bg-white/30 dark:bg-slate-800/60 backdrop-blur-lg 
                 shadow-lg border-b border-white/20 dark:border-slate-700/60"
      role="banner"
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src="./Meteosran-logo.png" alt="MeteoSran-Logo" className="h-10 w-auto mr-2" />
          <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            MeteoSran
          </span>

          {/* Mode Selector Dropdown */}
          <div className="relative">
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
          <div className="flex items-center gap-2">
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
            <div className="relative">
              <button
                className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 transition-colors"
                onClick={() => setShowSettings(!showSettings)}
                aria-label="Open settings"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
              {showSettings && (
                <div className="absolute right-0 mt-2 w-[380px] origin-top-right rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg shadow-2xl border border-white/30 dark:border-slate-700/40 ring-1 ring-black ring-opacity-5 focus:outline-none z-30 overflow-hidden max-h-[80vh] overflow-y-auto p-6">
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl focus:outline-none"
                    onClick={() => setShowSettings(false)}
                    aria-label="Close settings"
                  >
                    ×
                  </button>
                  <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-3xl align-middle">settings</span>
                    User Preferences
                  </h2>
                  <div className="space-y-6">
                    {/* Notification toggle */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg text-gray-700 dark:text-gray-200 font-semibold flex items-center gap-2">
                          <span className="material-symbols-outlined text-xl align-middle">notifications</span>
                          Enable Notifications
                        </span>
                        {/* Apple-style switch */}
                        <label className="relative inline-block w-12 h-7 align-middle select-none">
                          <input
                            type="checkbox"
                            checked={notificationsEnabled}
                            onChange={e => setNotificationsEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="block bg-gray-300 peer-checked:bg-green-500 w-12 h-7 rounded-full transition-colors duration-300"></div>
                          <div className="dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-300 peer-checked:translate-x-5"></div>
                        </label>
                      </div>
                      <span className="ml-10 text-xs text-gray-500 dark:text-gray-400">Get notified about weather updates and alerts.</span>
                    </div>
                    <hr className="my-2 border-t border-gray-200 dark:border-gray-700" />
                    {/* Location preference */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg text-gray-700 dark:text-gray-200 font-semibold flex items-center gap-2">
                          <span className="material-symbols-outlined text-xl align-middle">location_on</span>
                          Location
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-2">
                        <button
                          className={`px-2 py-1 text-xs rounded-l-lg font-semibold shadow-sm transition min-w-[60px] ${locationMode === 'auto' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                          onClick={() => setLocationMode('auto')}
                          disabled={locationMode === 'auto'}
                        >
                          Auto
                        </button>
                        <button
                          className={`px-2 py-1 text-xs font-semibold shadow-sm transition min-w-[60px] ${locationMode === 'manual' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                          onClick={() => setLocationMode('manual')}
                          disabled={locationMode === 'manual'}
                        >
                          Manual
                        </button>
                        <button
                          className={`px-2 py-1 text-xs font-semibold shadow-sm transition min-w-[60px] ${locationMode === 'ip' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                          onClick={() => setLocationMode('ip')}
                          disabled={locationMode === 'ip'}
                        >
                          IP-based
                        </button>
                        <button
                          className={`px-2 py-1 text-xs rounded-r-lg font-semibold shadow-sm transition min-w-[60px] ${locationMode === 'fixed' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                          onClick={() => setLocationMode('fixed')}
                          disabled={locationMode === 'fixed'}
                        >
                          Fixed city
                        </button>
                      </div>
                      <span className="ml-10 text-xs text-gray-500 dark:text-gray-400">Choose how your location is determined for weather updates.</span>
                    </div>
                    <hr className="my-2 border-t border-gray-200 dark:border-gray-700" />
                    {/* Notification type */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg text-gray-700 dark:text-gray-200 font-semibold flex items-center gap-2">
                          <span className="material-symbols-outlined text-xl align-middle">list_alt</span>
                          Notification Type
                        </span>
                      </div>
                      <select
                        className="w-full mt-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={notificationType}
                        onChange={e => setNotificationType(e.target.value)}
                      >
                        <option value="Daily Summary">Daily Summary</option>
                        <option value="Severe Alerts">Severe Alerts</option>
                        <option value="Rain Warnings">Rain Warnings</option>
                      </select>
                    </div>
                    <div className="flex justify-center mt-4">
                      <button
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition disabled:opacity-50"
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
