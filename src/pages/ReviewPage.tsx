import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTrack } from '../hooks/useTrack';
import { useFeedback } from '../hooks/useFeedback';
import { useAuth } from '../hooks/useAuth';
import { addFeedback } from '../firebase/firestore';
import { WaveformPlayer } from '../components/waveform/WaveformPlayer';
import { FeedbackPopup } from '../components/feedback/FeedbackPopup';
import { FeedbackCard } from '../components/feedback/FeedbackCard';
import { generateShareUrl } from '../utils/shareLink';
import { logError } from '../utils/errorHandler';
import type { FeedbackEntry } from '../types';

export const ReviewPage = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const { track, loading: trackLoading } = useTrack(trackId);
  const { feedback, loading: feedbackLoading } = useFeedback(trackId);
  const { user } = useAuth();

  const [pendingTimestamp, setPendingTimestamp] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

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

  const copyShareLink = async () => {
    if (!trackId) return;
    await navigator.clipboard.writeText(generateShareUrl(trackId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (trackLoading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '80px', color: 'var(--text-muted)' }}>
        Loading track...
      </div>
    );
  }

  if (!track) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Track not found</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>This link may be invalid or the track was removed.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Track header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>{track.title}</h1>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
            <span>{track.feedbackCount} marker{track.feedbackCount !== 1 ? 's' : ''}</span>
            <span>Uploaded {track.createdAt?.toDate().toLocaleDateString()}</span>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={copyShareLink}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              background: copied ? 'rgba(61, 214, 140, 0.15)' : 'var(--bg-raised)',
              color: copied ? 'var(--accent-green)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              border: `1px solid ${copied ? 'rgba(61, 214, 140, 0.3)' : 'var(--border)'}`,
              transition: 'all 0.15s',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
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
        audioUrl={track.downloadURL}
        feedback={feedback}
        trackId={track.id}
        onTimestampClick={handleTimestampClick}
        interactable={!isOwner}
      />

      {/* Reviewer hint */}
      {!isOwner && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'rgba(124, 106, 247, 0.08)',
          border: '1px solid rgba(124, 106, 247, 0.2)',
          borderRadius: 'var(--radius)',
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}>
          <strong style={{ color: 'var(--accent-violet)' }}>You're reviewing this track.</strong>{' '}
          Click anywhere on the waveform to pin feedback at that timestamp.
        </div>
      )}

      {/* Feedback list */}
      {!feedbackLoading && feedback.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Feedback
            <span style={{
              marginLeft: '10px',
              background: 'rgba(124, 106, 247, 0.15)',
              color: 'var(--accent-violet)',
              padding: '2px 10px',
              borderRadius: '99px',
              fontSize: '13px',
              fontWeight: 700,
            }}>
              {feedback.length}
            </span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {feedback.map((entry, i) => (
              <FeedbackCard key={entry.id} entry={entry} index={i} />
            ))}
          </div>
        </div>
      )}

      {!feedbackLoading && feedback.length === 0 && (
        <div style={{
          marginTop: '40px',
          textAlign: 'center',
          padding: '48px 20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--text-muted)',
          fontSize: '14px',
        }}>
          No feedback yet. {isOwner ? 'Share the link to start collecting.' : 'Be the first to leave a marker!'}
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'rgba(255, 80, 80, 0.08)',
          border: '1px solid rgba(255, 80, 80, 0.3)',
          borderRadius: 'var(--radius)',
          fontSize: '13px',
          color: '#ff5050',
        }}>
          {submitError}
        </div>
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
