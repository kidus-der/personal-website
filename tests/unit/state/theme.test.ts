import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * The rune module holds module-level state, so every test re-imports it fresh.
 */
async function freshTheme() {
	vi.resetModules();
	return await import('$lib/state/theme.svelte');
}

function stubColorScheme(light: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('prefers-color-scheme: light') ? light : false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	}));
}

beforeEach(() => {
	localStorage.clear();
	document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('theme', () => {
	it('defaults to dark', async () => {
		const { theme } = await freshTheme();
		expect(theme.current).toBe('dark');
	});

	it('set() applies the data-theme attribute and persists', async () => {
		const { theme } = await freshTheme();
		theme.set('light');
		expect(theme.current).toBe('light');
		expect(document.documentElement.getAttribute('data-theme')).toBe('light');
		expect(localStorage.getItem('theme')).toBe('light');
	});

	it('toggle() flips between dark and light', async () => {
		const { theme } = await freshTheme();
		theme.toggle();
		expect(theme.current).toBe('light');
		theme.toggle();
		expect(theme.current).toBe('dark');
	});

	it('init() prefers the stored value over the system preference', async () => {
		localStorage.setItem('theme', 'light');
		stubColorScheme(false);
		const { theme } = await freshTheme();
		theme.init();
		expect(theme.current).toBe('light');
	});

	it('init() falls back to the system preference when nothing is stored', async () => {
		stubColorScheme(true);
		const { theme } = await freshTheme();
		theme.init();
		expect(theme.current).toBe('light');
		expect(document.documentElement.getAttribute('data-theme')).toBe('light');
	});

	it('init() ignores a junk stored value', async () => {
		localStorage.setItem('theme', 'neon');
		stubColorScheme(false);
		const { theme } = await freshTheme();
		theme.init();
		expect(theme.current).toBe('dark');
	});

	it('init() reconciles with the attribute the blocking script wrote', async () => {
		document.documentElement.setAttribute('data-theme', 'light');
		stubColorScheme(false);
		const { theme } = await freshTheme();
		theme.init();
		expect(theme.current).toBe('light');
	});

	it('re-applying the current theme still writes the attribute back', async () => {
		const { theme } = await freshTheme();
		document.documentElement.removeAttribute('data-theme');
		theme.set('dark');
		expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
	});
});
