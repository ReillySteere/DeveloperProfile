import { test, expect, Page, APIRequestContext } from '@playwright/test';

/**
 * Helper function to create a test user
 * Note: Requires REGISTRATION_ENABLED=true environment variable
 */
async function createUser(
  request: APIRequestContext,
  username: string,
  password: string,
) {
  const response = await request.post('/api/auth/register', {
    data: {
      username,
      password,
    },
  });

  // Ignore 409 (Conflict) if user already exists from previous test run
  // Ignore 403 (Forbidden) if registration is disabled - user may be pre-seeded
  if (
    !response.ok() &&
    response.status() !== 409 &&
    response.status() !== 403
  ) {
    console.error(
      `Failed to register user: ${response.status()} ${await response.text()}`,
    );
  }
}

/**
 * Helper function to sign in a user
 */
async function signIn(page: Page, username: string, password: string) {
  // Click the sign in button to open modal
  const signInButton = page.getByRole('button', { name: /sign in/i });
  await signInButton.click();

  // Wait for modal to appear
  await expect(page.getByRole('dialog')).toBeVisible();

  // Fill in credentials
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);

  // Submit the form
  await page
    .getByRole('button', { name: /sign in/i })
    .last()
    .click();

  // Wait for modal to close (successful login)
  await expect(page.getByRole('dialog')).not.toBeVisible();

  // Verify we're signed in by checking for sign out button
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
}

/**
 * Helper function to sign out
 */
async function signOut(page: Page) {
  const signOutButton = page.getByRole('button', { name: /sign out/i });
  await signOutButton.click();

  // Verify we're signed out by checking for sign in button
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
}

test.describe('Case Studies Page - Unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/case-studies');
  });

  test('Case studies page renders and shows list', async ({ page }) => {
    // Wait for page title heading to be visible
    await expect(
      page.getByRole('heading', { name: 'Case Studies' }),
    ).toBeVisible({
      timeout: 10000,
    });

    // Verify there are case study cards listed
    const caseStudyCards = page.locator('a[href^="/case-studies/"]');
    await expect(caseStudyCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('Unauthenticated user can open a case study detail page', async ({
    page,
  }) => {
    // Wait for case studies to load
    await expect(page.locator('a[href^="/case-studies/"]').first()).toBeVisible(
      {
        timeout: 10000,
      },
    );

    // Click on the first case study link
    await page.locator('a[href^="/case-studies/"]').first().click();

    // Wait for navigation to complete
    await expect(page).toHaveURL(/\/case-studies\/[^/]+/);

    // Verify detail page sections are visible
    await expect(page.getByText('The Problem')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('The Solution')).toBeVisible();
    await expect(page.getByText('The Outcome')).toBeVisible();
  });

  test('Case study detail shows project information', async ({ page }) => {
    // Navigate to a case study
    await page.locator('a[href^="/case-studies/"]').first().click();

    // Wait for page to load
    await expect(page.getByText('The Problem')).toBeVisible({ timeout: 10000 });

    // Verify navigation links are present
    await expect(page.getByText('Back to Case Studies')).toBeVisible();
    await expect(page.getByText('View Projects')).toBeVisible();
  });

  test('Create Case Study button is not visible when unauthenticated', async ({
    page,
  }) => {
    // Wait for page to load
    await expect(
      page.getByRole('heading', { name: 'Case Studies' }),
    ).toBeVisible({
      timeout: 10000,
    });

    // Verify Create Case Study button is NOT visible
    await expect(
      page.getByRole('button', { name: /create case study/i }),
    ).not.toBeVisible();
  });

  test('Edit button is not visible when unauthenticated', async ({ page }) => {
    // Navigate to a case study detail
    await page.locator('a[href^="/case-studies/"]').first().click();

    // Wait for page to load
    await expect(page.getByText('The Problem')).toBeVisible({ timeout: 10000 });

    // Verify Edit button is NOT visible
    await expect(
      page.getByRole('button', { name: /edit case study/i }),
    ).not.toBeVisible();
  });
});

test.describe('Case Studies Navigation', () => {
  test('Can navigate from case study detail back to list', async ({ page }) => {
    await page.goto('/case-studies');

    // Wait for page to load
    await expect(
      page.getByRole('heading', { name: 'Case Studies' }),
    ).toBeVisible({ timeout: 10000 });

    // Navigate to detail page
    await page.locator('a[href^="/case-studies/"]').first().click();
    await expect(page.getByText('The Problem')).toBeVisible({ timeout: 10000 });

    // Click back link
    await page.getByText('Back to Case Studies').click();

    // Verify we're back on the list page
    await expect(page).toHaveURL('/case-studies');
    await expect(
      page.getByRole('heading', { name: 'Case Studies' }),
    ).toBeVisible();
  });

  test('Can navigate from case study to projects page', async ({ page }) => {
    await page.goto('/case-studies');

    // Navigate to detail page
    await page.locator('a[href^="/case-studies/"]').first().click();
    await expect(page.getByText('The Problem')).toBeVisible({ timeout: 10000 });

    // Click projects link
    await page.getByText('View Projects').click();

    // Verify we're on the projects page
    await expect(page).toHaveURL('/projects');
  });
});
