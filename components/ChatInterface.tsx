import React, { RefObject } from 'react';
import { Message } from '../types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { SampleQuestions } from './SampleQuestions';
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
}) => {
  const showSampleQuestions = messages.length <= 1 && !isLoading && !error && !currentInputState.imageFile;

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
      <div className="w-full max-w-6xl mx-auto px-2">
        {showSampleQuestions && <SampleQuestions onQuestionSelect={onSampleQuestion} />}
        <ChatInput 
          onSendMessage={onSendMessage} 
          isLoading={isLoading} 
          currentInputState={currentInputState}       // Changed
          setCurrentInputState={setCurrentInputState} // Changed
          inputRef={inputRef} // Pass inputRef to ChatInput
          onStartLiveSession={onStartLiveSession}
        />
      </div>
    </div>
  );
};
