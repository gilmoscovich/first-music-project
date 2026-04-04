# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Priority Rules
- **Start coding immediately.** Do not write spec docs, plans, or lengthy analysis unless explicitly asked. Bias toward making code changes first, then explaining after.

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `npm run dev` (serves at `http://localhost:5173`)
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- After screenshotting, read the PNG with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

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

## UI Guidelines
- **Icon size:** Minimum 24px. Never use subtle/small icons that require the user to ask for bigger.
- **Touch targets:** Minimum 44px for any interactive element on mobile.
- **Contrast:** Use high contrast by default. Do not make UI elements subtle unless specifically requested.
- **Sizing philosophy:** When in doubt, go larger and bolder — not smaller and more discreet.

## Implementation Guidelines
- **Scope precisely.** Implement only what the user described. If they say "new signups only", do NOT apply the change to existing users. Ask for clarification before broadening scope.

## Workflow
- After making changes, run `npm run build` to verify zero TypeScript errors before committing or reporting completion.

## Tech Stack & Debugging
- Stack: TypeScript, React, Firebase (Firestore + Storage + Hosting + Auth), CSS.
- When debugging Firebase issues, check Security Rules early — they are a common root cause, especially Storage rules where `request.resource` is `null` on deletes.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color


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
/                   → LandingPage (public — marketing homepage)
/login              → LoginPage (public)
/dashboard          → DashboardPage (ProtectedRoute + AppShell)
/upload             → UploadPage (ProtectedRoute + AppShell)
/review/:trackId    → ReviewPage (AppShell, no auth guard — reviewers are anonymous)
```

`ProtectedRoute` redirects unauthenticated users to `/login`. After successful login/signup, users are redirected to `/dashboard`. `ReviewPage` is intentionally unguarded because reviewers don't have accounts.

### Firebase Layer (`src/firebase/`)
- **`firestore.ts`** — all Firestore reads/writes. Key functions: `getUserTracks`, `getTrack`, `createTrack`, `deleteTrack`, `addFeedback`, `deleteFeedback`, `markFeedbackRead`, `markFeedbackSectionRead`, `subscribeFeedback` (real-time listener), `getUserStorageUsed`, `updateTrackFileSize`.
- **`storage.ts`** — `uploadAudio` (resumable, returns `downloadURL` + `storagePath`), `deleteAudio`, `getFileMetadata`.
- **`auth.ts`** — thin wrapper around Firebase Auth.

### Storage Quota Tracking
`Track.fileSize` (bytes) is stored per-track. A centralized `users/{uid}.storageUsed` Firestore counter is atomically incremented on upload/backfill and decremented on delete. `StorageBar` component shows used vs 5 GB free tier limit. Existing tracks without `fileSize` are backfilled via `getFileMetadata()` on Dashboard load.

### Wavesurfer Integration (`src/hooks/useWavesurfer.ts`)
The hook owns the WaveSurfer instance (`wsRef`). Feedback entries are rendered as cyan RegionsPlugin markers (0.8 s wide, non-draggable). Markers are deduplicated via `renderedIdsRef` — only new entries are added, never re-rendered. Marker hover/click attach native DOM event listeners to the region's `element`. A `regionClickedRef` flag prevents the waveform's own click handler from firing after a region click.

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

---

## Design System

**All pages must follow this design system without exception.** The visual language is established by `LandingPage.tsx` and must be applied consistently across `LoginPage`, `DashboardPage`, `UploadPage`, `ReviewPage`, and all shared components (`AppShell`, `FeedbackCard`, `WaveformPlayer`, etc.).

### Brand Identity
- **Product name:** FeedbackStudio — always rendered as `Feedback` + `<span style="color:#06b6d4">Studio</span>`
- **Personality:** dark studio tool meets modern SaaS — precise, professional, warm
- **Primary accent:** `#06b6d4` (cyan) — the waveform marker color; used for all CTAs, highlights, active states, and brand moments
- **Never use:** blue, indigo, purple, or default Tailwind palette colors as primary

### Color Tokens

All colors must be defined as CSS variables on `[data-theme]` and consumed via `var(--token)`. Never hardcode hex values in component CSS except for the brand cyan `#06b6d4`.

**Dark theme (`data-theme="dark"`):**
```css
--bg-page: #0d0d0f
--bg-surface: #17171b        /* cards, panels */
--bg-surface2: #1f1f24       /* elevated surfaces, popups */
--bg-field: #17171b          /* form inputs */
--border: #242428
--border-soft: rgba(255,255,255,0.07)
--text-primary: #f0f0f0
--text-secondary: #666
--text-muted: #3a3a40
--text-label: #555
```

