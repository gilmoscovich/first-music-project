import { useState } from 'react';
import { DEFAULT_BANDS, DEFAULT_INSTRUMENTS } from '../../types';
import type { FrequencyBand, InstrumentGroup, FeedbackEntry } from '../../types';
import { FrequencyPanel } from './FrequencyPanel';
import { formatTime } from '../../utils/formatTime';
import './FeedbackPopup.css';

interface FeedbackPopupProps {
  timestamp: number;
  onSubmit: (entry: Omit<FeedbackEntry, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}

const STORAGE_KEY = 'fs-reviewer-name';

export const FeedbackPopup = ({ timestamp, onSubmit, onCancel }: FeedbackPopupProps) => {
  const [reviewerName, setReviewerName] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '');
  const [comment, setComment] = useState('');
  const [instruments, setInstruments] = useState<InstrumentGroup[]>(DEFAULT_INSTRUMENTS.map(g => ({ ...g })));
  const [bands, setBands] = useState<FrequencyBand[]>(DEFAULT_BANDS.map(b => ({ ...b })));
  const [freqExpanded, setFreqExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState(false);

  const savedName = localStorage.getItem(STORAGE_KEY) ?? '';

  const handleSubmit = async () => {
    if (!reviewerName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setSubmitting(true);
    try {
      await onSubmit({ timestamp, reviewerName: reviewerName.trim(), comment, instruments, bands });
      localStorage.setItem(STORAGE_KEY, reviewerName.trim());
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgetName = () => {
    localStorage.removeItem(STORAGE_KEY);
    setReviewerName('');
    setNameError(false);
  };

  const updateInstrument = (id: string, notes: string) => {
    setInstruments(prev => prev.map(g => g.id === id ? { ...g, notes } : g));
  };

  return (
    <div className="popup-overlay">
      <div className="popup-modal">
        <div className="popup-header">
          <div>
            <div className="popup-title">Add Feedback</div>
            <div className="popup-time">@ {formatTime(timestamp)}</div>
          </div>
          <button onClick={onCancel} className="popup-close">×</button>
        </div>

        <div className="popup-body">
          <div>
            <div className="popup-label-row">
              <label className="popup-label">Your name</label>
              {savedName && (
                <button className="popup-not-you" onClick={handleForgetName} type="button">
                  Not you?
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="Enter your name"
              value={reviewerName}
              onChange={(e) => { setReviewerName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
              style={{ width: '100%' }}
              required
            />
            {nameError && <p className="popup-name-error">Please enter your name</p>}
          </div>

          <div className="instruments-section">
            <label className="popup-label">Instruments</label>
            <div className="instrument-rows">
              {instruments.map(group => (
                <div key={group.id} className="instrument-row">
                  <span className="instrument-label">{group.label}</span>
                  <input
                    type="text"
                    className="instrument-input"
                    placeholder="Notes…"
                    value={group.notes}
                    onChange={(e) => updateInstrument(group.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="freq-collapsible">
            <button
              className={`freq-toggle${freqExpanded ? ' freq-toggle--open' : ''}`}
              onClick={() => setFreqExpanded(v => !v)}
              type="button"
            >
              <span className="freq-toggle-label">Frequency Detail</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="freq-toggle-chevron">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {freqExpanded && (
              <div className="freq-collapsible-body">
                <FrequencyPanel bands={bands} onChange={setBands} />
              </div>
            )}
          </div>

          <div>
            <label className="popup-label">General notes</label>
            <textarea
              placeholder="What are you hearing at this moment?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="popup-footer">
          <button onClick={onCancel} className="popup-cancel-btn">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`popup-submit-btn${submitting ? ' popup-submit-btn--disabled' : ''}`}
          >
            {submitting ? 'Saving...' : 'Pin Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};
