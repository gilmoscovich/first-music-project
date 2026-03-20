import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { FeedbackEntry } from '../../types';
import { VERDICT_LABEL } from '../../types';
import { useWavesurfer } from '../../hooks/useWavesurfer';
import { formatTime } from '../../utils/formatTime';
import './WaveformPlayer.css';

interface WaveformPlayerProps {
  audioUrl: string;
  feedback: FeedbackEntry[];
  trackId?: string;
  onTimestampClick: (seconds: number) => void;
  onTimeUpdate?: (seconds: number) => void;
  interactable?: boolean;
  showPulse?: boolean;
}

export interface WaveformPlayerHandle {
  seekTo: (seconds: number) => void;
  playPause: () => void;
}

export const WaveformPlayer = forwardRef<WaveformPlayerHandle, WaveformPlayerProps>(
  ({ audioUrl, feedback, trackId, onTimestampClick, onTimeUpdate, interactable = true, showPulse = false }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const timelineRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<HTMLDivElement | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });

    const handleMarkerHover = useCallback((id: string | null, clientX: number, clientY: number) => {
      if (!id) { setHoveredId(null); return; }
      const rect = playerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setHoveredId(id);
      setTooltipPos({
        left: Math.max(8, Math.min(clientX - rect.left, rect.width - 272)),
        top: clientY - rect.top + 16,
      });
    }, []);

    const { wsRef, seekTo, flashMarkers } = useWavesurfer({
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
      onMarkerHover: handleMarkerHover,
      onMarkerClick: (timestamp: number) => {
        seekTo(timestamp);
        const ws = wsRef.current;
        if (!ws) return;
        if (!ws.isPlaying()) {
          ws.play();
          setIsPlaying(true);
          startTimeTracking();
        }
      },
    });

    const startTimeTracking = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (!wsRef.current) { clearInterval(intervalRef.current!); intervalRef.current = null; return; }
        const t = wsRef.current.getCurrentTime();
        setCurrentTime(t);
        onTimeUpdate?.(t);
        if (!wsRef.current.isPlaying()) {
          setIsPlaying(false);
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
        }
      }, 100);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        seekTo(seconds);
        if (wsRef.current && !wsRef.current.isPlaying()) {
          wsRef.current.play();
          setIsPlaying(true);
          startTimeTracking();
        }
      },
      playPause: handlePlayPause,
    }));

    const handlePlayPause = () => {
      const ws = wsRef.current;
      if (!ws) return;
      if (!isPlaying) {
        ws.play();
        setIsPlaying(true);
        startTimeTracking();
      } else {
        ws.pause();
        setIsPlaying(false);
      }
    };

    const hoveredEntry = hoveredId ? feedback.find(f => f.id === hoveredId) ?? null : null;
    const verdictsWithBands = hoveredEntry?.bands.filter(b => b.verdict && b.verdict !== null) ?? [];

    return (
      <div className="waveform-player" ref={playerRef}>
        {interactable && (
          <div className="waveform-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Click anywhere on the waveform to drop a feedback marker
          </div>
        )}

        <div className={`waveform-container${showPulse ? ' waveform-container--pulse' : ''}`}>
          {!isReady && (
            <div className="waveform-loading">Loading waveform...</div>
          )}
          <div ref={containerRef} />
          <div ref={timelineRef} className="waveform-timeline" />
        </div>

        <div className="waveform-controls">
          <button
            onClick={handlePlayPause}
            disabled={!isReady}
            className={`play-btn${isReady ? ' play-btn--ready' : ''}`}
            data-help="Play or pause the track — you can also press Space"
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="play-btn-icon">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="play-btn-icon">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          <div className="waveform-time-group">
            <span className="waveform-time-current">{formatTime(currentTime)}</span>
            <span className="waveform-time-duration">/ {formatTime(duration)}</span>
            <span className="waveform-time-hint">Space to play / pause</span>
          </div>

          {interactable && isReady && (
            <button
              className="pin-feedback-btn"
              onClick={() => onTimestampClick(currentTime)}
              data-help="Pin feedback at the current playback position"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="17" x2="12" y2="22" />
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
              </svg>
              Pin Feedback Here
            </button>
          )}

          {feedback.length > 0 && (
            <button className="waveform-markers-badge" onClick={flashMarkers} data-help="Number of feedback markers — click to highlight them on the waveform">
              {feedback.length} marker{feedback.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>

        {hoveredEntry && (
          <div className="marker-tooltip" style={{ left: tooltipPos.left, top: tooltipPos.top }}>
            <div className="tooltip-header">
              <span className="tooltip-name">{hoveredEntry.reviewerName}</span>
              <span className="tooltip-time">{formatTime(hoveredEntry.timestamp)}</span>
            </div>
            <div className="tooltip-stars">
              {'★'.repeat(hoveredEntry.rating)}{'☆'.repeat(5 - hoveredEntry.rating)}
            </div>
            {hoveredEntry.comment && (
              <div className="tooltip-comment">
                {hoveredEntry.comment.length > 100
                  ? hoveredEntry.comment.slice(0, 100) + '…'
                  : hoveredEntry.comment}
              </div>
            )}
            {hoveredEntry.volumeDb !== 0 && (
              <div className="tooltip-volume">
                Volume: {hoveredEntry.volumeDb > 0 ? '+' : ''}{hoveredEntry.volumeDb} dB
              </div>
            )}
            {verdictsWithBands.length > 0 && (
              <div className="tooltip-pills">
                {verdictsWithBands.map(b => (
                  <span key={b.id} className={`tooltip-pill tooltip-pill--${b.verdict}`}>
                    {b.label}: {VERDICT_LABEL[b.verdict!]}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);
