import { describe, it, expect } from 'vitest';
import * as motion from '$lib/motion';

const RE_EXPORTS = ['animate', 'inView', 'scroll', 'stagger', 'spring', 'press', 'hover'] as const;

describe('$lib/motion', () => {
	it.each(RE_EXPORTS)('re-exports %s as a function', (name) => {
		expect(typeof motion[name]).toBe('function');
	});

	it('also re-exports the motion design tokens', () => {
		expect(motion.springs.snappy.stiffness).toBe(300);
		expect(motion.easings.outExpo).toEqual([0.16, 1, 0.3, 1]);
		expect(motion.durations.base).toBe(0.4);
		expect(typeof motion.reducedMotion).toBe('function');
	});
});
