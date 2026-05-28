// We no longer use Firebase for storing chat history, but we still export the types
// and interact with our PostgreSQL backend API via the Express server.
import { Message } from '../../types';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  memorySummary?: string;
  isPinned?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

export const renameChatSession = async (userId: string, chatId: string, title: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!response.ok) throw new Error("Failed to rename chat session");
    return true;
  } catch (error) {
    console.error("Error renaming chat session:", error);
    return false;
  }
};

export const deleteChatSession = async (userId: string, chatId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error("Failed to delete chat session");
    return true;
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return false;
  }
};

export const pinChatSession = async (userId: string, chatId: string, isPinned: boolean): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned })
    });
    if (!response.ok) throw new Error("Failed to pin/unpin chat session");
    return true;
  } catch (error) {
    console.error("Error pinning chat session:", error);
    return false;
  }
};

/**
 * Creates a tiny thumbnail from a base64 image for DB storage.
 * Max 200px, JPEG 0.6 quality → typically ~5-10 KB instead of ~100+ KB.
 */
const createThumbnail = (
  base64Data: string,
  mimeType: string,
  maxDim = 200,
  quality = 0.6
): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No 2D context')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ data: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
    img.src = `data:${mimeType};base64,${base64Data}`;
  });
};

export const saveMessageToDB = async (userId: string, chatId: string, message: Message) => {
  if (!userId || !chatId) return;

  try {
    // If the message contains an image, create a small thumbnail for DB storage
    // instead of persisting the full-resolution base64 data.
    let messageToSave = message;
    if (message.image?.data) {
      try {
        const thumb = await createThumbnail(message.image.data, message.image.mimeType);
        messageToSave = {
          ...message,
          image: {
            data: thumb.data,
            mimeType: thumb.mimeType,
            name: message.image.name
          }
        };
      } catch (thumbErr) {
        console.warn('[MeteoSran] Thumbnail generation failed, saving without image:', thumbErr);
        messageToSave = { ...message };
        delete (messageToSave as any).image;
      }
    }

    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message: messageToSave })
    });
    
    if (!response.ok) {
      // Handle payload too large (413) or other errors gracefully
      if (response.status === 413) {
         console.warn("Image thumbnail still too large for PostgreSQL. Dropping image payload.");
         const messageWithoutImage = { ...messageToSave };
         delete (messageWithoutImage as any).image;
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