import { useEffect, useRef, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js';
import type { FeedbackEntry } from '../types';
import { updateTrackDuration } from '../firebase/firestore';

interface UseWavesurferOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  audioUrl: string | null;
  feedback: FeedbackEntry[];
  trackId?: string;
  onTimestampClick: (seconds: number) => void;
  onReady?: () => void;
}

export const useWavesurfer = ({
  containerRef,
  timelineRef,
  audioUrl,
  feedback,
  trackId,
  onTimestampClick,
  onReady,
}: UseWavesurferOptions) => {
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const renderedIdsRef = useRef<Set<string>>(new Set());
  const isReadyRef = useRef(false);

  const addMarker = useCallback((entry: FeedbackEntry) => {
    if (!regionsRef.current || !entry.id) return;
    regionsRef.current.addRegion({
      id: entry.id,
      start: entry.timestamp,
      end: entry.timestamp + 0.5,
      color: 'rgba(245, 197, 24, 0.9)',
      drag: false,
      resize: false,
    });
    renderedIdsRef.current.add(entry.id);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !timelineRef.current || !audioUrl) return;

    const timeline = TimelinePlugin.create({
      container: timelineRef.current,
      style: { color: '#6b6b80', fontSize: '11px' },
    });

    const regions = RegionsPlugin.create();

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#3a3a4a',
      progressColor: '#7c6af7',
      cursorColor: '#f5c518',
      height: 100,
      normalize: true,
      interact: true,
      plugins: [timeline, regions],
    });

    wsRef.current = ws;
    regionsRef.current = regions;
    renderedIdsRef.current = new Set();
    isReadyRef.current = false;

    ws.load(audioUrl);

    ws.on('ready', () => {
      isReadyRef.current = true;
      if (trackId) {
        updateTrackDuration(trackId, ws.getDuration()).catch(() => {});
      }
      onReady?.();
    });

    ws.on('interaction', (newTime: number) => {
      // Only fire if not clicking on an existing region
      onTimestampClick(newTime);
    });

    return () => {
      ws.destroy();
      wsRef.current = null;
      regionsRef.current = null;
      isReadyRef.current = false;
    };
  }, [audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync markers when feedback changes
  useEffect(() => {
    if (!regionsRef.current || !isReadyRef.current) return;
    for (const entry of feedback) {
      if (entry.id && !renderedIdsRef.current.has(entry.id)) {
        addMarker(entry);
      }
    }
  }, [feedback, addMarker]);

  const play = () => wsRef.current?.playPause();
  const seekTo = (seconds: number) => {
    const ws = wsRef.current;
    if (!ws) return;
    const duration = ws.getDuration();
    if (duration > 0) ws.seekTo(seconds / duration);
  };

  return { play, seekTo, wsRef };
};
