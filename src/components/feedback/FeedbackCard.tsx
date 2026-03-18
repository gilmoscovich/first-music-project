import type { FeedbackEntry } from '../../types';
import { StarRating } from './StarRating';
import { VolumeFader } from './VolumeFader';
import { FrequencyPanel } from './FrequencyPanel';
import { formatTime } from '../../utils/formatTime';

interface FeedbackCardProps {
  entry: FeedbackEntry;
  index: number;
}

export const FeedbackCard = ({ entry, index }: FeedbackCardProps) => {
  const activeBands = entry.bands?.filter(b => b.verdict || b.notes) ?? [];

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '28px', height: '28px',
          background: 'rgba(124, 106, 247, 0.15)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, color: 'var(--accent-violet)',
          flexShrink: 0,
        }}>
          {index + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.reviewerName || 'Anonymous'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {entry.createdAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div style={{
          background: 'rgba(245, 197, 24, 0.1)',
          color: 'var(--accent-amber)',
          padding: '4px 10px',
          borderRadius: '99px',
          fontSize: '12px',
          fontWeight: 700,
          fontFamily: 'monospace',
          flexShrink: 0,
        }}>
          {formatTime(entry.timestamp)}
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <StarRating value={entry.rating} readonly />
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{entry.rating}/5</span>
        </div>

        {/* Volume */}
        {entry.volumeDb !== 0 && (
          <VolumeFader value={entry.volumeDb} readonly />
        )}

        {/* Frequency bands - only show active ones */}
        {activeBands.length > 0 && (
          <FrequencyPanel bands={entry.bands} readonly />
        )}

        {/* Comment */}
        {entry.comment && (
          <div style={{
            padding: '12px',
            background: 'var(--bg-raised)',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            borderLeft: '3px solid var(--accent-violet)',
          }}>
            {entry.comment}
          </div>
        )}
      </div>
    </div>
  );
};
