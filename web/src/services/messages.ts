import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Message, MessageStatus } from '../types';

const COLLECTION = 'messages';

export const subscribeMessages = (
  userId: string,
  connectionId: string,
  statusFilter: MessageStatus | 'all',
  onData: (messages: Message[]) => void,
  onError?: (error: Error) => void
) => {
  // Sem orderBy para evitar índice composto — ordenação feita no cliente
  const filters = [
    where('userId', '==', userId),
    where('connectionId', '==', connectionId),
    ...(statusFilter !== 'all' ? [where('status', '==', statusFilter)] : []),
  ];

  const q = query(collection(db, COLLECTION), ...filters);

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Message)
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      onData(messages);
    },
    onError
  );
};

// A Cloud Function é a única responsável por transicionar scheduled → sent.
// O cliente apenas declara a intenção: sem data = enviar agora, com data = agendar.
const resolveStatus = (scheduledAt: Date | null): MessageStatus =>
  scheduledAt ? 'scheduled' : 'sent';

export const createMessage = (
  userId: string,
  connectionId: string,
  contactIds: string[],
  content: string,
  scheduledAt: Date | null
) => {
  const status = resolveStatus(scheduledAt);
  return addDoc(collection(db, COLLECTION), {
    userId,
    connectionId,
    contactIds,
    content: content.trim(),
    status,
    scheduledAt: scheduledAt ? Timestamp.fromDate(scheduledAt) : null,
    sentAt: status === 'sent' ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
  });
};

export const updateMessage = (
  id: string,
  contactIds: string[],
  content: string,
  scheduledAt: Date | null
) => {
  const status = resolveStatus(scheduledAt);
  return updateDoc(doc(db, COLLECTION, id), {
    contactIds,
    content: content.trim(),
    status,
    scheduledAt: scheduledAt ? Timestamp.fromDate(scheduledAt) : null,
    sentAt: status === 'sent' ? serverTimestamp() : null,
  });
};

export const deleteMessage = (id: string) =>
  deleteDoc(doc(db, COLLECTION, id));
