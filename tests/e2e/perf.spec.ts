import { test, expect } from '@playwright/test';

declare global {
	interface Window {
		/** Page-clock milliseconds at which the hero finished arriving. */
		__settledAt?: number;
	}
}

/**
 * The animation budget, and the flicker it was hiding.
 *
 * The home page once reported around 540 running animations — 74 sweeping SVG
 * paths and 400 pulsing dots — and the hero visibly painted, vanished and faded
 * back in. Both are the kind of regression that a unit test cannot see and that
 * nobody notices in review until the page is on a real machine, so they are
 * asserted here against the built site.
 */

/**
 * What `document.getAnimations()` may report on a settled page.
 *
 * The ceiling is written for what the page renders, not for what one animation
 * library happens to hand the browser. `ParticleNetwork` draws a 2400-node
 * field and registers nothing at all here — it is one canvas and one
 * `requestAnimationFrame` loop — so what this actually catches is the next
 * background that goes back to one WAAPI animation per element.
 */
const ANIMATION_BUDGET = 60;
/** Everything the hero stages. */
const HERO = '[data-hero]';
/** How long the whole hero entrance has to finish, from `load`. */
const SETTLE_BUDGET_MS = 2500;

test.describe('home page performance', () => {
	test('settles inside the animation budget', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('load');
		await page.waitForTimeout(4000);

		const running = await page.evaluate(() => document.getAnimations().length);
		expect(running).toBeLessThanOrEqual(ANIMATION_BUDGET);
	});

	test('never flashes the hero: hidden from the first frame, then revealed', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('load');

		// At load the stylesheet is holding the staged elements, so none of them
		// is visible. A `1` here is the flash: content painted before the script
		// that is about to hide it has run.
		const atLoad = await page.evaluate(
			(selector) =>
				[...document.querySelectorAll(selector)].map((element) => ({
					revealed: element.hasAttribute('data-revealed'),
					opacity: getComputedStyle(element).opacity
				})),
			HERO
		);
		expect(atLoad.length).toBeGreaterThan(0);
		for (const element of atLoad) {
			if (!element.revealed) expect(Number(element.opacity)).toBeLessThan(1);
		}

		// The sequence finishes 1.45s in (0.75s delay + 0.7s duration). Waiting on
		// the condition rather than sleeping a fixed 2.5s keeps this assertion
		// about the sequence; the budget is then checked against the page's own
		// clock, which is the number the contract is written in and is not moved
		// by how busy the machine running Playwright happens to be.
		await page.waitForFunction((selector) => {
			const staged = [...document.querySelectorAll(selector)];
			if (!staged.every((element) => element.hasAttribute('data-revealed'))) return false;
			window.__settledAt ??= performance.now();
			return true;
		}, HERO);
		const settledAt = await page.evaluate(() => window.__settledAt ?? Number.POSITIVE_INFINITY);
		expect(settledAt).toBeLessThan(SETTLE_BUDGET_MS);

		const settled = await page.evaluate(
			(selector) =>
				[...document.querySelectorAll(selector)].map((element) =>
					Number(getComputedStyle(element).opacity)
				),
			HERO
		);
		for (const opacity of settled) expect(opacity).toBe(1);
	});

	/**
	 * The whole field is one element. A second canvas in the hero would mean a
	 * second frame loop, which is the regression the budget above cannot see:
	 * canvases register no WAAPI animations, so they are invisible to it.
	 */
	test('draws the whole hero backdrop on a single canvas', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('load');
		await expect(page.locator('.hero canvas')).toHaveCount(1);
	});

	test('shows the whole hero to a reader with no JavaScript', async ({ browser }) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		try {
			await page.goto('/');
			// The pre-hide is gated on `html.js`, which only the blocking script
			// sets — so without scripts nothing is hidden.
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
			const opacities = await page.evaluate(
				(selector) =>
					[...document.querySelectorAll(selector)].map(
						(element) => getComputedStyle(element).opacity
					),
				HERO
			);
			for (const opacity of opacities) expect(Number(opacity)).toBe(1);
		} finally {
			await context.close();
		}
	});
});
