/**
 * The maths behind `ParticleNetwork` — the site's one background signature.
 *
 * Everything here is pure and framework-free: a seeded value-noise field, a
 * uniform spatial hash for the neighbour search, and a CSS colour parser so the
 * canvas can be painted from the same design tokens as the rest of the page.
 * The component owns the canvas and the frame loop; it computes none of this.
 */

/** A colour as three 0–255 channels. */
export type RGB = readonly [number, number, number];

/** `bold` behind the home headline; `soft` behind reading copy. */
export type NetworkIntensity = 'bold' | 'soft';

/**
 * Particles at each intensity, on a desktop-width viewport.
 *
 * The count is the whole effect: at a few hundred the field reads as scattered
 * dust, and only once the average node has five or six neighbours inside the
 * link radius does it start reading as a system. 2400 is the density the owner
 * picked from the live options.
 */
export const PARTICLE_COUNTS: Record<NetworkIntensity, number> = {
	bold: 2400,
	soft: 1200
};

/**
 * Below this viewport width the counts are halved.
 *
 * A phone has both a smaller canvas — so the same count would read as a solid
 * mat rather than a network — and less thermal headroom for the neighbour pass.
 */
export const NARROW_VIEWPORT = 640;

/** How far two ordinary nodes can be apart and still be linked, in CSS pixels. */
export const LINK_RADIUS = 26;

/** The same, for the one-in-thirty hub nodes, which reach further. */
export const HUB_LINK_RADIUS = 42;

/** Grid pitch of the spatial hash. One link radius, so a 3×3 scan is exact. */
export const CELL_SIZE = LINK_RADIUS;

/** How many frames a particle lives before it respawns somewhere else. */
export const LIFESPAN = { min: 120, max: 360 } as const;

/** Radius of an ordinary node; a per-particle seed picks a point in the range. */
export const NODE_RADIUS = { min: 1.2, max: 2.2 } as const;

/** Radius of a hub node. Bigger, brighter, and linked further out. */
export const HUB_RADIUS = 2.8;

/** One in this many particles is a hub. */
export const HUB_EVERY = 30;

/** One in this many particles gets the (comparatively costly) glow sprite. */
export const GLOW_EVERY = 4;

/** Distance a particle travels per frame. The reference used 1.6; this is the
 * owner's "slow down the streams" — slow enough that a node reads as a node. */
export const STEP = 0.55;

/** Spatial frequency of the flow field the particles ride. */
export const NOISE_SCALE = 0.0022;

/** How fast the field itself drifts, per millisecond of page time. */
export const NOISE_DRIFT = 0.00002;

/** Spatial frequency of the second noise field that picks the warm minority. */
export const WARM_SCALE = 0.003;

/**
 * Noise value above which a particle takes the warm (`--chart-2`) colour.
 *
 * `createNoise` is bounded by ±1.5 but, sampled at `WARM_SCALE`, sits inside
 * roughly ±0.56 with a strong bias towards zero — so the threshold that lands
 * the warm share at the ~35% the reference reads as is a small number, not the
 * midpoint it looks like it should be. Measured, not guessed.
 */
export const WARM_THRESHOLD = 0.05;

/**
 * Alpha of the translucent wash that fades the previous frame into a trail.
 *
 * This is the knob that decides whether the field reads as nodes or as comets.
 * The reference used 0.08 against 1.6px-per-frame streaks, where a long tail
 * *was* the effect; here the step is a third of that and the tail outlived the
 * node by fifteen pixels, which is the opposite of the "more node/system like"
 * the design asks for. At 0.2 the residue is gone in about a dozen frames — a
 * hair of travel behind each node, and the links carry the structure.
 */
export const TRAIL_ALPHA = 0.2;

/** Black, used when a CSS colour cannot be parsed. */
const BLACK: RGB = [0, 0, 0];

const HEX_SHORT = /^#([\da-f])([\da-f])([\da-f])$/i;
const HEX_LONG = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i;
const RGB_FN = /^rgba?\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+)/i;

