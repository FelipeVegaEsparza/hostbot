# Quick Start Guide - i18n Testing

## 🚀 Quick Setup (First Time Only)

```bash
cd dashboard
npm install
npx playwright install
```

## ✅ Verify Setup

```bash
node tests/verify-i18n-setup.js
```

Expected output: All 15 checks should pass ✅

## 🧪 Run Tests

### Option 1: Run All Tests (Headless)
```bash
npm test
```

### Option 2: Run Tests with Visual UI (Recommended for First Time)
```bash
npm run test:ui
```

### Option 3: Run Tests with Browser Visible
```bash
npm run test:headed
```

## 📊 View Results

After running tests:
```bash
npm run test:report
```

## 🔍 Quick Manual Test

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Open browser: `http://localhost:3002`

3. Test language switching:
   - Click language selector (top right)
   - Switch to English
   - Navigate to different pages
   - Refresh page
   - Verify language persists

## 📖 Full Documentation

- **Automated Tests**: See `tests/README.md`
- **Manual Testing**: See `tests/MANUAL_TESTING_GUIDE.md`
- **Test Code**: See `tests/i18n.spec.ts`

## ❓ Troubleshooting

### Tests won't run
```bash
# Reinstall Playwright browsers
npx playwright install --with-deps
```

### Dev server not starting
```bash
# Check if port 3002 is available
# Or update playwright.config.ts with different port
```

### Tests failing
```bash
# Run with debug mode
npx playwright test --debug
```

## 🎯 What Gets Tested

✅ Default language (Spanish)  
✅ Language switching (Spanish ↔ English)  
✅ Persistence across navigation  
✅ Persistence after refresh  
✅ localStorage storage  
✅ Browser back/forward  
✅ Direct URL access  
✅ Cross-browser (Chrome, Firefox, Safari)  
✅ Mobile browsers  
✅ Edge cases  

## 📝 Requirements Validated

- ✅ Requirement 1.4: Language preference persistence
- ✅ Requirement 2.3: Language switching functionality
- ✅ Requirement 2.4: Persistence across navigation
- ✅ Requirement 2.5: localStorage storage

---

**Need help?** Check the full documentation in `tests/README.md`
