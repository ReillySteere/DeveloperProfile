import { test, expect } from '@playwright/test';

test.describe('About Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
  });

  test('About page renders correctly', async ({ page }) => {
    // Verify the page has loaded
    await expect(page.locator('h1')).toContainText('Reilly Goulding');
    await expect(page.locator('h2').first()).toContainText(
      'Staff Full Stack Developer',
    );

    // Verify location is displayed
    await expect(page.getByText('Calgary, AB')).toBeVisible();
  });

  test('Download Resume button exists and works', async ({ page }) => {
    const downloadButton = page.getByRole('button', {
      name: /download resume/i,
    });
    await expect(downloadButton).toBeVisible();

    // Set up download listener before clicking
    const downloadPromise = page.waitForEvent('download');

    // Click the download button
    await downloadButton.click();

    // Wait for the download to start
    const download = await downloadPromise;

    // Verify the download started (file should have a filename)
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('LinkedIn button exists with correct link', async ({ page }) => {
    const linkedInButton = page.getByRole('link', {
      name: /connect on linkedin/i,
    });
    await expect(linkedInButton).toBeVisible();
    await expect(linkedInButton).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/reillysteere/',
    );
  });

  test('Email button exists with correct mailto link', async ({ page }) => {
    const emailButton = page.getByRole('link', { name: /send an email/i });
    await expect(emailButton).toBeVisible();
    await expect(emailButton).toHaveAttribute(
      'href',
      'mailto:reilly.steere@gmail.com',
    );
  });
});
