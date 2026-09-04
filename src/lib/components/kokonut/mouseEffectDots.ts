/**
 * Dot-field geometry for `MouseEffectCard` — KokonutUI `cards/mouse-effect-card`.
 *
 * Pure functions, kept out of the component so the field can be reasoned about
 * and tested without a DOM.
 */

/** A single dot, positioned in the card's own pixel space. */
export interface Dot {
	x: number;
	y: number;
	/** Resting opacity, before the pointer's proximity boost. */
	opacity: number;
}

/**
 * Hard ceiling on the number of dots.
 *
 * Every dot is an element the repulsion loop touches on each frame, so the cap
 * is what keeps a large card from turning a decorative background into the most
 * expensive thing on the page.
 */
export const MAX_DOTS = 400;

/** The original's three-step opacity cycle across the grid diagonal. */
const BASE_OPACITIES = [0.3, 0.5, 0.7];

/**
 * Lay a dot grid over a `width` x `height` box.
 *
 * Both the survival chance and the resting opacity rise with distance from the
 * centre, so the field thins out and dims where the card's text sits and fills
 * in towards the edges.
 */
export function generateDots(width: number, height: number, spacing: number): Dot[] {
	if (width <= 0 || height <= 0 || spacing <= 0) return [];

	const columns = Math.floor(width / spacing);
	const rows = Math.floor(height / spacing);
	const centerX = width / 2;
	const centerY = height / 2;
	const maxDistance = Math.hypot(centerX, centerY);
	const dots: Dot[] = [];

	for (let row = 0; row < rows; row += 1) {
		for (let column = 0; column < columns; column += 1) {
			const x = column * spacing + spacing / 2;
			const y = row * spacing + spacing / 2;
			const edgeFactor = Math.min(Math.hypot(x - centerX, y - centerY) / (maxDistance * 0.7), 1);
			if (Math.random() > edgeFactor) continue;
			dots.push({
				x,
				y,
				opacity: BASE_OPACITIES[(row + column) % BASE_OPACITIES.length] * edgeFactor
			});
		}
	}

	return capDots(dots);
}

/**
 * Trim a field to `max` dots by sampling evenly through it rather than cutting
 * the tail, which would leave the bottom of the card bare.
 */
export function capDots(dots: Dot[], max: number = MAX_DOTS): Dot[] {
	if (dots.length <= max) return dots;
	const step = dots.length / max;
	const kept: Dot[] = [];
	for (let i = 0; i < max; i += 1) kept.push(dots[Math.floor(i * step)]);
	return kept;
}

/** How far a dot is pushed, and how much brighter it gets, for one pointer. */
export interface DotResponse {
	x: number;
	y: number;
	/** Extra opacity, added to the dot's resting value. */
	boost: number;
}

const AT_REST: DotResponse = { x: 0, y: 0, boost: 0 };

/** The original's PROXIMITY_MULTIPLIER and PROXIMITY_OPACITY_BOOST. */
const PROXIMITY_MULTIPLIER = 1.2;
const PROXIMITY_OPACITY_BOOST = 0.8;

/**
 * Where `dot` wants to be while the pointer sits at (`pointerX`, `pointerY`).
 *
 * The push falls off linearly to nothing at `radius`; the glow reaches a little
 * further, so dots brighten just before they start to move.
 */
export function respondToPointer(
	dot: Dot,
	pointerX: number,
	pointerY: number,
	radius: number,
	strength: number
): DotResponse {
	const dx = dot.x - pointerX;
	const dy = dot.y - pointerY;
	const distance = Math.hypot(dx, dy);
	const glowRadius = radius * PROXIMITY_MULTIPLIER;
	if (distance >= glowRadius) return AT_REST;

	const boost = (1 - distance / glowRadius) * PROXIMITY_OPACITY_BOOST;
	if (distance >= radius) return { x: 0, y: 0, boost };

	const force = (1 - distance / radius) * strength;
	// A dot sitting exactly under the pointer has no direction to flee; atan2
	// resolves (0, 0) to 0 radians, which pushes it right rather than to NaN.
	const angle = Math.atan2(dy, dx);
	return { x: Math.cos(angle) * force, y: Math.sin(angle) * force, boost };
}
