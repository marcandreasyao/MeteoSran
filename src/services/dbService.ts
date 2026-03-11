import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { Message } from '../../types';

export const saveMessageToDB = async (userId: string, message: Message) => {
  if (!userId) return;
  
  try {
    const userMessagesRef = doc(db, 'users', userId, 'messages', message.id);
    
    // Convert Date to Firestore Timestamp if it exists
    const messageToSave = {
      ...message,
      timestamp: message.timestamp instanceof Date 
        ? Timestamp.fromDate(message.timestamp) 
        : message.timestamp
    };

    // We omit the raw image data to save space if needed, 
    // but since this is JSON storage, we'll try to store it up to the document size limit (1MB Docs in Firestore).
    // For production, images should go to Firebase Storage and we'd save the URL here.
    if (messageToSave.image && messageToSave.image.data.length > 500000) {
       console.warn("Image too large for Firestore document. Omitting from DB save.");
       delete messageToSave.image;
    }

    await setDoc(userMessagesRef, messageToSave);
  } catch (error) {
    console.error("Error saving message to Firestore:", error);
  }
};

export const fetchUserMessages = async (userId: string): Promise<Message[]> => {
  if (!userId) return [];

  try {
    const messagesRef = collection(db, 'users', userId, 'messages');
    // Using string sort on ID or timestamp 
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
