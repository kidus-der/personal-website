import { test, expect, type Page } from '@playwright/test';

/**
 * One page each, checked the same shallow way: it responds 200, it renders a
 * `<main>` and a level-1 heading, and the browser console stays clean.
 *
 * Vercel's analytics and speed-insights scripts are injected on every page
 * (`src/routes/+layout.svelte`) and only resolve on Vercel itself — against a
 * local `vite preview` they 404, and Chromium reports that as a console error.
 * That is a property of the preview environment, not a regression, so both
 * requests are stubbed out here rather than filtered after the fact: the
 * console then has nothing to complain about in the first place.
 */
const STUBBED_SCRIPTS = ['**/_vercel/insights/script.js', '**/_vercel/speed-insights/script.js'];

async function collectConsoleErrors(page: Page): Promise<string[]> {
	for (const pattern of STUBBED_SCRIPTS) {
		await page.route(pattern, (route) =>
			route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
		);
	}

	const errors: string[] = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error') errors.push(msg.text());
	});
	page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
	return errors;
}

const routes: { path: string; heading: RegExp | string }[] = [
	{ path: '/', heading: /reason and act/i },
	{ path: '/work', heading: /work/i },
	{ path: '/work/coeus-ai', heading: /coeus ai/i },
	{ path: '/about', heading: /hello/i },
	{ path: '/blog', heading: /buna print/i },
	{ path: '/blog/hello', heading: /hello/i }
];

test.describe('smoke: every route responds and renders cleanly', () => {
	for (const { path, heading } of routes) {
		test(`${path} → 200, <main>, <h1>, no console errors`, async ({ page }) => {
			const errors = await collectConsoleErrors(page);

			const response = await page.goto(path);
			expect(response?.status()).toBe(200);

			await expect(page.locator('main')).toBeVisible();
			await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);

			await page.waitForLoadState('networkidle');
			expect(errors, `console errors on ${path}: ${errors.join('; ')}`).toEqual([]);
		});
	}
});
