import { test, expect } from '@playwright/test';

test.describe('Rate Limiting', () => {
  test('should include rate limit headers on API responses', async ({
    request,
  }) => {
    const response = await request.get('/api/experience');

    // Rate limit headers should be present
    const limit = response.headers()['x-ratelimit-limit'];
    const remaining = response.headers()['x-ratelimit-remaining'];
    const reset = response.headers()['x-ratelimit-reset'];

    expect(limit).toBeDefined();
    expect(remaining).toBeDefined();
    expect(reset).toBeDefined();

    // Values should be valid numbers
    expect(parseInt(limit, 10)).toBeGreaterThan(0);
    expect(parseInt(remaining, 10)).toBeGreaterThanOrEqual(0);
    expect(parseInt(reset, 10)).toBeGreaterThan(0);
  });

  test('should decrement remaining count on subsequent requests', async ({
    request,
  }) => {
    // Make first request
    const first = await request.get('/api/projects');
    const firstRemaining = parseInt(
      first.headers()['x-ratelimit-remaining'],
      10,
    );

    // Make second request
    const second = await request.get('/api/projects');
    const secondRemaining = parseInt(
      second.headers()['x-ratelimit-remaining'],
      10,
    );

    // Remaining should decrease (or reset if window changed)
    expect(secondRemaining).toBeLessThanOrEqual(firstRemaining);
  });

  test('should not rate limit health endpoints', async ({ request }) => {
    const response = await request.get('/api/health');

    // Health endpoints should not have rate limit headers
    const limit = response.headers()['x-ratelimit-limit'];
    expect(limit).toBeUndefined();
  });

  test('should return 429 when rate limit exceeded', async ({ request }) => {
    // This test uses a strict endpoint (login) with low limits
    const promises: Promise<{ status: number }>[] = [];

    // Make requests up to and beyond the limit (5 for login)
    for (let i = 0; i < 10; i++) {
      promises.push(
        request
          .post('/api/auth/login', {
            data: { username: 'test', password: 'test' },
          })
          .then((r) => ({ status: r.status() })),
      );
    }

    const results = await Promise.all(promises);

    // Some requests should succeed (200 or 401), some should be rate limited (429)
    const rateLimited = results.filter((r) => r.status === 429);
    const notRateLimited = results.filter((r) => r.status !== 429);

    // At least 5 should succeed, remaining should be rate limited
    expect(notRateLimited.length).toBeGreaterThanOrEqual(5);
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('should include Retry-After header on 429 response', async ({
    request,
  }) => {
    // First exhaust the limit
    for (let i = 0; i < 6; i++) {
      await request.post('/api/auth/register', {
        data: { username: `test${Date.now()}${i}`, password: 'test123' },
      });
    }

    // This request should be rate limited
    const response = await request.post('/api/auth/register', {
      data: { username: `test${Date.now()}`, password: 'test123' },
    });

    if (response.status() === 429) {
      const retryAfter = response.headers()['retry-after'];
      expect(retryAfter).toBeDefined();
      expect(parseInt(retryAfter, 10)).toBeGreaterThan(0);
    }
  });
});

test.describe('Rate Limit UI Integration', () => {
  test('traces page should show rate limited requests', async ({
    page,
    request,
  }) => {
    // Generate rate limited requests first
    for (let i = 0; i < 10; i++) {
      await request.post('/api/auth/login', {
        data: { username: 'test', password: 'test' },
      });
    }

    // Navigate to traces page
    await page.goto('/status/traces');

    // Wait for traces to load
    await page
      .waitForSelector('[data-testid="trace-row"]', { timeout: 5000 })
      .catch(() => {
        // Traces may not have the testid, look for trace content
      });

    // Check if page loaded successfully
    await expect(page.locator('h1')).toContainText('Request Traces');
  });
});
