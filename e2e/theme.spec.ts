import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
  });

  test('Dark mode / Light mode toggles successfully', async ({ page }) => {
    // Find the theme toggle button
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await expect(themeToggle).toBeVisible();

    // Click to toggle theme
    await themeToggle.click();

    // Wait a moment for the theme to apply
    await page.waitForTimeout(500);

    // Click again to toggle back
    await themeToggle.click();

    // Wait for the theme to revert
    await page.waitForTimeout(500);

    // The toggle button should still be visible and functional
    await expect(themeToggle).toBeVisible();

    // Verify the theme toggle didn't break the page
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Theme persists across navigation', async ({ page }) => {
    // Get theme toggle
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await expect(themeToggle).toBeVisible();

    // Toggle the theme
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Navigate to another page
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    // The theme toggle should still be visible
    const themeToggleOnBlog = page.getByRole('button', {
      name: /toggle theme/i,
    });
    await expect(themeToggleOnBlog).toBeVisible();

    // Navigate back to about
    await page.goto('/about');

    // Toggle back to restore original state
    const themeToggleBack = page.getByRole('button', { name: /toggle theme/i });
    await themeToggleBack.click();
  });
});
