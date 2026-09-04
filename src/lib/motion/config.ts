/**
 * Motion design tokens — the single source of truth for animation physics.
 *
 * Pure data plus one environment probe. Nothing here imports `motion`, so this
 * module is safe to pull into SSR code paths and into unit tests.
 */

export interface SpringToken {
	readonly type: 'spring';
	readonly stiffness: number;
	readonly damping: number;
}

export const springs = {
	snappy: { type: 'spring', stiffness: 300, damping: 28 },
	soft: { type: 'spring', stiffness: 180, damping: 22 },
	bouncy: { type: 'spring', stiffness: 400, damping: 18 }
} as const satisfies Record<string, SpringToken>;

export type SpringName = keyof typeof springs;

/** Cubic-bezier control points, in the [x1, y1, x2, y2] form Motion accepts. */
export const easings = {
	outExpo: [0.16, 1, 0.3, 1],
	outQuart: [0.25, 1, 0.5, 1],
	inOutQuart: [0.76, 0, 0.24, 1]
} as const;

export type EasingName = keyof typeof easings;

/** Durations in seconds (Motion's unit, unlike CSS). */
export const durations = {
	fast: 0.2,
	base: 0.4,
	slow: 0.7
} as const;

export type DurationName = keyof typeof durations;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * True when the user has asked for reduced motion.
 *
 * SSR-safe: returns `false` when there is no `matchMedia` to ask. Deliberately
 * read on every call rather than cached, so a preference changed mid-session is
 * picked up by the next animation.
 */
export function reducedMotion(): boolean {
	if (typeof globalThis.matchMedia !== 'function') return false;
	try {
		return globalThis.matchMedia(REDUCED_MOTION_QUERY).matches;
	} catch {
		return false;
	}
}
