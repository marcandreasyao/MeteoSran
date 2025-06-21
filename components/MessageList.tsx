import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';


interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, error }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading, error]);

  return (
    <div className="flex-grow p-4 md:p-6 space-y-4 overflow-y-auto">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && (
        <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 p-3 rounded-xl max-w-lg shadow-md backdrop-blur-sm">
                <LoadingSpinner size="sm" />
                <span>MeteoSran is thinking...</span>
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
