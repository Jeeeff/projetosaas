import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, FirestoreError } from 'firebase/firestore';
import { db } from '../firebase';

export interface UserStats {
  connections: number;
  contacts: number;
  messages: number;
  sent: number;
  scheduled: number;
  contactsByConnection: Record<string, number>;
  messagesByConnection: Record<string, number>;
}

const EMPTY_STATS: UserStats = {
  connections: 0,
  contacts: 0,
  messages: 0,
  sent: 0,
  scheduled: 0,
  contactsByConnection: {},
  messagesByConnection: {},
};

// Subscribe agregado das três coleções do usuário. Só sinaliza `loading: false`
// quando todas as três subscriptions entregaram o primeiro snapshot, evitando
// flash de zeros no Dashboard.
export const useUserStats = (userId: string | null) => {
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!userId) {
      setStats(EMPTY_STATS);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ready = { connections: false, contacts: false, messages: false };
    const timeout = setTimeout(() => setLoading(false), 6000);

    const markReady = (key: keyof typeof ready) => {
      ready[key] = true;
      if (ready.connections && ready.contacts && ready.messages) {
        clearTimeout(timeout);
        setLoading(false);
      }
    };

    const handleError = (err: FirestoreError) => {
      clearTimeout(timeout);
      setError(err);
      setLoading(false);
    };

    const unsubConnections = onSnapshot(
      query(collection(db, 'connections'), where('userId', '==', userId)),
      (snap) => {
        setStats((s) => ({ ...s, connections: snap.size }));
        markReady('connections');
      },
      handleError
    );

    const unsubContacts = onSnapshot(
      query(collection(db, 'contacts'), where('userId', '==', userId)),
      (snap) => {
        const byConnection: Record<string, number> = {};
        snap.docs.forEach((d) => {
          const cid = d.data().connectionId as string | undefined;
          if (cid) byConnection[cid] = (byConnection[cid] ?? 0) + 1;
        });
        setStats((s) => ({ ...s, contacts: snap.size, contactsByConnection: byConnection }));
        markReady('contacts');
      },
      handleError
    );

    const unsubMessages = onSnapshot(
      query(collection(db, 'messages'), where('userId', '==', userId)),
      (snap) => {
        let sent = 0;
        let scheduled = 0;
        const byConnection: Record<string, number> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.status === 'sent') sent++;
          else if (data.status === 'scheduled') scheduled++;
          const cid = data.connectionId as string | undefined;
          if (cid) byConnection[cid] = (byConnection[cid] ?? 0) + 1;
        });
        setStats((s) => ({
          ...s,
          messages: snap.size,
          sent,
          scheduled,
          messagesByConnection: byConnection,
        }));
        markReady('messages');
      },
      handleError
    );

    return () => {
      clearTimeout(timeout);
      unsubConnections();
      unsubContacts();
      unsubMessages();
    };
  }, [userId]);

  return { stats, loading, error };
};
