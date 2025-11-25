# Manual Testing Guide for Language Switching

This guide provides step-by-step instructions for manually testing the i18n (internationalization) implementation.

**Requirements Tested:** 1.4, 2.3, 2.4, 2.5

## Prerequisites

1. Start the development server:
   ```bash
   cd dashboard
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3002`

## Test Suite 1: Basic Language Switching

### Test 1.1: Default Language (Requirement 1.4)
**Objective:** Verify Spanish is the default language

**Steps:**
1. Open the application in a new incognito/private window
2. Navigate to `http://localhost:3002`
3. Observe the language selector in the top navigation

**Expected Results:**
- ✅ Language selector shows "Español" selected
- ✅ All text on the page is in Spanish
- ✅ Navigation items show: "Panel de Control", "Chatbots", "Conversaciones", "Base de Conocimiento", "WhatsApp", "Facturación", "Configuración"
- ✅ URL does not contain `/en` prefix

**Status:** [ ] Pass [ ] Fail

---

### Test 1.2: Switch to English (Requirement 2.3)
**Objective:** Verify switching from Spanish to English works

**Steps:**
1. Start from the default Spanish page
2. Click on the language selector dropdown
3. Select "English"
4. Wait for the page to reload

**Expected Results:**
- ✅ Language selector now shows "English" selected
- ✅ All text updates to English
- ✅ Navigation items show: "Dashboard", "Chatbots", "Conversations", "Knowledge Base", "WhatsApp", "Billing", "Settings"
- ✅ URL now contains `/en` prefix (e.g., `http://localhost:3002/en`)
- ✅ Page transition is smooth without errors

**Status:** [ ] Pass [ ] Fail

---

### Test 1.3: Switch Back to Spanish (Requirement 2.3)
**Objective:** Verify switching from English to Spanish works

**Steps:**
1. From the English page (with `/en` in URL)
2. Click on the language selector dropdown
3. Select "Español"
4. Wait for the page to reload

**Expected Results:**
- ✅ Language selector now shows "Español" selected
- ✅ All text updates to Spanish
- ✅ URL no longer contains `/en` prefix
- ✅ Page transition is smooth without errors

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 2: Language Persistence Across Navigation

### Test 2.1: Persist Language When Navigating (Requirement 2.4)
**Objective:** Verify language persists when navigating between pages

**Steps:**
1. Start from the home page in Spanish
2. Switch to English
3. Click on "Chatbots" in the navigation
4. Observe the language
5. Click on "Conversations"
6. Observe the language
7. Click on "Knowledge Base"
8. Observe the language
9. Click on "WhatsApp"
10. Observe the language

**Expected Results:**
- ✅ Language remains English on all pages
- ✅ Language selector shows "English" on all pages
- ✅ All URLs maintain the `/en` prefix
- ✅ No automatic language switching occurs

**Status:** [ ] Pass [ ] Fail

---

### Test 2.2: Persist Language After Page Refresh (Requirement 2.5)
**Objective:** Verify language persists after refreshing the page

**Steps:**
1. Start from the home page in Spanish
2. Switch to English
3. Verify English content is displayed
4. Press F5 or click the browser refresh button
5. Wait for the page to reload

**Expected Results:**
- ✅ Page reloads in English
- ✅ Language selector still shows "English"
- ✅ All content remains in English
- ✅ URL still contains `/en` prefix

**Status:** [ ] Pass [ ] Fail

---

### Test 2.3: Persist Language After Browser Restart
**Objective:** Verify language persists after closing and reopening the browser

**Steps:**
1. Start from the home page in Spanish
2. Switch to English
3. Close the browser completely
4. Reopen the browser
5. Navigate to `http://localhost:3002`

**Expected Results:**
- ✅ Page loads in English (last selected language)
- ✅ Language selector shows "English"
- ✅ localStorage contains `preferred-locale: "en"`

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 3: Browser Back/Forward Navigation

### Test 3.1: Language Persists with Browser Back Button
**Objective:** Verify language persists when using browser back button

**Steps:**
1. Start from home page in Spanish
2. Switch to English
3. Navigate to Chatbots page
4. Navigate to Conversations page
5. Click browser back button twice
6. Observe the language on each page

