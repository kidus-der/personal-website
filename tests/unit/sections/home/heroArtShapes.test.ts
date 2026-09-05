import { describe, it, expect } from 'vitest';
import {
	HERO_SHAPES,
	SHAPE_COLORS,
	ENTRANCE_DROP,
	ENTRANCE_ROTATE_OFFSET,
	MAX_BLEED
} from '$lib/components/sections/home/heroArt';

describe('HERO_SHAPES', () => {
	it('composes exactly five shapes', () => {
		expect(HERO_SHAPES).toHaveLength(5);
	});

	it('gives every shape a positive size in percent of the container', () => {
		for (const shape of HERO_SHAPES) {
			expect(shape.width).toBeGreaterThan(0);
			expect(shape.width).toBeLessThanOrEqual(100);
			expect(shape.height).toBeGreaterThan(0);
			expect(shape.height).toBeLessThanOrEqual(100);
		}
	});

	it('varies the sizes rather than repeating one shape five times', () => {
		expect(new Set(HERO_SHAPES.map((shape) => shape.width)).size).toBe(HERO_SHAPES.length);
	});

	it('keeps every shape within the container, give or take a deliberate bleed', () => {
		for (const shape of HERO_SHAPES) {
			expect(shape.x).toBeGreaterThanOrEqual(-MAX_BLEED);
			expect(shape.y).toBeGreaterThanOrEqual(-MAX_BLEED);
			expect(shape.x + shape.width).toBeLessThanOrEqual(100 + MAX_BLEED);
			expect(shape.y + shape.height).toBeLessThanOrEqual(100 + MAX_BLEED);
		}
	});

	it('reads as a loose diagonal: each shape sits below the one before it', () => {
		for (let i = 1; i < HERO_SHAPES.length; i += 1) {
			expect(HERO_SHAPES[i].y).toBeGreaterThan(HERO_SHAPES[i - 1].y);
		}
		// …and drifts rightwards overall, upper-left to lower-right.
		expect(HERO_SHAPES.at(-1)!.x).toBeGreaterThan(HERO_SHAPES[0].x);
	});

	it('tilts every shape, and never all the same way', () => {
		expect(HERO_SHAPES.every((shape) => shape.rotate !== 0)).toBe(true);
		expect(HERO_SHAPES.some((shape) => shape.rotate < 0)).toBe(true);
		expect(HERO_SHAPES.some((shape) => shape.rotate > 0)).toBe(true);
	});

	it('gives each shape a unique delay, ascending', () => {
		const delays = HERO_SHAPES.map((shape) => shape.delay);
		expect(new Set(delays).size).toBe(delays.length);
		expect([...delays].sort((a, b) => a - b)).toEqual(delays);
		expect(delays[0]).toBeGreaterThan(0);
	});

	it('names a known colour token for each shape, with no duplicates', () => {
		const colors = HERO_SHAPES.map((shape) => shape.color);
		expect(new Set(colors).size).toBe(colors.length);
		for (const color of colors) expect(SHAPE_COLORS).toContain(color);
	});
});

describe('entrance constants', () => {
	it('drops the shapes in from above', () => {
		expect(ENTRANCE_DROP).toBeLessThan(0);
	});

	it('unwinds the tilt on the way in', () => {
		expect(ENTRANCE_ROTATE_OFFSET).not.toBe(0);
	});
});
