import { describe, it, expect, afterEach, vi } from 'vitest';
import { springs, easings, durations, reducedMotion } from '$lib/motion/config';

function stubMatchMedia(matches: boolean) {
	const spy = vi.fn((query: string) => ({
		matches,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	}));
	vi.stubGlobal('matchMedia', spy);
	return spy;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('motion tokens', () => {
	it('exposes the three named springs from the spec', () => {
		expect(springs.snappy).toEqual({ type: 'spring', stiffness: 300, damping: 28 });
		expect(springs.soft).toEqual({ type: 'spring', stiffness: 180, damping: 22 });
		expect(springs.bouncy).toEqual({ type: 'spring', stiffness: 400, damping: 18 });
	});

	it('exposes cubic-bezier easing arrays', () => {
		expect(easings.outExpo).toEqual([0.16, 1, 0.3, 1]);
		expect(easings.outQuart).toEqual([0.25, 1, 0.5, 1]);
		expect(easings.inOutQuart).toEqual([0.76, 0, 0.24, 1]);
	});

	it('exposes durations in seconds', () => {
		expect(durations).toEqual({ fast: 0.2, base: 0.4, slow: 0.7 });
	});
});

describe('reducedMotion', () => {
	it('returns true when the user prefers reduced motion', () => {
		const spy = stubMatchMedia(true);
		expect(reducedMotion()).toBe(true);
		expect(spy).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
	});

	it('returns false when the user has no reduced-motion preference', () => {
		stubMatchMedia(false);
		expect(reducedMotion()).toBe(false);
	});

	it('returns false when matchMedia is unavailable (SSR)', () => {
		vi.stubGlobal('matchMedia', undefined);
		expect(reducedMotion()).toBe(false);
	});
});
