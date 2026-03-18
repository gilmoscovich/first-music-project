import { useState, useEffect } from 'react';
import type { FeedbackEntry } from '../types';
import { subscribeFeedback } from '../firebase/firestore';

export const useFeedback = (trackId: string | undefined) => {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackId) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeFeedback(trackId, (entries) => {
      setFeedback(entries);
      setLoading(false);
    });
    return unsubscribe;
  }, [trackId]);

  return { feedback, loading };
};
