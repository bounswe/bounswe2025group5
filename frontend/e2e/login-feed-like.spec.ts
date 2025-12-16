import { test, expect } from '@playwright/test';

const username = process.env.E2E_USER;
const password = process.env.E2E_PASS;

test.describe('login → mainpage → feed view', () => {
  test.skip(!username || !password, 'E2E_USER and E2E_PASS env vars are required');

  test('user can log in and see feed components', async ({ page }) => {
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

    // Feed header and key controls render
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create post/i })).toBeVisible();

    // Posts render or empty state shows
    const likeButtons = page.locator('[aria-label="Like post"]');
    if (!(await likeButtons.count())) {
      await expect(page.getByText(/No posts yet/i)).toBeVisible();
      return;
    }

    const commentButtons = page.getByRole('button', { name: /view .*comment|show comments|yorum/i });
    const commentCount = await commentButtons.count();
    expect(commentCount).toBeGreaterThan(0);

    // Open comments on the first post
    await commentButtons.first().click();

    // Add a new comment
    const commentInput = page.getByPlaceholder(/add a comment|yorum ekle/i);
    await expect(commentInput).toBeVisible();
    await commentInput.fill('e2e test');
    await page.getByRole('button', { name: /send comment|yorum gönder/i }).click();

    // Verify the comment appears
    await expect(page.getByText('e2e test')).toBeVisible({ timeout: 10_000 });
  });
});

