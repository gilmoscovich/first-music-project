# Feedback Studio — Codebase Optimization Plan

> Full audit completed: 2026-03-20.
> Read this entire document before touching any code.
> Execute one phase at a time. Build and test before moving to the next phase.

---

## Overall Health

| Category | Finding | Severity |
|----------|---------|----------|
| Dead code | `StarRating` component — exported, never imported | 🔴 Remove |
| Misplaced file | `useFeedback.ts` lives in `src/` root, not `src/hooks/` | 🟡 Move |
| Duplicate constant | `VERDICT_LABEL` defined in 2 separate files | 🟡 Consolidate |
| Unused export | `getErrors()` in errorHandler — accumulates, never read | 🟡 Clean |
| Local utility | `formatBytes` in StorageBar — should live in `utils/` | 🟢 Extract |
| Large component | `ReviewPage.tsx` — 397 lines, 3+ unrelated concerns | 🟢 Refactor |
| CSS files | All 19 are properly imported — nothing orphaned | ✅ Clean |
| npm deps | All 6 packages actively used — no bloat | ✅ Clean |
| Type safety | Strict TypeScript throughout, zero `any` types | ✅ Excellent |

---

## The Phased Approach

Split into **3 phases** ordered by risk:

| Phase | Name | Risk | Touches | Commit After? |
|-------|------|------|---------|---------------|
| **1** | Dead code removal | 🟢 Zero | 2 files deleted | Yes |
| **2** | Code quality & DRY | 🟡 Very low | Refactors, no logic change | Yes |
| **3** | Structural refactoring | 🟠 Medium | Component splits, new files | Yes |

Never start Phase 2 before Phase 1 is committed and tested.
Never start Phase 3 before Phase 2 is committed and tested.

---

---

# Phase 1 — Dead Code Removal

**Risk:** Zero. No imports change, no logic changes. Pure deletion.
**Goal:** Remove everything that is confirmed unused.
**Time estimate:** 5 minutes.

---

### 1A — Delete `StarRating` component

**Why it's safe:** Grep across all `*.tsx` files returns zero imports of `StarRating`. It was likely built in anticipation of a rating feature that was never wired up. The star display in `FeedbackCard` and the waveform tooltip uses inline `★`/`☆` characters, not this component.

Delete both files:
```
src/components/feedback/StarRating.tsx   ← 34 lines
src/components/feedback/StarRating.css   ← 37 lines
```

**Verify:** `npm run build` — must produce zero errors and zero warnings about missing imports.

---

### Phase 1 Checklist

- [ ] Delete `StarRating.tsx`
- [ ] Delete `StarRating.css`
- [ ] `npm run build` — clean
- [ ] Commit: `chore: remove unused StarRating component`

---

---

# Phase 2 — Code Quality & DRY

**Risk:** Very low. Pure refactors — same behaviour, cleaner structure.
Each sub-step is independent. Do them in any order within this phase.
**Goal:** No duplicate code, no misplaced files, no dead exports.
**Time estimate:** 30–45 minutes.

---

### 2A — Move `useFeedback.ts` into `hooks/`

**Why:** It's the only hook living outside `src/hooks/`. Inconsistency with `useAuth`, `useTheme`, `useTrack`, `useWavesurfer`.

```
src/useFeedback.ts  →  src/hooks/useFeedback.ts
```

Update the one import in `ReviewPage.tsx`:
```ts
// Before
import { useFeedback } from '../useFeedback';

// After
import { useFeedback } from '../hooks/useFeedback';
```

**Verify:** App loads, real-time feedback still updates on ReviewPage.

---

### 2B — Extract `VERDICT_LABEL` to shared types

**Why:** The same `Record<string, string>` constant is copy-pasted in two files:
- `src/components/feedback/FeedbackCard.tsx` lines 33–37
- `src/components/waveform/WaveformPlayer.tsx` lines 7–11

**Fix:** Add to `src/types/index.ts` (already exports `BandVerdict`, so this belongs there):
```ts
export const VERDICT_LABEL: Record<BandVerdict, string> = {
  too_much:   'Too Much',
  just_right: 'Just Right',
  too_little: 'Too Little',
};
```

Then in both files, remove the local definition and import from types:
```ts
import { VERDICT_LABEL } from '../../types';
```

