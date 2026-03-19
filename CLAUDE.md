# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design Improvement Guidelines

When touching any frontend/UI code, apply these principles:

### Visual Hierarchy
- Use clear typographic hierarchy (distinct sizes for headings, subheadings, body)
- Make the most important element on each page visually dominant
- Avoid walls of text — break content into digestible sections

### Spacing & Layout
- Use generous, consistent spacing (padding/margin) — when in doubt, add more whitespace
- Align elements to a clear grid
- Never let content touch the edges of the screen

### Color & Contrast
- Stick to a limited palette (1 primary color, 1 accent, neutral grays)
- Ensure text has strong contrast against its background
- Use color purposefully — not decoratively

### Components & Polish
- Add subtle hover states to all interactive elements (buttons, links, cards)
- Use consistent border-radius across all elements
- Prefer subtle shadows over hard borders for depth
- Smooth transitions on interactions (0.2s ease)

### Typography
- Use a clean sans-serif font (Inter, DM Sans, or system-ui as fallback)
- Limit to 2 font weights max (regular + semibold/bold)
- Set comfortable line-height (1.5–1.7 for body text)

### General Rule
Avoid the "default AI-generated" look — aim for something that feels intentional, crafted, and consistent throughout.

## Commands

```bash
npm run dev       # start dev server (Vite)
npm run build     # tsc -b && vite build
npm run lint      # eslint
npm run preview   # preview production build

# Deploy Firestore rules (required after editing firestore.rules)
npx firebase deploy --only firestore:rules
```

No test suite exists in this project.

## Architecture

**Feedback Studio** is a music feedback platform. Artists upload tracks and share review links; reviewers leave timestamped feedback without needing an account.

### Stack
- React 19 + TypeScript, Vite
- Firebase: Auth (email/password), Firestore, Storage
- wavesurfer.js v7 with RegionsPlugin (markers) + TimelinePlugin

### Routing (`src/App.tsx`)
```
/login              → LoginPage (public)
/                   → DashboardPage (ProtectedRoute + AppShell)
/upload             → UploadPage (ProtectedRoute + AppShell)
/review/:trackId    → ReviewPage (AppShell, no auth guard — reviewers are anonymous)
```

`ProtectedRoute` redirects unauthenticated users to `/login`. `ReviewPage` is intentionally unguarded because reviewers don't have accounts.

### Firebase Layer (`src/firebase/`)
- **`firestore.ts`** — all Firestore reads/writes. Key functions: `getUserTracks`, `getTrack`, `createTrack`, `deleteTrack`, `addFeedback`, `deleteFeedback`, `markFeedbackRead`, `markFeedbackSectionRead`, `subscribeFeedback` (real-time listener), `getUserStorageUsed`, `updateTrackFileSize`.
- **`storage.ts`** — `uploadAudio` (resumable, returns `downloadURL` + `storagePath`), `deleteAudio`, `getFileMetadata`.
- **`auth.ts`** — thin wrapper around Firebase Auth.

### Storage Quota Tracking
`Track.fileSize` (bytes) is stored per-track. A centralized `users/{uid}.storageUsed` Firestore counter is atomically incremented on upload/backfill and decremented on delete. `StorageBar` component shows used vs 5 GB free tier limit. Existing tracks without `fileSize` are backfilled via `getFileMetadata()` on Dashboard load.

### Wavesurfer Integration (`src/hooks/useWavesurfer.ts`)
The hook owns the WaveSurfer instance (`wsRef`). Feedback entries are rendered as orange RegionsPlugin markers (0.8 s wide, non-draggable). Markers are deduplicated via `renderedIdsRef` — only new entries are added, never re-rendered. Marker hover/click attach native DOM event listeners to the region's `element`. A `regionClickedRef` flag prevents the waveform's own click handler from firing after a region click.

Playback time is tracked via `setInterval` stored in `intervalRef` (cleared on unmount). `seekTo(seconds)` normalizes to `[0,1]` using duration.

### Data Model
```typescript
Track        { id, ownerId, title, fileName, storagePath, downloadURL, duration?, fileSize?, feedbackCount, unreadCount?, createdAt }
FeedbackEntry { id?, timestamp, reviewerName, comment, rating, volumeDb, bands: FrequencyBand[], createdAt?, read?, readSections? }
FrequencyBand { id: FrequencyBandId, label, range, verdict: BandVerdict, notes }
UserDoc      { storageUsed }
```

`FrequencyBandId`: `'sub' | 'low' | 'lowMid' | 'mid' | 'highMid' | 'high'`
`BandVerdict`: `'too_much' | 'just_right' | 'too_little' | null`

### Firestore Rules (`firestore.rules`)
- **`/users/{uid}`** — read/write only by matching authenticated user
- **`/tracks/{trackId}`** — read: public; create: authenticated; update: owner OR counter-only update (feedbackCount +1, for anonymous reviewer batch writes); delete: owner only
- **`/tracks/{trackId}/feedback/{feedbackId}`** — read/create: public (anonymous reviewers); update: owner only (fields: `read`, `readSections`); delete: owner only

### Theming
CSS variables defined in `src/styles/globals.css`. Theme toggled via `data-theme` attribute on `<html>`. Three modes: `light`, `dark`, `system` (via `useTheme` hook + `prefers-color-scheme` media query).

### Help System
- **Help modal** (`src/components/help/HelpModal.tsx`) — opens on "Help" button click
- **Hints mode** (`AppShell.tsx`) — global `mouseover` listener reads `data-help` attribute from hovered elements, displays text in a fixed corner panel. Add `data-help="..."` to any element to annotate it.
- **Walkthrough** (`src/components/onboarding/WalkthroughModal.tsx`) — 3-step modal for first-time reviewers, gated by `localStorage` key `fs-onboarded`.
