import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  // Check that the main heading is visible
  await expect(
    page.getByRole('heading', { name: /Mémoire d'âme/i })
  ).toBeVisible();

  // Check that the description is visible
  await expect(
    page.getByText(/Capturez et préservez les histoires de vie/i)
  ).toBeVisible();
});

test('has correct page title', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Mémoire d'âme/);
});
