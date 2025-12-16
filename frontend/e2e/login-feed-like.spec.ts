import { test, expect } from '@playwright/test';

const username = process.env.E2E_USER;
const password = process.env.E2E_PASS;

test.describe('login → mainpage → feed like flow', () => {
  test.skip(!username || !password, 'E2E_USER and E2E_PASS env vars are required');

  test('user can log in, open feed, create & like a post', async ({ page }) => {
    const postContent = `Playwright post ${Date.now()}`;

    // Login
    await page.goto('/auth/login');
    await page.fill('#email', username!);
    await page.fill('#password', password!);
    await page.getByRole('button', { name: /login/i }).click();

    // Should land on mainpage after auth redirect (or already be there)
    await page.waitForLoadState('networkidle');
    if (!page.url().includes('/mainpage')) {
      await page.goto('/mainpage', { waitUntil: 'networkidle' });
    }

    // Navigate to feed via navbar
    await page.getByRole('button', { name: 'Feed', exact: true }).click();
    await page.waitForURL('**/feed', { timeout: 10_000 });

    // Create a new post to guarantee content exists
    await page.getByRole('button', { name: /create post/i }).click();
    await page.getByLabel(/content/i).fill(postContent);
    await page.getByRole('button', { name: /post/i }).click();

    // Wait for the new post to appear
    await expect(page.getByText(postContent)).toBeVisible({ timeout: 10_000 });

    // Like the newly created post (first "Like post" button should belong to it)
    const likeButton = page.getByRole('button', { name: /like post/i }).first();
    await likeButton.click();
    await expect(likeButton).toHaveAttribute('aria-label', /unlike post/i);
  });
});

