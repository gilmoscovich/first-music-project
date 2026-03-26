# Email Verification for New Signups

**Date:** 2026-03-26
**Status:** Approved

## Summary

After signup, send a Firebase verification email and redirect the user to a holding page. Block access to protected routes until `user.emailVerified` is true. Existing users and the sign-in flow are unaffected.

## Architecture

### Flow

1. User fills out signup form on `/login`
2. `createUserWithEmailAndPassword` succeeds → Firebase sends verification email via `sendEmailVerification(user)`
3. App navigates to `/verify-email` instead of `/dashboard`
4. User clicks the link in their inbox (handled by Firebase externally)
5. User returns to app, clicks "I've verified — continue" → app calls `user.reload()` → checks `user.emailVerified` → redirects to `/dashboard`

### Route Guard Change

`ProtectedRoute` currently checks: `if (!user) → /login`

New logic:
- `if (!user)` → `/login`
- `if (user && !user.emailVerified)` → `/verify-email`
- Otherwise → render children

The `/verify-email` route is public (no auth guard). If an already-verified user somehow lands there, the page redirects them to `/dashboard`.

## Files Changed

| File | Change |
|------|--------|
| `src/firebase/auth.ts` | Add `sendVerificationEmail(user)` wrapper |
| `src/components/layout/ProtectedRoute.tsx` | Add `emailVerified` check |
| `src/App.tsx` | Add `/verify-email` route |
| `src/pages/LoginPage.tsx` | Navigate to `/verify-email` after signup |
| `src/pages/VerifyEmailPage.tsx` | New page (see below) |
| `src/pages/VerifyEmailPage.css` | Styles (reuse LoginPage patterns) |

## New Page: VerifyEmailPage

A card-based page matching the LoginPage visual style. Contains:

- Logo + wordmark
- Heading: "Check your inbox"
- Body: "We sent a verification link to `{email}`. Click it to activate your account."
- **"I've verified — continue"** button: calls `user.reload()`, checks `emailVerified`, navigates to `/dashboard` on success, shows error on failure
- **"Resend email"** button: calls `sendVerificationEmail()` again, disabled for 60s after each send to prevent spam, shows confirmation text
- **"Sign out"** link: calls `signOut()`, navigates to `/login` — for users who entered the wrong email

## Out of Scope

- Blocking existing (already signed-in) unverified users
- Email verification for the sign-in flow
- Custom Firebase email templates (uses Firebase default)
- Two-factor authentication
