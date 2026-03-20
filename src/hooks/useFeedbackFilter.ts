import { useState, useMemo } from 'react';
import type { FeedbackEntry } from '../types';

export type FilterMode = 'all' | 'unread';
export type SortMode = 'timestamp' | 'rating' | 'newest';

export function useFeedbackFilter(feedback: FeedbackEntry[]) {
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortMode>('timestamp');

  const filtered = useMemo(() => {
    const base = filter === 'unread' ? feedback.filter(f => !f.read) : feedback;
    return [...base].sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'newest') return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
      return a.timestamp - b.timestamp;
    });
  }, [feedback, filter, sort]);

  return { filter, setFilter, sort, setSort, filtered };
}
