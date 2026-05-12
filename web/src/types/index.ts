import { Timestamp } from 'firebase/firestore';

export interface Connection {
  id: string;
  userId: string;
  name: string;
  createdAt: Timestamp;
}

export interface Contact {
  id: string;
  userId: string;
  connectionId: string;
  name: string;
  phone: string;
  createdAt: Timestamp;
}

export type MessageStatus = 'scheduled' | 'sent';

export interface Message {
  id: string;
  userId: string;
  connectionId: string;
  contactIds: string[];
  content: string;
  status: MessageStatus;
  scheduledAt: Timestamp | null;
  sentAt: Timestamp | null;
  createdAt: Timestamp;
}