**Expected Results:**
- ✅ Language remains English when going back
- ✅ Language selector shows "English" on all pages
- ✅ Content remains in English

**Status:** [ ] Pass [ ] Fail

---

### Test 3.2: Language Persists with Browser Forward Button
**Objective:** Verify language persists when using browser forward button

**Steps:**
1. Complete Test 3.1 first
2. Click browser forward button twice
3. Observe the language on each page

**Expected Results:**
- ✅ Language remains English when going forward
- ✅ Language selector shows "English" on all pages
- ✅ Content remains in English

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 4: Direct URL Access

### Test 4.1: Access English Version Directly
**Objective:** Verify accessing English version via direct URL works

**Steps:**
1. Open a new incognito/private window
2. Navigate directly to `http://localhost:3002/en/dashboard`

**Expected Results:**
- ✅ Page loads in English
- ✅ Language selector shows "English"
- ✅ All content is in English
- ✅ URL contains `/en` prefix

**Status:** [ ] Pass [ ] Fail

---

### Test 4.2: Access Spanish Version Directly
**Objective:** Verify accessing Spanish version via direct URL works

**Steps:**
1. Open a new incognito/private window
2. Navigate directly to `http://localhost:3002/dashboard`

**Expected Results:**
- ✅ Page loads in Spanish
- ✅ Language selector shows "Español"
- ✅ All content is in Spanish
- ✅ URL does not contain `/en` prefix

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 5: Cross-Browser Testing

### Test 5.1: Chrome/Chromium
**Objective:** Verify language switching works in Chrome

**Steps:**
1. Open Google Chrome
2. Navigate to `http://localhost:3002`
3. Perform Tests 1.1, 1.2, 2.1, and 2.2

**Expected Results:**
- ✅ All tests pass in Chrome
- ✅ No console errors
- ✅ Smooth transitions

**Status:** [ ] Pass [ ] Fail

---

### Test 5.2: Firefox
**Objective:** Verify language switching works in Firefox

**Steps:**
1. Open Mozilla Firefox
2. Navigate to `http://localhost:3002`
3. Perform Tests 1.1, 1.2, 2.1, and 2.2

**Expected Results:**
- ✅ All tests pass in Firefox
- ✅ No console errors
- ✅ Smooth transitions

**Status:** [ ] Pass [ ] Fail

---

### Test 5.3: Safari (macOS only)
**Objective:** Verify language switching works in Safari

**Steps:**
1. Open Safari
2. Navigate to `http://localhost:3002`
3. Perform Tests 1.1, 1.2, 2.1, and 2.2

**Expected Results:**
- ✅ All tests pass in Safari
- ✅ No console errors
- ✅ Smooth transitions

**Status:** [ ] Pass [ ] Fail

---

### Test 5.4: Edge
**Objective:** Verify language switching works in Microsoft Edge

**Steps:**
1. Open Microsoft Edge
2. Navigate to `http://localhost:3002`
3. Perform Tests 1.1, 1.2, 2.1, and 2.2

**Expected Results:**
- ✅ All tests pass in Edge
- ✅ No console errors
- ✅ Smooth transitions

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 6: Mobile Browser Testing

### Test 6.1: Mobile Chrome (Android)
**Objective:** Verify language switching works on mobile Chrome

**Steps:**
1. Open Chrome on Android device or use Chrome DevTools mobile emulation
2. Navigate to `http://localhost:3002`
3. Perform Tests 1.1, 1.2, 2.1, and 2.2

**Expected Results:**
- ✅ Language selector is accessible on mobile
- ✅ All tests pass on mobile Chrome
- ✅ Touch interactions work properly

**Status:** [ ] Pass [ ] Fail

---

### Test 6.2: Mobile Safari (iOS)
**Objective:** Verify language switching works on mobile Safari

**Steps:**
1. Open Safari on iOS device or use Safari DevTools mobile emulation
2. Navigate to `http://localhost:3002`
3. Perform Tests 1.1, 1.2, 2.1, and 2.2

**Expected Results:**
- ✅ Language selector is accessible on mobile
- ✅ All tests pass on mobile Safari
- ✅ Touch interactions work properly

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 7: Edge Cases

