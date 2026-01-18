import { test, expect } from '@playwright/test';

test.describe('Experience Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/experience');
  });

  test('Experience page renders correctly', async ({ page }) => {
    // Wait for experience sections to load
    await expect(page.locator('section').first()).toBeVisible({
      timeout: 10000,
    });

    // Verify there are experience entries (sections) displayed
    const sections = page.locator('section');
    await expect(sections).not.toHaveCount(0);
  });

  test('Experience page displays company/role information', async ({
    page,
  }) => {
    // Wait for content to load
    await expect(page.locator('section').first()).toBeVisible({
      timeout: 10000,
    });

    // Check that there's at least one heading with experience information
    // The page should have experience entries with titles/roles
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible();
  });
});
