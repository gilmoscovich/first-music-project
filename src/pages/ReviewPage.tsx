import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTrack } from '../hooks/useTrack';
import { useFeedback } from '../hooks/useFeedback';
import { useAuth } from '../hooks/useAuth';
import { addFeedback, markFeedbackRead, markFeedbackSectionRead, deleteFeedback } from '../firebase/firestore';
import { WaveformPlayer } from '../components/waveform/WaveformPlayer';
import type { WaveformPlayerHandle } from '../components/waveform/WaveformPlayer';
import { FeedbackPopup } from '../components/feedback/FeedbackPopup';
import { FeedbackCard } from '../components/feedback/FeedbackCard';
import { WalkthroughModal } from '../components/onboarding/WalkthroughModal';
import { SettingsDrawer } from '../components/review/SettingsDrawer';
import { useFeedbackFilter } from '../hooks/useFeedbackFilter';
import type { SortMode } from '../hooks/useFeedbackFilter';
import { generateShareUrl } from '../utils/shareLink';
import { formatTime } from '../utils/formatTime';
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
  const [playbackTime, setPlaybackTime] = useState(0);
  const playerRef = useRef<WaveformPlayerHandle>(null);

  // Settings drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [localTitle, setLocalTitle] = useState<string | null>(null);

  // Filter + sort
  const { filter, setFilter, sort, setSort, filtered: displayedFeedback } = useFeedbackFilter(feedback);

  // Onboarding pulse + walkthrough (reviewer only, one-time)
  const [showPulse, setShowPulse] = useState(
    () => !localStorage.getItem('fs-onboarded')
  );
  const [showWalkthrough, setShowWalkthrough] = useState(
    () => !localStorage.getItem('fs-onboarded')
  );

  const handleWalkthroughDismiss = () => {
    localStorage.setItem('fs-onboarded', '1');
    setShowWalkthrough(false);
    setShowPulse(false);
  };

  const isOwner = !!(user && track && user.uid === track.ownerId);
  const displayTitle = localTitle ?? track?.title ?? '';

  // Spacebar play/pause
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as Element).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        playerRef.current?.playPause();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleTimestampClick = (seconds: number) => {
    setPendingTimestamp(seconds);
    if (!isOwner && showPulse) {
      localStorage.setItem('fs-onboarded', '1');
      setShowPulse(false);
    }
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

  const handleSectionRead = (feedbackId: string, section: 'volume' | 'frequencies', read: boolean) => {
    if (!trackId) return;
    markFeedbackSectionRead(trackId, feedbackId, section, read);
  };

  const handleDeleteFeedback = (feedbackId: string) => {
    if (!trackId) return;
    deleteFeedback(trackId, feedbackId);
  };

  const copyShareLink = async () => {
    if (!trackId) return;
    await navigator.clipboard.writeText(generateShareUrl(trackId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Derived feedback
  const activeFeedbackId = feedback.filter(f => f.timestamp <= playbackTime).at(-1)?.id ?? null;

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
          <h1 className="track-header-title">{displayTitle}</h1>
          <div className="track-header-meta">
            <span>{track.feedbackCount} marker{track.feedbackCount !== 1 ? 's' : ''}</span>
            <span>Uploaded {track.createdAt?.toDate().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="track-header-actions">
          {isOwner && (
            <>
              <button
                onClick={copyShareLink}
                className={`share-btn${copied ? ' share-btn--copied' : ''}`}
                data-help="Copy the review link to share with collaborators"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
                {copied ? 'Copied!' : 'Share Link'}
              </button>
              <button className="settings-trigger-btn" onClick={() => setDrawerOpen(true)} title="Track settings" data-help="Track settings — rename or delete this track">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Waveform */}
      <WaveformPlayer
        ref={playerRef}
        audioUrl={track.downloadURL}
        feedback={feedback}
        trackId={track.id}
        onTimestampClick={handleTimestampClick}
        onTimeUpdate={setPlaybackTime}
        interactable={!isOwner}
        showPulse={!isOwner && showPulse}
      />

      {/* Spacebar hint */}
      <div className="keyboard-hint">
        <kbd>Space</kbd> to play / pause
      </div>

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
          <div className="feedback-heading-row">
            <h2 className="feedback-heading">
              Feedback
              <span className="feedback-count-badge">{feedback.length}</span>
            </h2>

            <div className="feedback-controls">
              <div className="filter-tabs" data-help="Filter feedback: show All entries or only Unread ones">
                <button
                  className={`filter-tab${filter === 'all' ? ' filter-tab--active' : ''}`}
                  onClick={() => setFilter('all')}
                >All</button>
                <button
                  className={`filter-tab${filter === 'unread' ? ' filter-tab--active' : ''}`}
                  onClick={() => setFilter('unread')}
                >Unread</button>
              </div>

              <select
                className="sort-select"
                value={sort}
                onChange={e => setSort(e.target.value as SortMode)}
                data-help="Sort feedback by timestamp position, star rating, or newest first"
              >
                <option value="timestamp">By Timestamp</option>
                <option value="rating">By Rating</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          <div className="feedback-list">
            {displayedFeedback.length === 0 ? (
              <div className="empty-filtered">No unread feedback.</div>
            ) : (
              displayedFeedback.map((entry, i) => (
                <FeedbackCard
                  key={entry.id}
                  entry={entry}
                  index={i}
                  isActive={entry.id === activeFeedbackId && playbackTime > 0}
                  onMarkRead={isOwner ? handleMarkRead : undefined}
                  onSectionRead={isOwner ? handleSectionRead : undefined}
                  onDelete={isOwner ? handleDeleteFeedback : undefined}
                  onTimestampClick={(s) => playerRef.current?.seekTo(s)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {!feedbackLoading && feedback.length === 0 && (
        <div className="empty-feedback">
          No feedback yet. {isOwner ? 'Share the link to start collecting.' : 'Be the first to leave a marker!'}
        </div>
      )}

      {submitError && (
        <div className="submit-error">{submitError}</div>
      )}

      {!isOwner && (
        <div className="reviewer-bottom-bar">
          <button
            className="reviewer-bottom-input"
            onClick={() => handleTimestampClick(playbackTime)}
            data-help="Click to add feedback at the current playback position"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add feedback at {formatTime(playbackTime)}...
          </button>
          <button
            className="reviewer-bottom-submit"
            onClick={() => handleTimestampClick(playbackTime)}
          >
            Submit
          </button>
        </div>
      )}

      {!isOwner && showWalkthrough && (
        <WalkthroughModal onDismiss={handleWalkthroughDismiss} />
      )}

      {pendingTimestamp !== null && (
        <FeedbackPopup
          timestamp={pendingTimestamp}
          onSubmit={handleFeedbackSubmit}
          onCancel={() => setPendingTimestamp(null)}
        />
      )}

      {isOwner && (
        <SettingsDrawer
          track={track}
          displayTitle={displayTitle}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onTitleChange={setLocalTitle}
        />
      )}
    </div>
  );
};
