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

	it('notifies subscribers on change and stops after unsubscribe', async () => {
		const { theme, subscribeTheme } = await freshTheme();
		const seen: string[] = [];
		const off = subscribeTheme((t) => seen.push(t));
		expect(seen).toEqual(['dark']);
		theme.set('light');
		expect(seen).toEqual(['dark', 'light']);
		off();
		theme.set('dark');
		expect(seen).toEqual(['dark', 'light']);
	});
});
