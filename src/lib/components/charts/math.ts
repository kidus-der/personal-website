/**
 * Pure geometry and scale helpers shared by the chart components.
 *
 * Nothing here touches the DOM, Motion, or Svelte, so every branch is directly
 * unit-testable — which matters because jsdom cannot compute SVG geometry, so
 * the components are only asserted on the attribute strings these produce.
 *
 * Conventions:
 * - Angles are degrees, `0` is 12 o'clock, and they increase clockwise.
 * - Radar values are percentages (`0..100`).
 * - Every helper is total: bad input (NaN, negative, empty) degrades to a
 *   drawable no-op rather than emitting `NaN` into an SVG attribute, which
 *   browsers render as a hard error.
 */

export interface Point {
	readonly x: number;
	readonly y: number;
}

/** Decimals kept in emitted path/point strings — plenty for sub-pixel accuracy. */
const PATH_PRECISION = 3;

/** Decimals kept in raw coordinates — enough to erase trig float noise. */
const COORD_PRECISION = 6;

function round(value: number, precision: number): number {
	if (!Number.isFinite(value)) return 0;
	const factor = 10 ** precision;
	// `+ 0` normalises `-0` to `0` so attribute strings never read "-0".
	return Math.round(value * factor) / factor + 0;
}

const DEG_TO_RAD = Math.PI / 180;

/**
 * Polar to cartesian with `0deg` at 12 o'clock, sweeping clockwise (SVG's
 * y-axis points down, so a plain `+sin` gives clockwise motion).
 */
export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): Point {
	const radians = (angleDeg - 90) * DEG_TO_RAD;
	return {
		x: round(cx + r * Math.cos(radians), COORD_PRECISION),
		y: round(cy + r * Math.sin(radians), COORD_PRECISION)
	};
}

/**
 * An SVG path for the arc from `startDeg` to `endDeg`, drawn clockwise.
 *
 * A sweep of a full turn or more is drawn as two half arcs, because a single
 * arc command whose start and end points coincide renders as nothing.
 * Degenerate input (no sweep, backwards sweep, no radius) yields an empty path,
 * which is a valid, invisible `d`.
 */
export function describeArc(
	cx: number,
	cy: number,
	r: number,
	startDeg: number,
	endDeg: number
): string {
	if (!Number.isFinite(r) || r <= 0) return '';
	if (!Number.isFinite(startDeg) || !Number.isFinite(endDeg)) return '';

	const sweep = endDeg - startDeg;
	if (sweep <= 0) return '';

	const start = polarToCartesian(cx, cy, r, startDeg);
	const radius = round(r, PATH_PRECISION);

	if (sweep >= 360) {
		const half = polarToCartesian(cx, cy, r, startDeg + 180);
		return (
			`M ${round(start.x, PATH_PRECISION)} ${round(start.y, PATH_PRECISION)}` +
			` A ${radius} ${radius} 0 1 1 ${round(half.x, PATH_PRECISION)} ${round(half.y, PATH_PRECISION)}` +
			` A ${radius} ${radius} 0 1 1 ${round(start.x, PATH_PRECISION)} ${round(start.y, PATH_PRECISION)}`
		);
	}

	const end = polarToCartesian(cx, cy, r, endDeg);
	const largeArc = sweep > 180 ? 1 : 0;
	return (
		`M ${round(start.x, PATH_PRECISION)} ${round(start.y, PATH_PRECISION)}` +
		` A ${radius} ${radius} 0 ${largeArc} 1 ${round(end.x, PATH_PRECISION)} ${round(end.y, PATH_PRECISION)}`
	);
}

/**
 * Centre-line radius of the `index`-th concentric ring, counting outward from
 * the innermost. The `strokeWidth / 2` term puts the radius on the middle of
 * the stroke so `baseInnerRadius` is the inner edge of ring 0.
 */
export function ringRadius(
	index: number,
	baseInnerRadius: number,
	strokeWidth: number,
	ringGap: number
): number {
	return baseInnerRadius + index * (strokeWidth + ringGap) + strokeWidth / 2;
}

/** Clamp into `[0, 1]`. NaN and non-numbers collapse to `0`. */
export function clamp01(n: number): number {
	if (typeof n !== 'number' || Number.isNaN(n)) return 0;
	if (n < 0) return 0;
	if (n > 1) return 1;
	return n;
}

