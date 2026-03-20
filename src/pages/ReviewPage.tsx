import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrack } from '../hooks/useTrack';
import { useFeedback } from '../hooks/useFeedback';
import { useAuth } from '../hooks/useAuth';
import {
  addFeedback, markFeedbackRead, markFeedbackSectionRead,
  deleteFeedback, updateTrackTitle, deleteTrack,
} from '../firebase/firestore';
import { deleteAudio } from '../firebase/storage';
import { WaveformPlayer } from '../components/waveform/WaveformPlayer';
import type { WaveformPlayerHandle } from '../components/waveform/WaveformPlayer';
import { FeedbackPopup } from '../components/feedback/FeedbackPopup';
import { FeedbackCard } from '../components/feedback/FeedbackCard';
import { WalkthroughModal } from '../components/onboarding/WalkthroughModal';
import { generateShareUrl } from '../utils/shareLink';
import { formatTime } from '../utils/formatTime';
import { logError } from '../utils/errorHandler';
import type { FeedbackEntry } from '../types';
import './ReviewPage.css';

type FilterMode = 'all' | 'unread';
type SortMode = 'timestamp' | 'rating' | 'newest';

export const ReviewPage = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const navigate = useNavigate();
  const { track, loading: trackLoading } = useTrack(trackId);
  const { feedback, loading: feedbackLoading } = useFeedback(trackId);
  const { user } = useAuth();

  const [pendingTimestamp, setPendingTimestamp] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const playerRef = useRef<WaveformPlayerHandle>(null);

  // Settings drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [localTitle, setLocalTitle] = useState<string | null>(null);

  // Filter + sort
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortMode>('timestamp');

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

  // Track settings
  const handleRenameTrack = async () => {
    if (!trackId || !editTitle.trim()) return;
    await updateTrackTitle(trackId, editTitle.trim());
    setLocalTitle(editTitle.trim());
    setEditingTitle(false);
  };

  const handleDeleteTrack = async () => {
    if (!track || !confirm(`Delete "${displayTitle}"? This will remove all feedback too.`)) return;
    await deleteAudio(track.storagePath);
    await deleteTrack(trackId!);
    navigate('/');
  };

  const openDrawer = () => {
    setEditTitle(displayTitle);
    setEditingTitle(false);
    setDrawerOpen(true);
  };

  // Derived feedback
  const activeFeedbackId = feedback.filter(f => f.timestamp <= playbackTime).at(-1)?.id ?? null;
  const displayedFeedback = feedback
    .filter(f => filter === 'all' || !f.read)
    .sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'newest') return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
      return a.timestamp - b.timestamp;
    });

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
              <button className="settings-trigger-btn" onClick={openDrawer} title="Track settings" data-help="Track settings — rename or delete this track">
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

      {/* Settings drawer */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
      )}
      <div className={`settings-drawer${drawerOpen ? ' settings-drawer--open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Track Settings</span>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-section">
            <div className="drawer-label">Track title</div>
            {editingTitle ? (
              <div className="drawer-edit-row">
                <input
                  autoFocus
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRenameTrack();
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                  className="drawer-input"
                />
                <button onClick={handleRenameTrack} className="drawer-save-btn">Save</button>
                <button onClick={() => setEditingTitle(false)} className="drawer-cancel-btn">Cancel</button>
              </div>
            ) : (
              <div className="drawer-title-row">
                <span className="drawer-track-title">{displayTitle}</span>
                <button onClick={() => setEditingTitle(true)} className="drawer-edit-btn">Edit</button>
              </div>
            )}
          </div>

          <div className="drawer-divider" />

          <button
            onClick={copyShareLink}
            className={`drawer-action-btn${copied ? ' drawer-action-btn--success' : ''}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            {copied ? 'Link copied!' : 'Copy share link'}
          </button>

          <div className="drawer-divider" />

          <button onClick={handleDeleteTrack} className="drawer-delete-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            Delete track
          </button>
        </div>
      </div>
    </div>
  );
};
