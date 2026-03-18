import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserTracks, deleteTrack, updateTrackTitle } from '../firebase/firestore';
import { deleteAudio } from '../firebase/storage';
import type { Track } from '../types';
import { generateShareUrl } from '../utils/shareLink';
import { formatTime } from '../utils/formatTime';

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
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '60px' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Your Tracks</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{tracks.length} track{tracks.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <Link
          to="/upload"
          style={{
            background: 'var(--accent-violet)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          + Upload Track
        </Link>
      </div>

      {tracks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" style={{ margin: '0 auto 20px', display: 'block' }}>
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>No tracks yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            Upload your first track to start collecting feedback
          </div>
          <Link
            to="/upload"
            style={{
              background: 'var(--accent-violet)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Upload a Track
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tracks.map((track) => (
            <div
              key={track.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                opacity: deletingId === track.id ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <div style={{
                width: '40px', height: '40px',
                background: 'rgba(124, 106, 247, 0.1)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-violet)" strokeWidth="2">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === track.id ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(track.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      style={{ flex: 1, fontSize: '14px', padding: '4px 8px' }}
                    />
                    <button
                      onClick={() => saveEdit(track.id)}
                      style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--accent-violet)', color: '#fff', borderRadius: 'var(--radius)', fontWeight: 600 }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--bg-raised)', color: 'var(--text-muted)', borderRadius: 'var(--radius)' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    style={{ fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                    onDoubleClick={() => startEdit(track)}
                    title="Double-click to rename"
                  >
                    {track.title}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                  <span>{track.createdAt?.toDate().toLocaleDateString()}</span>
                  {track.duration && <span>{formatTime(track.duration)}</span>}
                </div>
              </div>

              <div style={{
                background: track.feedbackCount > 0 ? 'rgba(124, 106, 247, 0.15)' : 'var(--bg-raised)',
                color: track.feedbackCount > 0 ? 'var(--accent-violet)' : 'var(--text-muted)',
                padding: '4px 12px',
                borderRadius: '99px',
                fontSize: '12px',
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {track.feedbackCount} comment{track.feedbackCount !== 1 ? 's' : ''}
              </div>

              <button
                onClick={() => copyLink(track.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius)',
                  background: copied === track.id ? 'rgba(61, 214, 140, 0.15)' : 'var(--bg-raised)',
                  color: copied === track.id ? 'var(--accent-green)' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: `1px solid ${copied === track.id ? 'rgba(61, 214, 140, 0.3)' : 'var(--border)'}`,
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                {copied === track.id ? '✓ Copied' : 'Copy Link'}
              </button>

              <Link
                to={`/review/${track.id}`}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-raised)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  flexShrink: 0,
                }}
              >
                View →
              </Link>

              <button
                onClick={() => startEdit(track)}
                title="Rename"
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-raised)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  flexShrink: 0,
                  fontSize: '13px',
                }}
              >
                ✏️
              </button>

              <button
                onClick={() => handleDelete(track)}
                disabled={deletingId === track.id}
                title="Delete track"
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(247, 106, 106, 0.1)',
                  color: 'var(--accent-red)',
                  border: '1px solid rgba(247, 106, 106, 0.2)',
                  flexShrink: 0,
                  fontSize: '13px',
                }}
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
