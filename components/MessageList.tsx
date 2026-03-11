import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { ErrorMessage } from './ErrorMessage';


interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onRegenerate: (messageId: string) => void;
  onSwitchAlternative: (messageId: string, direction: 'prev' | 'next') => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, error, onRegenerate, onSwitchAlternative }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading, error]);

  return (
    <div className="flex-grow p-4 md:p-6 space-y-4 overflow-y-auto"
         style={{
           WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 40px), transparent 100%)',
           maskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 40px), transparent 100%)'
         }}>
      {messages.map((msg) => (
        <MessageBubble 
          key={msg.id} 
          message={msg} 
          onRegenerate={onRegenerate}
          onSwitchAlternative={onSwitchAlternative}
        />
      ))}
      {isLoading && (
        <div className="flex justify-start">
            <div className="flex items-center space-x-3 bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-2xl max-w-lg shadow-md backdrop-blur-sm rounded-bl-sm">
                <div className="flex space-x-1 items-center justify-center">
                  <div className="w-[6px] h-[6px] rounded-full bg-sky-500 animate-[bounce_1s_infinite] [animation-delay:-0.3s]"></div>
                  <div className="w-[6px] h-[6px] rounded-full bg-sky-500 animate-[bounce_1s_infinite] [animation-delay:-0.15s]"></div>
                  <div className="w-[6px] h-[6px] rounded-full bg-sky-500 animate-[bounce_1s_infinite]"></div>
                </div>
            </div>
        </div>
      )}
      {error && !isLoading && (
         <div className="flex justify-start">
            <ErrorMessage message={error} />
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
