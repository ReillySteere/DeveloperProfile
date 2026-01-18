import { test, expect, Page } from '@playwright/test';

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

test.describe('Blog Page - Unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
  });

  test('Blog page renders and shows list of blog posts', async ({ page }) => {
    // Wait for blog posts to load - blog cards contain h2 titles
    await expect(page.locator('h2').first()).toBeVisible({
      timeout: 10000,
    });

    // Verify there are blog posts listed (cards with titles)
    const blogCards = page.locator('[class*="blogCard"], [class*="card"]');
    await expect(blogCards).not.toHaveCount(0);
  });

  test('Unauthenticated user can open a blog post', async ({ page }) => {
    // Wait for blog posts to load
    await expect(page.locator('h2').first()).toBeVisible({
      timeout: 10000,
    });

    // Click on the first blog post link
    await page.locator('a[href*="/blog/"]').first().click();

    // Wait for navigation to complete - blog post page has article with h1
    await expect(page).toHaveURL(/\/blog\/[^/]+/);
    await expect(page.locator('article h1')).toBeVisible({ timeout: 10000 });
  });

  test('Create New Post button is not visible when unauthenticated', async ({
    page,
  }) => {
    // Wait for the page to load
    await expect(page.locator('h2').first()).toBeVisible({
      timeout: 10000,
    });

    // Verify Create New Post button is NOT visible
    await expect(
      page.getByRole('button', { name: /create new post/i }),
    ).not.toBeVisible();
  });
});

test.describe('Blog Page - Authenticated Workflow', () => {
  test('Complete authenticated blog workflow: create button, view, edit, preview, save', async ({
    page,
  }) => {
    // Navigate to blog and sign in
    await page.goto('/blog');
    await signIn(page, 'demo', 'password');

    // Step 1: Verify Create New Post button IS visible when authenticated
    await expect(
      page.getByRole('button', { name: /create new post/i }),
    ).toBeVisible();

    // Step 2: Wait for blog posts to load and open a blog post
    await expect(page.locator('h2').first()).toBeVisible({ timeout: 10000 });

    // Click on an actual blog post link (not the create link)
    // Blog post links have slugs like /blog/hello-world, not /blog/create
    await page
      .locator('a[href^="/blog/"]:not([href="/blog/create"])')
      .first()
      .click();

    // Wait for blog post page to fully render (article with h1)
    await expect(page).toHaveURL(/\/blog\/(?!create)[^/]+/);
    await expect(page.locator('article h1')).toBeVisible({ timeout: 10000 });

    // Verify we're still authenticated after navigation
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();

    // Step 3: Click the Edit Post button
    const editButton = page
      .locator('article')
      .getByRole('button', { name: /edit post/i });
    await expect(editButton).toBeVisible({ timeout: 10000 });
    await editButton.click();

    // Verify we're in edit mode - form fields should be visible
    await expect(page.getByLabel('Title')).toBeVisible();
    await expect(page.getByLabel('Content (Markdown)')).toBeVisible();

    // Step 4: Enter preview mode
    const previewButton = page.getByRole('button', { name: /preview mode/i });
    await previewButton.click();

    // Verify we're in preview mode - Edit Mode button should be visible
    await expect(
      page.getByRole('button', { name: /edit mode/i }),
    ).toBeVisible();

    // Step 5: Go back to edit mode and make a change
    await page.getByRole('button', { name: /edit mode/i }).click();

    // Get the content textarea
    const contentTextarea = page.getByLabel('Content (Markdown)');
    await expect(contentTextarea).toBeVisible();

    // Get original content to restore later
    const originalContent = await contentTextarea.inputValue();

    // Make a small change
    const testMarker = '\n<!-- E2E Test Marker -->';
    await contentTextarea.fill(originalContent + testMarker);

    // Step 6: Save changes
    const saveButton = page.getByRole('button', { name: /save changes/i });
    await saveButton.click();

    // Wait for save to complete - we should exit edit mode
    await expect(
      page.locator('article').getByRole('button', { name: /edit post/i }),
    ).toBeVisible({
      timeout: 10000,
    });

    // Step 7: Revert the change to keep the database clean
    await page
      .locator('article')
      .getByRole('button', { name: /edit post/i })
      .click();
    const contentTextareaAfter = page.getByLabel('Content (Markdown)');
    await contentTextareaAfter.fill(originalContent);
    await page.getByRole('button', { name: /save changes/i }).click();

    // Verify we're back in view mode
    await expect(
      page.locator('article').getByRole('button', { name: /edit post/i }),
    ).toBeVisible({
      timeout: 10000,
    });

    // Step 8: Sign out
    await signOut(page);
  });
});

test.describe('Authentication Flow', () => {
  test('User can sign in and sign out', async ({ page }) => {
    await page.goto('/blog');

    // Verify we start unauthenticated
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Sign in
    await signIn(page, 'demo', 'password');

    // Verify we're signed in
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();

    // Sign out
    await signOut(page);

    // Verify we're signed out
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});
