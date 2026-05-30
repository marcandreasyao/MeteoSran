import React, { useState, useEffect } from 'react';
import { Message } from '../types';
import { generateChatPdf } from '../services/pdfService';
import { useLanguage } from '../src/contexts/LanguageContext';

interface SettingsModalProps {
  onClose: () => void;
  messages: Message[];
  locationMode: 'auto' | 'manual' | 'ip' | 'fixed';
  setLocationMode: (mode: 'auto' | 'manual' | 'ip' | 'fixed') => void;
  onManualLocationRequested: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  messages,
  locationMode,
  setLocationMode,
  onManualLocationRequested
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isClosing, setIsClosing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem('notificationsEnabled');
    return stored ? stored === 'true' : false;
  });
  const [notificationType, setNotificationType] = useState(() => {
    return localStorage.getItem('notificationType') || 'Daily Summary';
  });

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  // Prevent background scrolling while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
    localStorage.setItem('notificationType', notificationType);
  }, [notificationType]);

  const handleDownloadPdf = async () => {
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
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal Container */}
      <div className={`relative w-full max-w-lg overflow-hidden rounded-3xl bg-white/95 dark:bg-[#1a1b1e]/95 backdrop-blur-2xl shadow-2xl border border-white/50 dark:border-white/10 ${isClosing ? 'animate-modal-fade-out' : 'animate-modal-pop'}`}>
        
        {/* Aurora Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-sky-400/10 via-indigo-400/5 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between p-5 sm:p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined notranslate text-2xl text-sky-500 dark:text-sky-400" translate="no">settings</span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t('header.preferences')}
              </h2>
              <p className="text-xs sm:text-sm text-sky-600 dark:text-sky-400 font-medium">
                {t('header.tagline')}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            aria-label={t('header.closeSettings')}
          >
            <span className="material-symbols-outlined notranslate text-xl" translate="no">close</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="relative p-5 sm:p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
          
          {/* Language Preference Selector */}
          <div className="group flex flex-col">
            <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined notranslate text-[18px] sm:text-[20px] text-sky-500 dark:text-sky-400" translate="no">language</span>
              {t('header.langLabel')}
            </span>
            <div className="flex p-1 space-x-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl overflow-x-auto hide-scrollbar border border-slate-200/40 dark:border-slate-700/30">
              {[
                { id: 'en', label: 'English' },
                { id: 'fr', label: 'Français' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  className={`flex-1 py-2 text-xs sm:text-sm rounded-lg font-medium transition-all duration-200 min-h-[40px] min-w-[80px]
                    ${language === lang.id
                      ? 'bg-sky-500 text-white shadow-[0_2px_8px_rgba(14,165,233,0.3)]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  onClick={() => {
                    setLanguage(lang.id as any);
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1.5 ml-1 leading-relaxed">
              {t('header.langDesc')}
            </span>
          </div>

          <div className="h-px bg-slate-200/50 dark:bg-slate-700/50 w-full" />

          {/* Chat Download Action */}
          <div className="group flex flex-col">
            <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined notranslate text-[18px] sm:text-[20px] text-sky-500 dark:text-sky-400" translate="no">file_download</span>
              {t('header.exportChat')}
            </span>
            <button
              onClick={handleDownloadPdf}
              disabled={!canDownload}
              className="w-full py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 
                         text-slate-850 dark:text-slate-200 font-medium shadow-sm active:scale-[0.98] transition-all 
                         disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] border border-slate-200/50 dark:border-slate-700/50"
              title={messages.length <= 1 ? t('header.downloadDisabledTooltip') : (isDownloadingPdf ? t('header.generatingPdf') : t('header.downloadTooltip'))}
            >
              <span className="material-symbols-outlined notranslate text-lg" translate="no">
                {isDownloadingPdf ? 'hourglass_top' : 'download'}
              </span>
              {isDownloadingPdf ? t('header.generatingPdf') : t('header.downloadPdf')}
            </button>
          </div>

          <div className="h-px bg-slate-200/50 dark:bg-slate-700/50 w-full" />

          {/* Notification toggle */}
          <div className="group flex items-center justify-between">
            <div className="flex flex-col pr-4">
              <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-[18px] sm:text-[20px] text-sky-500 dark:text-sky-400" translate="no">notifications</span>
                {t('header.notifications')}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-7 leading-relaxed">
                {t('header.notificationsDesc')}
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
            <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined notranslate text-[18px] sm:text-[20px] text-sky-500 dark:text-sky-400" translate="no">location_on</span>
              {t('header.locationSource')}
            </span>

            <div className="flex p-1 space-x-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl overflow-x-auto hide-scrollbar border border-slate-200/40 dark:border-slate-700/30">
              {[
                { id: 'auto', label: t('header.locationModes.auto') },
                { id: 'manual', label: t('header.locationModes.manual') },
                { id: 'ip', label: t('header.locationModes.ip') },
                { id: 'fixed', label: t('header.locationModes.fixed') }
              ].map((mode) => (
                <button
                  key={mode.id}
                  className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition-all duration-200 min-h-[40px] min-w-[65px]
                    ${locationMode === mode.id
                      ? 'bg-sky-500 text-white shadow-[0_2px_8px_rgba(14,165,233,0.3)]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  onClick={() => {
                    setLocationMode(mode.id as any);
                    if (mode.id === 'manual') {
                      onManualLocationRequested();
                    }
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-200/50 dark:bg-slate-700/50 w-full" />

          {/* Notification type */}
          <div className="group flex flex-col">
            <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined notranslate text-[18px] sm:text-[20px] text-sky-500 dark:text-sky-400" translate="no">list_alt</span>
              {t('header.updateType')}
            </span>
            <div className="relative">
              <select
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 
                           bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200
                           focus:outline-none focus:ring-2 focus:ring-sky-500/50 appearance-none cursor-pointer font-medium transition-all min-h-[44px]"
                value={notificationType}
                onChange={e => setNotificationType(e.target.value)}
              >
                <option value="Daily Summary">{t('header.updateTypes.summary')}</option>
                <option value="Severe Alerts">{t('header.updateTypes.alerts')}</option>
                <option value="Rain Warnings">{t('header.updateTypes.warnings')}</option>
              </select>
              <div className="absolute inset-y-0 right-3 top-0 flex items-center pointer-events-none text-slate-400">
                <span className="material-symbols-outlined notranslate text-lg" translate="no">expand_more</span>
              </div>
            </div>
          </div>

          {/* Send Test Notification Button */}
          <div className="pt-2">
            <button
              className="w-full py-2.5 sm:py-3 text-xs sm:text-sm rounded-full bg-sky-500 hover:bg-sky-600 text-white
                         font-medium shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
              disabled={!notificationsEnabled}
              onClick={handleSendTestNotification}
            >
              {t('header.sendTestNotification')}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};
