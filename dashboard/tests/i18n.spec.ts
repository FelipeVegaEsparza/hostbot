/**
 * Language Switching E2E Tests
 * 
 * Tests for Requirements: 1.4, 2.3, 2.4, 2.5
 * 
 * These tests verify:
 * - Switching between Spanish and English
 * - Language persists across navigation
 * - Language persists after page refresh
 * - Browser compatibility
 */

import { test, expect, Page } from '@playwright/test';

// Helper function to check if text is in Spanish
async function expectSpanishContent(page: Page) {
  // Check for common Spanish words in the navigation
  await expect(page.getByText('Panel de Control')).toBeVisible();
  await expect(page.getByText('Chatbots')).toBeVisible();
  await expect(page.getByText('Conversaciones')).toBeVisible();
}

// Helper function to check if text is in English
async function expectEnglishContent(page: Page) {
  // Check for common English words in the navigation
  await expect(page.getByText('Dashboard')).toBeVisible();
  await expect(page.getByText('Chatbots')).toBeVisible();
  await expect(page.getByText('Conversations')).toBeVisible();
}

test.describe('Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should display Spanish by default (Requirement 1.4)', async ({ page }) => {
    await page.goto('/');
    
    // Verify Spanish is the default language
    const languageSelector = page.locator('select[aria-label="Select language"]');
    await expect(languageSelector).toHaveValue('es');
    
    // Verify Spanish content is displayed
    await expectSpanishContent(page);
  });

  test('should switch from Spanish to English (Requirement 2.3)', async ({ page }) => {
    await page.goto('/');
    
    // Verify we start with Spanish
    const languageSelector = page.locator('select[aria-label="Select language"]');
    await expect(languageSelector).toHaveValue('es');
    
    // Switch to English
    await languageSelector.selectOption('en');
    
    // Wait for navigation and content update
    await page.waitForLoadState('networkidle');
    
    // Verify English is now selected
    await expect(languageSelector).toHaveValue('en');
    
    // Verify English content is displayed
    await expectEnglishContent(page);
    
    // Verify URL contains /en prefix
    expect(page.url()).toContain('/en');
  });

  test('should switch from English to Spanish (Requirement 2.3)', async ({ page }) => {
    // Start with English
    await page.goto('/en');
    
    const languageSelector = page.locator('select[aria-label="Select language"]');
    await expect(languageSelector).toHaveValue('en');
    
    // Switch to Spanish
    await languageSelector.selectOption('es');
    
    // Wait for navigation and content update
    await page.waitForLoadState('networkidle');
    
    // Verify Spanish is now selected
    await expect(languageSelector).toHaveValue('es');
    
    // Verify Spanish content is displayed
    await expectSpanishContent(page);
    
    // Verify URL does not contain /en prefix (Spanish is default)
    expect(page.url()).not.toContain('/en');
  });

  test('should persist language across navigation (Requirement 2.4)', async ({ page }) => {
    await page.goto('/');
    
    // Switch to English
    const languageSelector = page.locator('select[aria-label="Select language"]');
    await languageSelector.selectOption('en');
    await page.waitForLoadState('networkidle');
    
    // Navigate to different pages
    await page.click('text=Chatbots');
    await page.waitForLoadState('networkidle');
    await expect(languageSelector).toHaveValue('en');
    await expectEnglishContent(page);
    
    await page.click('text=Conversations');
    await page.waitForLoadState('networkidle');
    await expect(languageSelector).toHaveValue('en');
    await expectEnglishContent(page);
    
    await page.click('text=Knowledge Base');
    await page.waitForLoadState('networkidle');
    await expect(languageSelector).toHaveValue('en');
    await expectEnglishContent(page);
  });

  test('should persist language after page refresh (Requirement 2.5)', async ({ page }) => {
    await page.goto('/');
    
    // Switch to English
    const languageSelector = page.locator('select[aria-label="Select language"]');
    await languageSelector.selectOption('en');
    await page.waitForLoadState('networkidle');
    
    // Verify English is selected
    await expect(languageSelector).toHaveValue('en');
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify English is still selected after refresh
    await expect(languageSelector).toHaveValue('en');
    await expectEnglishContent(page);
    
    // Verify localStorage has the preference
    const storedLocale = await page.evaluate(() => localStorage.getItem('preferred-locale'));
    expect(storedLocale).toBe('en');
  });

  test('should save language preference to localStorage (Requirement 2.5)', async ({ page }) => {
    await page.goto('/');
    
    // Switch to English
    const languageSelector = page.locator('select[aria-label="Select language"]');
    await languageSelector.selectOption('en');
    await page.waitForLoadState('networkidle');
    
    // Check localStorage
    const storedLocale = await page.evaluate(() => localStorage.getItem('preferred-locale'));
    expect(storedLocale).toBe('en');
    
    // Switch back to Spanish
    await languageSelector.selectOption('es');
    await page.waitForLoadState('networkidle');
    
    // Check localStorage updated
    const updatedLocale = await page.evaluate(() => localStorage.getItem('preferred-locale'));
    expect(updatedLocale).toBe('es');
  });

  test('should maintain language when navigating with browser back/forward', async ({ page }) => {
    await page.goto('/');
    
    // Switch to English
    const languageSelector = page.locator('select[aria-label="Select language"]');
    await languageSelector.selectOption('en');
    await page.waitForLoadState('networkidle');
    
    // Navigate to another page
    await page.click('text=Chatbots');
    await page.waitForLoadState('networkidle');
    
    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Verify language is still English
    await expect(languageSelector).toHaveValue('en');
    await expectEnglishContent(page);
    
    // Go forward
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    // Verify language is still English
    await expect(languageSelector).toHaveValue('en');
    await expectEnglishContent(page);
  });

  test('should handle direct URL access with locale prefix', async ({ page }) => {
    // Access English version directly
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');
    
    const languageSelector = page.locator('select[aria-label="Select language"]');
    await expect(languageSelector).toHaveValue('en');
    await expectEnglishContent(page);
    
    // Access Spanish version directly (no prefix)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(languageSelector).toHaveValue('es');
    await expectSpanishContent(page);
  });
});

