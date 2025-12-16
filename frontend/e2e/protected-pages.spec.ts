/// <reference types="node" />
import { test, expect } from '@playwright/test';

const username = process.env.E2E_USER;
const password = process.env.E2E_PASS;

test.describe('authenticated page smoke checks', () => {
  test.skip(!username || !password, 'E2E_USER and E2E_PASS env vars are required');

  test('mainpage, feed, goals, profile, challenges render', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('#email', username!);
    await page.fill('#password', password!);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForLoadState('networkidle');
    if (!page.url().includes('/mainpage')) {
      await page.goto('/mainpage', { waitUntil: 'networkidle' });
    }

    // Mainpage checks
    await expect(page).toHaveURL(/\/mainpage/);
    await expect(
      page.getByText(/Your Challenges|Katıldığınız Etkinlikler/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Following Feed|Takip Akışı/i)
    ).toBeVisible();
    // Ensure challenges are present (not the empty state)
    await expect(page.getByText(/No active challenges|Aktif etkinlik yok/i)).not.toBeVisible();
    // Ensure posts are present on mainpage feed
    const mainpageLikes = page.locator('[aria-label="Like post"]');
    await expect(mainpageLikes.first()).toBeVisible();

    // Feed checks
    await page.goto('/feed', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/feed/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /refresh|yenile/i })).toBeVisible();
    const feedLikes = page.locator('[aria-label="Like post"]');
    await expect(feedLikes.first()).toBeVisible();
    await expect(page.getByText(/No posts yet|Gönderi yok/i)).not.toBeVisible();

    // Goals checks
    await page.goto('/goals', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/goals/);
    await expect(page.getByText(/Goals|Hedefler/i)).toBeVisible();

    // Profile checks
    await page.goto('/profile', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole('heading', { name: /Posts|Gönderiler/i })).toBeVisible();

    // Challenges checks
    await page.goto('/challenges', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/challenges/);
    // Expect challenges content: either cards or the empty-state message
    const challengeTitles = page.getByRole('heading', { level: 3 }).filter({ hasNotText: /Create Challenge/i });
    const emptyChallenges = page.getByText(/No challenges found|Etkinlik bulunamadı/i);
    if (await challengeTitles.count()) {
      await expect(challengeTitles.first()).toBeVisible();
    } else {
      await expect(emptyChallenges).toBeVisible();
    }
  });
});

