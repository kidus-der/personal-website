import { describe, it, expect } from 'vitest';
import {
	polarToCartesian,
	describeArc,
	ringRadius,
	clamp01,
	radarPoints,
	radarPath,
	bandScale,
	linearScale,
	niceMax,
	chartColor
} from '$lib/components/charts/math';

describe('polarToCartesian', () => {
	it('places 0 degrees at 12 o’clock and sweeps clockwise', () => {
		expect(polarToCartesian(50, 50, 40, 0)).toEqual({ x: 50, y: 10 });
		expect(polarToCartesian(50, 50, 40, 90)).toEqual({ x: 90, y: 50 });
		expect(polarToCartesian(50, 50, 40, 180)).toEqual({ x: 50, y: 90 });
		expect(polarToCartesian(50, 50, 40, 270)).toEqual({ x: 10, y: 50 });
	});

	it('wraps angles beyond a full turn', () => {
		expect(polarToCartesian(0, 0, 10, 360)).toEqual(polarToCartesian(0, 0, 10, 0));
		expect(polarToCartesian(0, 0, 10, -90)).toEqual(polarToCartesian(0, 0, 10, 270));
	});

	it('collapses to the centre for a zero radius', () => {
		expect(polarToCartesian(7, 9, 0, 123)).toEqual({ x: 7, y: 9 });
	});

	it('rounds trigonometric noise away', () => {
		const { x, y } = polarToCartesian(100, 100, 50, 90);
		expect(Number.isInteger(x)).toBe(true);
		expect(Number.isInteger(y)).toBe(true);
	});
});

describe('describeArc', () => {
	it('draws a clockwise minor arc without the large-arc flag', () => {
		expect(describeArc(50, 50, 40, 0, 90)).toBe('M 50 10 A 40 40 0 0 1 90 50');
	});

	it('sets the large-arc flag past 180 degrees', () => {
		expect(describeArc(50, 50, 40, 0, 270)).toBe('M 50 10 A 40 40 0 1 1 10 50');
	});

	it('draws a full circle as two arcs', () => {
		const d = describeArc(50, 50, 40, 0, 360);
		expect(d.match(/A/g)).toHaveLength(2);
		expect(d.startsWith('M 50 10')).toBe(true);
		expect(d.endsWith('50 10')).toBe(true);
	});

	it('treats a sweep beyond a full turn as a full circle', () => {
		expect(describeArc(50, 50, 40, 0, 720)).toBe(describeArc(50, 50, 40, 0, 360));
	});

	it('returns an empty path for a degenerate sweep', () => {
		expect(describeArc(50, 50, 40, 90, 90)).toBe('');
		expect(describeArc(50, 50, 40, 90, 10)).toBe('');
		expect(describeArc(50, 50, 40, 0, Number.NaN)).toBe('');
	});

	it('returns an empty path for a non-positive radius', () => {
		expect(describeArc(50, 50, 0, 0, 90)).toBe('');
		expect(describeArc(50, 50, -4, 0, 90)).toBe('');
	});
});

describe('ringRadius', () => {
	it('steps outward by stroke width plus gap, centred on the stroke', () => {
		expect(ringRadius(0, 60, 12, 6)).toBe(66);
		expect(ringRadius(1, 60, 12, 6)).toBe(84);
		expect(ringRadius(2, 60, 12, 6)).toBe(102);
	});

	it('is monotonic in the index', () => {
		const radii = [0, 1, 2, 3].map((i) => ringRadius(i, 20, 8, 4));
		expect(radii).toEqual([...radii].sort((a, b) => a - b));
	});
});

describe('clamp01', () => {
	it('passes values inside the unit interval through', () => {
		expect(clamp01(0)).toBe(0);
		expect(clamp01(0.42)).toBe(0.42);
		expect(clamp01(1)).toBe(1);
	});

	it('clamps out-of-range values', () => {
		expect(clamp01(-0.5)).toBe(0);
		expect(clamp01(1.5)).toBe(1);
		expect(clamp01(Number.POSITIVE_INFINITY)).toBe(1);
		expect(clamp01(Number.NEGATIVE_INFINITY)).toBe(0);
	});

	it('treats NaN and undefined as zero', () => {
		expect(clamp01(Number.NaN)).toBe(0);
		expect(clamp01(undefined as unknown as number)).toBe(0);
	});
});

describe('radarPoints', () => {
	it('returns one point per metric starting at 12 o’clock', () => {
		const points = radarPoints([100, 100, 100, 100], 4, 50, 50, 40);
		expect(points).toEqual([
			{ x: 50, y: 10 },
			{ x: 90, y: 50 },
			{ x: 50, y: 90 },
			{ x: 10, y: 50 }
		]);
	});

	it('scales each value as a percentage of the radius', () => {
		const [top] = radarPoints([50], 4, 50, 50, 40);
		expect(top).toEqual({ x: 50, y: 30 });
	});

	it('pads missing values with zero and ignores extras', () => {
		expect(radarPoints([100], 3, 50, 50, 40)).toHaveLength(3);
		expect(radarPoints([100], 3, 50, 50, 40)[1]).toEqual({ x: 50, y: 50 });
		expect(radarPoints([100, 100, 100, 100, 100], 3, 50, 50, 40)).toHaveLength(3);
	});

	it('clamps negative and NaN values to the centre and over-100 to the rim', () => {
		expect(radarPoints([-20], 1, 50, 50, 40)[0]).toEqual({ x: 50, y: 50 });
		expect(radarPoints([Number.NaN], 1, 50, 50, 40)[0]).toEqual({ x: 50, y: 50 });
		expect(radarPoints([500], 1, 50, 50, 40)[0]).toEqual({ x: 50, y: 10 });
	});

	it('returns nothing when there are no metrics', () => {
		expect(radarPoints([100], 0, 50, 50, 40)).toEqual([]);
		expect(radarPoints([100], -3, 50, 50, 40)).toEqual([]);
	});
});

