# Email Verification for New Signups

**Date:** 2026-03-26
**Status:** Approved

## Summary

After signup, send a Firebase verification email and redirect the user to a holding page. Block access to protected routes until `user.emailVerified` is true. Existing users and the sign-in flow are unaffected.

## Architecture

### Flow

1. User fills out signup form on `/login`
2. `createUserWithEmailAndPassword` succeeds → call `sendEmailVerification(user)`
   - If `sendEmailVerification` fails (network error, rate limit): navigate to `/verify-email` anyway — the resend button on that page handles recovery. Show no error for this sub-failure since the account was created successfully.
3. App navigates to `/verify-email` instead of `/dashboard`
4. User clicks the verification link in their inbox (handled by Firebase externally)
5. User returns to app, clicks "I've verified — continue":
   - Call `user.reload()` to refresh the Firebase token
   - Read `auth.currentUser.emailVerified` (not from `useAuth()` hook, which may hold a stale value)
   - If verified: navigate to `/dashboard`
   - If not yet verified: show an error message ("Email not yet verified — please check your inbox")

### Route Guard Change

`ProtectedRoute` currently checks: `if (!user) → /login`

New logic:
1. `if (!user)` → `/login`
2. `if (user && !user.emailVerified)` → call `user.reload()` first to avoid stale token issues (e.g. user verified in another tab/session), then re-evaluate:
   - Manage this reload in a `useEffect` with a loading guard; display the same loading indicator already used during initial auth check while the reload is pending
   - If `auth.currentUser?.emailVerified` is true after reload → render children
   - Otherwise → `/verify-email`
3. Otherwise → render children

The `/verify-email` route is public (no auth guard).

### Legacy / Existing Accounts

Any account created before this feature ships will have `emailVerified === false`. The new `ProtectedRoute` guard will block these users from the dashboard after their next login, forcing them to verify. This is **intentional** — it upgrades the security posture for all accounts, not just new ones. Existing users will receive a verification email automatically when they click "I've verified — continue" on the holding page (which won't work until they verify), or by clicking "Resend email".

If this is unacceptable, a migration exemption (e.g. checking account creation date) would be needed — but that is not in scope for this implementation. Accept the behavior as-is.

## Files Changed

| File | Change |
|------|--------|
| `src/firebase/auth.ts` | Add `sendVerificationEmail(user)` wrapper |
| `src/components/layout/ProtectedRoute.tsx` | Add `emailVerified` check with `user.reload()` |
| `src/App.tsx` | Add `/verify-email` route (public, no `ProtectedRoute`, no `AppShell`) |
| `src/pages/LoginPage.tsx` | Navigate to `/verify-email` after signup |
| `src/pages/VerifyEmailPage.tsx` | New page (see below) |
| `src/pages/VerifyEmailPage.css` | Styles (reuse LoginPage patterns) |

Note: both `/dashboard` and `/upload` use `ProtectedRoute`, so both will benefit from the new guard automatically.

## New Page: VerifyEmailPage

A standalone card-based page — **no `AppShell`, no nav bar** — matching the LoginPage visual style exactly (same layout, same card, same logo wordmark).

### Data source
- Email address displayed on the page: read from `auth.currentUser.email` (not from React Router `state`, which is lost on page refresh)
- If `auth.currentUser` is `null` when the page mounts (signed-out user navigating directly): redirect to `/login` immediately

### Content
- Logo + wordmark
- Heading: "Check your inbox"
- Body: "We sent a verification link to `{email}`. Click it to activate your account."
- **"I've verified — continue"** button:
  1. Call `user.reload()`
  2. Read `auth.currentUser?.emailVerified`
  3. If true: navigate to `/dashboard`
  4. If false: show inline error "Email not yet verified — please check your inbox and try again"
- **"Resend email"** button:
  - Calls `sendVerificationEmail(auth.currentUser)`
  - Disabled for 60 seconds after each send
  - Shows confirmation text: "Email sent!" while in cooldown
- **"Sign out"** link: calls `signOut()`, navigates to `/login` — for users who signed up with the wrong email

## Out of Scope

- Custom Firebase email templates (uses Firebase default)
- Two-factor authentication
- Blocking sign-in for unverified users (the sign-in flow is unchanged; the gate is purely in `ProtectedRoute`)
