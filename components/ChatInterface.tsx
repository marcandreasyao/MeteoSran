import React, { RefObject } from 'react';
import { Message } from '../types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';
import { CurrentInputState } from '../App'; // Import CurrentInputState

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (text: string, imageFile?: File | null) => void;
  onSampleQuestion: (question: string) => void;
  onRegenerate: (messageId: string) => void;
  onSwitchAlternative: (messageId: string, direction: 'prev' | 'next') => void;
  currentInputState: CurrentInputState; // Changed from currentInput
  setCurrentInputState: (value: CurrentInputState) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onStartLiveSession?: () => void;
  userFirstName: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  error,
  onSendMessage,
  onSampleQuestion,
  onRegenerate,
  onSwitchAlternative,
  currentInputState,
  setCurrentInputState,
  inputRef,
  onStartLiveSession,
  userFirstName,
}) => {
  const showWelcomeScreen = messages.length === 0 && !isLoading && !error && !currentInputState.imageFile;

  return (
    <div 
      className="flex flex-col flex-grow h-full overflow-hidden"
    >
      <MessageList 
        messages={messages} 
        isLoading={isLoading} 
        error={error} 
        onRegenerate={onRegenerate}
        onSwitchAlternative={onSwitchAlternative}
      />
      <div className={`w-full max-w-6xl mx-auto px-2 ${showWelcomeScreen ? 'h-full flex flex-col justify-end' : ''}`}>
        {showWelcomeScreen && <WelcomeScreen firstName={userFirstName} onSuggestionClick={onSampleQuestion} />}
        <div className={showWelcomeScreen ? 'mb-4 md:mb-8' : ''}>
          <ChatInput 
            onSendMessage={onSendMessage} 
            isLoading={isLoading} 
            currentInputState={currentInputState}
            setCurrentInputState={setCurrentInputState}
            inputRef={inputRef}
            onStartLiveSession={onStartLiveSession}
          />
        </div>
      </div>
    </div>
  );
};
