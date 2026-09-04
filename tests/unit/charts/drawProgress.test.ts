import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { flushSync } from 'svelte';
import { mountDrawProgress } from './drawProgress.harness.svelte';
import { DRAW_DURATION } from '$lib/components/charts/drawProgress.svelte';

interface AnimateOptions {
	duration?: number;
	ease?: number[];
	onUpdate?: (value: number) => void;
}

/**
 * The stub keeps the `onUpdate` callback instead of firing it, so a test can
 * step the animation frame by frame — the one thing the component suites, which
 * jump straight to the final value, cannot check.
 */
const mocks = vi.hoisted(() => {
	const stop = vi.fn();
	const frames: ((value: number) => void)[] = [];
	return {
		stop,
		frames,
		reducedMotion: vi.fn(() => false),
		animate: vi.fn((_from: number, _to: number, options?: AnimateOptions) => {
			if (options?.onUpdate) frames.push(options.onUpdate);
			return { stop };
		})
	};
});

vi.mock('$lib/motion', async () => {
	const config = await vi.importActual<typeof import('$lib/motion/config')>('$lib/motion/config');
	return { ...config, animate: mocks.animate, reducedMotion: mocks.reducedMotion };
});

/** Advances the single in-flight animation to `value`. */
function step(value: number): void {
	mocks.frames.at(-1)?.(value);
	flushSync();
}

beforeEach(() => {
	mocks.reducedMotion.mockReturnValue(false);
	mocks.frames.length = 0;
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('createDrawProgress', () => {
	it('starts at zero and follows the animation to one', () => {
		const draw = mountDrawProgress();
		flushSync();

		expect(draw.value).toBe(0);
		step(0.5);
		expect(draw.value).toBe(0.5);
		step(1);
		expect(draw.value).toBe(1);

		draw.destroy();
	});

	it('animates from 0 to 1 over the shared draw duration', () => {
		const draw = mountDrawProgress();
		flushSync();

		expect(mocks.animate).toHaveBeenCalledTimes(1);
		const [from, to, options] = mocks.animate.mock.calls[0];
		expect(from).toBe(0);
		expect(to).toBe(1);
		expect(options?.duration).toBe(DRAW_DURATION);

		draw.destroy();
	});

	it('accepts a duration override', () => {
		const draw = mountDrawProgress({ duration: 0.4 });
		flushSync();
		expect(mocks.animate.mock.calls[0][2]?.duration).toBe(0.4);
		draw.destroy();
	});

	it('passes a mutable copy of the easing, not the frozen token', () => {
		const draw = mountDrawProgress();
		flushSync();
		const ease = mocks.animate.mock.calls[0][2]?.ease;
		expect(ease).toEqual([0.16, 1, 0.3, 1]);
		expect(Array.isArray(ease)).toBe(true);
		draw.destroy();
	});

	it('jumps to the final state without animating when motion is reduced', () => {
		mocks.reducedMotion.mockReturnValue(true);
		const draw = mountDrawProgress();
		flushSync();

		expect(draw.value).toBe(1);
		expect(mocks.animate).not.toHaveBeenCalled();

		draw.destroy();
	});

	it('jumps to the final state without animating when disabled', () => {
		const draw = mountDrawProgress({ enabled: false });
		flushSync();

		expect(draw.value).toBe(1);
		expect(mocks.animate).not.toHaveBeenCalled();

		draw.destroy();
	});

	it('stops the animation when the scope is destroyed', () => {
		const draw = mountDrawProgress();
		flushSync();
		draw.destroy();
		expect(mocks.stop).toHaveBeenCalledTimes(1);
	});

	it('re-runs when the enabled flag turns off, stopping the old animation', () => {
		const draw = mountDrawProgress();
		flushSync();
		expect(mocks.animate).toHaveBeenCalledTimes(1);

		draw.setEnabled(false);
		flushSync();

		expect(mocks.stop).toHaveBeenCalledTimes(1);
		expect(draw.value).toBe(1);
		expect(mocks.animate).toHaveBeenCalledTimes(1);

		draw.destroy();
	});
});
