import { test, expect } from '@playwright/test';

test('register page renders form fields', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /sign up|register/i }).first().click();

  await expect(page).toHaveURL(/\/auth\/register/);
  await expect(page.locator('#username')).toBeVisible();
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await expect(page.locator('#confirmPassword')).toBeVisible();
  await expect(page.getByRole('button', { name: /register|sign up/i }).first()).toBeVisible();
});

