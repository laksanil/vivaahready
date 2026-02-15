# Feedback + Admin Security Test Plan

## Scope
Recent changes under test:
- Feedback submission requires login
- Feedback identity uses WhatsApp/phone (not client-provided email/user payload)
- Admin feedback panel shows phone + user context with masking/copy/filter/drilldown
- `/api/admin/*` and `/admin/*` access control
- Feedback schema fields persisted as expected

## Test Matrix

### 1) Feedback Page Auth Gate (`/feedback`)
- Logged out user visiting `/feedback` is redirected to `/login` with `callbackUrl` back to `/feedback` (including `from` query if present)
- Logged in user with phone can load feedback page/form
- Logged in user without phone is blocked with add-phone CTA

### 2) Feedback Widget Behavior
- Logged out user clicking widget routes to `/login?callbackUrl=/feedback?from=...`
- Logged in user clicking widget routes to `/feedback?from=currentPath`

### 3) Feedback Submission API (`POST /api/feedback`)
- `401 AUTH_REQUIRED` when not logged in
- `400 PHONE_REQUIRED` when logged in but no valid phone on profile
- `200 OK` when logged in with valid phone and valid payload
- Persisted fields include: `userId`, `userPhone` normalized, `userPhoneLast4`, `overallStars`, `primaryIssue`, `stepBData`
- Spoof attempt: client-provided `userId`/`userPhone` ignored; stored values come from server-side user context

### 4) Phone Normalization + Masking Unit Coverage
- `normalizePhoneE164('+1 (408) 555-1234') -> '+14085551234'`
- `maskPhone('+14085551234') -> '+1******1234'`
- `getPhoneLast4('+14085551234') -> '1234'`

### 5) Admin Security (Pages)
- Logged out visiting `/admin/feedback` is blocked (redirect/login)
- Logged in non-admin visiting `/admin/feedback` is blocked
- Admin user can load `/admin/feedback`

### 6) Admin APIs
- `GET /api/admin/feedback` blocked for non-admin, allowed for admin
- `GET /api/admin/feedback/summary` blocked for non-admin, allowed for admin
- Filter behavior:
  - `phone` (last4/partial)
  - `verified=true|false`
  - `minStars`
  - `issue`
  - `startDate` / `endDate`
- Response includes fields needed by admin table/detail: `userPhone`, `userId`, `isVerified`, `createdAt`, `primaryIssue`, `summaryText`, `issueTags`

### 7) Admin UI Data Rendering
- Admin list table shows masked phone and verified badge
- Admin detail page (`/admin/feedback/[id]`) shows full user context and drilldown link to all feedback from same number
- Copy controls exist for phone/context values

## Determinism
- Unit/API tests mock auth and DB (`vitest` module mocks)
- E2E uses generated unique users and cleanup registry/global teardown
- No dependence on external APIs for pass/fail

## Commands To Run
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `npm run test`
- `E2E_SKIP_DB_SETUP=1 npm run test:e2e -- tests/e2e/feedback-auth-widget.spec.ts tests/e2e/admin-feedback-access.spec.ts`
