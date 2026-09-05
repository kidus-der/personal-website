import { test, expect } from '@playwright/test';

/** Below this the pill nav hides and the hamburger takes over — see Nav.svelte. */
const MOBILE_WIDTH = { width: 390, height: 844 };
/** One past that breakpoint — the pill is back (Nav.svelte's `DESKTOP_QUERY`). */
const DESKTOP_WIDTH = { width: 1280, height: 800 };

test.describe('primary navigation', () => {
	// The `mobile` Playwright project runs every spec at a sub-768px viewport,
	// where `MorphicNav`'s pill is `display: none` (Nav.svelte) — so these two
	// desktop-pill tests force a desktop viewport regardless of project.
	test.use({ viewport: DESKTOP_WIDTH });

	test('desktop pill links move between routes via client-side routing', async ({ page }) => {
		await page.goto('/');

		// A full page load bumps this; a client-side navigation does not.
		await page.evaluate(() => {
			window.__navigations = 0;
			window.addEventListener('beforeunload', () => {
				window.__navigations = (window.__navigations ?? 0) + 1;
			});
		});

		const nav = page.getByRole('navigation', { name: 'Primary' });
		await nav.getByRole('link', { name: 'Work' }).click();
		await expect(page).toHaveURL('/work');
		await expect(page.getByRole('heading', { level: 1 })).toContainText(/work/i);

		await nav.getByRole('link', { name: 'About' }).click();
		await expect(page).toHaveURL('/about');

		await nav.getByRole('link', { name: 'The Buna Print' }).click();
		await expect(page).toHaveURL('/blog');

		await nav.getByRole('link', { name: 'Home', exact: true }).click();
		await expect(page).toHaveURL('/');

		const fullPageLoads = await page.evaluate(() => window.__navigations ?? 0);
		expect(fullPageLoads).toBe(0);
	});

	test('the active link is marked aria-current', async ({ page }) => {
		await page.goto('/work');
		const nav = page.getByRole('navigation', { name: 'Primary' });
		await expect(nav.getByRole('link', { name: 'Work' })).toHaveAttribute('aria-current', 'page');
		await expect(nav.getByRole('link', { name: 'About' })).not.toHaveAttribute('aria-current');
	});

	test('the theme switch flips data-theme and the choice survives a reload', async ({ page }) => {
		await page.goto('/');
		const html = page.locator('html');
		const initialTheme = await html.getAttribute('data-theme');
		const toggled = initialTheme === 'light' ? 'dark' : 'light';

		const themeSwitch = page.getByRole('button', { name: /switch to (light|dark) theme/i }).first();
		await themeSwitch.click();
		await expect(html).toHaveAttribute('data-theme', toggled);

		await page.reload();
		await expect(html).toHaveAttribute('data-theme', toggled);
	});

	test.describe('mobile menu', () => {
		test.use({ viewport: MOBILE_WIDTH });

		test('opens from the hamburger, exposes every nav link, and closes on Escape', async ({
			page
		}) => {
			await page.goto('/');

			const hamburger = page.getByRole('button', { name: 'Open menu' });
			await expect(hamburger).toHaveAttribute('aria-controls', 'mobile-menu');
			await hamburger.click();

			const dialog = page.getByRole('dialog', { name: 'Navigation' });
			await expect(dialog).toBeVisible();
			for (const label of ['Home', 'Work', 'About', 'The Buna Print']) {
				await expect(dialog.getByRole('link', { name: label, exact: true })).toBeVisible();
			}

			await page.keyboard.press('Escape');
			await expect(dialog).not.toBeVisible();
			await expect(hamburger).toBeFocused();
		});

		test('closes after a link navigates', async ({ page }) => {
			await page.goto('/');
			await page.getByRole('button', { name: 'Open menu' }).click();

			const dialog = page.getByRole('dialog', { name: 'Navigation' });
			await dialog.getByRole('link', { name: 'Work', exact: true }).click();

			await expect(page).toHaveURL('/work');
			await expect(dialog).not.toBeVisible();
		});
	});
});

declare global {
	interface Window {
		__navigations?: number;
	}
}
