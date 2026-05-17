// We no longer use Firebase for storing chat history, but we still export the types
// and interact with our PostgreSQL backend API via the Express server.
import { Message } from '../../types';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  memorySummary?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

export const createChatSession = async (userId: string, title: string = "New Chat"): Promise<string | null> => {
  if (!userId) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title })
    });
    
    if (!response.ok) throw new Error("Failed to create chat session");
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Error creating chat session:", error);
    return null;
  }
};

export const fetchChatSessions = async (userId: string): Promise<ChatSession[]> => {
  if (!userId) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/chats/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch chat sessions");
    
    const sessions = await response.json();
    return sessions.map((session: any) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt)
    }));
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return [];
  }
};

export const updateChatMemorySummary = async (userId: string, chatId: string, summary: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memorySummary: summary })
    });
    if (!response.ok) throw new Error("Failed to update memory summary");
  } catch (error) {
    console.error("Error updating memory summary:", error);
  }
};

export const saveMessageToDB = async (userId: string, chatId: string, message: Message) => {
  if (!userId || !chatId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message })
    });
    
    if (!response.ok) {
      // Handle payload too large (413) or other errors gracefully
      if (response.status === 413) {
         console.warn("Image too large to save in PostgreSQL. Dropping image payload.");
         const messageWithoutImage = { ...message };
         delete messageWithoutImage.image;
         await fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId, message: messageWithoutImage })
         });
      } else {
         throw new Error("Failed to save message");
      }
    }
  } catch (error) {
    console.error("Error saving message to PostgreSQL via API:", error);
  }
};

export const fetchUserMessages = async (userId: string, chatId: string): Promise<Message[]> => {
  if (!userId || !chatId) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/messages/${chatId}`);
    if (!response.ok) throw new Error("Failed to fetch messages");
    
    const messages = await response.json();
    return messages.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      text: msg.text,
      timestamp: new Date(msg.timestamp),
      image: msg.image,
      alternatives: msg.alternatives,
      currentAlternativeIndex: msg.currentAlternativeIndex
    }));
  } catch (error) {
    console.error("Error fetching messages from PostgreSQL via API:", error);
    return [];
  }
};

export const migrateLegacyMessages = async (userId: string) => {
  // Legacy migration left as a stub or to be implemented via backend script if needed
  console.log("Legacy migration not implemented for PostgreSQL yet.");
};