/**
 * Parse the CSS colours our design tokens are written in.
 *
 * Only the three forms the tokens actually use — `#rgb`, `#rrggbb` and
 * `rgb()`/`rgba()` — are supported, because a canvas cannot be handed a
 * `color-mix()` or an `oklch()` anyway and pretending otherwise would hide the
 * moment a token changes shape. Anything else yields `fallback`, so a missing
 * custom property paints something rather than throwing mid-frame.
 */
export function parseColor(css: string, fallback: RGB = BLACK): RGB {
	const value = css.trim();
	if (value === '') return fallback;

	const short = HEX_SHORT.exec(value);
	if (short) {
		return [
			Number.parseInt(short[1] + short[1], 16),
			Number.parseInt(short[2] + short[2], 16),
			Number.parseInt(short[3] + short[3], 16)
		];
	}

	const long = HEX_LONG.exec(value);
	if (long) {
		return [
			Number.parseInt(long[1], 16),
			Number.parseInt(long[2], 16),
			Number.parseInt(long[3], 16)
		];
	}

	const fn = RGB_FN.exec(value);
	if (fn) {
		return [
			Math.min(255, Math.max(0, Math.round(Number(fn[1])))),
			Math.min(255, Math.max(0, Math.round(Number(fn[2])))),
			Math.min(255, Math.max(0, Math.round(Number(fn[3]))))
		];
	}

	return fallback;
}