**Light theme (`data-theme="light"`):**
```css
--bg-page: #fafaf8
--bg-surface: #fff
--bg-surface2: #fff
--bg-field: #fafaf8
--border: #ebebeb
--border-soft: #e8e8e4
--text-primary: #111
--text-secondary: #888
--text-muted: #ccc
--text-label: #aaa
```

### Typography
- **Font stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif` — no external fonts
- **Headings:** `font-weight: 900`, `letter-spacing: -0.04em` to `-0.05em`, `line-height: 1.03–1.1`
- **Body:** `font-weight: 400`, `line-height: 1.7`, `color: var(--text-secondary)`
- **Labels / eyebrows:** `font-size: 11px`, `font-weight: 700`, `letter-spacing: 0.12em`, `text-transform: uppercase`, `color: #06b6d4`
- **Never use the same weight for headings and body.** Use 900 for display, 700 for UI labels, 400 for body.

### Spacing
Use consistent spacing tokens — not arbitrary values:
- Section padding: `80px 6%` (vertical breathing room)
- Card padding: `28px`
- Component internal gaps: `8px`, `12px`, `16px`, `24px`
- Vertical rhythm: multiples of `8px`

### Components

**Buttons:**
```css
/* Primary */
background: #06b6d4; color: #fff; font-weight: 700; border-radius: 9px;
padding: 13px 28px (large), 7px 16px (small);
hover: opacity 0.82 + translateY(-1px);

/* Ghost */
background: transparent; border: 1.5px solid var(--btn-ghost-border);
color: var(--btn-ghost-color);
hover: border-color #06b6d4; color #06b6d4;
```

**Cards / Surfaces:**
```css
background: var(--bg-surface);
border: 1px solid var(--border-soft);
border-radius: 14px;
padding: 28px;
/* Light mode only: */ box-shadow: 0 4px 24px rgba(0,0,0,.05);
hover: border-color rgba(249,115,22,.4); translateY(-2px);
```

**Tag / Badge (amber):**
```css
background: rgba(249,115,22,.1);
border: .5px solid rgba(249,115,22,.25);
border-radius: 100px;
color: #06b6d4 (dark) / #0e7490 (light);
font-size: 12px; font-weight: 700; letter-spacing: .04em;
```

**Frequency band pills:**
- Too much → red tint
- Just right → green tint
- Too little → cyan tint
- Unselected → muted/dim

**Form fields:**
```css
background: var(--bg-field);
border: 1px solid var(--border-soft);
border-radius: 8px;
padding: 10px 14px;
color: var(--text-field);
```

**Section eyebrow pattern:**
```
[11px uppercase cyan label]
[Large 900-weight heading]
[16px body paragraph]
```

### Waveform Player
The waveform player in the app (`WaveformPlayer.tsx`) should visually match the landing page mockup:
- Dark unplayed bars: `#232328` / Light unplayed bars: `#e8e7e2`
- Played portion: `#06b6d4`
- Marker pins: cyan triangles (`#06b6d4`) with timestamp label badges
- Player card: `border-top: 2px solid #06b6d4` as a brand accent line

### AppShell / Nav
The app nav (`AppShell.tsx`) must match the landing page nav style:
- Logo: `Feedback` + cyan `Studio`
- Background: `var(--bg-page)` with `border-bottom: 1px solid var(--border-soft)`
- Sticky positioning
- Same button styles as landing page (ghost Sign out, cyan primary action)

### Login Page
Must feel like part of the same product as the landing page:
- Dark/light page background using same tokens
- Card-based form using `var(--bg-surface)` with cyan `border-top` accent
- Logo at top in same wordmark style
- Amber primary button for submit

### Dashboard Page
- Track cards: use `var(--bg-surface)` card style with hover border-color cyan
- Empty state: centered, muted, with cyan CTA button
- Storage bar accent: `#06b6d4`

### Review Page
- Waveform player: match the landing page player card style (cyan border-top, dark surface)
- Feedback cards below waveform: same style as landing page feedback card
- Feedback popup: match the landing page popup mockup exactly (cyan timestamp, band pills, fader, Pin Feedback cyan button)

### Animations
- Page load: `fuUp` fade-up with staggered delays (`opacity: 0 → 1`, `translateY(22px → 0)`)
- Hover transitions: `transform` and `opacity` only, `0.15s ease`
- Never use `transition-all`
