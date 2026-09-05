export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const DEFAULT_THEME: Theme = 'dark';

let current = $state<Theme>(DEFAULT_THEME);

function readStored(): Theme | null {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored === 'light' || stored === 'dark' ? stored : null;
	} catch {
		// Private-mode / blocked storage — fall back to the system preference.
		return null;
	}
}

function persist(next: Theme) {
	try {
		localStorage.setItem(STORAGE_KEY, next);
	} catch {
		// Nothing to do: the theme still applies for this session.
	}
}

function apply(next: Theme) {
	current = next;
	if (typeof document !== 'undefined') {
		document.documentElement.setAttribute('data-theme', next);
	}
}

export const theme = {
	get current(): Theme {
		return current;
	},

	set(next: Theme) {
		apply(next);
		persist(next);
	},

	toggle() {
		theme.set(current === 'dark' ? 'light' : 'dark');
	},

	/**
	 * Reconcile the rune with what the blocking inline script already put on
	 * `<html>`. Safe to call on the server (no-op) and more than once.
	 */
	init() {
		if (typeof document === 'undefined') return;
		const attr = document.documentElement.getAttribute('data-theme');
		const fromDom: Theme | null = attr === 'light' || attr === 'dark' ? attr : null;
		const preferred: Theme =
			typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches
				? 'light'
				: 'dark';
		apply(readStored() ?? fromDom ?? preferred);
	}
};
