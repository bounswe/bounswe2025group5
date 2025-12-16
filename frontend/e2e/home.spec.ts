import { test, expect } from '@playwright/test';

test('home shows login and register entry points', async ({ page }) => {
  await page.goto('/');

  // Buttons from the landing carousel card
  const loginButton = page.getByRole('button', { name: /login/i });
  const registerButton = page.getByRole('button', { name: /sign up|register/i }).first();

  await expect(loginButton).toBeVisible();
  await expect(registerButton).toBeVisible();
});