**Verify:** Verdict labels still display correctly in FeedbackCard body and waveform marker tooltip.

---

### 2C — Extract `formatBytes` to `utils/`

**Why:** `formatBytes` is a standalone pure function currently living inside `StorageBar.tsx`. It belongs in `utils/` alongside `formatTime.ts`.

Create `src/utils/formatBytes.ts`:
```ts
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

Remove the local definition from `StorageBar.tsx` and import from utils.

**Verify:** Storage bar labels still display the correct file sizes on the dashboard.

---

### 2D — Simplify `errorHandler.ts`

**Why:** `getErrors()` is exported but has zero callers anywhere in the codebase. The internal `errors` array grows indefinitely over a session and is never drained.

**Option A — Simplify (recommended):**
```ts
// Before: maintains an array, exports getErrors()
// After: pure logging wrapper — no accumulation

export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}
```

**Option B — Keep but document:**
If you think you'll need `getErrors()` for a future debug panel, add a comment explaining that and leave it. But remove the quiet accumulation by adding a size cap:
```ts
const MAX_ERRORS = 50;
const errors: string[] = [];

export function logError(context: string, error: unknown): void {
  const msg = `[${context}] ${error instanceof Error ? error.message : String(error)}`;
  if (errors.length < MAX_ERRORS) errors.push(msg);
  console.error(msg);
}

export function getErrors(): string[] { return [...errors]; }
```

**Verify:** Build succeeds. Check that existing `logError` calls in `firestore.ts` still compile.

---

### Phase 2 Checklist

- [ ] **2A** — Move `useFeedback.ts` → `hooks/useFeedback.ts`, update import in ReviewPage
- [ ] **2B** — Add `VERDICT_LABEL` to `types/index.ts`, remove from FeedbackCard + WaveformPlayer
- [ ] **2C** — Create `utils/formatBytes.ts`, remove local from StorageBar
- [ ] **2D** — Simplify or cap `errorHandler.ts`
- [ ] `npm run build` — clean
- [ ] Manual smoke test: Dashboard, ReviewPage, waveform tooltip
- [ ] Commit: `refactor: DRY pass — shared constants, move hooks, clean utils`

---

---

# Phase 3 — Structural Refactoring

**Risk:** Medium. We are splitting existing components into new files.
Functionality does not change, but prop interfaces must be defined carefully.
**Goal:** Break down `ReviewPage.tsx` (397 lines) into focused, testable pieces.
**Time estimate:** 1–2 hours. Do not rush this phase.

---

### 3A — Extract `SettingsDrawer` from `ReviewPage`

**Why:** The owner-only settings drawer (title editing, copy link, delete track) is ~100 lines of state + JSX inside `ReviewPage`. It has no dependency on the waveform or feedback list — it stands entirely on its own.

Create `src/components/review/SettingsDrawer.tsx`:

```ts
interface SettingsDrawerProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
}
```

Internally the drawer manages its own:
- `editingTitle` / `editTitle` state
- Save/cancel logic (calls `firestore.updateTrackTitle`)
- Copy link state
- Delete confirmation + `firestore.deleteTrack` + navigate

Move the relevant CSS rules (`.settings-drawer`, `.drawer-*`) into:
```
src/components/review/SettingsDrawer.css
```

`ReviewPage.tsx` after extraction:
- Removes ~100 lines of state + JSX
- Just renders `<SettingsDrawer track={track} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />`

**Verify:**
- Open settings drawer on a track — all buttons work
- Rename a track title — updates in Firestore and UI
- Delete a track — navigates back to dashboard
- Copy link — copies correct URL

---

### 3B — Extract `useFeedbackFilter` hook

**Why:** The filter/sort state and derived `filteredFeedback` array is ~25 lines of logic inside `ReviewPage`. Extracting it makes the filtering independently testable and reduces cognitive load in ReviewPage.

Create `src/hooks/useFeedbackFilter.ts`:

```ts
export type FilterMode = 'all' | 'unread' | 'read';
export type SortMode = 'newest' | 'oldest';

