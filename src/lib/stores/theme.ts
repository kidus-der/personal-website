/**
 * Compatibility shim. The source of truth is `$lib/state/theme.svelte`.
 *
 * Kept so components still importing `$lib/stores/theme` (and using
 * `$themeStore`) keep working until Task 11 removes them. New code must import
 * `theme` from `$lib/state/theme.svelte` instead.
 */
import { readable } from 'svelte/store';
import { theme, subscribeTheme, type Theme } from '$lib/state/theme.svelte';

export type { Theme };

const store = readable<Theme>(theme.current, (set) => subscribeTheme(set));

export const themeStore = {
	subscribe: store.subscribe,
	set: theme.set,
	toggle: theme.toggle,
	init: theme.init
};
