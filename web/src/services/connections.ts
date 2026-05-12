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
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Connection } from '../types';

const COLLECTION = 'connections';

export const subscribeConnections = (
  userId: string,
  onData: (connections: Connection[]) => void,
  onError?: (error: Error) => void
) => {
  // Sem orderBy para evitar índice composto — ordenação feita no cliente
  const q = query(collection(db, COLLECTION), where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const connections = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Connection)
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      onData(connections);
    },
    onError
  );
};

export const createConnection = (userId: string, name: string) =>
  addDoc(collection(db, COLLECTION), {
    userId,
    name: name.trim(),
    createdAt: serverTimestamp(),
  });

export const updateConnection = (id: string, name: string) =>
  updateDoc(doc(db, COLLECTION, id), { name: name.trim() });

export const deleteConnection = (id: string) =>
  deleteDoc(doc(db, COLLECTION, id));

// Exclui a conexão em cascata: todos os contatos e mensagens associados.
// Divide em chunks de 400 ops para respeitar o limite de 500 ops/batch do Firestore.
const BATCH_LIMIT = 400;

export const deleteConnectionCascade = async (connectionId: string, userId: string) => {
  const [contactsSnap, messagesSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, 'contacts'),
        where('userId', '==', userId),
        where('connectionId', '==', connectionId)
      )
    ),
    getDocs(
      query(
        collection(db, 'messages'),
        where('userId', '==', userId),
        where('connectionId', '==', connectionId)
      )
    ),
  ]);

  const refs = [
    ...contactsSnap.docs.map((d) => d.ref),
    ...messagesSnap.docs.map((d) => d.ref),
    doc(db, COLLECTION, connectionId),
  ];

  // Commits sequenciais — cada chunk é atômico, mas no agregado pode falhar parcial.
  // Para o escopo deste app (volumes baixos), é aceitável; em produção real seria
  // melhor uma Cloud Function onDocumentDeleted com retry idempotente.
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    refs.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
};
