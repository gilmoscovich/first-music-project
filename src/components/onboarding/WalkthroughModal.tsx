import { useState } from 'react';
import './WalkthroughModal.css';

const STEPS = [
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    title: "You're reviewing a track",
    body: "The artist shared this with you for feedback. Your comments go directly to them.",
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="7" width="20" height="10" rx="1" />
        <line x1="6" y1="9" x2="6" y2="15" />
        <line x1="9" y1="8" x2="9" y2="16" />
        <line x1="12" y1="9" x2="12" y2="15" />
        <line x1="15" y1="8" x2="15" y2="16" />
        <line x1="18" y1="9" x2="18" y2="15" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    title: "Click the waveform to mark a moment",
    body: "Tap anywhere on the waveform to drop a pin at that exact timestamp. A feedback form will appear.",
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    title: "Describe and pin your feedback",
    body: "Leave notes per instrument (kick, bass, synths…), optionally flag frequency bands, add general notes — then hit Pin Feedback.",
  },
];

interface WalkthroughModalProps {
  onDismiss: () => void;
}

export const WalkthroughModal = ({ onDismiss }: WalkthroughModalProps) => {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="walkthrough-overlay">
      <div className="walkthrough-modal">
        <div className="walkthrough-icon">{current.icon}</div>
        <div className="walkthrough-step-label">Step {step + 1} of {STEPS.length}</div>
        <h2 className="walkthrough-title">{current.title}</h2>
        <p className="walkthrough-body">{current.body}</p>
        <div className="walkthrough-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`walkthrough-dot${i === step ? ' walkthrough-dot--active' : ''}`} />
          ))}
        </div>
        <div className="walkthrough-actions">
          {step > 0 && (
            <button className="walkthrough-back-btn" onClick={() => setStep(s => s - 1)}>
              Back
            </button>
          )}
          <button className="walkthrough-next-btn" onClick={() => isLast ? onDismiss() : setStep(s => s + 1)}>
            {isLast ? 'Start Reviewing' : 'Next →'}
          </button>
        </div>
        <button className="walkthrough-skip" onClick={onDismiss}>Skip intro</button>
      </div>
    </div>
  );
};
