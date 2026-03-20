import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Track } from '../../types';
import { updateTrackTitle, deleteTrack } from '../../firebase/firestore';
import { deleteAudio } from '../../firebase/storage';
import { generateShareUrl } from '../../utils/shareLink';
import './SettingsDrawer.css';

interface SettingsDrawerProps {
  track: Track;
  displayTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onTitleChange: (newTitle: string) => void;
}

export const SettingsDrawer = ({ track, displayTitle, isOpen, onClose, onTitleChange }: SettingsDrawerProps) => {
  const navigate = useNavigate();
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditTitle(displayTitle);
      setEditingTitle(false);
    }
  }, [isOpen, displayTitle]);

  const handleRenameTrack = async () => {
    if (!editTitle.trim()) return;
    await updateTrackTitle(track.id, editTitle.trim());
    onTitleChange(editTitle.trim());
    setEditingTitle(false);
  };

  const handleDeleteTrack = async () => {
    if (!confirm(`Delete "${displayTitle}"? This will remove all feedback too.`)) return;
    await deleteAudio(track.storagePath);
    await deleteTrack(track.id);
    navigate('/');
  };

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(generateShareUrl(track.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {isOpen && (
        <div className="drawer-overlay" onClick={onClose} />
      )}
      <div className={`settings-drawer${isOpen ? ' settings-drawer--open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Track Settings</span>
          <button className="drawer-close" onClick={onClose}>
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
    </>
  );
};
