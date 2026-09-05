import { test, expect } from '@playwright/test';

/** Everything the hero stages — see `Hero.svelte` and `perf.spec.ts`. */
const HERO = '[data-hero]';
/** The whole entrance has to land inside this, from `load` (perf.spec.ts's own budget). */
const SETTLE_BUDGET_MS = 2500;

test.describe('home hero', () => {
	test('every hero element is revealed within the settle budget', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('load');

		const count = await page.locator(HERO).count();
		expect(count).toBeGreaterThan(0);

		await expect
			.poll(
				() =>
					page.evaluate(
						(selector) =>
							[...document.querySelectorAll(selector)].every((el) =>
								el.hasAttribute('data-revealed')
							),
						HERO
					),
				{ timeout: SETTLE_BUDGET_MS + 500 }
			)
			.toBe(true);
	});

	test('no hero element goes visible then hidden again after load', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('load');

		// Sample opacity right after load and again once everything has settled;
		// a flicker would show a mid-sequence element at full opacity and then
		// back down, which neither of these two snapshots alone could catch, but
		// a monotonic non-decreasing reading across the whole entrance would.
		const readings: number[][] = [];
		for (let i = 0; i < 6; i++) {
			readings.push(
				await page.evaluate(
					(selector) =>
						[...document.querySelectorAll(selector)].map((el) =>
							Number(getComputedStyle(el).opacity)
						),
					HERO
				)
			);
			await page.waitForTimeout(300);
		}

		for (let elementIndex = 0; elementIndex < readings[0].length; elementIndex++) {
			let previous = readings[0][elementIndex];
			for (let sample = 1; sample < readings.length; sample++) {
				const current = readings[sample][elementIndex];
				expect(current).toBeGreaterThanOrEqual(previous - 0.001);
				previous = current;
			}
		}
	});
});

test.describe('contact modal', () => {
	test('opens from "Say hello", traps focus, and Escape closes it', async ({ page }) => {
		await page.goto('/');

		await page.getByRole('button', { name: 'Say hello', exact: true }).click();

		const dialog = page.getByRole('dialog', { name: 'Contact form' });
		await expect(dialog).toBeVisible();

		// Tabbing from the last focusable control wraps back to the first —
		// the trap, not just the dialog's presence.
		const focusable = dialog.locator(
			'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
		);
		const total = await focusable.count();
		expect(total).toBeGreaterThan(0);

		await focusable.nth(total - 1).focus();
		await page.keyboard.press('Tab');
		await expect(focusable.nth(0)).toBeFocused();

		await page.keyboard.press('Escape');
		await expect(dialog).not.toBeVisible();
	});
});
