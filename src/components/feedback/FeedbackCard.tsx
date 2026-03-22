import { useState, useEffect } from 'react';
import type { FeedbackEntry } from '../../types';
import { VERDICT_LABEL } from '../../types';
import { VolumeFader } from './VolumeFader';
import { formatTime } from '../../utils/formatTime';
import './FeedbackCard.css';

// Deterministic avatar color from name
const AVATAR_COLORS = [
  '#E07B54', '#7C8CF8', '#3DD68C', '#F472B6',
  '#60C9F8', '#FBBF24', '#A78BFA', '#34D399',
];
function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface FeedbackCardProps {
  entry: FeedbackEntry;
  index: number;
  isActive?: boolean;
  isOwner?: boolean;
  onMarkRead?: (id: string, read: boolean) => void;
  onSectionRead?: (id: string, section: 'volume' | 'frequencies', read: boolean) => void;
  onDelete?: (id: string) => void;
  onTimestampClick?: (seconds: number) => void;
  onSaveNotes?: (id: string, notes: { id: string; text: string; checked: boolean }[]) => void;
}

interface CardSectionProps {
  title?: string;
  checked?: boolean;
  onCheck?: (checked: boolean) => void;
  children: React.ReactNode;
}

const CardSection = ({ title, checked, onCheck, children }: CardSectionProps) => {
  const [open, setOpen] = useState(true);
  const [localChecked, setLocalChecked] = useState(!!checked);

  useEffect(() => { setLocalChecked(!!checked); }, [checked]);

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onCheck) return;
    const next = !localChecked;
    setLocalChecked(next);
    onCheck(next);
  };

  return (
    <div className={`card-section${localChecked ? ' card-section--checked' : ''}`}>
      <button
        className={`section-header${open ? '' : ' section-header--closed'}`}
        onClick={() => setOpen(o => !o)}
      >
        {title && <span className="section-title">{title}</span>}
        <div className="section-header-right">
          {onCheck && (
            <span
              className={`section-check${localChecked ? ' section-check--done' : ''}`}
              onClick={handleCheck}
              title={localChecked ? 'Mark as unreviewed' : 'Mark as reviewed'}
            >
              {localChecked ? '✓' : '○'}
            </span>
          )}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="section-chevron">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
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

export const FeedbackCard = ({
  entry, index, isActive, isOwner,
  onMarkRead, onSectionRead, onDelete, onTimestampClick, onSaveNotes,
}: FeedbackCardProps) => {
  const [collapsed, setCollapsed] = useState(true);
  const [isRead, setIsRead] = useState(!!entry.read);
  const [notes, setNotes] = useState(entry.ownerNotes ?? []);
  const [newNoteText, setNewNoteText] = useState('');
  const activeBands = entry.bands?.filter(b => b.verdict) ?? [];
  const reviewerName = entry.reviewerName || 'Anonymous';
  const initials = avatarInitials(reviewerName);
  const color = avatarColor(reviewerName);

  // Status: REVIEWED / IN PROGRESS / NEW
  const sectionsRead = entry.readSections?.volume || entry.readSections?.frequencies;
  const statusLabel = isRead ? 'REVIEWED' : sectionsRead ? 'IN PROGRESS' : 'NEW';
  const statusClass = isRead ? 'status-reviewed' : sectionsRead ? 'status-in-progress' : 'status-new';

  useEffect(() => { setIsRead(!!entry.read); }, [entry.read]);
  useEffect(() => { setNotes(entry.ownerNotes ?? []); }, [entry.ownerNotes]);

  const saveNotes = (updated: typeof notes) => {
    setNotes(updated);
    if (onSaveNotes && entry.id) onSaveNotes(entry.id, updated);
  };

  const handleAddNote = () => {
    const text = newNoteText.trim();
    if (!text) return;
    saveNotes([...notes, { id: crypto.randomUUID(), text, checked: false }]);
    setNewNoteText('');
  };

  const handleToggleNote = (id: string) => {
    saveNotes(notes.map(n => n.id === id ? { ...n, checked: !n.checked } : n));
  };

  const handleDeleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
  };

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onMarkRead || !entry.id) return;
    const next = !isRead;
    setIsRead(next);
    onMarkRead(entry.id, next);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete || !entry.id) return;
    if (!confirm('Remove this feedback?')) return;
    onDelete(entry.id);
  };

  const cardClass = [
    'feedback-card',
    isRead ? 'feedback-card--read' : '',
    collapsed ? 'feedback-card--collapsed' : '',
    isActive ? 'feedback-card--active' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass}>
      <div className="card-header" onClick={() => setCollapsed(c => !c)}>
        <span className="card-index">{String(index + 1).padStart(2, '0')}</span>
        <span className="card-sep" />

        <div className="card-avatar" style={{ background: color + '22', color }}>
          {initials}
        </div>

        <div className="card-reviewer">
          <div className="card-reviewer-name">
            {reviewerName}
            <span className={`card-status-badge ${statusClass}`}>{statusLabel}</span>
          </div>
          <div className="card-reviewer-meta">
            {entry.createdAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {entry.comment && (
              <span className="card-comment-preview"> · "{entry.comment.length > 48 ? entry.comment.slice(0, 48) + '…' : entry.comment}"</span>
            )}
          </div>
        </div>

        <button
          className={`card-timestamp${onTimestampClick ? ' card-timestamp--clickable' : ''}`}
          onClick={(e) => { e.stopPropagation(); onTimestampClick?.(entry.timestamp); }}
          title={onTimestampClick ? 'Play from this timestamp' : undefined}
          disabled={!onTimestampClick}
          data-help="Seek to this feedback's timestamp and play from there"
        >
          {onTimestampClick && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="timestamp-play-icon">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
          {formatTime(entry.timestamp)}
        </button>

        <div className="card-actions">
          {onMarkRead && entry.id && (
            <button
              className={`mark-read-btn${isRead ? ' mark-read-btn--read' : ''}`}
              onClick={(e) => handleMarkRead(e)}
              title={isRead ? 'Mark as unread' : 'Mark as read'}
              data-help="Toggle read/unread status for this feedback"
            >
              {isRead ? '✓' : '○'}
            </button>
          )}
          {onDelete && entry.id && (
            <button className="delete-feedback-btn" onClick={(e) => handleDelete(e)} title="Delete this feedback" data-help="Permanently delete this feedback entry">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
          <button
            className={`collapse-btn${collapsed ? ' collapse-btn--collapsed' : ''}`}
            onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }}
            title={collapsed ? 'Expand' : 'Collapse'}
            data-help="Collapse or expand the full feedback details"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      <div className="card-body-wrapper">
        <div className="card-body">
          <div className="card-body-content">
            {entry.comment && (
              <div className="card-comment">{entry.comment}</div>
            )}

            {entry.volumeDb !== 0 && (
              <CardSection
                title="Volume"
                checked={entry.readSections?.volume}
                onCheck={onSectionRead && entry.id
                  ? (v) => onSectionRead(entry.id!, 'volume', v)
                  : undefined}
              >
                <VolumeFader value={entry.volumeDb} readonly />
              </CardSection>
            )}

            {activeBands.length > 0 && (
              <CardSection
                title="Frequencies"
                checked={entry.readSections?.frequencies}
                onCheck={onSectionRead && entry.id
                  ? (v) => onSectionRead(entry.id!, 'frequencies', v)
                  : undefined}
              >
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

            {isOwner && (
              <div className="owner-note-section">
                <div className="owner-note-label">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Private notes
                </div>

                {notes.length > 0 && (
                  <ul className="owner-note-list">
                    {notes.map(n => (
                      <li key={n.id} className="owner-note-item">
                        <button
                          className={`owner-note-checkbox${n.checked ? ' owner-note-checkbox--checked' : ''}`}
                          onClick={() => handleToggleNote(n.id)}
                          title={n.checked ? 'Mark as undone' : 'Mark as done'}
                        >
                          {n.checked ? (
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <polyline points="2,6 5,9 10,3" />
                            </svg>
                          ) : null}
                        </button>
                        <span className={`owner-note-item-text${n.checked ? ' owner-note-item-text--checked' : ''}`}>
                          {n.text}
                        </span>
                        <button
                          className="owner-note-item-delete"
                          onClick={() => handleDeleteNote(n.id)}
                          title="Delete note"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="owner-note-input-row">
                  <input
                    className="owner-note-input"
                    type="text"
                    placeholder="Add a note…"
                    value={newNoteText}
                    onChange={e => setNewNoteText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNote(); } }}
                  />
                  <button
                    className="owner-note-input-add"
                    onClick={handleAddNote}
                    disabled={!newNoteText.trim()}
                    title="Add note"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
