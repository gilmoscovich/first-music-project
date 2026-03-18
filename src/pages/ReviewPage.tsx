import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTrack } from '../hooks/useTrack';
import { useFeedback } from '../hooks/useFeedback';
import { useAuth } from '../hooks/useAuth';
import { addFeedback, markFeedbackRead } from '../firebase/firestore';
import { WaveformPlayer } from '../components/waveform/WaveformPlayer';
import type { WaveformPlayerHandle } from '../components/waveform/WaveformPlayer';
import { FeedbackPopup } from '../components/feedback/FeedbackPopup';
import { FeedbackCard } from '../components/feedback/FeedbackCard';
import { generateShareUrl } from '../utils/shareLink';
import { logError } from '../utils/errorHandler';
import type { FeedbackEntry } from '../types';
import './ReviewPage.css';

export const ReviewPage = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const { track, loading: trackLoading } = useTrack(trackId);
  const { feedback, loading: feedbackLoading } = useFeedback(trackId);
  const { user } = useAuth();

  const [pendingTimestamp, setPendingTimestamp] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const playerRef = useRef<WaveformPlayerHandle>(null);

  const isOwner = user && track && user.uid === track.ownerId;

  const handleTimestampClick = (seconds: number) => {
    setPendingTimestamp(seconds);
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFeedbackSubmit = async (entry: Omit<FeedbackEntry, 'id' | 'createdAt'>) => {
    if (!trackId) return;
    try {
      await addFeedback(trackId, entry);
      setPendingTimestamp(null);
      setSubmitError(null);
    } catch (err) {
      logError(err, 'handleFeedbackSubmit');
      setSubmitError('Failed to save feedback. Please try again.');
    }
  };

  const handleMarkRead = (feedbackId: string, read: boolean) => {
    if (!trackId) return;
    markFeedbackRead(trackId, feedbackId, read);
  };

  const copyShareLink = async () => {
    if (!trackId) return;
    await navigator.clipboard.writeText(generateShareUrl(trackId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (trackLoading) {
    return <div className="review-loading">Loading track...</div>;
  }

  if (!track) {
    return (
      <div className="review-not-found">
        <div className="review-not-found-title">Track not found</div>
        <div className="review-not-found-desc">This link may be invalid or the track was removed.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Track header */}
      <div className="track-header">
        <div className="track-header-info">
          <h1 className="track-header-title">{track.title}</h1>
          <div className="track-header-meta">
            <span>{track.feedbackCount} marker{track.feedbackCount !== 1 ? 's' : ''}</span>
            <span>Uploaded {track.createdAt?.toDate().toLocaleDateString()}</span>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={copyShareLink}
            className={`share-btn${copied ? ' share-btn--copied' : ''}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            {copied ? 'Copied!' : 'Share Link'}
          </button>
        )}
      </div>

      {/* Waveform */}
      <WaveformPlayer
        ref={playerRef}
        audioUrl={track.downloadURL}
        feedback={feedback}
        trackId={track.id}
        onTimestampClick={handleTimestampClick}
        interactable={!isOwner}
      />

      {/* Reviewer hint */}
      {!isOwner && (
        <div className="reviewer-hint">
          <strong className="reviewer-hint-strong">You're reviewing this track.</strong>{' '}
          Click anywhere on the waveform to pin feedback at that timestamp.
        </div>
      )}

      {/* Feedback list */}
      {!feedbackLoading && feedback.length > 0 && (
        <div className="feedback-section">
          <h2 className="feedback-heading">
            Feedback
            <span className="feedback-count-badge">{feedback.length}</span>
          </h2>
          <div className="feedback-list">
            {feedback.map((entry, i) => (
              <FeedbackCard
                key={entry.id}
                entry={entry}
                index={i}
                onMarkRead={isOwner ? handleMarkRead : undefined}
                onTimestampClick={(s) => playerRef.current?.seekTo(s)}
              />
            ))}
          </div>
        </div>
      )}

      {!feedbackLoading && feedback.length === 0 && (
        <div className="empty-feedback">
          No feedback yet. {isOwner ? 'Share the link to start collecting.' : 'Be the first to leave a marker!'}
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div className="submit-error">{submitError}</div>
      )}

      {/* Feedback popup */}
      {pendingTimestamp !== null && (
        <FeedbackPopup
          timestamp={pendingTimestamp}
          onSubmit={handleFeedbackSubmit}
          onCancel={() => setPendingTimestamp(null)}
        />
      )}
    </div>
  );
};
