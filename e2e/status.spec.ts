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
