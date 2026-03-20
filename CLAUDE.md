# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `npm run dev` (serves at `http://localhost:5173`)
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- After screenshotting, read the PNG with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color

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
