/// <reference types="node" />
import { test, expect } from '@playwright/test';

const username = process.env.E2E_USER;
const password = process.env.E2E_PASS;

const WASTE_TYPES = ['GLASS', 'METAL', 'ORGANIC', 'PAPER', 'PLASTIC'] as const;

test.describe('create goals for all waste types', () => {
  test.skip(!username || !password, 'E2E_USER and E2E_PASS env vars are required');

  test('creates goals with duration 10 and amount 1000 for each type', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('#email', username!);
    await page.fill('#password', password!);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForLoadState('networkidle');
    if (!page.url().includes('/mainpage')) {
      await page.goto('/mainpage', { waitUntil: 'networkidle' });
    }

    // Go to goals
    await page.goto('/goals', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/goals/);

    for (const type of WASTE_TYPES) {
      await page.getByRole('button', { name: /create goal/i }).click();
      await page.selectOption('#goal-type', type);
      await page.fill('#goal-duration', '10');
      await page.fill('#goal-restriction', '1000');
      await page.getByRole('button', { name: /save|kaydet/i }).click();

      // Wait for the goal card to show the type
      await expect(page.getByText(new RegExp(`${type}\\s+goal`, 'i'))).toBeVisible({ timeout: 10_000 });
    }
  });
});

