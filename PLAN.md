# Feedback Studio — Execution Plan

## Current Status
- App built and compiling clean ✅
- Firebase project created (feedbackstudio-a1cc5) ✅
- Firebase Auth / Firestore / Storage enabled ✅
- Security rules deployed ✅
- CORS configured on Storage bucket ✅
- Dev server running at http://localhost:5173 ✅

---

## Phase 1 — Authentication Flow Verification

**Goal:** Confirm sign-up, sign-in, and sign-out work end-to-end.

### Steps
1. Open http://localhost:5173 in browser
2. Verify the login page renders (dark theme, logo, email/password form)
3. Click "Sign up" → create a test account with a real email + password
4. Confirm redirect to the Dashboard page after sign-up
5. Sign out using the "Sign out" button in the top-right
6. Sign back in with the same credentials
7. Confirm redirect to Dashboard again

### Success Criteria
- No console errors during auth flow
- User email appears in the top nav after sign-in
- Dashboard shows "No tracks yet" state correctly

---

## Phase 2 — Audio Upload Flow

**Goal:** Upload an MP3 or WAV file and confirm it lands in Firebase Storage and Firestore.

### Steps
1. From the Dashboard, click **+ Upload Track**
2. Drop or select an MP3 or WAV file (any track, even a short test file)
3. Confirm the file name and size appear below the drop zone
4. Optionally edit the track title
5. Click **Upload & Get Share Link**
6. Confirm the upload progress bar animates to 100%
7. Confirm automatic redirect to the Review page for that track
8. Open Firebase console → Storage → confirm the file exists under `tracks/{uid}/{trackId}/`
9. Open Firebase console → Firestore → confirm a document exists under `tracks/{trackId}`

### Success Criteria
- Upload completes without error
- Redirect to Review page happens automatically
- File visible in Firebase Storage
- Track document visible in Firestore with `downloadURL`, `feedbackCount: 0`

---

## Phase 3 — Waveform Rendering

**Goal:** Confirm WaveSurfer.js loads and renders the waveform from Firebase Storage.

### Steps
1. On the Review page (after upload redirect), wait for the waveform to render
2. Confirm the waveform graphic appears (not stuck on "Loading waveform...")
3. Click the play button — confirm audio plays
4. Confirm the time counter (mm:ss / mm:ss) updates while playing
5. Click the pause button — confirm audio pauses
6. Click directly on different parts of the waveform — confirm playhead jumps

### Success Criteria
- Waveform renders within ~5 seconds
- Audio plays correctly
- No CORS errors in the browser console (F12 → Console)

### If Waveform Is Still Stuck
- Open browser DevTools (F12) → Console tab
- Look for a CORS error mentioning `firebasestorage.googleapis.com`
- Report the exact error message — Claude will fix it

---

## Phase 4 — Feedback Marker Flow

**Goal:** Drop a feedback marker at a timestamp and confirm it saves to Firestore.

### Steps
1. On the Review page, click anywhere on the waveform at a specific point
2. Confirm the **Feedback Popup** opens, showing the timestamp in yellow (e.g. `@ 0:23`)
3. Fill in the popup:
   - Enter your name (optional)
   - Set a star rating (required — 1 to 5 stars)
   - Adjust the volume fader (drag left/right)
   - Select a verdict on at least one frequency band (Too Much / Just Right / Too Little)
   - Type a note in the General notes field
4. Click **Pin Feedback**
5. Confirm the popup closes
6. Confirm a yellow marker pin appears on the waveform at the correct position
7. Confirm a feedback card appears below the waveform with all submitted details
8. Open Firebase console → Firestore → `tracks/{trackId}/feedback` — confirm the document exists

### Success Criteria
- Marker appears on waveform immediately after submit
- Feedback card shows correct timestamp, name, rating, volume, band verdicts, and comment
- Firestore subcollection contains the document
- `feedbackCount` on the parent track document incremented to 1

---

## Phase 5 — Share Link & Reviewer Flow

**Goal:** Confirm the share link works for a reviewer who is not logged in.

### Steps
1. On the Review page, click the **Share Link** button (visible to the track owner)
2. Confirm the button shows "Copied!" confirmation
3. Open a **new browser window in Incognito/Private mode** (Cmd+Shift+N on Mac)
4. Paste the copied link and navigate to it
5. Confirm the track loads with the waveform rendering correctly
6. Confirm the reviewer hint banner appears ("You're reviewing this track")
7. Click the waveform to drop a new marker
8. Fill in and submit the feedback popup
9. Switch back to the original (logged-in) window
10. Confirm the new marker and feedback card appear in real-time (no page refresh needed)

### Success Criteria
- Reviewer can access the page with no login
- Reviewer can submit feedback
- Feedback appears live on the owner's view via Firestore real-time sync

---

## Phase 6 — Dashboard Track Management

**Goal:** Confirm rename and delete work correctly.

### Steps
1. Go to the Dashboard (click "Feedback Studio" logo or navigate to `/`)
2. Confirm the uploaded track appears with its title, date, and feedback count badge
3. Click the **✏️ rename button** → confirm an inline input appears
4. Type a new title → press Enter or click Save → confirm title updates
5. Click **Copy Link** → confirm "✓ Copied" state appears
6. Click **View →** → confirm navigation to the Review page
7. Go back to Dashboard
8. Click the **🗑 delete button** → confirm the confirmation dialog appears
9. Click OK → confirm the track disappears from the list
10. Open Firebase console → confirm the Firestore document and Storage file are gone

### Success Criteria
- Rename saves and persists (visible after page refresh)
- Delete removes the track from the UI immediately
- Firebase console confirms both Firestore doc and Storage file are deleted

---

## Phase 7 — Bug Fixes

**Goal:** Fix any issues discovered in Phases 1–6 before deploying.

### Steps
1. Collect all issues noted during testing
2. For each issue, Claude identifies the root cause and applies a targeted fix
3. Re-run the affected phase's test steps to confirm the fix works
4. Run `npm run build` to confirm the build is still clean after all fixes

### Success Criteria
- `npm run build` completes with zero TypeScript errors
- All critical flows from Phases 1–6 pass

---

## Phase 8 — Production Deployment (Firebase Hosting)

**Goal:** Deploy the app to a public URL so reviewers can access it without running localhost.

### Steps
1. Add `hosting` configuration to `firebase.json`
2. Run `npm run build` to generate the `dist/` folder
3. Run `firebase deploy --only hosting` to publish
4. Firebase provides a live URL (e.g. `https://feedbackstudio-a1cc5.web.app`)
5. Open the live URL in the browser — confirm the login page loads
6. Sign in with the test account — confirm Dashboard works on production
7. Upload a track on production and run through Phase 3 and 4 again on the live URL
8. Test the share link from the live URL in Incognito mode

### Success Criteria
- App accessible at the `.web.app` URL without running localhost
- All flows work identically to localhost
- Share links use the production URL, not `localhost:5173`

---

## Phase 9 — Final Checklist

| Item | Status |
|---|---|
| Auth: sign up / sign in / sign out | ⬜ |
| Upload: MP3/WAV with progress bar | ⬜ |
| Waveform: renders and plays | ⬜ |
| Feedback: marker drops on click | ⬜ |
| Feedback: popup saves all fields | ⬜ |
| Feedback: real-time sync to owner view | ⬜ |
| Dashboard: rename track | ⬜ |
| Dashboard: delete track | ⬜ |
| Share link: reviewer access with no login | ⬜ |
| Production URL: live and working | ⬜ |