export function useFeedbackFilter(feedback: FeedbackEntry[]) {
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort]     = useState<SortMode>('newest');

  const filtered = useMemo(() => {
    const base =
      filter === 'unread' ? feedback.filter(f => !f.read)
      : filter === 'read'   ? feedback.filter(f => f.read)
      : feedback;

    return sort === 'newest'
      ? [...base].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      : [...base].sort((a, b) => a.timestamp - b.timestamp);
  }, [feedback, filter, sort]);

  return { filter, setFilter, sort, setSort, filtered };
}
```

In `ReviewPage.tsx` replace the inline filter/sort state with:
```ts
const { filter, setFilter, sort, setSort, filtered } = useFeedbackFilter(feedback);
```

**Verify:** All 3 filter tabs work, both sort orders work, counts are correct.

---

### Phase 3 Checklist

- [ ] **3A** — Create `SettingsDrawer.tsx` + `SettingsDrawer.css`, remove from ReviewPage
- [ ] **3A** — Verify: rename, delete, copy link all work
- [ ] **3B** — Create `useFeedbackFilter.ts`, replace inline logic in ReviewPage
- [ ] **3B** — Verify: filter tabs and sort work correctly
- [ ] `npm run build` — clean
- [ ] Full manual test of ReviewPage as owner AND as reviewer
- [ ] Commit: `refactor: split ReviewPage — extract SettingsDrawer and useFeedbackFilter`

---

---

## Final File Structure After All 3 Phases

```
src/
├── App.tsx
├── main.tsx
├── index.css
│
├── types/
│   └── index.ts              ← VERDICT_LABEL added here (Phase 2B)
│
├── styles/
│   └── globals.css
│
├── pages/
│   ├── LoginPage.tsx / .css
│   ├── DashboardPage.tsx / .css
│   ├── UploadPage.tsx / .css
│   └── ReviewPage.tsx / .css   ← ~250 lines after Phase 3
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx / .css
│   │   └── ProtectedRoute.tsx / .css
│   ├── feedback/
│   │   ├── FeedbackCard.tsx / .css
│   │   ├── FeedbackPopup.tsx / .css
│   │   ├── FrequencyPanel.tsx / .css
│   │   └── VolumeFader.tsx / .css
│   │   (StarRating deleted in Phase 1)
│   ├── review/
│   │   └── SettingsDrawer.tsx / .css   ← NEW in Phase 3A
│   ├── waveform/
│   │   └── WaveformPlayer.tsx / .css
│   ├── upload/
│   │   ├── AudioDropZone.tsx / .css
│   │   └── UploadProgress.tsx / .css
│   ├── dashboard/
│   │   └── StorageBar.tsx / .css
│   ├── help/
│   │   └── HelpModal.tsx / .css
│   └── onboarding/
│       └── WalkthroughModal.tsx / .css
│
├── hooks/
│   ├── useAuth.ts
│   ├── useTheme.ts
│   ├── useTrack.ts
│   ├── useFeedback.ts         ← MOVED from src/ root in Phase 2A
│   ├── useWavesurfer.ts
│   └── useFeedbackFilter.ts   ← NEW in Phase 3B
│
├── firebase/
│   ├── config.ts
│   ├── auth.ts
│   ├── firestore.ts
│   └── storage.ts
│
└── utils/
    ├── formatTime.ts
    ├── formatBytes.ts          ← NEW in Phase 2C
    ├── shareLink.ts
    └── errorHandler.ts         ← simplified in Phase 2D
```

---

## What NOT to Touch (in any phase)

| Item | Reason |
|------|--------|
| `useWavesurfer.ts` | Complex but correct — marker deduplication logic is intentional |
| `firebase/firestore.ts` | Atomic counter logic is careful by design |
| `DEFAULT_BANDS` in `types/` | Shared default state, used in multiple components |
| `AppShell.tsx` hints system | `data-help` attribute pattern is intentional |
| All Firestore rules | Separate deployment, out of scope |

---

## Summary

| Phase | What | Risk | Lines removed/moved |
|-------|------|------|---------------------|
| 1 | Delete StarRating | 🟢 Zero | −71 |
| 2 | DRY + housekeeping | 🟡 Very low | −40 moved/centralized |
| 3 | Split ReviewPage | 🟠 Medium | −150 (into 2 new files) |
| **Total** | | | **~260 lines cleaned up** |