describe('radarPath', () => {
	it('closes the polygon', () => {
		expect(
			radarPath([
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 }
			])
		).toBe('M 0 0 L 10 0 L 10 10 Z');
	});

	it('returns an empty path for no points', () => {
		expect(radarPath([])).toBe('');
	});

	it('rounds coordinates', () => {
		expect(radarPath([{ x: 1.23456789, y: 2 }])).toBe('M 1.235 2 Z');
	});
});

describe('bandScale', () => {
	it('splits the width evenly and centres each band', () => {
		const scale = bandScale(4, 400, 0.2);
		expect(scale.step).toBe(100);
		expect(scale.band).toBe(80);
		expect(scale.x(0)).toBe(10);
		expect(scale.x(1)).toBe(110);
		expect(scale.x(3)).toBe(310);
	});

	it('collapses to zero for an empty dataset', () => {
		const scale = bandScale(0, 400, 0.2);
		expect(scale.step).toBe(0);
		expect(scale.band).toBe(0);
		expect(scale.x(0)).toBe(0);
	});

	it('clamps an out-of-range gap fraction into the unit interval', () => {
		expect(bandScale(2, 200, -1).band).toBe(100);
		expect(bandScale(2, 200, 2).band).toBe(0);
	});

	it('falls back to the documented default for an unusable gap fraction', () => {
		// NaN is a caller bug, not a request for zero gap — a full-width band
		// would silently look like a deliberate design choice.
		const fallback = bandScale(2, 200).band;
		expect(fallback).toBe(80);
		expect(bandScale(2, 200, Number.NaN).band).toBe(fallback);
		expect(bandScale(2, 200, undefined as unknown as number).band).toBe(fallback);
		expect(bandScale(2, 200, Number.POSITIVE_INFINITY).band).toBe(fallback);
	});

	it('treats a non-positive or non-finite width as zero', () => {
		expect(bandScale(4, -100, 0.2).step).toBe(0);
		expect(bandScale(4, Number.NaN, 0.2).step).toBe(0);
	});
});

describe('linearScale', () => {
	it('maps the domain onto the range', () => {
		const scale = linearScale([0, 100], [0, 200]);
		expect(scale(0)).toBe(0);
		expect(scale(50)).toBe(100);
		expect(scale(100)).toBe(200);
	});

	it('supports an inverted range, as SVG y-axes need', () => {
		const scale = linearScale([0, 10], [300, 0]);
		expect(scale(0)).toBe(300);
		expect(scale(10)).toBe(0);
		expect(scale(5)).toBe(150);
	});

	it('extrapolates outside the domain', () => {
		const scale = linearScale([0, 10], [0, 100]);
		expect(scale(20)).toBe(200);
		expect(scale(-5)).toBe(-50);
	});

	it('returns the range start for a degenerate domain', () => {
		const scale = linearScale([5, 5], [0, 200]);
		expect(scale(5)).toBe(0);
		expect(scale(999)).toBe(0);
	});

	it('returns the range start for non-finite input', () => {
		const scale = linearScale([0, 10], [0, 100]);
		expect(scale(Number.NaN)).toBe(0);
	});
});

describe('niceMax', () => {
	it('rounds up to the next nice number', () => {
		expect(niceMax(5)).toBe(5);
		expect(niceMax(7)).toBe(8);
		expect(niceMax(98.2)).toBe(100);
		expect(niceMax(1)).toBe(1);
		expect(niceMax(1.1)).toBe(2);
		expect(niceMax(23)).toBe(25);
		expect(niceMax(3000)).toBe(4000);
	});

	it('handles fractional magnitudes without float noise', () => {
		expect(niceMax(0.3)).toBe(0.4);
		expect(niceMax(0.21)).toBe(0.25);
	});

	it('falls back to 1 for zero, negative and non-finite input', () => {
		expect(niceMax(0)).toBe(1);
		expect(niceMax(-42)).toBe(1);
		expect(niceMax(Number.NaN)).toBe(1);
		expect(niceMax(Number.POSITIVE_INFINITY)).toBe(1);
	});
});

describe('chartColor', () => {
	it('cycles through the five chart tokens', () => {
		expect(chartColor(0)).toBe('var(--chart-1)');
		expect(chartColor(4)).toBe('var(--chart-5)');
		expect(chartColor(5)).toBe('var(--chart-1)');
	});

	it('handles negative indices', () => {
		expect(chartColor(-1)).toBe('var(--chart-5)');
	});
});
