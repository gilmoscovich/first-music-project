# Email Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send the track owner an email whenever a reviewer submits feedback on one of their tracks.

**Architecture:** A Firebase Cloud Function `onFeedbackCreated` triggers on every new document in `tracks/{trackId}/feedback/{feedbackId}`. It fetches the track title + owner email via Firebase Admin SDK, then sends a plain-text email via the Resend API.

**Tech Stack:** Firebase Cloud Functions v2 (Node.js 22), firebase-admin, resend npm package, Firebase Functions Emulator for local testing.

---

## Pre-requisites (manual steps — do these before starting)

### A) Create a free Resend account and get an API key
1. Go to https://resend.com and sign up (free tier: 3,000 emails/month)
2. In the Resend dashboard → **API Keys** → **Create API key** → copy it
3. In the Resend dashboard → **Domains** → either:
   - Add and verify your own domain (for production), OR
   - Use Resend's shared test domain `onboarding@resend.dev` (works immediately for testing, sends to your own email only)

### B) Verify the Firebase CLI is logged in
```bash
firebase login
firebase projects:list
```
Expected: `feedbackstudio-a1cc5` appears in the list.

---

## File Structure

```
functions/                        ← NEW: Cloud Functions package root
  package.json                    ← NEW: Functions dependencies (firebase-admin, resend, etc.)
  tsconfig.json                   ← NEW: TypeScript config for functions
  .env                            ← NEW: Local secrets (gitignored)
  .gitignore                      ← NEW: Ignore node_modules, lib, .env
  src/
    index.ts                      ← NEW: Cloud Function definition
firebase.json                     ← MODIFY: Add functions config
```

---

## Task 1: Initialize Firebase Functions

**Files:**
- Create: `functions/package.json`
- Create: `functions/tsconfig.json`
- Create: `functions/.gitignore`
- Modify: `firebase.json`

- [ ] **Step 1: Initialize the functions directory**

```bash
cd /Users/gilmoscovich/ClaudeCode/feedback-studio
firebase init functions
```

When prompted:
- **Language:** TypeScript
- **Use ESLint:** No
- **Install dependencies with npm now:** Yes

This creates `functions/` with `package.json`, `tsconfig.json`, `src/index.ts`, and `node_modules/`.

- [ ] **Step 2: Verify the generated structure**

```bash
ls functions/
```

Expected output:
```
node_modules  package.json  src  tsconfig.json
```

- [ ] **Step 3: Update firebase.json to include functions**

`firebase init` should have already added functions to `firebase.json`. Verify it looks like this:

```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log",
        "*.local"
      ]
    }
  ],
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

If functions is missing, add the `"functions"` block manually.

- [ ] **Step 4: Create functions/.gitignore**

```
node_modules/
lib/
.env
```

- [ ] **Step 5: Commit**

```bash
git add firebase.json functions/package.json functions/tsconfig.json functions/.gitignore functions/src/index.ts
git commit -m "feat: initialize Firebase Cloud Functions"
```

---

## Task 2: Install Resend and configure TypeScript

**Files:**
- Modify: `functions/package.json` (add resend dependency)
- Modify: `functions/tsconfig.json` (ensure correct settings)

- [ ] **Step 1: Install the resend package**

```bash
cd functions
npm install resend
```

- [ ] **Step 2: Verify resend appears in functions/package.json**

```bash
cat functions/package.json | grep resend
```

Expected: `"resend": "^x.x.x"`

- [ ] **Step 3: Verify functions/tsconfig.json has the right settings**

The file should look like this (firebase init generates it correctly, just verify):

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017"
  },
  "compileOnSave": true,
  "include": [
    "src"
  ]
}
```

- [ ] **Step 4: Commit**

```bash
cd ..
git add functions/package.json functions/package-lock.json
git commit -m "feat: add resend dependency to functions"
```

---

## Task 3: Write the Cloud Function

**Files:**
- Modify: `functions/src/index.ts`

- [ ] **Step 1: Replace the generated index.ts with the function**

