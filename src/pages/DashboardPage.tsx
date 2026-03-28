import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserTracks, deleteTrack, updateTrackTitle, getUserStorageUsed, updateTrackFileSize } from '../firebase/firestore';
import { deleteAudio, getFileMetadata } from '../firebase/storage';
import { StorageBar } from '../components/dashboard/StorageBar';
import type { Track } from '../types';
import { generateShareUrl } from '../utils/shareLink';
import { formatTime } from '../utils/formatTime';
import './DashboardPage.css';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [storageUsed, setStorageUsed] = useState(0);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); };
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserTracks(user.uid),
      getUserStorageUsed(user.uid).catch(() => 0),
    ]).then(
      async ([loadedTracks, usedBytes]) => {
        setTracks(loadedTracks);
        setStorageUsed(usedBytes);
        setLoading(false);

        // Backfill file sizes for tracks uploaded before this feature
        const missing = loadedTracks.filter((t) => !t.fileSize);
        if (missing.length === 0) return;
        let gained = 0;
        await Promise.all(
          missing.map(async (t) => {
            try {
              const size = await getFileMetadata(t.storagePath);
              await updateTrackFileSize(t.id, user.uid, size);
              gained += size;
              setTracks((prev) => prev.map((p) => p.id === t.id ? { ...p, fileSize: size } : p));
            } catch {
              // Storage file may be inaccessible — skip silently
            }
          })
        );
        if (gained > 0) setStorageUsed((prev) => prev + gained);
      }
    ).catch(() => setLoading(false));
  }, [user]);

  const copyLink = async (trackId: string) => {
    const url = generateShareUrl(trackId);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for non-secure contexts (e.g. local network IP during dev)
      const el = document.createElement('textarea');
      el.value = url;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(trackId);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (track: Track) => {
    if (!confirm(`Delete "${track.title}"? This will remove all feedback too.`)) return;
    setDeletingId(track.id);
    try {
      await deleteAudio(track.storagePath);
      await deleteTrack(track.id, user?.uid, track.fileSize);
      setTracks((prev) => prev.filter((t) => t.id !== track.id));
      if (track.fileSize) setStorageUsed((prev) => Math.max(0, prev - track.fileSize!));
    } catch (err) {
      console.error('Failed to delete track:', err);
      alert('Failed to delete track. Check the console for details.');
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (track: Track) => {
    setEditingId(track.id);
    setEditTitle(track.title);
  };

  const saveEdit = async (trackId: string) => {
    if (!editTitle.trim()) return;
    await updateTrackTitle(trackId, editTitle.trim());
    setTracks((prev) => prev.map((t) => t.id === trackId ? { ...t, title: editTitle.trim() } : t));
    setEditingId(null);
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Your Tracks</h1>
          <p className="dashboard-subtitle">{tracks.length} track{tracks.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <Link to="/upload" className="dashboard-upload-link">
          + Upload Track
        </Link>
      </div>

      <StorageBar usedBytes={storageUsed} />

      {tracks.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" className="empty-state-icon">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <div className="empty-state-title">No tracks yet</div>
          <div className="empty-state-desc">
            Upload your first track to start collecting feedback
          </div>
          <Link to="/upload" className="empty-state-link">
            Upload a Track
          </Link>
        </div>
      ) : (
        <div className="tracks-list">
          {tracks.map((track) => (
            <div
              key={track.id}
              className={`track-item${deletingId === track.id ? ' track-item--deleting' : ''}`}
            >
              <div className="track-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent-violet)" strokeWidth="2">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>

              <div className="track-info">
                {editingId === track.id ? (
                  <div className="track-edit-row">
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(track.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="track-edit-input"
                    />
                    <button onClick={() => saveEdit(track.id)} className="track-edit-save">
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="track-edit-cancel">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <Link
                    to={`/review/${track.id}`}
                    className="track-name"
                    onDoubleClick={(e) => { e.preventDefault(); startEdit(track); }}
                    title="Click to open · Double-click to rename"
                  >
                    {track.title}
                  </Link>
                )}
                <div className="track-meta">
                  <span>{track.createdAt?.toDate().toLocaleDateString()}</span>
                  {track.duration && <span>{formatTime(track.duration)}</span>}
                  {track.fileSize && (
                    <span className="track-filesize">
                      {(track.fileSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`feedback-badge${track.feedbackCount > 0 ? ' feedback-badge--active' : ''}`}
                data-help="Total number of feedback markers left on this track"
              >
                {track.feedbackCount} comment{track.feedbackCount !== 1 ? 's' : ''}
              </div>

              {(track.unreadCount ?? 0) > 0 && (
                <span className="unread-badge" data-help="New feedback received since your last visit">{track.unreadCount} new</span>
              )}

              <button
                onClick={() => copyLink(track.id)}
                className={`track-copy-btn${copied === track.id ? ' track-copy-btn--copied' : ''}`}
                data-help="Copy the review link to send to collaborators"
              >
                {copied === track.id ? '✓ Copied' : 'Copy Link'}
              </button>

              <Link to={`/review/${track.id}`} className="track-view-link" data-help="Open the review page for this track">
                View →
              </Link>

              <button
                onClick={() => startEdit(track)}
                title="Rename"
                className="track-rename-btn"
                data-help="Rename this track"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>

              <button
                onClick={() => handleDelete(track)}
                disabled={deletingId === track.id}
                title="Delete track"
                className="track-delete-btn"
                data-help="Permanently delete this track and all its feedback"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
