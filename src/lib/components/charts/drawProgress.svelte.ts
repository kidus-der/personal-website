/**
 * The draw-in every chart shares: a 0 → 1 value that the SVG attributes read.
 *
 * All three charts animate the same way — start empty, ease out to full over
 * ~1.1s, jump straight to full when the user has asked for reduced motion, and
 * stop cleanly on unmount. This is that logic, once.
 */
import { animate, easings, reducedMotion } from '$lib/motion';

/** Seconds a chart takes to draw itself in. */
export const DRAW_DURATION = 1.1;

export interface DrawProgressOptions {
	/**
	 * Whether to animate. A *getter*, not a snapshot, so a component can pass
	 * `() => animateOnMount` and have the effect re-run when the prop changes.
	 */
	enabled?: () => boolean;
	/** Override for {@link DRAW_DURATION}, in seconds. */
	duration?: number;
}

export interface DrawProgress {
	/** 0 → 1. Reactive: read it straight from markup. */
	readonly value: number;
}

/**
 * Must be called during component initialisation (it registers an `$effect`).
 *
 * The returned object exposes `value` through a getter so the reactive read
 * happens at the call site rather than being captured once.
 */
export function createDrawProgress(options: DrawProgressOptions = {}): DrawProgress {
	const { enabled = () => true, duration = DRAW_DURATION } = options;

	/**
	 * Starts at 0, so server-rendered markup shows an empty chart. The data is
	 * carried by each chart's `aria-label` and `<title>`, so nothing is lost for
	 * crawlers or assistive tech.
	 */
	let value = $state(0);

	$effect(() => {
		if (!enabled() || reducedMotion()) {
			value = 1;
			return;
		}
		value = 0;
		const controls = animate(0, 1, {
			duration,
			// Spread: Motion mutates/normalises the array, and the token is shared.
			ease: [...easings.outExpo],
			onUpdate: (next: number) => {
				value = next;
			}
		});
		return () => controls.stop();
	});

	return {
		get value(): number {
			return value;
		}
	};
}
