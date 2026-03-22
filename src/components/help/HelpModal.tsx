import './HelpModal.css';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal = ({ onClose }: HelpModalProps) => (
  <div className="help-overlay" onClick={onClose}>
    <div className="help-modal" onClick={e => e.stopPropagation()}>
      <div className="help-modal-header">
        <span className="help-modal-title">Help &amp; Reference</span>
        <button className="help-modal-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="help-modal-body">
        <div className="help-section">
          <div className="help-section-title">Leaving Feedback</div>
          <ul className="help-list">
            <li>Press play and listen to the track</li>
            <li>When you want to leave a note, hit the <strong>+</strong> button in the player controls — it pins feedback at your current playback position</li>
            <li>Fill in a volume adjustment and frequency band verdicts</li>
            <li>Add a comment in the notes field, then hit <strong>Pin Feedback</strong></li>
            <li>Your feedback is saved instantly and goes directly to the artist</li>
          </ul>
        </div>

        <div className="help-divider" />

        <div className="help-section">
          <div className="help-section-title">Reviewing &amp; Managing (track owners)</div>
          <ul className="help-list">
            <li>Hover over orange waveform markers to preview feedback</li>
            <li>Click a marker to seek to that position and play from there</li>
            <li><strong>Filter:</strong> All / Unread — toggle to show only unread feedback</li>
            <li><strong>Sort:</strong> by Timestamp position or Newest first</li>
            <li><strong>⚙ Settings</strong> — rename or delete the track</li>
            <li><strong>Share Link</strong> — copy the review URL to send to collaborators</li>
            <li>The unread badge on My Tracks shows new feedback since your last visit</li>
          </ul>
        </div>

        <div className="help-divider" />

        <div className="help-section">
          <div className="help-section-title">General</div>
          <ul className="help-list">
            <li>The <strong>+</strong> button in the player controls pins feedback at the current timestamp</li>
            <li><kbd>Space</kbd> — play / pause the waveform at any time</li>
            <li>Theme: Light / Dark / System — toggle in the top-right corner of every page</li>
            <li>The <strong>Hints</strong> button in the sidebar enables hover hints — hover any control to see what it does</li>
          </ul>
        </div>
      </div>

      <div className="help-modal-footer">
        <button className="help-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);