test.describe('Language Switching - Cross-Browser', () => {
  test('should work in Chromium', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium-specific test');
    
    await page.goto('/');
    const languageSelector = page.locator('select[aria-label="Select language"]');
    
    await languageSelector.selectOption('en');
    await page.waitForLoadState('networkidle');
    
    await expect(languageSelector).toHaveValue('en');
    await expectEnglishContent(page);
  });

  test('should work in Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test');
    
    await page.goto('/');
    const languageSelector = page.locator('select[aria-label="Select language"]');
    
    await languageSelector.selectOption('en');
    await page.waitForLoadState('networkidle');
    
    await expect(languageSelector).toHaveValue('en');
    await expectEnglishContent(page);
  });

  test('should work in WebKit (Safari)', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'WebKit-specific test');
    
    await page.goto('/');
    const languageSelector = page.locator('select[aria-label="Select language"]');
    
    await languageSelector.selectOption('en');
    await page.waitForLoadState('networkidle');
    
    await expect(languageSelector).toHaveValue('en');
    await expectEnglishContent(page);
  });
});

test.describe('Language Switching - Edge Cases', () => {
  test('should not break when switching language multiple times rapidly', async ({ page }) => {
    await page.goto('/');
    const languageSelector = page.locator('select[aria-label="Select language"]');
    
    // Rapidly switch languages
    await languageSelector.selectOption('en');
    await languageSelector.selectOption('es');
    await languageSelector.selectOption('en');
    await languageSelector.selectOption('es');
    
    await page.waitForLoadState('networkidle');
    
    // Should end up with Spanish
    await expect(languageSelector).toHaveValue('es');
    await expectSpanishContent(page);
  });

  test('should handle invalid locale in URL gracefully', async ({ page }) => {
    // Try to access with invalid locale
    const response = await page.goto('/invalid-locale/dashboard');
    
    // Should return 404 or redirect
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });
});
