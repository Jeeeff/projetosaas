import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Contact } from '../types';

const COLLECTION = 'contacts';

export const subscribeContacts = (
  userId: string,
  connectionId: string,
  onData: (contacts: Contact[]) => void,
  onError?: (error: Error) => void
) => {
  // Sem orderBy para evitar índice composto — ordenação feita no cliente
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('connectionId', '==', connectionId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const contacts = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Contact)
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      onData(contacts);
    },
    onError
  );
};

export const createContact = (
  userId: string,
  connectionId: string,
  name: string,
  phone: string
) =>
  addDoc(collection(db, COLLECTION), {
    userId,
    connectionId,
    name: name.trim(),
    phone: phone.trim(),
    createdAt: serverTimestamp(),
  });

export const updateContact = (id: string, name: string, phone: string) =>
  updateDoc(doc(db, COLLECTION, id), { name: name.trim(), phone: phone.trim() });

export const deleteContact = (id: string) =>
  deleteDoc(doc(db, COLLECTION, id));
