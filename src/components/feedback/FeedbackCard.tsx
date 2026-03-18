import { useState, useEffect } from 'react';
import type { FeedbackEntry } from '../../types';
import { StarRating } from './StarRating';
import { VolumeFader } from './VolumeFader';
import { formatTime } from '../../utils/formatTime';
import './FeedbackCard.css';

interface FeedbackCardProps {
  entry: FeedbackEntry;
  index: number;
  onMarkRead?: (id: string, read: boolean) => void;
  onTimestampClick?: (seconds: number) => void;
}

const VERDICT_LABEL: Record<string, string> = {
  too_much: 'Too Much',
  just_right: 'Just Right',
  too_little: 'Too Little',
};

const CardSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="card-section">
      <button className={`section-header${open ? '' : ' section-header--closed'}`} onClick={() => setOpen(o => !o)}>
        <span className="section-title">{title}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="section-chevron">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div className="section-body-wrapper">
        <div className="section-body">
          <div className="section-body-inner">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const FeedbackCard = ({ entry, index, onMarkRead, onTimestampClick }: FeedbackCardProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isRead, setIsRead] = useState(!!entry.read);
  const activeBands = entry.bands?.filter(b => b.verdict) ?? [];

  useEffect(() => {
    setIsRead(!!entry.read);
  }, [entry.read]);

  const handleMarkRead = () => {
    if (!onMarkRead || !entry.id) return;
    const next = !isRead;
    setIsRead(next);
    onMarkRead(entry.id, next);
  };

  const cardClass = [
    'feedback-card',
    isRead ? 'feedback-card--read' : '',
    collapsed ? 'feedback-card--collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass}>
      <div className="card-header">
        <div className="card-index">{index + 1}</div>

        <div className="card-reviewer">
          <div className="card-reviewer-name">
            {entry.reviewerName || 'Anonymous'}
            {isRead && <span className="reviewed-badge">✓ Reviewed</span>}
          </div>
          <div className="card-reviewer-date">
            {entry.createdAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <button
          className={`card-timestamp${onTimestampClick ? ' card-timestamp--clickable' : ''}`}
          onClick={() => onTimestampClick?.(entry.timestamp)}
          title={onTimestampClick ? 'Play from this timestamp' : undefined}
          disabled={!onTimestampClick}
        >
          {onTimestampClick && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="timestamp-play-icon">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
          {formatTime(entry.timestamp)}
        </button>

        <div className="card-actions">
          {onMarkRead && entry.id && (
            <button
              className={`mark-read-btn${isRead ? ' mark-read-btn--read' : ''}`}
              onClick={handleMarkRead}
              title={isRead ? 'Mark as unread' : 'Mark as read'}
            >
              {isRead ? '✓' : '○'}
            </button>
          )}
          <button
            className={`collapse-btn${collapsed ? ' collapse-btn--collapsed' : ''}`}
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      <div className="card-body-wrapper">
        <div className="card-body">
          <div className="card-body-content">
            {/* Rating */}
            <div className="card-rating-row">
              <StarRating value={entry.rating} readonly />
              <span className="card-rating-value">{entry.rating}/5</span>
            </div>

            {/* Comment */}
            {entry.comment && (
              <div className="card-comment">{entry.comment}</div>
            )}

            {/* Volume accordion */}
            {entry.volumeDb !== 0 && (
              <CardSection title="Volume">
                <VolumeFader value={entry.volumeDb} readonly />
              </CardSection>
            )}

            {/* Frequencies accordion — compact view */}
            {activeBands.length > 0 && (
              <CardSection title="Frequencies">
                <div className="freq-compact">
                  {activeBands.map(band => (
                    <div key={band.id} className="freq-compact-row">
                      <span className="freq-compact-label">{band.label}</span>
                      <span className={`verdict-pill verdict-pill--${band.verdict}`}>
                        {VERDICT_LABEL[band.verdict!]}
                      </span>
                      {band.notes && <span className="freq-compact-notes">{band.notes}</span>}
                    </div>
                  ))}
                </div>
              </CardSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
