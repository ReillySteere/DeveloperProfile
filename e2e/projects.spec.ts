import { test, expect } from '@playwright/test';

test.describe('Projects Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
  });

  test('Projects page renders correctly', async ({ page }) => {
    // Wait for project cards to load
    await expect(page.locator('[class*="container"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Verify the page has loaded with content
    // Projects page should display project cards
    const content = page.locator('main, [id="projects"]');
    await expect(content).toBeVisible();
  });

  test('Projects page displays project cards', async ({ page }) => {
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Check that there are elements that look like project cards
    // Each project should have some kind of heading or title
    const headings = page.locator('h1, h2, h3, h4');
    await expect(headings.first()).toBeVisible({ timeout: 10000 });
  });
});
