import React, { RefObject } from 'react';
import { Message } from '../types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { SampleQuestions } from './SampleQuestions';
import { ErrorMessage } from './ErrorMessage';
import { CurrentInputState } from '../App'; // Import CurrentInputState

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (text: string, imageFile?: File | null) => void;
  onSampleQuestion: (question: string) => void;
  currentInputState: CurrentInputState; // Changed from currentInput
  setCurrentInputState: (value: CurrentInputState) => void; // Changed from setCurrentInput
  inputRef: RefObject<HTMLTextAreaElement | null>; // Changed to allow null
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  error,
  onSendMessage,
  onSampleQuestion,
  currentInputState,     // Changed
  setCurrentInputState, // Changed
  inputRef, // Destructure inputRef
}) => {
  const showSampleQuestions = messages.length <= 1 && !isLoading && !error && !currentInputState.imageFile;

  return (
    <div 
      className="flex flex-col flex-grow h-full overflow-hidden"
    >
      <MessageList messages={messages} isLoading={isLoading} error={error} />
      <div className="w-full max-w-6xl mx-auto px-2">
        {showSampleQuestions && <SampleQuestions onQuestionSelect={onSampleQuestion} />}
        <ChatInput 
          onSendMessage={onSendMessage} 
          isLoading={isLoading} 
          currentInputState={currentInputState}       // Changed
          setCurrentInputState={setCurrentInputState} // Changed
          inputRef={inputRef} // Pass inputRef to ChatInput
        />
      </div>
    </div>
  );
};
