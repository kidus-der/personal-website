/**
 * The pure half of `ParticleNetwork`.
 *
 * Named `…Helpers` rather than `particleNetwork.test.ts` because macOS ships a
 * case-insensitive filesystem, on which that name and `ParticleNetwork.test.ts`
 * are the same file — the same reason `flowFieldGeometry.test.ts` was not
 * `flowField.test.ts`.
 */
import { describe, it, expect } from 'vitest';
import {
	CELL_SIZE,
	LINK_RADIUS,
	NARROW_VIEWPORT,
	PARTICLE_COUNTS,
	SpatialHash,
	createNoise,
	isLightBackground,
	parseColor,
	particleCount,
	rgba,
	type RGB
} from '$lib/components/kokonut/particleNetwork';

describe('parseColor', () => {
	it('reads the long hex the tokens are written in', () => {
		expect(parseColor('#ef5824')).toEqual([239, 88, 36]);
		expect(parseColor('#000000')).toEqual([0, 0, 0]);
		expect(parseColor('#FFFFFF')).toEqual([255, 255, 255]);
	});

	it('expands short hex', () => {
		expect(parseColor('#fff')).toEqual([255, 255, 255]);
		expect(parseColor('#0a3')).toEqual([0, 170, 51]);
	});

	it('reads rgb() and rgba(), comma- or space-separated', () => {
		expect(parseColor('rgb(10, 20, 30)')).toEqual([10, 20, 30]);
		expect(parseColor('rgba(244, 244, 245, 0.62)')).toEqual([244, 244, 245]);
		expect(parseColor('rgb(10 20 30 / 50%)')).toEqual([10, 20, 30]);
	});

	it('rounds and clamps fractional channels', () => {
		expect(parseColor('rgb(10.6, -4, 900)')).toEqual([11, 0, 255]);
	});

	it('tolerates the whitespace getPropertyValue leaves on a custom property', () => {
		expect(parseColor('  #ef5824 ')).toEqual([239, 88, 36]);
	});

	it('falls back rather than throwing on anything it cannot read', () => {
		const fallback: RGB = [1, 2, 3];
		// A missing custom property reads as the empty string, and a token can hold
		// forms — `color-mix()`, `oklch()` — a canvas could not use anyway.
		expect(parseColor('', fallback)).toEqual(fallback);
		expect(parseColor('color-mix(in srgb, red 50%, blue)', fallback)).toEqual(fallback);
		expect(parseColor('#12345', fallback)).toEqual(fallback);
		expect(parseColor('rebeccapurple', fallback)).toEqual(fallback);
	});

	it('defaults its fallback to black', () => {
		expect(parseColor('nonsense')).toEqual([0, 0, 0]);
	});
});

describe('rgba', () => {
	it('writes a canvas-ready colour', () => {
		expect(rgba([239, 88, 36], 0.5)).toBe('rgba(239,88,36,0.5)');
	});
});

describe('isLightBackground', () => {
	it('separates the two theme grounds', () => {
		expect(isLightBackground([0, 0, 0])).toBe(false);
		expect(isLightBackground([255, 255, 255])).toBe(true);
	});

	it('weights the channels by luminance, not by average', () => {
		// Saturated blue is dark despite a 255 channel; saturated green is light.
		expect(isLightBackground([0, 0, 255])).toBe(false);
		expect(isLightBackground([0, 255, 0])).toBe(true);
	});
});

describe('particleCount', () => {
	it('uses the full count on a desktop-width viewport', () => {
		expect(particleCount('bold', 1440)).toBe(PARTICLE_COUNTS.bold);
		expect(particleCount('soft', 1440)).toBe(PARTICLE_COUNTS.soft);
	});

	it('halves below the narrow breakpoint', () => {
		expect(particleCount('bold', 390)).toBe(PARTICLE_COUNTS.bold / 2);
		expect(particleCount('soft', 390)).toBe(PARTICLE_COUNTS.soft / 2);
	});

	it('treats the breakpoint itself as wide', () => {
		expect(particleCount('bold', NARROW_VIEWPORT)).toBe(PARTICLE_COUNTS.bold);
		expect(particleCount('bold', NARROW_VIEWPORT - 1)).toBe(PARTICLE_COUNTS.bold / 2);
	});
});

