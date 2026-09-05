/**
 * Option shapes for the Svelte actions in `$lib/actions`.
 *
 * Types only — this module has no runtime dependency on `motion`, so it is safe
 * to import from anywhere, SSR included.
 */
import type { SpringName } from '$lib/motion/config';

/** `use:reveal` — fade + rise a node (or its children) once it scrolls into view. */
export interface RevealOptions {
	/** Distance in px the node travels upward into place. Default 16. */
	y?: number;
	/** Delay in seconds before the reveal starts. Default 0. */
	delay?: number;
	/** Duration in seconds. Default 0.6. */
	duration?: number;
	/**
	 * When set, the node's direct children are revealed instead of the node
	 * itself, this many seconds apart.
	 */
	stagger?: number;
	/** Reveal only on the first entry. Default true. */
	once?: boolean;
	/** How much of the node must be visible to trigger. Default 0.2. */
	amount?: 'some' | 'all' | number;
}

/** `use:tilt` — 3D tilt plus glow position, exposed as CSS variables. */
export interface TiltOptions {
	/** Maximum rotation in degrees on either axis. Default 9. */
	max?: number;
	/** Named spring from `$lib/motion`. Default 'snappy'. */
	spring?: SpringName;
}

/** `use:magnetic` — spring the node toward the cursor while it is over it. */
export interface MagneticOptions {
	/** Fraction of the cursor offset the node follows. Default 0.3. */
	strength?: number;
}

/** `use:parallax` — translate the node on the scroll timeline. */
export interface ParallaxOptions {
	/** Travel as a fraction of 100px in each direction. Default 0.2. */
	speed?: number;
}

/** `use:scrollProgress` — write a 0..1 `--progress` variable onto the node. */
export interface ScrollProgressOptions {
	/** Element whose scroll position is tracked. Defaults to the node itself. */
	target?: HTMLElement;
}

/** `use:press` — scale the node down while it is held. */
export interface PressOptions {
	/** Scale to animate to while pressed. Default 0.97. */
	scale?: number;
}