```typescript
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

admin.initializeApp();

const resend = new Resend(process.env.RESEND_API_KEY);

export const onFeedbackCreated = onDocumentCreated(
  'tracks/{trackId}/feedback/{feedbackId}',
  async (event) => {
    const { trackId } = event.params;

    // 1. Get the track to find the title and owner
    const trackSnap = await admin.firestore().doc(`tracks/${trackId}`).get();
    if (!trackSnap.exists) {
      console.error(`Track ${trackId} not found`);
      return;
    }
    const track = trackSnap.data() as { title: string; ownerId: string };

    // 2. Get the owner's email from Firebase Auth
    let ownerEmail: string;
    try {
      const userRecord = await admin.auth().getUser(track.ownerId);
      if (!userRecord.email) {
        console.error(`Owner ${track.ownerId} has no email`);
        return;
      }
      ownerEmail = userRecord.email;
    } catch (err) {
      console.error(`Failed to fetch user ${track.ownerId}:`, err);
      return;
    }

    // 3. Send the email
    const { error } = await resend.emails.send({
      from: 'FeedbackStudio <onboarding@resend.dev>',
      to: ownerEmail,
      subject: `New feedback on "${track.title}"`,
      text: `You got new feedback on your track "${track.title}" on FeedbackStudio.`,
    });

    if (error) {
      console.error('Resend error:', error);
    } else {
      console.log(`Email sent to ${ownerEmail} for track "${track.title}"`);
    }
  }
);
```

> **Note on `from` address:** While testing, use `onboarding@resend.dev` — Resend allows this on free accounts but only delivers to your own verified email. When you go live, change this to `notifications@yourdomain.com` after verifying your domain in Resend.

- [ ] **Step 2: Build to check for TypeScript errors**

```bash
cd functions
npm run build
```

Expected: no errors, `lib/` directory created.

- [ ] **Step 3: Commit**

```bash
cd ..
git add functions/src/index.ts
git commit -m "feat: add onFeedbackCreated Cloud Function"
```

---

## Task 4: Configure local environment for the emulator

**Files:**
- Create: `functions/.env`

- [ ] **Step 1: Create functions/.env with your Resend API key**

```bash
echo 'RESEND_API_KEY=re_your_actual_key_here' > functions/.env
```

Replace `re_your_actual_key_here` with the key you copied from Resend dashboard.

- [ ] **Step 2: Verify .env is gitignored**

```bash
git status functions/.env
```

Expected: `.env` does NOT appear as a tracked or untracked file (it should be ignored). If it shows as untracked, check `functions/.gitignore` contains `.env`.

- [ ] **Step 3: Start the Firebase emulator**

Open a new terminal tab and run:

```bash
firebase emulators:start --only functions,firestore
```

Expected output (after a few seconds):
```
✔  functions: Loaded functions definitions from source: onFeedbackCreated.
✔  firestore: Firestore Emulator logging to firestore-debug.log
✔  All emulators ready!

┌─────────────────────────────────────────────────────────────┐
│ Emulator  │ Host:Port      │ View in Emulator UI             │
├───────────┼────────────────┼─────────────────────────────────┤
│ Functions │ localhost:5001 │ http://127.0.0.1:4000/functions │
│ Firestore │ localhost:8080 │ http://127.0.0.1:4000/firestore │
└─────────────────────────────────────────────────────────────┘
```

---

## Task 5: Test locally end-to-end

- [ ] **Step 1: Point the local app at the Firestore emulator**

Add this to `functions/.env` (already there — confirm it) and also ensure the frontend Vite dev server is running:

```bash
# In a separate terminal
npm run dev
```

- [ ] **Step 2: Connect the frontend to the Firestore emulator**

Temporarily add these lines to `src/firebase/config.ts` to redirect Firestore writes to the local emulator:

```typescript
import { connectFirestoreEmulator } from 'firebase/firestore';

// Add after `export const db = getFirestore(app);`
if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

> **Warning:** This redirects ALL Firestore reads/writes to the emulator while in dev mode. Your production data will not be affected. Remove this after testing.

- [ ] **Step 3: Submit a feedback through the UI**

1. Open `http://localhost:5173` in your browser
2. Log in as the track owner
3. Open the review link for one of your tracks
4. Submit a feedback