/** `rgba(…)` string for a parsed colour at `alpha`. */
export function rgba(color: RGB, alpha: number): string {
	return `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
}

/**
 * Whether a background colour is a light one.
 *
 * The field's alphas are tuned against the surface it sits on: the same stroke
 * that is barely there on black is loud on white. Relative luminance, rather
 * than reading `data-theme`, keeps this true for any future theme.
 */
export function isLightBackground(bg: RGB): boolean {
	return (bg[0] * 0.2126 + bg[1] * 0.7152 + bg[2] * 0.0722) / 255 > 0.5;
}

/** How many particles to seed for an intensity at a given viewport width. */
export function particleCount(intensity: NetworkIntensity, viewportWidth: number): number {
	const base = PARTICLE_COUNTS[intensity];
	return viewportWidth < NARROW_VIEWPORT ? base / 2 : base;
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const mix = (a: number, b: number, t: number) => a + t * (b - a);

function gradient(hash: number, x: number, y: number): number {
	const v = hash & 3;
	return (v < 2 ? x : y) * (v & 1 ? -1 : 1) + (v < 2 ? y : x) * (v & 2 ? -1 : 1) * 0.5;
}

/**
 * A tiny 2D value-noise field, ported from the reference implementation.
 *
 * The permutation table is shuffled by a seeded LCG rather than `Math.random`,
 * so the same seed always draws the same field — which makes the flow testable
 * and makes two screenshots of the same page comparable. Output is smooth and
 * bounded by ±1.5.
 */
export function createNoise(seed = 1): (x: number, y: number) => number {
	const p = new Uint8Array(512);
	for (let i = 0; i < 256; i += 1) p[i] = i;

	let state = seed >>> 0 || 1;
	for (let i = 255; i > 0; i -= 1) {
		state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
		const j = state % (i + 1);
		const swap = p[i];
		p[i] = p[j];
		p[j] = swap;
	}
	for (let i = 0; i < 256; i += 1) p[i + 256] = p[i];

	return function noise(x: number, y: number): number {
		const X = Math.floor(x) & 255;
		const Y = Math.floor(y) & 255;
		const fx = x - Math.floor(x);
		const fy = y - Math.floor(y);
		const u = fade(fx);
		const v = fade(fy);
		const a = p[X] + Y;
		const b = p[X + 1] + Y;
		return mix(
			mix(gradient(p[a], fx, fy), gradient(p[b], fx - 1, fy), u),
			mix(gradient(p[a + 1], fx, fy - 1), gradient(p[b + 1], fx - 1, fy - 1), u),
			v
		);
	};
}

/**
 * A uniform grid over the canvas, rebuilt once per frame.
 *
 * Linking 2400 particles pairwise is 2.9M distance checks a frame, which is not
 * a background — it is the page's whole budget. Bucketing by a cell the size of
 * the link radius turns it into "look at the nine cells around me", which is
 * linear in the particle count at any fixed density.
 *
 * The buckets are a counting sort into two flat `Int32Array`s rather than a map
 * of arrays: a `Map` of 1300 arrays rebuilt sixty times a second is the kind of
 * allocation churn that shows up as jank rather than as CPU.
 */
export class SpatialHash {
	readonly cell: number;
	/** Grid dimensions of the last `build`. */
	cols = 0;
	rows = 0;
	/** `starts[c]` … `starts[c + 1]` is cell `c`'s slice of `items`. */
	private starts = new Int32Array(1);
	private items = new Int32Array(1);
	private count = 0;

	constructor(cell: number) {
		this.cell = cell;
	}

	/** Bucket the first `count` entries of `xs`/`ys` over a `width`×`height` box. */
	build(xs: Float32Array, ys: Float32Array, count: number, width: number, height: number): void {
		const cols = Math.max(1, Math.ceil(width / this.cell));
		const rows = Math.max(1, Math.ceil(height / this.cell));
		const cells = cols * rows;

		if (this.starts.length < cells + 1) this.starts = new Int32Array(cells + 1);
		if (this.items.length < count) this.items = new Int32Array(count);

		const starts = this.starts;
		starts.fill(0, 0, cells + 1);
		this.cols = cols;
		this.rows = rows;
		this.count = count;

		// Counting sort: tally per cell, prefix-sum into offsets, then place.
		for (let i = 0; i < count; i += 1) starts[this.cellOf(xs[i], ys[i]) + 1] += 1;
		for (let c = 0; c < cells; c += 1) starts[c + 1] += starts[c];

		// `starts` is consumed as a cursor here and restored by shifting after.
		const cursor = starts;
		const items = this.items;
		for (let i = 0; i < count; i += 1) {
			const c = this.cellOf(xs[i], ys[i]);
			items[cursor[c]] = i;
			cursor[c] += 1;
		}
		for (let c = cells; c > 0; c -= 1) starts[c] = starts[c - 1];
		starts[0] = 0;
	}

	/** Index of the cell a point falls in, clamped to the grid. */
	private cellOf(x: number, y: number): number {
		const col = Math.min(this.cols - 1, Math.max(0, Math.floor(x / this.cell)));
		const row = Math.min(this.rows - 1, Math.max(0, Math.floor(y / this.cell)));
		return row * this.cols + col;
	}

	/**
	 * Write the indices in the `(2 * ring + 1)²` cells around `(x, y)` into `out`.
	 *
	 * Returns how many were written; entries past `out.length` are dropped, which
	 * only costs a link nobody would have seen in a pathologically dense clump.
	 */
	query(x: number, y: number, ring: number, out: Int32Array): number {
		if (this.count === 0) return 0;

		const col = Math.min(this.cols - 1, Math.max(0, Math.floor(x / this.cell)));
		const row = Math.min(this.rows - 1, Math.max(0, Math.floor(y / this.cell)));
		const minCol = Math.max(0, col - ring);
		const maxCol = Math.min(this.cols - 1, col + ring);
		const minRow = Math.max(0, row - ring);
		const maxRow = Math.min(this.rows - 1, row + ring);

		let written = 0;
		for (let r = minRow; r <= maxRow; r += 1) {
			const base = r * this.cols;
			for (let c = minCol; c <= maxCol; c += 1) {
				const cellIndex = base + c;
				const end = this.starts[cellIndex + 1];
				for (let k = this.starts[cellIndex]; k < end; k += 1) {
					if (written >= out.length) return written;
					out[written] = this.items[k];
					written += 1;
				}
			}
		}
		return written;
	}
}
