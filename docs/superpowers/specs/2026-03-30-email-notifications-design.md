# Email Notifications Design

**Date:** 2026-03-30
**Status:** Approved

## Goal

Send the track owner an email whenever a reviewer submits new feedback on one of their tracks.

## Email Content

- **Subject:** `New feedback on "[Track Title]"`
- **Body:** `You got new feedback on your track "[Track Title]" on FeedbackStudio.`
- Format: plain text (no HTML template)

## Architecture

A single Firebase Cloud Function `onFeedbackCreated` triggered by Firestore:

```
Firestore write: tracks/{trackId}/feedback/{feedbackId}
  → Cloud Function: onFeedbackCreated
      1. Read tracks/{trackId} → get title + ownerId
      2. Firebase Admin auth.getUser(ownerId) → get owner email
      3. POST to Resend API → send email
```

No changes to the frontend or Firestore data model.

## Tech

- **Runtime:** Firebase Cloud Functions (Node.js)
- **Email service:** Resend (free tier: 3,000 emails/month)
- **Trigger:** `onDocumentCreated` from `firebase-functions/v2/firestore`

## Configuration

- Resend API key stored as a Firebase Function secret (`RESEND_API_KEY`)
- Locally: `.env` file inside `functions/` directory (gitignored)

## Local Testing

- Firebase Functions Emulator intercepts Firestore writes and fires the function
- Submit real feedback on the local dev app to trigger the function
- Resend sends real emails even from local (uses the live Resend API)

## Error Handling

- If Resend API call fails: log the error, do not retry
- Reviewer's feedback is already persisted in Firestore regardless of email failure
- No impact on the user-facing flow

## Out of Scope

- Email batching or digests
- HTML email templates
- Unsubscribe mechanism
- Notification preferences