/**
 * Vertices of a radar polygon: one per metric, evenly spaced clockwise from
 * 12 o'clock, at `value / 100` of the radius.
 *
 * `values` shorter than `metrics` is padded with zeros and longer is truncated,
 * so a series missing a metric still renders a closed polygon.
 */
export function radarPoints(
	values: readonly number[],
	metrics: number,
	cx: number,
	cy: number,
	r: number
): Point[] {
	if (!Number.isFinite(metrics) || metrics <= 0) return [];
	const count = Math.floor(metrics);
	const step = 360 / count;

	return Array.from({ length: count }, (_, i) => {
		const fraction = clamp01((values[i] ?? 0) / 100);
		const point = polarToCartesian(cx, cy, r * fraction, i * step);
		return { x: round(point.x, PATH_PRECISION), y: round(point.y, PATH_PRECISION) };
	});
}

/** A closed SVG path through the given points. Empty input yields an empty path. */
export function radarPath(points: readonly Point[]): string {
	if (points.length === 0) return '';
	return (
		points
			.map(
				(p, i) =>
					`${i === 0 ? 'M' : 'L'} ${round(p.x, PATH_PRECISION)} ${round(p.y, PATH_PRECISION)}`
			)
			.join(' ') + ' Z'
	);
}

export interface BandScale {
	/** Width of one slot, including its gap. */
	readonly step: number;
	/** Drawable width inside a slot, after the gap is removed. */
	readonly band: number;
	/** Left edge of the `i`-th band, relative to the plot origin. */
	x(i: number): number;
}

/**
 * An ordinal scale over `count` evenly spaced bands, `gapFraction` of each slot
 * left empty. Coordinates are relative to the plot origin — callers add their
 * own left margin.
 */
export function bandScale(count: number, width: number, gapFraction = 0.2): BandScale {
	const usableWidth = Number.isFinite(width) && width > 0 ? width : 0;
	const step = count > 0 && Number.isFinite(count) ? usableWidth / count : 0;
	const band = step * (1 - clamp01(gapFraction));
	const inset = (step - band) / 2;
	return {
		step,
		band,
		x: (i: number) => (Number.isFinite(i) ? i * step + inset : inset)
	};
}

/**
 * A linear scale from `domain` to `range`.
 *
 * A zero-width domain (every datum identical, or a single datum) would divide
 * by zero, so it maps everything onto the range start — visually a flat
 * baseline rather than a chart full of `NaN`.
 */
export function linearScale(
	domain: readonly [number, number],
	range: readonly [number, number]
): (value: number) => number {
	const [d0, d1] = domain;
	const [r0, r1] = range;
	const span = d1 - d0;
	if (!Number.isFinite(span) || span === 0) return () => r0;
	return (value: number) => {
		if (!Number.isFinite(value)) return r0;
		return r0 + ((value - d0) / span) * (r1 - r0);
	};
}

/**
 * Mantissas of the "nice" axis maxima, in ascending order. Wider than the
 * classic 1/2/5 set so mid-range data (7 → 8, 23 → 25) does not get a wildly
 * oversized axis; the brief's worked examples assume these steps.
 */
const NICE_MANTISSAS = [1, 2, 2.5, 4, 5, 8, 10] as const;

/** Smallest "nice" number greater than or equal to `n`. Non-positive input → 1. */
export function niceMax(n: number): number {
	if (!Number.isFinite(n) || n <= 0) return 1;
	const exponent = Math.floor(Math.log10(n));
	const magnitude = 10 ** exponent;
	const mantissa = n / magnitude;
	const nice = NICE_MANTISSAS.find((candidate) => candidate >= mantissa - 1e-9) ?? 10;
	// Rounding undoes float error from the power-of-ten round trip (0.1 * 3).
	return round(nice * magnitude, Math.max(0, -exponent + 2));
}

const CHART_COLOR_COUNT = 5;

/** The `--chart-N` token for a series index, cycling through the five tokens. */
export function chartColor(index: number): string {
	const safe = Number.isFinite(index) ? Math.trunc(index) : 0;
	const slot = ((safe % CHART_COLOR_COUNT) + CHART_COLOR_COUNT) % CHART_COLOR_COUNT;
	return `var(--chart-${slot + 1})`;
}