describe('createNoise', () => {
	it('is deterministic for a seed', () => {
		const a = createNoise(7);
		const b = createNoise(7);
		for (let i = 0; i < 200; i += 1) {
			expect(a(i * 0.37, i * 0.11)).toBe(b(i * 0.37, i * 0.11));
		}
	});

	it('gives a different field for a different seed', () => {
		const a = createNoise(1);
		const b = createNoise(2);
		const differs = Array.from(
			{ length: 200 },
			(_, i) => a(i * 0.37, i * 0.11) !== b(i * 0.37, i * 0.11)
		);
		expect(differs.some(Boolean)).toBe(true);
	});

	it('stays inside the bound the gradient function implies', () => {
		const noise = createNoise(3);
		let min = Infinity;
		let max = -Infinity;
		for (let i = 0; i < 20000; i += 1) {
			const value = noise(Math.random() * 512 - 256, Math.random() * 512 - 256);
			expect(Number.isFinite(value)).toBe(true);
			min = Math.min(min, value);
			max = Math.max(max, value);
		}
		expect(min).toBeGreaterThanOrEqual(-1.5);
		expect(max).toBeLessThanOrEqual(1.5);
		// A field that never left a hair either side of zero would satisfy the
		// bound above while being useless as a flow field.
		expect(max - min).toBeGreaterThan(0.2);
	});

	it('is continuous — neighbouring samples do not jump', () => {
		const noise = createNoise(5);
		for (let i = 0; i < 500; i += 1) {
			const x = Math.random() * 100;
			const y = Math.random() * 100;
			expect(Math.abs(noise(x, y) - noise(x + 0.001, y))).toBeLessThan(0.02);
		}
	});
});

describe('SpatialHash', () => {
	/** Every index the hash offers for `(x, y)`, sorted, so order is not asserted. */
	function query(hash: SpatialHash, x: number, y: number, ring = 1): number[] {
		const out = new Int32Array(64);
		const found = hash.query(x, y, ring, out);
		return [...out.slice(0, found)].sort((a, b) => a - b);
	}

	function build(points: [number, number][], width = 100, height = 100): SpatialHash {
		const xs = new Float32Array(points.map(([x]) => x));
		const ys = new Float32Array(points.map(([, y]) => y));
		const hash = new SpatialHash(CELL_SIZE);
		hash.build(xs, ys, points.length, width, height);
		return hash;
	}

	it('offers every point in the ring of cells around a position', () => {
		// 0 shares a cell, 1 is one cell over, 2 is far away.
		const hash = build([
			[10, 10],
			[35, 10],
			[95, 95]
		]);
		expect(query(hash, 10, 10)).toEqual([0, 1]);
	});

	it('never misses a point inside the link radius', () => {
		const points: [number, number][] = Array.from({ length: 400 }, () => [
			Math.random() * 300,
			Math.random() * 200
		]);
		const hash = build(points, 300, 200);

		for (const [x, y] of points) {
			const offered = new Set(query(hash, x, y));
			const truth = points
				.map((point, index) => ({ point, index }))
				.filter(({ point }) => Math.hypot(point[0] - x, point[1] - y) < LINK_RADIUS)
				.map(({ index }) => index);
			for (const index of truth) expect(offered.has(index)).toBe(true);
		}
	});

	it('reaches further with a wider ring, which is what a hub needs', () => {
		const hash = build([
			[10, 10],
			[70, 10]
		]);
		expect(query(hash, 10, 10, 1)).toEqual([0]);
		expect(query(hash, 10, 10, 2)).toEqual([0, 1]);
	});

	it('clamps a query outside the grid to its edge rather than reading past it', () => {
		const hash = build([[1, 1]]);
		expect(query(hash, -500, -500)).toEqual([0]);
		expect(query(hash, 5000, 5000)).toEqual([]);
	});

	it('buckets points that fall outside the box into the edge cells', () => {
		// A particle can sit a fraction of a pixel past the edge in the gap between
		// the step that moved it and the respawn that notices.
		const hash = build([[-3, -3]]);
		expect(query(hash, 0, 0)).toEqual([0]);
	});

	it('offers nothing before anything has been built', () => {
		expect(query(new SpatialHash(CELL_SIZE), 0, 0)).toEqual([]);
	});

	it('forgets the previous frame when it is rebuilt', () => {
		const xs = new Float32Array([10, 90]);
		const ys = new Float32Array([10, 90]);
		const hash = new SpatialHash(CELL_SIZE);
		hash.build(xs, ys, 2, 100, 100);
		expect(query(hash, 10, 10)).toEqual([0]);

		xs[0] = 90;
		ys[0] = 90;
		hash.build(xs, ys, 2, 100, 100);
		expect(query(hash, 10, 10)).toEqual([]);
		expect(query(hash, 90, 90)).toEqual([0, 1]);
	});

	it("stops writing at the end of the caller's buffer", () => {
		const hash = build(Array.from({ length: 50 }, () => [10, 10] as [number, number]));
		const out = new Int32Array(4);
		expect(hash.query(10, 10, 1, out)).toBe(4);
	});
});
