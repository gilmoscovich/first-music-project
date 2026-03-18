import { useState, useEffect } from 'react';
import type { Track } from '../types';
import { getTrack } from '../firebase/firestore';

export const useTrack = (trackId: string | undefined) => {
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trackId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getTrack(trackId)
      .then((t) => {
        setTrack(t);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [trackId]);

  return { track, loading, error };
};
