import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as motionModule from '$lib/motion';
import { parallax } from '$lib/actions/parallax';
import type { MotionMock } from './motionMock';

vi.mock('$lib/motion', async () => (await import('./motionMock')).createMotionMock());

const motion = motionModule as unknown as MotionMock;

let node: HTMLElement;

beforeEach(() => {
	vi.clearAllMocks();
	motion.reducedMotion.mockReturnValue(false);
	node = document.createElement('div');
	document.body.appendChild(node);
});

afterEach(() => {
	node.remove();
});

describe('parallax', () => {
	it('drives a linear y animation from the element scroll timeline', () => {
		parallax(node, undefined);

		expect(motion.animate).toHaveBeenCalledTimes(1);
		const [subject, keyframes, options] = motion.animate.mock.calls[0];
		expect(subject).toBe(node);
		expect(keyframes).toEqual({ y: [-20, 20] });
		expect(options).toMatchObject({ ease: 'linear' });

		expect(motion.scroll).toHaveBeenCalledTimes(1);
		expect(motion.scroll.mock.calls[0][0]).toBe(motion.animate.mock.results[0].value);
		expect(motion.scroll.mock.calls[0][1]).toEqual({
			target: node,
			offset: ['start end', 'end start']
		});
	});

	it('scales the travel by speed', () => {
		parallax(node, { speed: 0.5 });

		expect(motion.animate.mock.calls[0][1]).toEqual({ y: [-50, 50] });
	});

	it('does nothing under reduced motion', () => {
		motion.reducedMotion.mockReturnValue(true);

		parallax(node, undefined);

		expect(motion.animate).not.toHaveBeenCalled();
		expect(motion.scroll).not.toHaveBeenCalled();
	});

	it('cancels the scroll timeline and the animation on destroy', () => {
		const cancel = vi.fn();
		motion.scroll.mockReturnValueOnce(cancel);

		const result = parallax(node, undefined);
		const animation = motion.animate.mock.results[0].value;
		result?.destroy?.();

		expect(cancel).toHaveBeenCalledTimes(1);
		expect(animation.stop).toHaveBeenCalledTimes(1);
	});
});
