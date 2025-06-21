export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system', // For system messages or errors shown in chat
}

export enum ResponseMode {
  DEFAULT = "default",
  CONCISE = "concise",
  SHORT = "short",
  STRAIGHT = "straight",
  FUNNY = "funny",
  EINSTEIN = "einstein"
}

export interface ImagePayload {
  data: string; // base64 encoded image data
  mimeType: string;
  name: string; // file name for display
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  image?: ImagePayload; // Optional image data
}
