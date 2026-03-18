import type { FeedbackEntry } from '../../types';
import { StarRating } from './StarRating';
import { VolumeFader } from './VolumeFader';
import { FrequencyPanel } from './FrequencyPanel';
import { formatTime } from '../../utils/formatTime';
import './FeedbackCard.css';

interface FeedbackCardProps {
  entry: FeedbackEntry;
  index: number;
}

export const FeedbackCard = ({ entry, index }: FeedbackCardProps) => {
  const activeBands = entry.bands?.filter(b => b.verdict || b.notes) ?? [];

  return (
    <div className="feedback-card">
      <div className="card-header">
        <div className="card-index">{index + 1}</div>

        <div className="card-reviewer">
          <div className="card-reviewer-name">{entry.reviewerName || 'Anonymous'}</div>
          <div className="card-reviewer-date">
            {entry.createdAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="card-timestamp">{formatTime(entry.timestamp)}</div>
      </div>

      <div className="card-body">
        <div className="card-rating-row">
          <StarRating value={entry.rating} readonly />
          <span className="card-rating-value">{entry.rating}/5</span>
        </div>

        {entry.volumeDb !== 0 && (
          <VolumeFader value={entry.volumeDb} readonly />
        )}

        {activeBands.length > 0 && (
          <FrequencyPanel bands={entry.bands} readonly />
        )}

        {entry.comment && (
          <div className="card-comment">{entry.comment}</div>
        )}
      </div>
    </div>
  );
};
