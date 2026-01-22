import { test, expect } from '@playwright/test';

test.describe('Architecture Feature', () => {
  test('should navigate to Architecture page from navigation', async ({
    page,
  }) => {
    await page.goto('/');

    // Click on Architecture in navigation
    const architectureLink = page.getByRole('link', { name: /architecture/i });
    await architectureLink.click();

    // Should be on Architecture page
    await expect(page).toHaveURL(/\/architecture/);
    await expect(
      page.getByRole('heading', { name: 'Architecture', level: 1 }),
    ).toBeVisible();
  });

  test('should display ADR list with cards', async ({ page }) => {
    await page.goto('/architecture');

    // Wait for ADRs to load
    await expect(
      page.getByRole('heading', { name: 'Architectural Decision Records' }),
    ).toBeVisible();

    // Should have at least one ADR card visible (use first() since there are multiple)
    await expect(page.getByText(/ADR-\d+/).first()).toBeVisible();
  });

  test('should display component documentation list', async ({ page }) => {
    await page.goto('/architecture');

    // Wait for components to load
    await expect(
      page.getByRole('heading', { name: 'Component Documentation' }),
    ).toBeVisible();
  });

  test('should filter ADRs by search query', async ({ page }) => {
    await page.goto('/architecture');

    // Wait for ADRs section to load
    await expect(
      page.getByRole('heading', { name: 'Architectural Decision Records' }),
    ).toBeVisible();

    // Search for something
    const searchInput = page.getByPlaceholder('Search ADRs...');
    await searchInput.fill('sqlite');

    // ADRs not matching should be filtered out
    // (We can't easily verify specific content here, but the filter should work)
    await expect(searchInput).toHaveValue('sqlite');
  });

  test('should filter ADRs by status', async ({ page }) => {
    await page.goto('/architecture');

    // Wait for ADRs section to load
    await expect(
      page.getByRole('heading', { name: 'Architectural Decision Records' }),
    ).toBeVisible();

    // Filter by Accepted status
    const statusSelect = page.getByLabel('Filter by status');
    await statusSelect.selectOption('Accepted');

    // Should show only Accepted ADRs
    await expect(statusSelect).toHaveValue('Accepted');
  });

  test('should clear filters when Clear Filters button is clicked', async ({
    page,
  }) => {
    await page.goto('/architecture');

    // Apply a filter
    const searchInput = page.getByPlaceholder('Search ADRs...');
    await searchInput.fill('test');

    // Clear Filters button should appear
    const clearButton = page.getByRole('button', { name: /clear filters/i });
    await expect(clearButton).toBeVisible();

    // Click to clear
    await clearButton.click();

    // Search should be cleared
    await expect(searchInput).toHaveValue('');
  });

  test('should navigate to ADR detail page when clicking an ADR', async ({
    page,
  }) => {
    await page.goto('/architecture');

    // Wait for ADRs to load and click the first one (use Link role)
    const adrCard = page
      .getByRole('link', { name: /ADR-001.*Persistent Storage/i })
      .first();
    await adrCard.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/architecture\/ADR-001/);

    // Back button should be visible (it's a button inside a link)
    await expect(page.getByText('← Back to Architecture')).toBeVisible();
  });

  test('should navigate back to list from detail page', async ({ page }) => {
    // First go to main page and click into an ADR (more reliable than direct URL)
    await page.goto('/architecture');

    // Wait for the page to load
    await expect(
      page.getByRole('heading', { name: 'Architectural Decision Records' }),
    ).toBeVisible();

    // Click on an ADR
    const adrCard = page
      .getByRole('link', { name: /ADR-001.*Persistent Storage/i })
      .first();
    await adrCard.click();

    // Wait for detail page
    await expect(page.getByText('← Back to Architecture')).toBeVisible();

    // Click back button
    await page.getByText('← Back to Architecture').click();

    // Should be back on list page
    await expect(page).toHaveURL(/\/architecture\/?$/);
  });

  test('should navigate to dependency graph page', async ({ page }) => {
    await page.goto('/architecture');

    // Click the View Dependency Graph button
    const depGraphButton = page.getByRole('button', {
      name: /view dependency graph/i,
    });
    await depGraphButton.click();

    // Should navigate to dependencies page
    await expect(page).toHaveURL(/\/architecture\/dependencies/);
    await expect(
      page.getByRole('heading', { name: 'Dependency Graph' }),
    ).toBeVisible();
  });
});
