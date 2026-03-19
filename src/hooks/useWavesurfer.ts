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
  onMarkerHover?: (id: string | null, x: number, y: number) => void;
  onMarkerClick?: (timestamp: number) => void;
}

export const useWavesurfer = ({
  containerRef,
  timelineRef,
  audioUrl,
  feedback,
  trackId,
  onTimestampClick,
  onReady,
  onMarkerHover,
  onMarkerClick,
}: UseWavesurferOptions) => {
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const renderedIdsRef = useRef<Set<string>>(new Set());
  const isReadyRef = useRef(false);
  const onMarkerHoverRef = useRef(onMarkerHover);
  onMarkerHoverRef.current = onMarkerHover;
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;
  const regionClickedRef = useRef(false);

  const addMarker = useCallback((entry: FeedbackEntry) => {
    if (!regionsRef.current || !entry.id) return;
    const region = regionsRef.current.addRegion({
      id: entry.id,
      start: entry.timestamp,
      end: entry.timestamp + 0.8,
      color: 'rgba(255, 140, 0, 0.4)',
      drag: false,
      resize: false,
    });
    const el = region.element;
    if (el) {
      el.style.cursor = 'pointer';
      el.addEventListener('mouseenter', (e: MouseEvent) => {
        onMarkerHoverRef.current?.(entry.id!, e.clientX, e.clientY);
      });
      el.addEventListener('mousemove', (e: MouseEvent) => {
        onMarkerHoverRef.current?.(entry.id!, e.clientX, e.clientY);
      });
      el.addEventListener('mouseleave', () => {
        onMarkerHoverRef.current?.(null, 0, 0);
      });
      el.addEventListener('click', () => {
        regionClickedRef.current = true;
        onMarkerClickRef.current?.(entry.timestamp);
        setTimeout(() => { regionClickedRef.current = false; }, 0);
      });
    }
    renderedIdsRef.current.add(entry.id);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !timelineRef.current || !audioUrl) return;

    const timeline = TimelinePlugin.create({
      container: timelineRef.current,
      style: { color: '#888888', fontSize: '11px' },
    });

    const regions = RegionsPlugin.create();

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#787878',
      progressColor: '#FF8C00',
      cursorColor: '#FF8C00',
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
      if (!regionClickedRef.current) onTimestampClick(newTime);
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
