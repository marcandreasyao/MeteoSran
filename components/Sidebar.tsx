import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ChatSession, SearchResultSession } from '../src/services/dbService';
import { useLanguage } from '../src/contexts/LanguageContext';

// ─── Magic UI: Shimmer Button ─────────────────────────────────────────────────
const shimmerStyle = `
@keyframes shimmer-slide {
  from { transform: translateX(-100%); }
  to   { transform: translateX(200%); }
}
.shimmer-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.625rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #93c5fd;
  background: transparent;
  border: none;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  transition: color 0.2s;
  margin-bottom: 1rem;
}
.shimmer-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.06) 100%);
  transition: opacity 0.2s;
  opacity: 1;
}
.shimmer-btn::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(147,197,253,0.18), transparent);
  transform: translateX(-100%);
  border-radius: 0.75rem;
}
.shimmer-btn:hover::after {
  animation: shimmer-slide 0.9s ease-in-out;
}
.shimmer-btn:hover { color: #bfdbfe; }
.shimmer-btn:active { opacity: 0.75; }

@keyframes premium-dropdown-enter {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.animate-premium-dropdown {
  animation: premium-dropdown-enter 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transform-origin: top right;
}
`;

let shimmerInjected = false;
const injectShimmer = () => {
  if (shimmerInjected) return;
  shimmerInjected = true;
  const s = document.createElement('style');
  s.textContent = shimmerStyle;
  document.head.appendChild(s);
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chatSessions: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (chatId: string, messageId?: string) => void;
  onNewChat: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onDeleteChat: (chatId: string) => void;
  onPinChat: (chatId: string, isPinned: boolean) => void;
  searchResults: SearchResultSession[];
  isSearching: boolean;
  isAuthenticated?: boolean;
  onSignIn?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  chatSessions,
  activeChatId,
  onSelectChat,
  onNewChat,
  searchQuery,
  onSearchChange,
  onRenameChat,
  onDeleteChat,
  onPinChat,
  searchResults,
  isSearching,
  isAuthenticated,
  onSignIn
}) => {
  const { t } = useLanguage();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (activeMenuChatId && !target.closest('.menu-container') && !target.closest('.menu-trigger-btn')) {
        setActiveMenuChatId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activeMenuChatId]);

  const startRename = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
    setDeletingChatId(null);
    // Autofocus input
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 50);
  };

  const saveRename = (chatId: string) => {
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const cancelRename = () => {
    setEditingChatId(null);
  };

  const startDelete = (chatId: string) => {
    setDeletingChatId(chatId);
    setEditingChatId(null);
  };

  const confirmDelete = (chatId: string) => {
    onDeleteChat(chatId);
    setDeletingChatId(null);
  };

  const cancelDelete = () => {
    setDeletingChatId(null);
  };

  const activeSessionsList = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults;
    }
    return chatSessions;
  }, [chatSessions, searchQuery, searchResults]);

  const pinnedSessions = useMemo(() => {
    return activeSessionsList.filter(chat => chat.isPinned);
  }, [activeSessionsList]);

  const recentSessions = useMemo(() => {
    return activeSessionsList.filter(chat => !chat.isPinned);
  }, [activeSessionsList]);

  const getHighlightedSnippet = (text: string, query: string) => {
    if (!query || !query.trim()) return text;
    const q = query.trim();

    const index = text.toLowerCase().indexOf(q.toLowerCase());
    if (index === -1) return text.length > 60 ? text.slice(0, 60) + '...' : text;

    const start = Math.max(0, index - 25);
    const end = Math.min(text.length, index + q.length + 25);
    const snippet = text.slice(start, end);

    const queryRegex = new RegExp(`(${q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = snippet.split(queryRegex);

    return (
      <>
        {start > 0 && '...'}
        {parts.map((part, i) => 
          queryRegex.test(part) ? (
            <mark key={i} className="bg-sky-400/25 text-sky-200 font-medium px-0.5 rounded-sm not-italic">
              {part}
            </mark>
          ) : (
            part
          )
        )}
        {end < text.length && '...'}
      </>
    );
  };

  const renderChatRow = (chat: SearchResultSession) => {
    const isActive = activeChatId === chat.id;
    const isEditing = editingChatId === chat.id;
    const isConfirmingDelete = deletingChatId === chat.id;

    return (
      <div key={chat.id} className="flex flex-col w-full">
        <div
          className={`
            group relative flex items-center w-full rounded-xl transition-all duration-200 border
            ${isActive
              ? 'bg-white/[0.07] text-white border-white/[0.08]'
              : 'text-slate-400 sm:hover:bg-white/[0.05] active:bg-white/[0.07] sm:hover:text-slate-200 border-transparent'}
          `}
        >
          {isEditing ? (
            <div className="flex items-center gap-2 w-full px-3 py-1.5 bg-slate-800/50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-blue-400 select-none shrink-0">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
              <input
                ref={editInputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveRename(chat.id);
                  if (e.key === 'Escape') cancelRename();
                }}
                onBlur={() => {
                  setTimeout(() => {
                    saveRename(chat.id);
                  }, 200);
                }}
                className="flex-grow bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-sans min-h-[26px]"
                autoFocus
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  saveRename(chat.id);
                }}
                className="p-1 hover:text-emerald-400 transition-colors shrink-0"
                title={t('common.save')}
              >
                <span className="material-symbols-outlined notranslate text-sm" translate="no">check</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cancelRename();
                }}
                className="p-1 hover:text-rose-400 transition-colors shrink-0"
                title={t('common.cancel')}
              >
                <span className="material-symbols-outlined notranslate text-sm" translate="no">close</span>
              </button>
            </div>
          ) : isConfirmingDelete ? (
            <div className="flex items-center justify-between w-full px-3 py-1.5 bg-red-950/20 text-red-200 min-h-[38px] animate-fade-in">
              <span className="text-fluid-xs truncate flex-1 font-medium text-red-300">{t('sidebar.deletePrompt')}</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(chat.id);
                  }}
                  className="p-1 hover:text-emerald-400 transition-colors flex items-center justify-center hover:bg-emerald-500/10 rounded"
                  title={t('sidebar.deleteBtn')}
                >
                  <span className="material-symbols-outlined notranslate text-sm font-bold" translate="no">check</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelDelete();
                  }}
                  className="p-1 hover:text-rose-400 transition-colors flex items-center justify-center hover:bg-rose-500/10 rounded"
                  title={t('common.cancel')}
                >
                  <span className="material-symbols-outlined notranslate text-sm" translate="no">close</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  onSelectChat(chat.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className="flex-grow text-left py-1 px-3.5 text-[0.8rem] sm:text-xs whitespace-nowrap overflow-hidden min-h-[30px] pr-8"
              >
                <span className="truncate block flex-1">{chat.title}</span>
              </button>

              {/* 3-dots actions trigger */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuChatId(activeMenuChatId === chat.id ? null : chat.id);
                }}
                className={`
                  absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 flex items-center justify-center transition-all duration-150 active:scale-95 shrink-0 menu-trigger-btn
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  ${isActive ? 'opacity-100' : ''}
                  ${activeMenuChatId === chat.id ? 'opacity-100 text-white' : 'text-slate-400 hover:text-slate-200'}
                `}
                title={t('common.options') || 'Options'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {activeMenuChatId === chat.id && (
                <div
                  ref={menuRef}
                  className="absolute right-1.5 top-[calc(100%-2px)] mt-1 w-44 bg-slate-950/90 backdrop-blur-xl border border-white/[0.08] rounded-xl p-1 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] z-[100] animate-premium-dropdown flex flex-col gap-0.5 menu-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPinChat(chat.id, !chat.isPinned);
                      setActiveMenuChatId(null);
                    }}
                    className="flex items-center gap-2.5 w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all text-xs"
                  >
                    {chat.isPinned ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-amber-400">
                          <path d="M16 12V4h1v-2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"></path>
                        </svg>
                        <span>{t('sidebar.unpinChat')}</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-slate-400">
                          <line x1="12" y1="17" x2="12" y2="22"></line>
                          <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.33-2.92A2 2 0 0 1 15.8 9.84V5a1 1 0 0 0-1-1H9.2a1 1 0 0 0-1 1v4.84a2 2 0 0 1-.43 1.24l-2.33 2.92a2 2 0 0 0-.44 1.24z"></path>
                        </svg>
                        <span>{t('sidebar.pinChat')}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(chat.id, chat.title);
                      setActiveMenuChatId(null);
                    }}
                    className="flex items-center gap-2.5 w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all text-xs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                    <span>{t('sidebar.renameChat')}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startDelete(chat.id);
                      setActiveMenuChatId(null);
                    }}
                    className="flex items-center gap-2.5 w-full text-left px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all text-xs border-t border-white/[0.04] mt-0.5 pt-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5 text-rose-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    <span>{t('sidebar.deleteChat')}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Snippets list for search results */}
        {searchQuery.trim() && chat.matchingMessages && chat.matchingMessages.length > 0 && (
          <div className="pl-4 pr-1 mt-1 mb-2 space-y-1.5">
            {chat.matchingMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => {
                  onSelectChat(chat.id, msg.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className="w-full text-left text-[11px] leading-snug font-normal text-slate-400 hover:text-sky-400 bg-slate-900/35 hover:bg-slate-900/60 p-2 rounded-lg border border-transparent hover:border-sky-500/20 transition-all block break-words"
                title={msg.text}
              >
                <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1 uppercase text-[9px]">
                  {msg.role === 'user' ? t('sidebar.userLabel') : t('sidebar.aiLabel')}
                </span>
                {getHighlightedSnippet(msg.text, searchQuery)}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar relative to screen on mobile, static flex item on desktop */}
      <div className={`
        fixed md:relative top-0 left-0 h-full z-50
        bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50
        transition-all duration-300 ease-in-out flex flex-col overflow-hidden
        ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:-translate-x-full'}
      `}>
        <style>{`
          .sidebar-content-container {
            padding-top: calc(1rem + max(3.5rem, env(safe-area-inset-top, 0px))) !important;
          }
          @media (min-width: 768px) {
            .sidebar-content-container {
              padding-top: 1rem !important;
            }
          }
        `}</style>
        <div 
          className="sidebar-content-container p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-4 flex flex-col h-full w-64"
        >
          {isAuthenticated !== false && (
            <>
              <button
                ref={(el) => { if (el) injectShimmer(); }}
                onClick={onNewChat}
                className="shimmer-btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:'17px',height:'17px',flexShrink:0}}>
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
                {t('sidebar.newChat')}
              </button>

              <div className="relative mb-3 flex items-center gap-2 pb-2 border-b border-slate-700/60 focus-within:border-slate-500/80 transition-colors duration-200">
                {isSearching ? (
                  <div className="w-[16px] h-[16px] border-2 border-slate-500 border-t-sky-400 rounded-full animate-spin shrink-0" />
                ) : (
                  <span className="material-symbols-outlined notranslate text-slate-500 text-[17px] shrink-0 select-none" translate="no">search</span>
                )}
                <input
                  type="text"
                  placeholder={t('sidebar.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent !border-0 !outline-none !ring-0 focus:!ring-0 focus:!outline-none !shadow-none appearance-none text-[0.8rem] text-slate-300 placeholder-slate-500 caret-sky-400 !p-0"
                />
              </div>
            </>
          )}

          {isAuthenticated === false ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-blue-400">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-4 leading-relaxed">{t('sidebar.signInPrompt')}</p>
              {onSignIn && (
                <button
                  onClick={onSignIn}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-[0.97]"
                >
                  {t('common.signIn')}
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col">
              {/* Pinned section */}
              {pinnedSessions.length > 0 && (
                <div className="flex flex-col mb-4">
                  <div className="text-fluid-xs font-semibold text-slate-500 mb-2 ml-1 uppercase tracking-wider flex items-center gap-1.5 select-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-amber-500 shrink-0">
                      <path d="M16 12V4h1v-2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"></path>
                    </svg>
                    {t('sidebar.pinned')}
                  </div>
                  <div className="space-y-0.5">
                    {pinnedSessions.map((chat) => renderChatRow(chat))}
                  </div>
                  <div className="border-t border-slate-800/60 my-3 mx-1" />
                </div>
              )}

              {/* Recent section */}
              <div className="text-fluid-xs font-semibold text-slate-500 mb-2 ml-1 uppercase tracking-wider select-none">
                {t('sidebar.recent')}
              </div>

              <div className="space-y-0.5 flex-grow">
                {recentSessions.map((chat) => renderChatRow(chat))}
                
                {recentSessions.length === 0 && pinnedSessions.length === 0 && (
                  <div className="text-sm text-slate-500 text-center mt-6">
                    {searchQuery ? t('sidebar.noMatchingChats') : t('sidebar.emptySessions')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
