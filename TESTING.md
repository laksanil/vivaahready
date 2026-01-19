# Testing Guide for VivaahReady

## Quick Reference

### Running Tests

```bash
# Run all unit tests
npm run test

# Run all E2E tests
npm run test:e2e

# Run both unit and E2E tests
npm run test:all

# Quick smoke tests (fast, covers critical paths)
npm run test:quick

# Interactive mode for debugging
npm run test:watch        # Unit tests with hot reload
npm run test:e2e:ui       # E2E tests with visual UI
npm run test:e2e:headed   # E2E tests in visible browser
```

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests (Playwright)
│   ├── navigation.spec.ts  # Page navigation & links
│   ├── auth.spec.ts        # Authentication flows
│   ├── signup-modal.spec.ts # Registration modal
│   ├── end-to-end-flow.spec.ts # Full user journey (signup → profile → matches → admin → messaging)
│   ├── api-health.spec.ts  # API endpoint health
│   └── responsive.spec.ts  # Mobile/tablet/desktop
├── unit/                   # Unit tests (Vitest)
│   ├── constants.test.ts   # Option arrays validation
│   └── utils.test.ts       # Utility function tests
├── api/                    # API logic tests
│   └── routes.test.ts      # Route validation logic
└── setup.ts                # Test configuration
```

## What Each Test Suite Covers

### E2E Tests (tests/e2e/)

1. **navigation.spec.ts** - Tests all public pages load correctly
   - Homepage, About, Pricing, Privacy, Terms
   - Login, Register pages
   - Navbar and footer links
   - 404 handling

2. **auth.spec.ts** - Tests authentication flows
   - Login form validation
   - Invalid credentials handling
   - Protected route access
   - Admin authentication

3. **signup-modal.spec.ts** - Tests the registration modal
   - Modal opens correctly
   - Step navigation
   - Form validation
   - Modal close functionality

4. **api-health.spec.ts** - Tests API endpoints
   - All API routes respond (no 500 errors)
   - Protected routes require auth
   - Error handling for invalid data

5. **end-to-end-flow.spec.ts** - Full onboarding + matching + messaging journey
   - User signup via FindMatchModal
   - Photo upload flow
   - Admin approvals
   - Matching + mutual likes
   - Messaging and profile edits

6. **responsive.spec.ts** - Tests responsive design
   - Mobile view (iPhone 13)
   - Tablet view (iPad Mini)
   - Desktop view (1920x1080)

### Unit Tests (tests/unit/)

1. **constants.test.ts** - Validates option arrays
   - HEIGHT_OPTIONS, QUALIFICATION_OPTIONS
   - HOBBIES_OPTIONS, FITNESS_OPTIONS, INTERESTS_OPTIONS
   - Preference options
   - No duplicate values

2. **utils.test.ts** - Tests utility functions
   - Age calculation
   - Height parsing/formatting
   - Name formatting
   - Phone number formatting
   - Status formatting
   - Match percentage calculation

## Adding New Tests

### When to Add Tests

Add tests when you:
1. Create a new page or component
2. Add a new API endpoint
3. Implement a new feature
4. Fix a bug (add regression test)

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/page-url')
    await expect(page.locator('selector')).toBeVisible()
  })
})
```

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest'

describe('Function Name', () => {
  it('should return expected result', () => {
    expect(myFunction(input)).toBe(expected)
  })
})
```

## CI/CD Integration

For GitHub Actions, add this workflow:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install chromium
      - run: npm run test:ci
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-results
          path: test-results/
```

## Troubleshooting

### E2E Tests Failing

1. **Server not running**: E2E tests need the dev server
   ```bash
   npm run dev  # In one terminal
   npm run test:e2e  # In another
   ```

2. **Browser not installed**: Install Playwright browsers
   ```bash
   npx playwright install chromium
   ```

3. **Custom browser path**: Use a system Chrome or a custom Chromium binary
   ```bash
   PLAYWRIGHT_USE_SYSTEM_CHROME=1 npm run test:e2e
   # or
   PLAYWRIGHT_CHROME_EXECUTABLE_PATH=/path/to/chrome npm run test:e2e
   ```

4. **Pass extra Chrome flags**:
   ```bash
   PLAYWRIGHT_CHROME_ARGS="--disable-crashpad" npm run test:e2e
   ```

5. **Skip DB reset (not recommended)**:
   ```bash
   E2E_SKIP_DB_SETUP=1 npm run test:e2e
   ```

6. **Flaky tests**: Add `test.slow()` or increase timeout
   ```typescript
   test('slow test', async ({ page }) => {
     test.slow()
     // ...
   })
   ```

### Unit Tests Failing

1. **Module not found**: Check path aliases in vitest.config.ts
2. **Mock issues**: Update mocks in tests/setup.ts

## Test Commands for Claude Code

When working with Claude Code, use these commands:

```bash
# Before making changes - run quick tests
npm run test:quick

# After changes - run full suite
npm run test:all

# Debug specific test
npm run test:watch -- tests/unit/utils.test.ts
npx playwright test tests/e2e/auth.spec.ts --headed
```
