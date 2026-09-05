/**
 * The one place the `motion` package is imported for general use.
 *
 * Components must never call these directly in markup — use a Svelte action
 * from `$lib/actions` or a helper here (see CLAUDE.md).
 */
export { animate, inView, scroll, stagger, spring, press, hover } from 'motion';

export { markRevealed } from './prehide';

export {
	springs,
	easings,
	durations,
	GRID_REVEAL,
	reducedMotion,
	type SpringToken,
	type SpringName,
	type EasingName,
	type DurationName
} from './config';
