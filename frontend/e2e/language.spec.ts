import { test, expect } from '@playwright/test';

const toggleLocator = 'button[aria-label*="language"], button[aria-label*="Dili"]';

test('language toggle persists after reload', async ({ page }) => {
  await page.goto('/');

  // Switch language
  await page.locator(toggleLocator).click();

  // UI should update to Turkish login text
  await expect(page.getByRole('button', { name: /giriş yap/i })).toBeVisible();

  // Persisted in localStorage
  const stored = await page.evaluate(() => localStorage.getItem('appLanguage'));
  expect(stored).toBe('tr');

  // After reload it should stay Turkish
  await page.reload();
  await expect(page.getByRole('button', { name: /giriş yap/i })).toBeVisible();
});

