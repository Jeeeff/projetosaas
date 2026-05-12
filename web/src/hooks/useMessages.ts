import { useState, useEffect } from 'react';
import { Message, MessageStatus } from '../types';
import { subscribeMessages } from '../services/messages';

export const useMessages = (
  userId: string | null,
  connectionId: string | null,
  filter: MessageStatus | 'all' = 'all'
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !connectionId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const timeout = setTimeout(() => setLoading(false), 6000);

    const unsubscribe = subscribeMessages(
      userId,
      connectionId,
      filter,
      (data) => {
        clearTimeout(timeout);
        setMessages(data);
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
  }, [userId, connectionId, filter]);

  return { messages, loading, error };
};
