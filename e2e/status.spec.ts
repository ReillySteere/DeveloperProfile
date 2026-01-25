import { test, expect } from '@playwright/test';

test.describe('Status Page (Mission Control)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/status');
  });

  test('renders Mission Control heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Mission Control');
  });

  test('shows connected status after SSE connects', async ({ page }) => {
    // Wait for SSE connection to establish
    await expect(page.getByText('● Connected')).toBeVisible({ timeout: 5000 });
  });

  test('displays heartbeat animation', async ({ page }) => {
    // Wait for connection and data
    await expect(page.getByText('● Connected')).toBeVisible({ timeout: 5000 });

    // Heartbeat should show event loop lag value
    await expect(page.getByText(/Event Loop Lag/i)).toBeVisible();
  });

  test('displays real-time charts', async ({ page }) => {
    await expect(page.getByText('Real-Time Metrics')).toBeVisible();
    await expect(page.getByText('Latency (ms)')).toBeVisible();
    await expect(page.getByText('Memory (MB)')).toBeVisible();
  });

  test('displays latency chain visualization', async ({ page }) => {
    await expect(page.getByText('Latency Chain')).toBeVisible();
    await expect(page.getByText('Client', { exact: true })).toBeVisible();
    await expect(page.getByText('Server', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Database', { exact: true }).first(),
    ).toBeVisible();
  });

  test('displays system info after receiving telemetry', async ({ page }) => {
    await expect(page.getByText('● Connected')).toBeVisible({ timeout: 5000 });

    // System Info section should show process details
    await expect(page.getByText('System Info')).toBeVisible();
    await expect(
      page.getByRole('term').filter({ hasText: 'Process ID' }),
    ).toBeVisible();
    await expect(
      page.getByRole('term').filter({ hasText: 'Node Version' }),
    ).toBeVisible();
    await expect(
      page.getByRole('term').filter({ hasText: 'Uptime' }),
    ).toBeVisible();
    await expect(
      page.getByRole('term').filter({ hasText: 'Database' }),
    ).toBeVisible();

    // Should show connected database status
    await expect(page.getByText('✓ Connected')).toBeVisible();
  });

  test('chaos controls toggle CPU stress', async ({ page }) => {
    await expect(page.getByText('Chaos Controls')).toBeVisible();
    await expect(page.getByText(/Simulation Mode/i)).toBeVisible();

    // Initially OFF
    const cpuButton = page.getByRole('button', { name: /CPU Stress OFF/i });
    await expect(cpuButton).toBeVisible();
    await expect(cpuButton).toHaveAttribute('aria-pressed', 'false');

    // Click to enable
    await cpuButton.click();

    // Should now show ON
    const cpuButtonOn = page.getByRole('button', { name: /CPU Stress ON/i });
    await expect(cpuButtonOn).toHaveAttribute('aria-pressed', 'true');

    // Hint should appear
    await expect(
      page.getByText(/Watch the heartbeat accelerate/i),
    ).toBeVisible();
  });

  test('chaos controls toggle memory stress', async ({ page }) => {
    const memoryButton = page.getByRole('button', {
      name: /Memory Stress OFF/i,
    });
    await expect(memoryButton).toBeVisible();
    await expect(memoryButton).toHaveAttribute('aria-pressed', 'false');

    // Click to enable
    await memoryButton.click();

    // Should now show ON
    const memoryButtonOn = page.getByRole('button', {
      name: /Memory Stress ON/i,
    });
    await expect(memoryButtonOn).toHaveAttribute('aria-pressed', 'true');
  });

  test('both chaos toggles can be enabled simultaneously', async ({ page }) => {
    const cpuButton = page.getByRole('button', { name: /CPU Stress OFF/i });
    const memoryButton = page.getByRole('button', {
      name: /Memory Stress OFF/i,
    });

    await cpuButton.click();
    await memoryButton.click();

    await expect(
      page.getByRole('button', { name: /CPU Stress ON/i }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('button', { name: /Memory Stress ON/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('navigation includes Status link', async ({ page }) => {
    // Navigate away first
    await page.goto('/about');

    // Status should be in navigation
    const statusLink = page.getByRole('link', { name: /Status/i });
    await expect(statusLink).toBeVisible();

    // Click to navigate
    await statusLink.click();
    await expect(page).toHaveURL(/\/status/);
    await expect(page.locator('h1')).toContainText('Mission Control');
  });
});

test.describe('Request Traces', () => {
  test('navigates to traces page from status', async ({ page }) => {
    await page.goto('/status');

    // Verify the Request Tracing section exists
    await expect(
      page.getByRole('heading', { name: 'Request Tracing' }),
    ).toBeVisible();
    await expect(page.getByText(/View detailed request traces/i)).toBeVisible();

    // Click the link to open traces
    const tracesLink = page.getByRole('link', {
      name: /Open Request Traces/i,
    });
    await expect(tracesLink).toBeVisible();
    await tracesLink.click();

    // Should navigate to traces page
    await expect(page).toHaveURL(/\/status\/traces/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Request Traces' }),
    ).toBeVisible();
  });

  test('displays traces list page', async ({ page }) => {
    await page.goto('/status/traces');

    // Page should have the traces heading
    await expect(
      page.getByRole('heading', { level: 1, name: 'Request Traces' }),
    ).toBeVisible();

    // Should show stats cards
    await expect(page.getByText('Total Traces (24h)')).toBeVisible();
    await expect(page.getByText('Error Rate')).toBeVisible();

    // Should have filter controls (using specific IDs)
    await expect(page.locator('#trace-method')).toBeVisible();
    await expect(page.locator('#trace-path')).toBeVisible();
    await expect(page.locator('#trace-limit')).toBeVisible();
  });

  test('can toggle between static and live mode', async ({ page }) => {
    await page.goto('/status/traces');

    // Wait for page to load
    await expect(
      page.getByRole('heading', { level: 1, name: 'Request Traces' }),
    ).toBeVisible();

    // Initially in static mode
    const liveToggle = page.getByRole('button', { name: 'Static' });
    await expect(liveToggle).toBeVisible();

    // Click the toggle button
    await liveToggle.click();

    // Should switch to live mode
    await expect(page.getByRole('button', { name: 'Live' })).toBeVisible();

    // Filters should be hidden in live mode
    await expect(page.locator('#trace-method')).not.toBeVisible();
  });

  test('can apply filters', async ({ page }) => {
    await page.goto('/status/traces');

    // Wait for page to load
    await expect(
      page.getByRole('heading', { level: 1, name: 'Request Traces' }),
    ).toBeVisible();

    // Change method filter
    const methodSelect = page.locator('#trace-method');
    await methodSelect.selectOption('GET');

    // Click Apply Filters button
    const applyButton = page.getByRole('button', { name: /Apply Filters/i });
    await applyButton.click();

    // Verify the filter is still selected after apply
    await expect(methodSelect).toHaveValue('GET');
  });

  test('can reset filters', async ({ page }) => {
    await page.goto('/status/traces');

    // Wait for page to load
    await expect(
      page.getByRole('heading', { level: 1, name: 'Request Traces' }),
    ).toBeVisible();

    // Change filters
    const methodSelect = page.locator('#trace-method');
    await methodSelect.selectOption('POST');

    const pathInput = page.locator('#trace-path');
    await pathInput.fill('/api/test');

    // Click Reset button
    const resetButton = page.getByRole('button', { name: /Reset/i });
    await resetButton.click();

    // Filters should be cleared
    await expect(methodSelect).toHaveValue('');
    await expect(pathInput).toHaveValue('');
  });

  test('can navigate to trace detail and back', async ({ page }) => {
    await page.goto('/status/traces');

    // Wait for traces to load (or empty state)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Request Traces' }),
    ).toBeVisible();

    // If there are traces, click on one
    const traceRows = page.locator('[role="button"]').filter({
      has: page.locator('text=/\\/api\\//'),
    });

    const traceCount = await traceRows.count();

    if (traceCount > 0) {
      // Click the first trace row
      await traceRows.first().click();

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/status\/traces\/.+/);
      await expect(page.getByText('Trace Details')).toBeVisible();

      // Click back button
      const backButton = page.getByText('← Back');
      await backButton.click();

      // Should return to traces list
      await expect(page).toHaveURL(/\/status\/traces$/);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Request Traces' }),
      ).toBeVisible();
    }
  });

  test('refresh button reloads traces', async ({ page }) => {
    await page.goto('/status/traces');

    // Wait for page to load
    await expect(
      page.getByRole('heading', { level: 1, name: 'Request Traces' }),
    ).toBeVisible();

    // Click refresh button
    const refreshButton = page.getByRole('button', { name: /Refresh/i });
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // Page should still show traces (just refreshed)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Request Traces' }),
    ).toBeVisible();
  });
});
