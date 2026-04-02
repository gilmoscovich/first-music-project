# Waveform Peaks Pre-computation Design

**Date:** 2026-04-03  
**Status:** Approved  

## Problem

WaveSurfer's default loading mode (`ws.load(url)`) downloads the full audio file and decodes it via Web Audio API before rendering the waveform. For typical tracks (5-min WAV ≈ 50–100MB), this causes 10–30+ second delays before the waveform appears.

## Solution

Pre-compute waveform peaks client-side during upload. Store them in Firestore alongside the track. Pass them to WaveSurfer at load time so it renders instantly without downloading or decoding the audio first.

Existing tracks without peaks use lazy migration: slow on first visit (unchanged), but peaks are extracted from WaveSurfer after `ready` fires and saved to Firestore — every subsequent visit is instant.

## Data Model

Add `peaks?: number[][]` to the `Track` interface in `src/types/index.ts`.

- One array per channel (mono = 1 array, stereo = 2 arrays)
- ~1000 amplitude values per channel (0–1 range)
- Stored in the Firestore track document (~20KB — well within the 1MB document limit)
- `duration` is already stored on Track; both are passed together to WaveSurfer

```typescript
interface Track {
  // ... existing fields ...
  peaks?: number[][];   // waveform peak data, one array per channel
}
```

## Components

### `src/utils/extractPeaks.ts` (new)

Utility function that takes a `File` and returns `Promise<number[][]>`.

- Uses `OfflineAudioContext` to decode the file in memory
- Downsamples the decoded PCM data to 1000 points per channel
- Returns one `number[]` per channel (amplitude values 0–1)
- No external dependencies — pure Web Audio API

### `src/pages/UploadPage.tsx`

Run `extractPeaks(file)` in parallel with `uploadAudio(file, ...)` using `Promise.all`. Both resolve before `createTrack` is called. Peaks are passed into `createTrack` alongside the existing metadata. No extra wait time for the user.

### `src/firebase/firestore.ts`

Two changes:
1. `createTrack` — accept `peaks?: number[][]` in the data parameter and include it in the Firestore write
2. `updateTrackPeaks(trackId, peaks)` — new function, simple `updateDoc` to write peaks to an existing track document (used by lazy migration)

### `src/hooks/useWavesurfer.ts`

Accept two new optional parameters: `peaks?: number[][]` and `duration?: number`.

**If peaks are provided:**
```js
ws.load(audioUrl, peaks, duration);  // instant render, no decode
```

**If peaks are absent (old track):**
```js
ws.load(audioUrl);  // fallback: full decode (same as today)
// After ready fires:
const exportedPeaks = ws.exportPeaks();
updateTrackPeaks(trackId, exportedPeaks);  // lazy save for next time
```

The `updateTrackPeaks` call in the `ready` callback is fire-and-forget (`.catch(() => {})` — failure is silent, worst case is the next visit is still slow).

### `src/components/waveform/WaveformPlayer.tsx`

Accept `peaks?: number[][]` and `duration?: number` as new props. Pass them through to `useWavesurfer`.

## Data Flow

### New uploads
```
User selects file
  ├─ extractPeaks(file)    ─────────────────────┐
  └─ uploadAudio(file)  → downloadURL            │
                                                  ▼
                              createTrack({ ..., peaks, duration? })
                                    ↓
                              Firestore: track doc with peaks
                                    ↓
                         ReviewPage: ws.load(url, peaks, duration)
                                    ↓
                              Waveform renders instantly ✓
```

### Existing tracks (lazy migration)
```
ReviewPage loads → no peaks in track doc
  → ws.load(url)  [slow, full decode — one last time]
  → ready fires
  → ws.exportPeaks() → updateTrackPeaks(trackId, peaks)
  → Firestore updated
Next visit: peaks present → instant render ✓
```

## Error Handling

- `extractPeaks` failure during upload: log the error, proceed with `peaks: undefined`. Track uploads successfully; first ReviewPage visit falls back to full decode and lazy-saves peaks then.
- `updateTrackPeaks` failure during lazy migration: silent (`.catch(() => {})`). No user impact; next visit retries.
- `ws.load(url, peaks, duration)` with malformed peaks: WaveSurfer falls back to decoding. No crash.

## Out of Scope

- Server-side peak generation (Cloud Function)
- Re-generating peaks for tracks whose audio has changed
- Peak quality settings (resolution is fixed at 1000 samples/channel)
