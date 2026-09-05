import { describe, it, expect } from 'vitest';
import {
	generateAestheticPath,
	buildPathSets,
	PATH_COUNTS
} from '$lib/components/kokonut/backgroundPaths';

/** Count occurrences of an SVG path command at a token boundary. */
function countCommands(d: string, command: 'M' | 'C'): number {
	return (d.match(new RegExp(`(?:^|\\s)${command} `, 'g')) ?? []).length;
}

describe('generateAestheticPath', () => {
	it('starts with a single move command', () => {
		const d = generateAestheticPath(0, 1, 'primary');
		expect(d.startsWith('M ')).toBe(true);
		expect(countCommands(d, 'M')).toBe(1);
	});

	it.each([
		['primary', 10],
		['secondary', 8],
		['accent', 6]
	] as const)('emits one C command per segment for %s (%i)', (type, segments) => {
		expect(countCommands(generateAestheticPath(3, 1, type), 'C')).toBe(segments);
	});

	it('is deterministic for the same inputs', () => {
		expect(generateAestheticPath(4, -1, 'secondary')).toBe(
			generateAestheticPath(4, -1, 'secondary')
		);
	});

	it('mirrors x when position flips sign', () => {
		const right = generateAestheticPath(2, 1, 'primary');
		const left = generateAestheticPath(2, -1, 'primary');
		expect(left).not.toBe(right);
		// The first move command's x is `startX * position` = ±2400.
		expect(right.split(' ')[1]).toBe('2400');
		expect(left.split(' ')[1]).toBe('-2400');
	});

	it('contains only finite numbers', () => {
		const d = generateAestheticPath(9, 1, 'accent');
		const numbers = d.match(/-?\d+(?:\.\d+)?/g) ?? [];
		expect(numbers.length).toBeGreaterThan(0);
		for (const n of numbers) expect(Number.isFinite(Number(n))).toBe(true);
	});

	it('varies with the index (phase shift)', () => {
		expect(generateAestheticPath(0, 1, 'primary')).not.toBe(generateAestheticPath(1, 1, 'primary'));
	});
});

describe('buildPathSets', () => {
	const sets = buildPathSets(1);

	it('produces the budgeted number of paths in each set', () => {
		expect(PATH_COUNTS).toEqual({ primary: 8, secondary: 8, accent: 6 });
		expect(sets.primary).toHaveLength(PATH_COUNTS.primary);
		expect(sets.secondary).toHaveLength(PATH_COUNTS.secondary);
		expect(sets.accent).toHaveLength(PATH_COUNTS.accent);
	});

	it('stays inside the 44-path budget once both halves are drawn', () => {
		const perSide = PATH_COUNTS.primary + PATH_COUNTS.secondary + PATH_COUNTS.accent;
		expect(perSide * 2).toBe(44);
	});

	it('gives every path a deterministic, unique id scoped to the position', () => {
		const ids = [...sets.primary, ...sets.secondary, ...sets.accent].map((p) => p.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(sets.primary[3].id).toBe('primary-1-3');
		expect(buildPathSets(-1).secondary[0].id).toBe('secondary--1-0');
	});

	it('ramps opacity and width per the Kokonut formulas', () => {
		expect(sets.primary[0]).toMatchObject({ opacity: 0.15, width: 4, duration: 25 });
		expect(sets.primary[2].opacity).toBeCloseTo(0.19, 5);
		expect(sets.primary[2].width).toBeCloseTo(4.6, 5);
		expect(sets.secondary[0]).toMatchObject({ opacity: 0.12, width: 3, duration: 20 });
		expect(sets.secondary[4].opacity).toBeCloseTo(0.18, 5);
		expect(sets.accent[0]).toMatchObject({ opacity: 0.08, width: 2, duration: 15 });
		expect(sets.accent[4].opacity).toBeCloseTo(0.56, 5);
	});

	it('ramps accent opacity without ever exceeding 1', () => {
		// The accent ramp is steep enough to overshoot at the original count; the
		// cap stays in place whatever the count is set to.
		for (const path of sets.accent) expect(path.opacity).toBeLessThanOrEqual(1);
		expect(sets.accent.at(-1)!.opacity).toBeGreaterThan(sets.accent[0].opacity);
	});

	it('carries the generated geometry for each path', () => {
		expect(sets.primary[5].d).toBe(generateAestheticPath(5, 1, 'primary'));
		expect(buildPathSets(-1).accent[2].d).toBe(generateAestheticPath(2, -1, 'accent'));
	});

	it('produces the same output on repeated calls', () => {
		expect(buildPathSets(1)).toEqual(buildPathSets(1));
	});
});
