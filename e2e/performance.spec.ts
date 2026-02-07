import { test, expect } from '@playwright/test';

test.describe('Performance Observatory', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/performance');
  });

  test('renders Performance Observatory heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Performance Observatory');
  });

  test('displays Core Web Vitals section', async ({ page }) => {
    await expect(page.getByText('Core Web Vitals')).toBeVisible();
  });

  test('displays Network Waterfall section', async ({ page }) => {
    await expect(page.getByText('Network Waterfall')).toBeVisible();
  });

  test('displays Memory Usage section', async ({ page }) => {
    await expect(page.getByText('Memory Usage')).toBeVisible();
  });

  test('displays Industry Benchmarks section', async ({ page }) => {
    await expect(page.getByText('Industry Benchmarks')).toBeVisible({
      timeout: 5000,
    });
  });

  test('navigation rail contains Performance link', async ({ page }) => {
    await page.goto('/');
    const navLink = page.getByRole('link', { name: /performance/i });
    await expect(navLink).toBeVisible();
  });
});
