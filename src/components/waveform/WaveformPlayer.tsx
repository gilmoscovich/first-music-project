import { useRef, useState } from 'react';
import type { FeedbackEntry } from '../../types';
import { useWavesurfer } from '../../hooks/useWavesurfer';
import { formatTime } from '../../utils/formatTime';

interface WaveformPlayerProps {
  audioUrl: string;
  feedback: FeedbackEntry[];
  trackId?: string;
  onTimestampClick: (seconds: number) => void;
  interactable?: boolean;
}

export const WaveformPlayer = ({
  audioUrl,
  feedback,
  trackId,
  onTimestampClick,
  interactable = true,
}: WaveformPlayerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const { wsRef } = useWavesurfer({
    containerRef,
    timelineRef,
    audioUrl,
    feedback,
    trackId,
    onTimestampClick: interactable ? onTimestampClick : () => {},
    onReady: () => {
      setIsReady(true);
      setDuration(wsRef.current?.getDuration() ?? 0);
    },
  });

  // Update current time
  const handlePlayPause = () => {
    const ws = wsRef.current;
    if (!ws) return;

    if (!isPlaying) {
      ws.play();
      setIsPlaying(true);
      const interval = setInterval(() => {
        if (!wsRef.current) { clearInterval(interval); return; }
        setCurrentTime(wsRef.current.getCurrentTime());
        if (!wsRef.current.isPlaying()) {
          setIsPlaying(false);
          clearInterval(interval);
        }
      }, 100);
    } else {
      ws.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
    }}>
      {interactable && (
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Click anywhere on the waveform to drop a feedback marker
        </div>
      )}

      <div style={{ position: 'relative' }}>
        {!isReady && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-surface)',
            color: 'var(--text-muted)', fontSize: '13px',
          }}>
            Loading waveform...
          </div>
        )}
        <div ref={containerRef} />
        <div ref={timelineRef} style={{ marginTop: '4px' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
        <button
          onClick={handlePlayPause}
          disabled={!isReady}
          style={{
            width: '40px', height: '40px',
            borderRadius: '50%',
            background: isReady ? 'var(--accent-violet)' : 'var(--bg-raised)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'monospace', minWidth: '90px' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {feedback.length > 0 && (
          <span style={{
            marginLeft: 'auto',
            background: 'rgba(124, 106, 247, 0.15)',
            color: 'var(--accent-violet)',
            padding: '3px 10px',
            borderRadius: '99px',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            {feedback.length} marker{feedback.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
};
