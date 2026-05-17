import React, { useMemo } from 'react';
import { ChatSession } from '../src/services/dbService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chatSessions: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  chatSessions,
  activeChatId,
  onSelectChat,
  onNewChat,
  searchQuery,
  onSearchChange
}) => {
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return chatSessions;
    return chatSessions.filter(chat =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chatSessions, searchQuery]);

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
        bg-slate-900/95 backdrop-blur-3xl border-r border-slate-800/50
        transition-all duration-300 ease-in-out flex flex-col overflow-hidden shadow-2xl md:shadow-none
        ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:-translate-x-full'}
      `}>
        <div className="p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] flex flex-col h-full w-64">
          <div className="flex items-center gap-3 mb-6 px-1 md:hidden">
            <img src="/Meteosran-logo.png" alt="MeteoSran Logo" className="h-7 w-7 rounded-full bg-slate-950 p-0.5 shadow-sm" />
            <h2 className="text-lg font-bold text-white tracking-tight">MeteoSran</h2>
          </div>

          <button
            onClick={onNewChat}
            className="flex items-center justify-center gap-3 w-full bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/30 text-blue-400 p-3 rounded-full text-sm font-semibold transition-all mb-5 border border-blue-500/20 whitespace-nowrap min-touch-target shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">edit_square</span>
            New Chat
          </button>

          <div className="relative mb-8 mt-2 group">
            <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent border-b border-slate-700/50 pl-8 pr-2 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors rounded-none"
            />
          </div>

          <div className="text-[10px] font-bold text-slate-500 mb-4 ml-1 uppercase tracking-[0.15em] whitespace-nowrap">Recent</div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {filteredSessions.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  onSelectChat(chat.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`
                  w-full text-left min-touch-target flex items-center gap-3 text-sm
                  transition-all duration-300 whitespace-nowrap overflow-hidden group
                  ${activeChatId === chat.id
                    ? 'text-blue-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:translate-x-1.5'}
                `}
              >
                {activeChatId === chat.id ? (
                  <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] flex-shrink-0 ml-0.5"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-600 flex-shrink-0 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                )}
                <span className="truncate flex-1 tracking-wide">{chat.title}</span>
              </button>
            ))}

            {filteredSessions.length === 0 && (
              <div className="text-sm text-slate-500 text-center mt-6">
                {searchQuery ? "No matching chats" : "No recent chats"}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
