import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  addDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { Message } from '../../types';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  memorySummary?: string;
}

export const createChatSession = async (userId: string, title: string = "New Chat"): Promise<string | null> => {
  if (!userId) return null;

  try {
    const chatsRef = collection(db, 'users', userId, 'chats');
    const newChatRef = await addDoc(chatsRef, {
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      memorySummary: ""
    });
    return newChatRef.id;
  } catch (error) {
    console.error("Error creating chat session:", error);
    return null;
  }
};

export const fetchChatSessions = async (userId: string): Promise<ChatSession[]> => {
  if (!userId) return [];

  try {
    const chatsRef = collection(db, 'users', userId, 'chats');
    const q = query(chatsRef, orderBy('updatedAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const sessions: ChatSession[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      sessions.push({
        id: docSnap.id,
        title: data.title || "Untitled Chat",
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        memorySummary: data.memorySummary || ""
      });
    });

    return sessions;
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return [];
  }
};

export const updateChatMemorySummary = async (userId: string, chatId: string, summary: string) => {
  try {
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    await setDoc(chatRef, { memorySummary: summary, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("Error updating memory summary:", error);
  }
};

export const saveMessageToDB = async (userId: string, chatId: string, message: Message) => {
  if (!userId || !chatId) return;

  try {
    const userMessageRef = doc(db, 'users', userId, 'chats', chatId, 'messages', message.id);

    // Update the chat session's updatedAt timestamp
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    await setDoc(chatRef, {
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Safely serialize the timestamp for Firestore
    const messageToSave = {
      ...message,
      timestamp: message.timestamp instanceof Date
        ? Timestamp.fromDate(message.timestamp)
        : message.timestamp
    };

    // Prevent massive base64 strings from breaking Firestore document limits
    if (messageToSave.image && messageToSave.image.data.length > 500000) {
      console.warn("Image too large for Firestore document. Omitting from DB save.");
      delete messageToSave.image;
    }

    await setDoc(userMessageRef, messageToSave);
  } catch (error) {
    console.error("Error saving message to Firestore:", error);
  }
};

export const fetchUserMessages = async (userId: string, chatId: string): Promise<Message[]> => {
  if (!userId || !chatId) return [];

  try {
    const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');

    // The Beast Defeated: Removed the orderBy('timestamp', 'asc') clause to bypass 
    // strict Firestore indexing requirements and mixed data-type silent failures.
    const q = query(messagesRef);

    const querySnapshot = await getDocs(q);
    const messages: Message[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      messages.push({
        id: data.id || docSnap.id,
        role: data.role,
        text: data.text,
        timestamp: data.timestamp
          ? (typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate() : new Date(data.timestamp))
          : new Date(0), // Failsafe for missing timestamps
        image: data.image,
        alternatives: data.alternatives,
        currentAlternativeIndex: data.currentAlternativeIndex
      });
    });

    // The Angel's Touch: In-memory sorting guarantees a perfect chronological 
    // timeline regardless of how the legacy data was originally stored.
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    console.log(`[MeteoSran] Fetched & sorted ${messages.length} messages for chat ${chatId}`);
    return messages;
  } catch (error) {
    console.error("Error fetching messages from Firestore:", error);
    return [];
  }
};

export const migrateLegacyMessages = async (userId: string) => {
  try {
    const oldMessagesRef = collection(db, 'users', userId, 'messages');
    const oldSnapshot = await getDocs(oldMessagesRef);
    if (!oldSnapshot.empty) {
      const chatId = await createChatSession(userId, "Legacy Chat");
      if (chatId) {
        for (const docSnap of oldSnapshot.docs) {
          const data = docSnap.data() as any;
          const newMsgRef = doc(db, 'users', userId, 'chats', chatId, 'messages', docSnap.id);
          await setDoc(newMsgRef, data);
          await deleteDoc(doc(db, 'users', userId, 'messages', docSnap.id));
        }
      }
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
};