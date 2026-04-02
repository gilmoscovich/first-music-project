# Waveform Peaks Pre-computation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-compute waveform peaks during audio upload and store them in Firestore so the waveform renders instantly on the review page instead of downloading and decoding the full audio file.

**Architecture:** `extractPeaks(file)` runs client-side in parallel with the file upload using `AudioContext.decodeAudioData`. Peaks are stored on the Track Firestore document. `useWavesurfer` passes them to `ws.load(url, peaks, duration)` when available, skipping decode entirely. Old tracks without peaks are lazily migrated: after the slow first decode, `ws.exportPeaks()` is saved to Firestore so every subsequent visit is instant.

**Tech Stack:** Web Audio API (`AudioContext`, `decodeAudioData`), WaveSurfer.js v7 (`ws.load(url, peaks, duration)`, `ws.exportPeaks()`), Firebase Firestore, React, TypeScript.

---

### Task 1: Add `peaks` to the Track type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `peaks` field to Track interface**

In `src/types/index.ts`, add `peaks?: number[][]` to the Track interface:

```typescript
export interface Track {
  id: string;
  ownerId: string;
  title: string;
  fileName: string;
  storagePath: string;
  downloadURL: string;
  duration?: number;
  fileSize?: number;
  peaks?: number[][];   // ← add this line
  feedbackCount: number;
  unreadCount?: number;
  createdAt: Timestamp;
}
```

- [ ] **Step 2: Verify build is still clean**

```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ built` with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add peaks field to Track type"
```

---

### Task 2: Create `extractPeaks` utility

**Files:**
- Create: `src/utils/extractPeaks.ts`

- [ ] **Step 1: Create the utility**

Create `src/utils/extractPeaks.ts` with this exact content:

```typescript
const SAMPLE_COUNT = 1000;

/**
 * Decodes an audio File using the Web Audio API and returns
 * downsampled peak amplitude data — one number[] per channel.
 * Each value is in [0, 1]. Returns null if decoding fails.
 */
export async function extractPeaks(file: File): Promise<number[][] | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const ctx = new AudioContext();
    let decoded: AudioBuffer;
    try {
      decoded = await ctx.decodeAudioData(arrayBuffer);
    } finally {
      ctx.close();
    }

    const peaks: number[][] = [];
    const blockSize = Math.max(1, Math.floor(decoded.length / SAMPLE_COUNT));

    for (let c = 0; c < decoded.numberOfChannels; c++) {
      const channelData = decoded.getChannelData(c);
      const channelPeaks: number[] = new Array(SAMPLE_COUNT);

      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, channelData.length);
        let max = 0;
        for (let j = start; j < end; j++) {
          const abs = Math.abs(channelData[j]);
          if (abs > max) max = abs;
        }
        channelPeaks[i] = Math.round(max * 1000) / 1000;
      }
      peaks.push(channelPeaks);
    }

    return peaks;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ built` with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/extractPeaks.ts
git commit -m "feat: add extractPeaks utility using Web Audio API"
```

---

### Task 3: Add `updateTrackPeaks` to Firestore layer

**Files:**
- Modify: `src/firebase/firestore.ts`

- [ ] **Step 1: Add the function**

In `src/firebase/firestore.ts`, add after the existing `updateTrackDuration` function (line 41):

