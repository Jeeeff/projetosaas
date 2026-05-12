import { useState, useEffect } from 'react';
import { Contact } from '../types';
import { subscribeContacts } from '../services/contacts';

export const useContacts = (userId: string | null, connectionId: string | null) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !connectionId) {
      setContacts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const timeout = setTimeout(() => setLoading(false), 6000);

    const unsubscribe = subscribeContacts(
      userId,
      connectionId,
      (data) => {
        clearTimeout(timeout);
        setContacts(data);
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
  }, [userId, connectionId]);

  return { contacts, loading, error };
};
