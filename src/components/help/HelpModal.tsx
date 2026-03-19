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
            <li>Click anywhere on the waveform to drop a pin at that exact timestamp</li>
            <li>Fill in a star rating, volume adjustment, and frequency band verdicts</li>
            <li>Add notes in the comment field, then hit <strong>Submit</strong></li>
            <li>Your feedback is saved instantly and goes directly to the artist</li>
          </ul>
        </div>

        <div className="help-divider" />

        <div className="help-section">
          <div className="help-section-title">Reviewing &amp; Managing (track owners)</div>
          <ul className="help-list">
            <li>Hover over orange waveform markers to preview feedback — click to play from that point</li>
            <li><strong>Filter:</strong> All / Unread — toggle to show only unread feedback</li>
            <li><strong>Sort:</strong> by Timestamp position, Star Rating, or Newest first</li>
            <li><strong>⚙ Settings</strong> — rename or delete the track</li>
            <li><strong>Share Link</strong> — copy the review URL to send to collaborators</li>
            <li>Unread badge on the Dashboard shows new feedback since your last visit</li>
          </ul>
        </div>

        <div className="help-divider" />

        <div className="help-section">
          <div className="help-section-title">General</div>
          <ul className="help-list">
            <li>Profile avatar → account menu (My Tracks, theme settings, sign out)</li>
            <li>Theme toggle: Light / Dark / System — inside the profile menu</li>
            <li><strong>+ Upload</strong> — add a new track from any page</li>
            <li><kbd>Space</kbd> — play / pause the waveform player at any time</li>
            <li>The <strong>◎</strong> button in the header enables hover hints — hover any control to learn what it does</li>
          </ul>
        </div>
      </div>

      <div className="help-modal-footer">
        <button className="help-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);
