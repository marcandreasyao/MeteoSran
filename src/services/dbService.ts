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
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { Message } from '../../types';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export const createChatSession = async (userId: string, title: string = "New Chat"): Promise<string | null> => {
  if (!userId) return null;
  
  try {
    const chatsRef = collection(db, 'users', userId, 'chats');
    const newChatRef = await addDoc(chatsRef, {
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    return sessions;
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return [];
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
    
    const messageToSave = {
      ...message,
      timestamp: message.timestamp instanceof Date 
        ? Timestamp.fromDate(message.timestamp) 
        : message.timestamp
    };

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
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const querySnapshot = await getDocs(q);
    const messages: Message[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      messages.push({
        id: data.id,
        role: data.role,
        text: data.text,
        timestamp: data.timestamp?.toDate() || new Date(),
        image: data.image,
        alternatives: data.alternatives,
        currentAlternativeIndex: data.currentAlternativeIndex
      });
    });

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
