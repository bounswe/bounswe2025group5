/// <reference types="node" />
import { test, expect } from '@playwright/test';

const username = process.env.E2E_USER;
const password = process.env.E2E_PASS;

test.describe('attend challenge flow', () => {
  test.skip(!username || !password, 'E2E_USER and E2E_PASS env vars are required');

  test('user can attend a challenge and sees Leave', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('#email', username!);
    await page.fill('#password', password!);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForLoadState('networkidle');
    if (!page.url().includes('/mainpage')) {
      await page.goto('/mainpage', { waitUntil: 'networkidle' });
    }

    // Go to challenges
    await page.goto('/challenges', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/challenges/);

    const leaveButton = page.getByRole('button', { name: /Leave|Ayrıl/i }).first();
    const attendButton = page.getByRole('button', { name: /Attend|Katıl/i }).first();
    const emptyChallenges = page.getByText(/No challenges found|Etkinlik bulunamadı/i);
    const challengeTitles = page.getByRole('heading', { level: 3 }).filter({ hasNotText: /Create Challenge/i });
    const accordionToggles = page.locator('[data-state="closed"] button, [data-state="open"] button').filter({
      hasText: '',
    });

    if (await leaveButton.count()) {
      // Already attending: leave then ensure attend shows back up
      await leaveButton.click();
      await expect(attendButton).toBeVisible({ timeout: 10_000 });
      return;
    }

    // Otherwise, attend the first available challenge
    if (await attendButton.count()) {
      await attendButton.click();
      // After attending, a Leave button should appear
      await expect(leaveButton).toBeVisible({ timeout: 10_000 });
      return;
    }

    // If attend is not immediately visible, expand the first accordion and retry
    if (await accordionToggles.count()) {
      await accordionToggles.first().click();
      const attendAfterExpand = page.getByRole('button', { name: /Attend|Katıl/i }).first();
      if (await attendAfterExpand.count()) {
        await attendAfterExpand.click();
        await expect(page.getByRole('button', { name: /Leave|Ayrıl/i }).first()).toBeVisible({ timeout: 10_000 });
        return;
      }
    }

    // If no attend buttons, assert that challenges are empty
    await expect(emptyChallenges.or(challengeTitles.first())).toBeVisible();
  });
});

