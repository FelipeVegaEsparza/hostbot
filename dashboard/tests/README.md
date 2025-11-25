# i18n Testing Suite

This directory contains automated and manual tests for the internationalization (i18n) implementation.

## Overview

The testing suite validates the following requirements:
- **Requirement 1.4**: Language preference persistence
- **Requirement 2.3**: Language switching functionality
- **Requirement 2.4**: Language persistence across navigation
- **Requirement 2.5**: Language preference storage

## Test Files

### Automated Tests

- **`i18n.spec.ts`**: Playwright E2E tests for language switching
  - Basic language switching (Spanish ↔ English)
  - Language persistence across navigation
  - Language persistence after page refresh
  - Browser back/forward navigation
  - Direct URL access with locale prefix
  - Cross-browser compatibility
  - Edge cases and error handling

### Manual Testing

- **`MANUAL_TESTING_GUIDE.md`**: Comprehensive manual testing checklist
  - Step-by-step testing procedures
  - Expected results for each test
  - Cross-browser testing instructions
  - Mobile browser testing
  - Content verification
  - Performance testing

## Setup

### Install Dependencies

```bash
cd dashboard
npm install
```

This will install Playwright and all necessary testing dependencies.

### Install Playwright Browsers

```bash
npx playwright install
```

This installs the browser binaries needed for testing (Chromium, Firefox, WebKit).

## Running Tests

### Run All Tests

```bash
npm test
```

This runs all tests in headless mode across all configured browsers.

### Run Tests with UI

```bash
npm run test:ui
```

Opens the Playwright UI for interactive test running and debugging.

### Run Tests in Headed Mode

```bash
npm run test:headed
```

Runs tests with visible browser windows (useful for debugging).

### Run Tests for Specific Browser

```bash
# Chromium only
npm run test:chromium

# Firefox only
npm run test:firefox

# WebKit (Safari) only
npm run test:webkit
```

### Run Mobile Tests

```bash
npm run test:mobile
```

Runs tests on mobile browser emulations (Mobile Chrome and Mobile Safari).

### View Test Report

```bash
npm run test:report
```

Opens the HTML test report in your browser.

## Test Structure

### Test Suites

1. **Language Switching**: Basic functionality tests
   - Default language display
   - Switching between languages
   - URL updates

2. **Language Switching - Cross-Browser**: Browser compatibility
   - Chromium/Chrome
   - Firefox
   - WebKit/Safari

3. **Language Switching - Edge Cases**: Error handling
   - Rapid language switching
   - Invalid locale handling

### Helper Functions

- `expectSpanishContent(page)`: Verifies Spanish content is displayed
- `expectEnglishContent(page)`: Verifies English content is displayed

## Manual Testing

For comprehensive manual testing, follow the guide in `MANUAL_TESTING_GUIDE.md`.

The manual testing guide includes:
- 9 test suites with 25+ individual tests
- Cross-browser testing procedures
- Mobile browser testing
- Content verification checklists
- Performance testing
- Edge case scenarios

## CI/CD Integration

The tests are configured to run in CI environments. The configuration includes:
- Automatic retries on failure (2 retries in CI)
- Single worker in CI for stability
- Trace collection on first retry
- Screenshots on failure

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: |
          cd dashboard
          npm ci
      - name: Install Playwright Browsers
        run: |
          cd dashboard
          npx playwright install --with-deps
      - name: Run tests
        run: |
          cd dashboard
          npm test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: dashboard/playwright-report/
```

## Debugging Tests

### Debug a Specific Test

```bash
npx playwright test --debug i18n.spec.ts
```

### Debug with Playwright Inspector

```bash
PWDEBUG=1 npm test
```

### View Trace

If a test fails, you can view the trace:

```bash
npx playwright show-trace trace.zip
```

## Test Coverage

The automated tests cover:
- ✅ Default language display (Spanish)
- ✅ Switching from Spanish to English
- ✅ Switching from English to Spanish
- ✅ Language persistence across page navigation
- ✅ Language persistence after page refresh
- ✅ localStorage preference storage
- ✅ Browser back/forward navigation
- ✅ Direct URL access with locale prefix
- ✅ Cross-browser compatibility (Chromium, Firefox, WebKit)
- ✅ Mobile browser compatibility
- ✅ Rapid language switching
- ✅ Invalid locale handling

## Known Issues

None at this time.

## Contributing

When adding new i18n features:
1. Add corresponding tests to `i18n.spec.ts`
2. Update the manual testing guide if needed
3. Run all tests to ensure no regressions
4. Update this README if test structure changes

## Support

For issues or questions about the tests:
1. Check the Playwright documentation: https://playwright.dev
2. Review the test output and traces
3. Consult the manual testing guide for detailed procedures
