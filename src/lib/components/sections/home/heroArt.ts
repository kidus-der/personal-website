/**
 * Composition data for `HeroArt.svelte`.
 *
 * Ported in spirit from KokonutUI's Shapes Hero (MIT, @dorianbaffier) and
 * re-cut for our container: five translucent slabs strung along a loose
 * diagonal, upper-left to lower-right, in five sizes so nothing reads as a
 * repeated motif.
 *
 * Every measurement is a percentage of the container, so the same composition
 * holds at the 4:5 desktop column and the short mobile band underneath the
 * copy. Nothing here touches the DOM, which is what makes the layout testable.
 */

/** The token each shape tints itself with. Resolved to a var in the component. */
export const SHAPE_COLORS = ['accent', 'accent-strong', 'chart-2', 'chart-3', 'ember'] as const;

export type ShapeColor = (typeof SHAPE_COLORS)[number];

export interface HeroShape {
	/** Width as a percentage of the container's width. */
	readonly width: number;
	/** Height as a percentage of the container's height. */
	readonly height: number;
	/** Resting tilt in degrees. */
	readonly rotate: number;
	/** Left edge, percent of container width. */
	readonly x: number;
	/** Top edge, percent of container height. */
	readonly y: number;
	/** Entrance delay in seconds. */
	readonly delay: number;
	readonly color: ShapeColor;
}

/**
 * How far outside the container a shape may sit.
 *
 * The container clips, and a slab that runs off the edge reads as part of
 * something larger rather than as a floating pill — but only if the overhang
 * stays small enough that the shape is still legibly a shape.
 */
export const MAX_BLEED = 14;

/** Where each shape starts its entrance: above the container, tilted flatter. */
export const ENTRANCE_DROP = -150;
export const ENTRANCE_ROTATE_OFFSET = -15;

/**
 * The composition. Order is both paint order and entrance order, so the large
 * slab lands first and the small ones settle onto it.
 */
export const HERO_SHAPES: readonly HeroShape[] = [
	{ width: 60, height: 18, rotate: -12, x: -12, y: 8, delay: 0.3, color: 'accent' },
	{ width: 20, height: 7, rotate: -25, x: 20, y: 31, delay: 0.5, color: 'chart-3' },
	{ width: 38, height: 12, rotate: -8, x: 33, y: 43, delay: 0.7, color: 'ember' },
	{ width: 45, height: 14, rotate: 15, x: 47, y: 61, delay: 0.9, color: 'accent-strong' },
	{ width: 28, height: 9, rotate: 20, x: 61, y: 81, delay: 1.1, color: 'chart-2' }
];
