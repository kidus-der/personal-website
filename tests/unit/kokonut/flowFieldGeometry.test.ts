import { describe, it, expect } from 'vitest';
import {
	buildFlowField,
	flowPathCount,
	generateAestheticPath,
	FLOW_MIRRORS,
	FLOW_VIEW_BOX,
	PATH_COUNTS,
	STROKE_WIDTH,
	type FlowIntensity
} from '$lib/components/kokonut/flowField';

/**
 * The geometry has to be deterministic: it renders on the server and again on
 * the client, and a single differing coordinate is a hydration mismatch across
 * every page that carries the field.
 */
describe('generateAestheticPath', () => {
	it('starts with a move and continues in cubic segments', () => {
		const d = generateAestheticPath(0, 1, 'primary');
		expect(d.startsWith('M ')).toBe(true);
		expect(d.split(' C ')).toHaveLength(11); // 10 segments for the primary layer
	});

	it('gives the secondary layer fewer segments than the primary one', () => {
		expect(generateAestheticPath(0, 1, 'secondary').split(' C ')).toHaveLength(9);
	});

	it('is deterministic', () => {
		expect(generateAestheticPath(3, -1, 'secondary')).toBe(
			generateAestheticPath(3, -1, 'secondary')
		);
	});

	it('produces no NaN, whatever the index', () => {
		for (let index = 0; index < 12; index++) {
			expect(generateAestheticPath(index, 1, 'primary')).not.toContain('NaN');
		}
	});

	it('mirrors x across the Y axis for position -1, leaving y alone', () => {
		const numbers = (d: string) => d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
		const right = numbers(generateAestheticPath(2, 1, 'primary'));
		const left = numbers(generateAestheticPath(2, -1, 'primary'));
		expect(left).toHaveLength(right.length);
		// The `M`/`C` numbers alternate x, y from the start of the string.
		for (let i = 0; i < right.length; i++) {
			if (i % 2 === 0) expect(left[i]).toBeCloseTo(-right[i], 6);
			else expect(left[i]).toBeCloseTo(right[i], 6);
		}
	});

	it('shifts the phase with the index, so no two lines are the same curve', () => {
		expect(generateAestheticPath(0, 1, 'primary')).not.toBe(generateAestheticPath(1, 1, 'primary'));
	});
});

describe.each(['bold', 'soft'] as const)('buildFlowField(%s)', (intensity: FlowIntensity) => {
	const sets = buildFlowField(intensity);
	const all = [...sets.primary, ...sets.secondary];
	const counts = PATH_COUNTS[intensity];

	it('draws each layer once per mirrored half', () => {
		expect(sets.primary).toHaveLength(counts.primary * FLOW_MIRRORS.length);
		expect(sets.secondary).toHaveLength(counts.secondary * FLOW_MIRRORS.length);
	});

	it('agrees with flowPathCount', () => {
		expect(all).toHaveLength(flowPathCount(intensity));
	});

	it('gives every path a unique, deterministic id', () => {
		const ids = all.map((path) => path.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(ids).toContain(`primary-1-0`);
		expect(ids).toContain(`secondary--1-0`);
		expect(buildFlowField(intensity).primary.map((path) => path.id)).toEqual(
			sets.primary.map((path) => path.id)
		);
	});

	it('rebuilds byte-identical geometry', () => {
		expect(buildFlowField(intensity).primary.map((path) => path.d)).toEqual(
			sets.primary.map((path) => path.d)
		);
	});

	it('ramps each half from the back of the set to the front', () => {
		const half = sets.primary.slice(0, counts.primary);
		expect(half[0].t).toBe(0);
		expect(half.at(-1)?.t).toBe(1);
		expect(half.map((path) => path.t)).toEqual(
			[...half.map((path) => path.t)].sort((a, b) => a - b)
		);
	});

	it('keeps every stroke inside the width ramp', () => {
		const [thin, thick] = STROKE_WIDTH;
		for (const path of all) {
			expect(path.width).toBeGreaterThanOrEqual(thin);
			expect(path.width).toBeLessThanOrEqual(thick);
		}
	});

	it('drifts the two layers at different speeds', () => {
		expect(sets.primary[0].duration).not.toBe(sets.secondary[0].duration);
		expect(new Set(sets.primary.map((path) => path.duration)).size).toBe(1);
	});

	it('labels every path with the layer it belongs to', () => {
		expect(sets.primary.every((path) => path.layer === 'primary')).toBe(true);
		expect(sets.secondary.every((path) => path.layer === 'secondary')).toBe(true);
	});
});

describe('the intensities', () => {
	it('draws 36 paths bold and 24 soft — the numbers the perf budget is written for', () => {
		expect(flowPathCount('bold')).toBe(36);
		expect(flowPathCount('soft')).toBe(24);
	});
});

describe('FLOW_VIEW_BOX', () => {
	it('is centred on the crossing point and wider than it is tall', () => {
		const [minX, minY, width, height] = FLOW_VIEW_BOX.split(' ').map(Number);
		expect(width).toBeGreaterThan(height);
		// Centred on x = 0, where the two mirrored halves cross.
		expect(minX + width / 2).toBeCloseTo(0, 6);
		expect(minY).toBeLessThan(0);
	});
});