- [ ] **Step 4: Check the emulator logs**

In the terminal running the emulator, you should see:

```
i  functions: Beginning execution of "onFeedbackCreated"
✔  Email sent to your@email.com for track "Your Track Name"
i  functions: Finished "onFeedbackCreated"
```

- [ ] **Step 5: Check your email inbox**

You should receive an email with subject: `New feedback on "Your Track Name"`

- [ ] **Step 6: Revert the emulator connection from config.ts**

Remove the `connectFirestoreEmulator` lines from `src/firebase/config.ts` — they were for local testing only.

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/firebase/config.ts
git commit -m "test: verify email notification works locally (emulator)"
```

---

## Task 6: Deploy to production

- [ ] **Step 1: Set the Resend API key as a Firebase secret**

```bash
firebase functions:secrets:set RESEND_API_KEY
```

When prompted, paste your Resend API key and press Enter.

Expected:
```
✔ Created a new secret version projects/feedbackstudio-a1cc5/secrets/RESEND_API_KEY/versions/1
```

- [ ] **Step 2: Update the function to use the secret**

Modify `functions/src/index.ts` — add `runWith` secret binding at the top of the function:

```typescript
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();

const resendApiKey = defineSecret('RESEND_API_KEY');

export const onFeedbackCreated = onDocumentCreated(
  {
    document: 'tracks/{trackId}/feedback/{feedbackId}',
    secrets: [resendApiKey],
  },
  async (event) => {
    const resend = new Resend(resendApiKey.value());
    const { trackId } = event.params;

    const trackSnap = await admin.firestore().doc(`tracks/${trackId}`).get();
    if (!trackSnap.exists) {
      console.error(`Track ${trackId} not found`);
      return;
    }
    const track = trackSnap.data() as { title: string; ownerId: string };

    let ownerEmail: string;
    try {
      const userRecord = await admin.auth().getUser(track.ownerId);
      if (!userRecord.email) {
        console.error(`Owner ${track.ownerId} has no email`);
        return;
      }
      ownerEmail = userRecord.email;
    } catch (err) {
      console.error(`Failed to fetch user ${track.ownerId}:`, err);
      return;
    }

    const { error } = await resend.emails.send({
      from: 'FeedbackStudio <onboarding@resend.dev>',
      to: ownerEmail,
      subject: `New feedback on "${track.title}"`,
      text: `You got new feedback on your track "${track.title}" on FeedbackStudio.`,
    });

    if (error) {
      console.error('Resend error:', error);
    } else {
      console.log(`Email sent to ${ownerEmail} for track "${track.title}"`);
    }
  }
);
```

- [ ] **Step 3: Build to verify no TypeScript errors**

```bash
cd functions
npm run build
cd ..
```

Expected: no errors.

- [ ] **Step 4: Deploy only functions**

```bash
firebase deploy --only functions
```

Expected:
```
✔  functions: Finished running predeploy script.
i  functions: ensuring required APIs are enabled...
✔  functions: all necessary APIs are enabled
i  functions: preparing functions directory for uploading...
✔  functions[onFeedbackCreated]: Successful create operation.
✔  Deploy complete!
```

- [ ] **Step 5: Test in production**

1. Open your live app
2. Submit feedback on one of your tracks from a separate browser/incognito window
3. Check your email inbox — you should receive the notification within ~10 seconds

- [ ] **Step 6: Commit**

```bash
git add functions/src/index.ts
git commit -m "feat: use Firebase secret for Resend API key in production"
```

---

## Going Live with a Custom Domain (optional, after testing)

Once you've verified emails are arriving, replace `onboarding@resend.dev` with your own domain:

1. In Resend dashboard → **Domains** → **Add Domain** → follow DNS verification steps
2. Update the `from` field in `functions/src/index.ts`:
   ```typescript
   from: 'FeedbackStudio <notifications@yourdomain.com>',
   ```
3. Redeploy: `firebase deploy --only functions`
