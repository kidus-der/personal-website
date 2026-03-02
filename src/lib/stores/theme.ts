import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

function createThemeStore() {
	const { subscribe, set, update } = writable<Theme>('dark');

	return {
		subscribe,
		set,
		toggle() {
			update((current) => {
				const next: Theme = current === 'dark' ? 'light' : 'dark';
				if (typeof document !== 'undefined') {
					document.documentElement.setAttribute('data-theme', next);
					try {
						localStorage.setItem('theme', next);
					} catch {
						// ignore storage errors
					}
				}
				return next;
			});
		},
		init() {
			if (typeof document !== 'undefined') {
				const stored = (() => {
					try {
						return localStorage.getItem('theme');
					} catch {
						return null;
					}
				})();
				const preferred = window.matchMedia('(prefers-color-scheme: light)').matches
					? 'light'
					: 'dark';
				const resolved = (stored as Theme) || preferred;
				document.documentElement.setAttribute('data-theme', resolved);
				set(resolved);
			}
		}
	};
}

export const themeStore = createThemeStore();
