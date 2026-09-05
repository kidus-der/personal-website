import { test, expect } from '@playwright/test';

test.describe('/blog listing', () => {
	test('the tag filter offers "All" and every tag in the archive, and narrows the list', async ({
		page
	}) => {
		await page.goto('/blog');
		const filter = page.getByRole('group', { name: 'Filter by tag' });

		const all = filter.getByRole('button', { name: 'All' });
		const personal = filter.getByRole('button', { name: 'Personal' });
		await expect(all).toHaveAttribute('aria-pressed', 'true');
		await expect(personal).toBeVisible();

		await personal.click();
		await expect(personal).toHaveAttribute('aria-pressed', 'true');
		await expect(all).toHaveAttribute('aria-pressed', 'false');
		// "hello" carries the "Personal" tag, so filtering onto it still surfaces it.
		await expect(page.getByRole('heading', { name: /hello/i }).first()).toBeVisible();

		await all.click();
		await expect(all).toHaveAttribute('aria-pressed', 'true');
	});
});

test.describe('/blog/[slug] post page', () => {
	test('the reading-progress bar grows as the reader scrolls', async ({ page }) => {
		await page.goto('/blog/hello');
		const bar = page.locator('.reading-progress');
		await expect(bar).toBeAttached();

		const atTop = await bar.evaluate((el) => getComputedStyle(el).transform);

		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
		await expect.poll(() => bar.evaluate((el) => getComputedStyle(el).transform)).not.toBe(atTop);
	});

	test('a single-post archive shows no prev/next navigation', async ({ page }) => {
		await page.goto('/blog/hello');
		await expect(page.getByRole('navigation', { name: 'Post navigation' })).toHaveCount(0);
	});
});
