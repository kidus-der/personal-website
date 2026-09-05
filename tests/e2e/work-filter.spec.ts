import { test, expect } from '@playwright/test';

test.describe('/work filtering', () => {
	test('the "All" tab lists every project', async ({ page }) => {
		await page.goto('/work');
		await expect(page.locator('#project-grid > ul > li')).toHaveCount(8);
	});

	test('selecting a tab sets ?category= and narrows the grid', async ({ page }) => {
		await page.goto('/work');
		const tablist = page.getByRole('tablist', { name: 'Filter projects' });

		await tablist.getByRole('tab', { name: 'AI & ML' }).click();
		await expect(page).toHaveURL(/\?category=ai-ml$/);
		await expect(page.locator('#project-grid > ul > li')).toHaveCount(4);
		await expect(tablist.getByRole('tab', { name: 'AI & ML' })).toHaveAttribute(
			'aria-selected',
			'true'
		);

		await tablist.getByRole('tab', { name: 'Systems' }).click();
		await expect(page).toHaveURL(/\?category=systems$/);
		await expect(page.locator('#project-grid > ul > li')).toHaveCount(1);
	});

	test('the status line reports the visible count', async ({ page }) => {
		await page.goto('/work?category=systems');
		await expect(page.getByText('1 project', { exact: true })).toBeAttached();

		await page.goto('/work');
		await expect(page.getByText('8 projects', { exact: true })).toBeAttached();
	});

	test('a filtered view survives a reload', async ({ page }) => {
		await page.goto('/work?category=ai-ml');
		await page.reload();
		await expect(page.locator('#project-grid > ul > li')).toHaveCount(4);
		await expect(
			page.getByRole('tablist', { name: 'Filter projects' }).getByRole('tab', { name: 'AI & ML' })
		).toHaveAttribute('aria-selected', 'true');
	});

	test('an unknown category falls back to "All" instead of an empty grid', async ({ page }) => {
		await page.goto('/work?category=nonsense');
		await expect(page.locator('#project-grid > ul > li')).toHaveCount(8);
	});

	test('an unknown project slug renders the 404 page', async ({ page }) => {
		const response = await page.goto('/work/nope');
		expect(response?.status()).toBe(404);
		// The headline is `MatrixText`, which briefly scrambles individual glyphs
		// into binary digits — its `role="img"`/`aria-label` stays "Page not
		// found" throughout, unlike the glyphs' own text content mid-animation.
		await expect(page.getByRole('img', { name: 'Page not found' })).toBeAttached();
	});
});
