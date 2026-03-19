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
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: "Rate, describe, submit",
    body: "Give a star rating, flag volume or frequency issues, add notes — then hit Submit.",
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