```typescript
export const updateTrackPeaks = async (trackId: string, peaks: number[][]): Promise<void> => {
  await updateDoc(doc(db, 'tracks', trackId), { peaks });
};
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ built` with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/firebase/firestore.ts
git commit -m "feat: add updateTrackPeaks firestore function"
```

---

### Task 4: Extract peaks during upload (parallel with upload)

**Files:**
- Modify: `src/pages/UploadPage.tsx`

- [ ] **Step 1: Update the upload handler**

Replace the entire `handleUpload` function in `src/pages/UploadPage.tsx`:

```typescript
const handleUpload = async () => {
  if (!file || !user) return;
  setUploading(true);
  setError('');

  const trackId = nanoid(12);

  try {
    // Run peak extraction in parallel with the upload — no extra wait time
    const [{ downloadURL, storagePath }, peaks] = await Promise.all([
      uploadAudio(user.uid, trackId, file, setProgress),
      extractPeaks(file),
    ]);

    await createTrack(trackId, {
      ownerId: user.uid,
      title: title || file.name,
      fileName: file.name,
      storagePath,
      downloadURL,
      fileSize: file.size,
      ...(peaks ? { peaks } : {}),
    });

    navigate(`/review/${trackId}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    setError(msg);
    setUploading(false);
  }
};
```

- [ ] **Step 2: Add the import for `extractPeaks` at the top of the file**

Add to the existing imports block:

```typescript
import { extractPeaks } from '../utils/extractPeaks';
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ built` with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/UploadPage.tsx
git commit -m "feat: extract waveform peaks in parallel during audio upload"
```

---

### Task 5: Use peaks in `useWavesurfer` + lazy migration

**Files:**
- Modify: `src/hooks/useWavesurfer.ts`

- [ ] **Step 1: Add peaks/duration to the options interface and import `updateTrackPeaks`**

At the top of `src/hooks/useWavesurfer.ts`, update the import line for firestore:

```typescript
import { updateTrackDuration, updateTrackPeaks } from '../firebase/firestore';
```

Update the `UseWavesurferOptions` interface to add two new optional fields:

```typescript
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
```

- [ ] **Step 2: Destructure the new params and update `ws.load`**

Update the destructuring at the top of the `useWavesurfer` function to include `peaks` and `duration`:

```typescript
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
```

- [ ] **Step 3: Replace the load call and ready handler**

In the `useEffect` that creates WaveSurfer (the one with `ws.load(audioUrl)`), replace:

```typescript
ws.load(audioUrl);

ws.on('ready', () => {
  isReadyRef.current = true;
  if (trackId) {
    updateTrackDuration(trackId, ws.getDuration()).catch(() => {});
  }
  // Add any markers that arrived before the waveform was ready
  for (const entry of feedbackRef.current) {
    if (entry.id && !renderedIdsRef.current.has(entry.id)) {
      addMarker(entry);
    }
  }
  onReady?.();
});
```

With:

```typescript
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
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ built` with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useWavesurfer.ts
git commit -m "feat: pass peaks to WaveSurfer for instant render, lazy-save for old tracks"
```

---

### Task 6: Thread peaks through WaveformPlayer and ReviewPage

**Files:**
- Modify: `src/components/waveform/WaveformPlayer.tsx`
- Modify: `src/pages/ReviewPage.tsx`

- [ ] **Step 1: Add peaks and duration props to WaveformPlayer**

In `src/components/waveform/WaveformPlayer.tsx`, update the `WaveformPlayerProps` interface:

```typescript
interface WaveformPlayerProps {
  audioUrl: string;
  feedback: FeedbackEntry[];
  trackId?: string;
  peaks?: number[][];
  duration?: number;
  onTimestampClick: (seconds: number) => void;
  onTimeUpdate?: (seconds: number) => void;
  interactable?: boolean;
}
```

Then update the destructuring in the component signature (the `forwardRef` arrow function parameters) to include the new props:

```typescript
({ audioUrl, feedback, trackId, peaks, duration, onTimestampClick, onTimeUpdate, interactable = true }, ref) => {
```

Then pass them through to `useWavesurfer` — find the `useWavesurfer` call and add `peaks` and `duration`:

```typescript
const { wsRef, seekTo, flashMarkers } = useWavesurfer({
  containerRef,
  timelineRef,
  audioUrl,
  feedback,
  trackId,
  peaks,
  duration,
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
```

- [ ] **Step 2: Pass track.peaks and track.duration from ReviewPage**

In `src/pages/ReviewPage.tsx`, find the `<WaveformPlayer>` JSX block (around line 175) and add the two new props:

```tsx
<WaveformPlayer
  ref={playerRef}
  audioUrl={track.downloadURL}
  feedback={feedback}
  trackId={track.id}
  peaks={track.peaks}
  duration={track.duration}
  onTimestampClick={handleTimestampClick}
  onTimeUpdate={setPlaybackTime}
  interactable={!isOwner}
/>
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ built` with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/waveform/WaveformPlayer.tsx src/pages/ReviewPage.tsx
git commit -m "feat: thread peaks and duration through WaveformPlayer to useWavesurfer"
```

---

### Task 7: End-to-end verification and deploy

- [ ] **Step 1: Final clean build**

```bash
npm run build 2>&1
```
Expected: `✓ built in` with zero TypeScript errors, no `error TS` lines.

- [ ] **Step 2: Manual smoke test — new upload**
  1. Run `npm run dev` (if not already running)
  2. Log in and upload a new audio file
  3. Navigate to the review page for that track
  4. Waveform should render **within 1–2 seconds** (no full decode delay)
  5. Open browser DevTools → Network tab → confirm no large audio file download before waveform appears

- [ ] **Step 3: Manual smoke test — old track (lazy migration)**
  1. Open the review page for an existing track that was uploaded before this change
  2. Waveform will still be slow this first time (expected)
  3. After `ready` fires, open Firestore console and verify the `peaks` field now exists on the track document
  4. Reload the page — waveform should now render instantly

- [ ] **Step 4: Deploy and push**

```bash
npx firebase deploy --only hosting
git push origin main
```
