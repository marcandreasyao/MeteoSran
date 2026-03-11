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
        bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50
        transition-all duration-300 ease-in-out flex flex-col overflow-hidden
        ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:-translate-x-full'}
      `}>
        <div className="p-4 flex flex-col h-full w-64">
          <button
            onClick={onNewChat}
            className="flex items-center gap-3 w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 p-3 rounded-xl text-sm font-medium transition-all mb-4 border border-blue-500/20 whitespace-nowrap shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">edit_square</span>
            New chat
          </button>

          <div className="relative mb-6">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input 
              type="text" 
              placeholder="Search for chats"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>
          
          <div className="text-xs font-semibold text-slate-500 mb-3 ml-1 uppercase tracking-wider whitespace-nowrap">Recent</div>
          
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredSessions.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  onSelectChat(chat.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`
                  w-full text-left p-2.5 rounded-lg flex items-center gap-3 text-sm
                  transition-all whitespace-nowrap overflow-hidden group
                  ${activeChatId === chat.id 
                    ? 'bg-slate-800/80 text-white shadow-sm border border-slate-700/50' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'}
                `}
              >
                <span className={`material-symbols-outlined text-base ${activeChatId === chat.id ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-400'}`}>chat_bubble</span>
                <span className="truncate flex-1">{chat.title}</span>
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
