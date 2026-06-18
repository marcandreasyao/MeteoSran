import React, { useState, useEffect } from 'react';
import { useLanguage } from '../src/contexts/LanguageContext';

interface ReleaseNotesModalProps {
  onClose: () => void;
}

const COLOR_MAPS: Record<string, { bg: string, text: string }> = {
  fuchsia: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-500/20', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
  violet: { bg: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-600 dark:text-violet-400' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400' },
  slate: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' },
  sky: { bg: 'bg-sky-100 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
  teal: { bg: 'bg-teal-100 dark:bg-teal-500/20', text: 'text-teal-600 dark:text-teal-400' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-500/20', text: 'text-pink-600 dark:text-pink-400' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
};

const VERSIONS = [
  {
    id: 'v1_8_2',
    icon: 'stadium',
    iconColor: 'text-amber-500 dark:text-amber-400',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    badgeColor: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    features: [
      { key: 'smartSync', icon: 'sync', color: 'emerald' },
      { key: 'uiux', icon: 'animation', color: 'violet' },
      { key: 'venue', icon: 'stadium', color: 'sky' },
    ]
  },
  {
    id: 'v1_8_1',
    icon: 'scoreboard',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50',
    features: [
      { key: 'liveScores', icon: 'scoreboard', color: 'emerald' },
      { key: 'matchStats', icon: 'bar_chart', color: 'violet' },
      { key: 'graphRAG', icon: 'hub', color: 'sky' },
    ]
  },
  {
    id: 'v1_8',
    icon: 'sports_soccer',
    iconColor: 'text-sky-500 dark:text-sky-400',
    iconBg: 'bg-sky-500/10 dark:bg-sky-500/20',
    badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50',
    features: [
      { key: 'worldCup', icon: 'sports_soccer', color: 'emerald' },
      { key: 'matchPoll', icon: 'ballot', color: 'amber' },
      { key: 'ticker', icon: 'reorder', color: 'violet' },
      { key: 'svgEmblem', icon: 'verified', color: 'sky' },
      { key: 'geoFix', icon: 'my_location', color: 'rose' },
    ]
  },
  {
    id: 'v1_7',
    icon: 'auto_awesome',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50',
    features: [
      { key: 'memory', icon: 'psychology', color: 'emerald' },
      { key: 'weather', icon: 'wb_sunny', color: 'amber' },
      { key: 'search', icon: 'manage_search', color: 'sky' },
      { key: 'privacy', icon: 'shield', color: 'teal' },
      { key: 'bundle', icon: 'speed', color: 'indigo' },
      { key: 'speech', icon: 'mic', color: 'rose' },
    ]
  },
  {
    id: 'v1_6_6',
    icon: 'history',
    iconColor: 'text-indigo-500 dark:text-indigo-400',
    iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50',
    features: [
      { key: 'memory', icon: 'memory', color: 'fuchsia' },
      { key: 'theme', icon: 'dark_mode', color: 'violet' },
      { key: 'mobile', icon: 'smartphone', color: 'cyan' },
      { key: 'location', icon: 'explore', color: 'amber' },
      { key: 'datetime', icon: 'bug_report', color: 'rose' },
      { key: 'arch', icon: 'database', color: 'slate' },
      { key: 'liquid', icon: 'water_drop', color: 'sky' },
      { key: 'code', icon: 'code_blocks', color: 'indigo' },
      { key: 'sidebar', icon: 'side_navigation', color: 'emerald' },
      { key: 'bilingual', icon: 'translate', color: 'teal' },
      { key: 'download', icon: 'download', color: 'orange' },
      { key: 'login', icon: 'fingerprint', color: 'pink' },
      { key: 'iconGuard', icon: 'g_translate', color: 'blue' },
    ]
  }
];

export const ReleaseNotesModal: React.FC<ReleaseNotesModalProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const [isClosing, setIsClosing] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [animateContent, setAnimateContent] = useState(true);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  const handleSelectVersion = (versionId: string) => {
    setAnimateContent(false);
    setTimeout(() => {
      setSelectedVersionId(versionId);
      setAnimateContent(true);
    }, 150);
  };

  const handleGoBack = () => {
    setAnimateContent(false);
    setTimeout(() => {
      setSelectedVersionId(null);
      setAnimateContent(true);
    }, 150);
  };

  // Prevent background scrolling while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const selectedVersionObj = VERSIONS.find(v => v.id === selectedVersionId);

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
            {selectedVersionId ? (
              <button 
                onClick={handleGoBack}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none flex items-center justify-center mr-1"
                aria-label={t('releaseNotes.back')}
              >
                <span className="material-symbols-outlined notranslate text-xl" translate="no">arrow_back</span>
              </button>
            ) : (
              <img src="/Meteosran-logo.png" alt="MeteoSran Logo" className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 p-1 shadow-sm" />
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {selectedVersionId 
                  ? t(`releaseNotes.versions.${selectedVersionId}.title`) 
                  : t('releaseNotes.listTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-sky-600 dark:text-sky-400 font-medium">
                {selectedVersionId 
                  ? t(`releaseNotes.versions.${selectedVersionId}.subtitle`) 
                  : 'MeteoSran updates & changelogs'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            aria-label={t('releaseNotes.close')}
          >
            <span className="material-symbols-outlined notranslate text-xl" translate="no">close</span>
          </button>
        </div>
        
        {/* Content */}
        <div className={`relative p-5 sm:p-6 max-h-[60vh] overflow-y-auto custom-scrollbar transition-all duration-150 ${animateContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          
          {!selectedVersionId ? (
            /* List of Versions View */
            <div className="space-y-3.5">
              {VERSIONS.map((v) => (
                <div
                  key={v.id}
                  onClick={() => handleSelectVersion(v.id)}
                  className="group relative flex items-center justify-between p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-sky-500/30 dark:hover:border-sky-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${v.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <span className={`material-symbols-outlined notranslate text-[22px] ${v.iconColor}`} translate="no">{v.icon}</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {t(`releaseNotes.versions.${v.id}.title`)}
                        </h4>
                        {(() => {
                          const badgeKey = `releaseNotes.versions.${v.id}.badge`;
                          const badgeText = t(badgeKey);
                          if (badgeText && badgeText !== badgeKey) {
                            return (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${v.badgeColor}`}>
                                {badgeText}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {t(`releaseNotes.versions.${v.id}.subtitle`)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                    <span className="text-[11px] font-medium hidden sm:inline">
                      {t(`releaseNotes.versions.${v.id}.date`)}
                    </span>
                    <span className="material-symbols-outlined notranslate text-[18px]" translate="no">chevron_right</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Selected Version Features Detail View */
            <div className="space-y-4">
              {selectedVersionObj?.features.map((feature) => {
                const colors = COLOR_MAPS[feature.color] || COLOR_MAPS.slate;
                return (
                  <div key={feature.key} className="flex gap-3.5 items-start">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center mt-0.5`}>
                      <span className={`material-symbols-outlined notranslate text-[18px] ${colors.text}`} translate="no">{feature.icon}</span>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {t(`releaseNotes.versions.${selectedVersionId}.features.${feature.key}Title`)}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {t(`releaseNotes.versions.${selectedVersionId}.features.${feature.key}Desc`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
        </div>
        
        {/* Footer */}
        <div className="relative p-5 sm:p-6 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <button 
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/50 active:scale-95"
          >
            {t('releaseNotes.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
};
