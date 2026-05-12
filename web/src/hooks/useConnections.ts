import { useState, useEffect } from 'react';
import { Connection } from '../types';
import { subscribeConnections } from '../services/connections';

export const useConnections = (userId: string | null) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setConnections([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Evita spinner infinito caso o Firestore não responda
    const timeout = setTimeout(() => setLoading(false), 6000);

    const unsubscribe = subscribeConnections(
      userId,
      (data) => {
        clearTimeout(timeout);
        setConnections(data);
        setLoading(false);
      },
      (err) => {
        clearTimeout(timeout);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [userId]);

  return { connections, loading, error };
};
