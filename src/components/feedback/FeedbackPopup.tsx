import { useState } from 'react';
import { DEFAULT_BANDS } from '../../types';
import type { FrequencyBand, FeedbackEntry } from '../../types';
import { VolumeFader } from './VolumeFader';
import { FrequencyPanel } from './FrequencyPanel';
import { formatTime } from '../../utils/formatTime';
import './FeedbackPopup.css';

interface FeedbackPopupProps {
  timestamp: number;
  onSubmit: (entry: Omit<FeedbackEntry, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}

export const FeedbackPopup = ({ timestamp, onSubmit, onCancel }: FeedbackPopupProps) => {
  const [reviewerName, setReviewerName] = useState('');
  const [comment, setComment] = useState('');
  const [volumeDb, setVolumeDb] = useState(0);
  const [bands, setBands] = useState<FrequencyBand[]>(DEFAULT_BANDS.map(b => ({ ...b })));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ timestamp, reviewerName: reviewerName || 'Anonymous', comment, rating: 0, volumeDb, bands });
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting;

  return (
    <div className="popup-overlay">
      <div className="popup-modal">
        <div className="popup-header">
          <div>
            <div className="popup-title">Add Feedback</div>
            <div className="popup-time">@ {formatTime(timestamp)}</div>
          </div>
          <button onClick={onCancel} className="popup-close">×</button>
        </div>

        <div className="popup-body">
          <div>
            <label className="popup-label">Your name (optional)</label>
            <input
              type="text"
              placeholder="Anonymous"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <VolumeFader value={volumeDb} onChange={setVolumeDb} />

          <FrequencyPanel bands={bands} onChange={setBands} />

          <div>
            <label className="popup-label">General notes</label>
            <textarea
              placeholder="What are you hearing at this moment?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="popup-footer">
          <button onClick={onCancel} className="popup-cancel-btn">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className={`popup-submit-btn${isDisabled ? ' popup-submit-btn--disabled' : ''}`}
          >
            {submitting ? 'Saving...' : 'Pin Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};
