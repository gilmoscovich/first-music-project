import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserTracks, deleteTrack, updateTrackTitle } from '../firebase/firestore';
import { deleteAudio } from '../firebase/storage';
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

  useEffect(() => {
    if (!user) return;
    getUserTracks(user.uid)
      .then(setTracks)
      .finally(() => setLoading(false));
  }, [user]);

  const copyLink = async (trackId: string) => {
    await navigator.clipboard.writeText(generateShareUrl(trackId));
    setCopied(trackId);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (track: Track) => {
    if (!confirm(`Delete "${track.title}"? This will remove all feedback too.`)) return;
    setDeletingId(track.id);
    try {
      await deleteAudio(track.storagePath);
      await deleteTrack(track.id);
      setTracks((prev) => prev.filter((t) => t.id !== track.id));
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-violet)" strokeWidth="2">
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
                  <div
                    className="track-name"
                    onDoubleClick={() => startEdit(track)}
                    title="Double-click to rename"
                  >
                    {track.title}
                  </div>
                )}
                <div className="track-meta">
                  <span>{track.createdAt?.toDate().toLocaleDateString()}</span>
                  {track.duration && <span>{formatTime(track.duration)}</span>}
                </div>
              </div>

              <div className={`feedback-badge${track.feedbackCount > 0 ? ' feedback-badge--active' : ''}`}>
                {track.feedbackCount} comment{track.feedbackCount !== 1 ? 's' : ''}
              </div>

              <button
                onClick={() => copyLink(track.id)}
                className={`track-copy-btn${copied === track.id ? ' track-copy-btn--copied' : ''}`}
              >
                {copied === track.id ? '✓ Copied' : 'Copy Link'}
              </button>

              <Link to={`/review/${track.id}`} className="track-view-link">
                View →
              </Link>

              <button
                onClick={() => startEdit(track)}
                title="Rename"
                className="track-rename-btn"
              >
                ✏️
              </button>

              <button
                onClick={() => handleDelete(track)}
                disabled={deletingId === track.id}
                title="Delete track"
                className="track-delete-btn"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
