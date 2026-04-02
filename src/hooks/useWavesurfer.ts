import { useEffect, useRef, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js';
import type { FeedbackEntry } from '../types';
import { updateTrackDuration, updateTrackPeaks } from '../firebase/firestore';

interface UseWavesurferOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  audioUrl: string | null;
  feedback: FeedbackEntry[];
  trackId?: string;
  peaks?: number[][];
  duration?: number;
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
  peaks,
  duration,
  onReady,
  onMarkerHover,
  onMarkerClick,
}: UseWavesurferOptions) => {
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const renderedIdsRef = useRef<Set<string>>(new Set());
  const isReadyRef = useRef(false);
  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;
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
      color: 'rgba(6, 182, 212, 0.65)',
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

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: isDark ? '#4a4a54' : '#b0aeaa',
      progressColor: '#06b6d4',
      cursorColor: '#06b6d4',
      height: 120,
      barWidth: 2,
      barGap: 1,
      barRadius: 0,
      normalize: true,
      interact: true,
      plugins: [timeline, regions],
    });

    wsRef.current = ws;
    regionsRef.current = regions;
    renderedIdsRef.current = new Set();
    isReadyRef.current = false;

    if (peaks && peaks.length > 0) {
      ws.load(audioUrl, peaks, duration);
    } else {
      ws.load(audioUrl);
    }

    ws.on('ready', () => {
      isReadyRef.current = true;
      if (trackId) {
        updateTrackDuration(trackId, ws.getDuration()).catch(() => {});
        // Lazy migration: if no peaks were provided, export and save them now
        if (!peaks || peaks.length === 0) {
          const exported = ws.exportPeaks();
          if (exported && exported.length > 0) {
            updateTrackPeaks(trackId, exported).catch(() => {});
          }
        }
      }
      // Add any markers that arrived before the waveform was ready
      for (const entry of feedbackRef.current) {
        if (entry.id && !renderedIdsRef.current.has(entry.id)) {
          addMarker(entry);
        }
      }
      onReady?.();
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

  const flashMarkers = () => {
    const regions = regionsRef.current?.getRegions();
    if (!regions) return;
    regions.forEach(r => {
      if (!r.element) return;
      r.element.style.transition = 'background 0.15s';
      r.element.style.background = 'rgba(6, 182, 212, 0.95)';
    });
    setTimeout(() => {
      regions.forEach(r => {
        if (!r.element) return;
        r.element.style.background = 'rgba(6, 182, 212, 0.65)';
        setTimeout(() => { if (r.element) r.element.style.transition = ''; }, 400);
      });
    }, 600);
  };

  return { play, seekTo, wsRef, flashMarkers };
};
