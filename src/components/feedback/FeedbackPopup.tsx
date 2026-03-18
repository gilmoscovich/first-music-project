import { useState } from 'react';
import { DEFAULT_BANDS } from '../../types';
import type { FrequencyBand, FeedbackEntry } from '../../types';
import { VolumeFader } from './VolumeFader';
import { FrequencyPanel } from './FrequencyPanel';
import { StarRating } from './StarRating';
import { formatTime } from '../../utils/formatTime';

interface FeedbackPopupProps {
  timestamp: number;
  onSubmit: (entry: Omit<FeedbackEntry, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}

export const FeedbackPopup = ({ timestamp, onSubmit, onCancel }: FeedbackPopupProps) => {
  const [reviewerName, setReviewerName] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [volumeDb, setVolumeDb] = useState(0);
  const [bands, setBands] = useState<FrequencyBand[]>(DEFAULT_BANDS.map(b => ({ ...b })));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({ timestamp, reviewerName: reviewerName || 'Anonymous', comment, rating, volumeDb, bands });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-bright)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>Add Feedback</div>
            <div style={{ color: 'var(--accent-amber)', fontSize: '12px', fontFamily: 'monospace', marginTop: '2px' }}>
              @ {formatTime(timestamp)}
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{ color: 'var(--text-muted)', padding: '4px', fontSize: '20px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              Your name (optional)
            </label>
            <input
              type="text"
              placeholder="Anonymous"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Star rating */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Overall feel at this moment <span style={{ color: 'var(--accent-red)' }}>*</span>
            </div>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Volume fader */}
          <VolumeFader value={volumeDb} onChange={setVolumeDb} />

          {/* Frequency panel */}
          <FrequencyPanel bands={bands} onChange={setBands} />

          {/* Comment */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              General notes
            </label>
            <textarea
              placeholder="What are you hearing at this moment?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
          flexShrink: 0,
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-raised)',
              color: 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius)',
              background: rating === 0 || submitting ? 'var(--bg-raised)' : 'var(--accent-violet)',
              color: rating === 0 || submitting ? 'var(--text-muted)' : '#fff',
              fontWeight: 700,
              fontSize: '13px',
              transition: 'all 0.15s',
            }}
          >
            {submitting ? 'Saving...' : 'Pin Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};
