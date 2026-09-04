import { describe, it, expect, afterEach, vi } from 'vitest';
import {
	capDots,
	generateDots,
	respondToPointer,
	MAX_DOTS,
	type Dot
} from '$lib/components/kokonut/mouseEffectDots';

/** Keeps every candidate: `Math.random() > edgeFactor` is never true at 0. */
function keepEveryDot() {
	vi.spyOn(Math, 'random').mockReturnValue(0);
}

/** Drops every candidate except those at the very edge, where edgeFactor is 1. */
function dropAlmostEveryDot() {
	vi.spyOn(Math, 'random').mockReturnValue(0.999999);
}

function makeDots(count: number): Dot[] {
	return Array.from({ length: count }, (_, i) => ({ x: i, y: i, opacity: 0.5 }));
}

describe('generateDots', () => {
	afterEach(() => vi.restoreAllMocks());

	it('lays a grid at the requested pitch', () => {
		keepEveryDot();
		const dots = generateDots(160, 80, 16);
		expect(dots).toHaveLength(10 * 5);
		expect(dots[0]).toMatchObject({ x: 8, y: 8 });
	});

	it('centres each dot in its cell', () => {
		keepEveryDot();
		for (const dot of generateDots(64, 64, 16)) {
			expect((dot.x - 8) % 16).toBe(0);
			expect((dot.y - 8) % 16).toBe(0);
		}
	});

	it('never exceeds the cap', () => {
		keepEveryDot();
		const dots = generateDots(1600, 1200, 8);
		expect(dots).toHaveLength(MAX_DOTS);
	});

	it('thins the field out towards the centre', () => {
		dropAlmostEveryDot();
		const dots = generateDots(320, 320, 16);
		expect(dots.length).toBeGreaterThan(0);
		// Only dots past the 0.7 * maxDistance ring survive a near-1 roll.
		const maxDistance = Math.hypot(160, 160);
		for (const dot of dots) {
			expect(Math.hypot(dot.x - 160, dot.y - 160)).toBeGreaterThan(maxDistance * 0.69);
		}
	});

	it('dims dots near the centre and brightens them at the edges', () => {
		keepEveryDot();
		const dots = generateDots(320, 320, 16);
		const nearest = dots.reduce((a, b) =>
			Math.hypot(a.x - 160, a.y - 160) < Math.hypot(b.x - 160, b.y - 160) ? a : b
		);
		const farthest = dots.reduce((a, b) =>
			Math.hypot(a.x - 160, a.y - 160) > Math.hypot(b.x - 160, b.y - 160) ? a : b
		);
		expect(nearest.opacity).toBeLessThan(farthest.opacity);
	});

	it('returns nothing for a box or pitch that cannot hold a dot', () => {
		expect(generateDots(0, 100, 16)).toEqual([]);
		expect(generateDots(100, 0, 16)).toEqual([]);
		expect(generateDots(100, 100, 0)).toEqual([]);
		expect(generateDots(10, 10, 16)).toEqual([]);
	});
});

describe('capDots', () => {
	it('leaves a field that already fits alone', () => {
		const dots = makeDots(10);
		expect(capDots(dots, 20)).toBe(dots);
	});

	it('samples evenly rather than truncating', () => {
		const kept = capDots(makeDots(10), 5);
		expect(kept.map((dot) => dot.x)).toEqual([0, 2, 4, 6, 8]);
	});

	it('never repeats a dot', () => {
		const kept = capDots(makeDots(401), MAX_DOTS);
		expect(kept).toHaveLength(MAX_DOTS);
		expect(new Set(kept.map((dot) => dot.x)).size).toBe(MAX_DOTS);
	});
});

describe('respondToPointer', () => {
	const dot: Dot = { x: 100, y: 100, opacity: 0.5 };

	it('leaves a distant dot alone', () => {
		expect(respondToPointer(dot, 400, 400, 80, 20)).toEqual({ x: 0, y: 0, boost: 0 });
	});

	it('pushes a dot directly away from the pointer', () => {
		const response = respondToPointer(dot, 60, 100, 80, 20);
		expect(response.x).toBeCloseTo((1 - 40 / 80) * 20);
		expect(response.y).toBeCloseTo(0);
	});

	it('pushes hardest at the pointer and not at all at the radius', () => {
		const near = respondToPointer(dot, 99, 100, 80, 20);
		const edge = respondToPointer(dot, 20, 100, 80, 20);
		expect(near.x).toBeGreaterThan(edge.x);
		expect(edge.x).toBe(0);
	});

	it('resolves a dot sitting exactly under the pointer to a finite push', () => {
		const response = respondToPointer(dot, 100, 100, 80, 20);
		expect(Number.isFinite(response.x)).toBe(true);
		expect(Number.isFinite(response.y)).toBe(true);
		expect(Math.hypot(response.x, response.y)).toBeCloseTo(20);
	});

	it('brightens dots a little beyond the push radius', () => {
		// 90px out: past the 80px push, inside the 96px glow.
		const response = respondToPointer(dot, 10, 100, 80, 20);
		expect(response.x).toBe(0);
		expect(response.boost).toBeGreaterThan(0);
	});

	it('brightens most at the pointer', () => {
		expect(respondToPointer(dot, 100, 100, 80, 20).boost).toBeCloseTo(0.8);
	});
});
