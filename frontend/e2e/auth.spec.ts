import { test, expect } from '@playwright/test';

test('register page renders form fields', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /sign up|register/i }).click();

  await expect(page).toHaveURL(/\/auth\/register/);
  await expect(page.getByLabel(/username/i)).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /register|sign up/i })).toBeVisible();
});