### Test 7.1: Rapid Language Switching
**Objective:** Verify system handles rapid language switching

**Steps:**
1. Navigate to home page
2. Quickly switch between Spanish and English 5 times
3. Observe the final state

**Expected Results:**
- ✅ No errors occur
- ✅ Final language matches the last selection
- ✅ Content displays correctly
- ✅ No UI glitches

**Status:** [ ] Pass [ ] Fail

---

### Test 7.2: Invalid Locale in URL
**Objective:** Verify system handles invalid locale gracefully

**Steps:**
1. Navigate to `http://localhost:3002/fr/dashboard` (French - not supported)
2. Observe the result

**Expected Results:**
- ✅ Shows 404 page or redirects to default locale
- ✅ No application crash
- ✅ Error is handled gracefully

**Status:** [ ] Pass [ ] Fail

---

### Test 7.3: localStorage Disabled
**Objective:** Verify system works when localStorage is disabled

**Steps:**
1. Open browser DevTools
2. Disable localStorage (in Application/Storage tab)
3. Navigate to home page
4. Switch to English
5. Refresh the page

**Expected Results:**
- ✅ Language switching still works
- ✅ Language may not persist after refresh (acceptable)
- ✅ No JavaScript errors

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 8: Content Verification

### Test 8.1: All Pages Translated
**Objective:** Verify all pages have complete translations

**Pages to Check:**
- [ ] Login page (`/login`)
- [ ] Register page (`/register`)
- [ ] Dashboard home (`/dashboard`)
- [ ] Chatbots list (`/dashboard/chatbots`)
- [ ] Chatbot details (`/dashboard/chatbots/[id]`)
- [ ] Conversations list (`/dashboard/conversations`)
- [ ] Conversation details (`/dashboard/conversations/[id]`)
- [ ] Knowledge base (`/dashboard/knowledge`)
- [ ] WhatsApp integration (`/dashboard/whatsapp`)
- [ ] Billing (`/dashboard/billing`)
- [ ] Settings (`/dashboard/settings`)
- [ ] Admin overview (`/dashboard/admin`)
- [ ] Admin users (`/dashboard/admin/users`)
- [ ] Admin customers (`/dashboard/admin/customers`)
- [ ] Admin plans (`/dashboard/admin/plans`)
- [ ] Admin subscriptions (`/dashboard/admin/subscriptions`)

**Steps for Each Page:**
1. Navigate to the page in Spanish
2. Verify all text is in Spanish
3. Switch to English
4. Verify all text is in English
5. Check for any untranslated text (translation keys showing)

**Expected Results:**
- ✅ No translation keys visible (e.g., "common.save")
- ✅ All buttons, labels, and messages are translated
- ✅ No mixed language content

**Status:** [ ] Pass [ ] Fail

---

### Test 8.2: Date and Number Formatting
**Objective:** Verify dates and numbers are formatted per locale

**Steps:**
1. Navigate to a page with dates (e.g., conversations, billing)
2. Observe date format in Spanish
3. Switch to English
4. Observe date format in English

**Expected Results:**
- ✅ Spanish uses DD/MM/YYYY format
- ✅ English uses MM/DD/YYYY format
- ✅ Numbers use appropriate separators
- ✅ Currency is formatted correctly

**Status:** [ ] Pass [ ] Fail

---

## Test Suite 9: Performance

### Test 9.1: Language Switch Performance
**Objective:** Verify language switching is fast

**Steps:**
1. Open browser DevTools Network tab
2. Switch from Spanish to English
3. Measure time to complete

**Expected Results:**
- ✅ Language switch completes in < 2 seconds
- ✅ No unnecessary network requests
- ✅ Smooth user experience

**Status:** [ ] Pass [ ] Fail

---

## Summary

**Total Tests:** 25
**Tests Passed:** ___
**Tests Failed:** ___
**Pass Rate:** ___%

## Issues Found

| Test ID | Issue Description | Severity | Status |
|---------|------------------|----------|--------|
|         |                  |          |        |

## Notes

Add any additional observations or notes here:

---

## Sign-off

**Tester Name:** _______________
**Date:** _______________
**Signature:** _______________
