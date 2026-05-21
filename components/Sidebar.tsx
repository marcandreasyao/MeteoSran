import React, { useMemo, useState, useRef } from 'react';
import { ChatSession } from '../src/services/dbService';

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
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onDeleteChat: (chatId: string) => void;
  onPinChat: (chatId: string, isPinned: boolean) => void;
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
  onPinChat
}) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

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

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return chatSessions;
    return chatSessions.filter(chat =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chatSessions, searchQuery]);

  const pinnedSessions = useMemo(() => {
    return filteredSessions.filter(chat => chat.isPinned);
  }, [filteredSessions]);

  const recentSessions = useMemo(() => {
    return filteredSessions.filter(chat => !chat.isPinned);
  }, [filteredSessions]);

  const renderChatRow = (chat: ChatSession) => {
    const isActive = activeChatId === chat.id;
    const isEditing = editingChatId === chat.id;
    const isConfirmingDelete = deletingChatId === chat.id;

    return (
      <div
        key={chat.id}
        className={`
          group relative flex items-center w-full rounded-xl transition-all overflow-hidden border
          ${isActive
            ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
            : 'text-slate-400 sm:hover:bg-slate-800/40 active:bg-slate-800/60 sm:hover:text-slate-200 border-transparent'}
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
              title="Save"
            >
              <span className="material-symbols-outlined text-sm">check</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelRename();
              }}
              className="p-1 hover:text-rose-400 transition-colors shrink-0"
              title="Cancel"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ) : isConfirmingDelete ? (
          <div className="flex items-center justify-between w-full px-3 py-1.5 bg-red-950/20 text-red-200 min-h-[38px] animate-fade-in">
            <span className="text-fluid-xs truncate flex-1 font-medium text-red-300">Delete chat?</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete(chat.id);
                }}
                className="p-1 hover:text-emerald-400 transition-colors flex items-center justify-center hover:bg-emerald-500/10 rounded"
                title="Confirm Delete"
              >
                <span className="material-symbols-outlined text-sm font-bold">check</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cancelDelete();
                }}
                className="p-1 hover:text-rose-400 transition-colors flex items-center justify-center hover:bg-rose-500/10 rounded"
                title="Cancel"
              >
                <span className="material-symbols-outlined text-sm">close</span>
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
              className="flex-grow text-left py-1.5 px-3.5 text-fluid-sm whitespace-nowrap overflow-hidden min-h-[38px] pr-20"
            >
              <span className="truncate block flex-1">{chat.title}</span>
            </button>

            {/* Action buttons shown on hover or if active */}
            <div className={`
              absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg
              opacity-0 group-hover:opacity-100 transition-all duration-200
              ${isActive ? 'opacity-100' : ''}
              ${isActive ? 'bg-slate-800' : 'bg-slate-900/90 backdrop-blur-sm sm:group-hover:bg-slate-800/90'}
            `}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPinChat(chat.id, !chat.isPinned);
                }}
                className="p-1 hover:bg-slate-700/50 rounded-md flex items-center justify-center transition-all duration-150 active:scale-95 shrink-0"
                title={chat.isPinned ? "Unpin chat" : "Pin chat"}
              >
                {chat.isPinned ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-amber-400 hover:text-amber-300 transition-colors">
                    <path d="M16 12V4h1v-2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-slate-400 hover:text-amber-400 transition-colors">
                    <line x1="12" y1="17" x2="12" y2="22"></line>
                    <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.33-2.92A2 2 0 0 1 15.8 9.84V5a1 1 0 0 0-1-1H9.2a1 1 0 0 0-1 1v4.84a2 2 0 0 1-.43 1.24l-2.33 2.92a2 2 0 0 0-.44 1.24z"></path>
                  </svg>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startRename(chat.id, chat.title);
                }}
                className="p-1 hover:bg-slate-700/50 rounded-md flex items-center justify-center transition-all duration-150 active:scale-95 shrink-0"
                title="Rename chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5 text-slate-400 hover:text-blue-400 transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startDelete(chat.id);
                }}
                className="p-1 hover:bg-slate-700/50 rounded-md flex items-center justify-center transition-all duration-150 active:scale-95 shrink-0"
                title="Delete chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5 text-slate-400 hover:text-rose-400 transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </>
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
        <div className="p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] flex flex-col h-full w-64">
          <button
            ref={(el) => { if (el) injectShimmer(); }}
            onClick={onNewChat}
            className="shimmer-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:'17px',height:'17px',flexShrink:0}}>
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
            New chat
          </button>

          <div className="relative mb-3 flex items-center gap-2.5 border-b border-slate-700/60 pb-2 focus-within:border-slate-500/80 transition-colors">
            <span className="material-symbols-outlined text-slate-500 text-[18px] shrink-0 select-none">search</span>
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none appearance-none text-sm text-slate-300 placeholder-slate-500 caret-blue-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col">
            {/* Pinned section */}
            {pinnedSessions.length > 0 && (
              <div className="flex flex-col mb-4">
                <div className="text-fluid-xs font-semibold text-slate-500 mb-2 ml-1 uppercase tracking-wider flex items-center gap-1.5 select-none">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-amber-500 shrink-0">
                    <path d="M16 12V4h1v-2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"></path>
                  </svg>
                  Pinned
                </div>
                <div className="space-y-1">
                  {pinnedSessions.map((chat) => renderChatRow(chat))}
                </div>
                <div className="border-t border-slate-800/60 my-3 mx-1" />
              </div>
            )}

            {/* Recent section */}
            <div className="text-fluid-xs font-semibold text-slate-500 mb-2 ml-1 uppercase tracking-wider select-none">
              Recent
            </div>

            <div className="space-y-1 flex-grow">
              {recentSessions.map((chat) => renderChatRow(chat))}
              
              {recentSessions.length === 0 && pinnedSessions.length === 0 && (
                <div className="text-sm text-slate-500 text-center mt-6">
                  {searchQuery ? "No matching chats" : "No chats yet"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
