import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as motionModule from '$lib/motion';
import { springs } from '$lib/motion/config';
import { magnetic } from '$lib/actions/magnetic';
import type { MotionMock } from '../mocks/motionFactory';
import { pointerLeave, pointerMove, stubBox, stubPointer } from './domStubs';

vi.mock('$lib/motion', async () => (await import('../mocks/motionFactory')).createMotionMock());

const motion = motionModule as unknown as MotionMock;

let node: HTMLElement;

beforeEach(() => {
	vi.clearAllMocks();
	motion.reducedMotion.mockReturnValue(false);
	stubPointer('fine');
	node = document.createElement('div');
	stubBox(node);
	document.body.appendChild(node);
});

afterEach(() => {
	node.remove();
	vi.unstubAllGlobals();
});

describe('magnetic', () => {
	it('pulls the node toward the cursor by the default strength', () => {
		magnetic(node, undefined);

		pointerMove(node, 150, 100);

		// Centre is (100, 50); offset (50, 50) scaled by the default 0.3.
		expect(motion.animate).toHaveBeenCalledTimes(1);
		const [subject, keyframes, options] = motion.animate.mock.calls[0];
		expect(subject).toBe(node);
		expect(keyframes).toEqual({ x: 15, y: 15 });
		expect(options).toMatchObject(springs.soft);
	});

	it('scales the pull by the configured strength', () => {
		magnetic(node, { strength: 1 });

		pointerMove(node, 50, 0);

		expect(motion.animate.mock.calls[0][1]).toEqual({ x: -50, y: -50 });
	});

	it('springs back to the origin on pointer leave', () => {
		magnetic(node, undefined);
		pointerMove(node, 150, 100);

		pointerLeave(node);

		expect(motion.animate.mock.calls[1][1]).toEqual({ x: 0, y: 0 });
	});

	it('does nothing under reduced motion', () => {
		motion.reducedMotion.mockReturnValue(true);
		magnetic(node, undefined);

		pointerMove(node, 150, 100);

		expect(motion.animate).not.toHaveBeenCalled();
	});

	it('does nothing on a coarse pointer', () => {
		stubPointer('coarse');
		magnetic(node, undefined);

		pointerMove(node, 150, 100);

		expect(motion.animate).not.toHaveBeenCalled();
	});

	it('detaches its listeners and stops the animation on destroy', () => {
		const result = magnetic(node, undefined);
		pointerMove(node, 150, 100);
		const animation = motion.animate.mock.results[0].value;

		result?.destroy?.();
		pointerMove(node, 10, 10);

		expect(animation.stop).toHaveBeenCalledTimes(1);
		expect(motion.animate).toHaveBeenCalledTimes(1);
	});

	it('picks up a new strength from update', () => {
		const result = magnetic(node, { strength: 0.3 });

		result?.update?.({ strength: 0.5 });
		pointerMove(node, 150, 100);

		expect(motion.animate.mock.calls[0][1]).toEqual({ x: 25, y: 25 });
	});
});
