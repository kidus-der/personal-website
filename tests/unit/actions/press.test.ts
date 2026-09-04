import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as motionModule from '$lib/motion';
import { springs } from '$lib/motion/config';
import { press } from '$lib/actions/press';
import type { MotionMock } from './motionMock';

vi.mock('$lib/motion', async () => (await import('./motionMock')).createMotionMock());

const motion = motionModule as unknown as MotionMock;

/** Runs the gesture handler the action registered, returning its release handler. */
function startPress() {
	const [element, onPressStart] = motion.press.mock.calls[0];
	return onPressStart(element, {} as PointerEvent);
}

let node: HTMLElement;

beforeEach(() => {
	vi.clearAllMocks();
	motion.reducedMotion.mockReturnValue(false);
	node = document.createElement('button');
	document.body.appendChild(node);
});

afterEach(() => {
	node.remove();
});

describe('press', () => {
	it('registers the press gesture on the node', () => {
		press(node, undefined);

		expect(motion.press).toHaveBeenCalledTimes(1);
		expect(motion.press.mock.calls[0][0]).toBe(node);
		expect(motion.animate).not.toHaveBeenCalled();
	});

	it('scales down on press and back up on release', () => {
		press(node, undefined);

		const release = startPress();
		expect(motion.animate).toHaveBeenCalledTimes(1);
		expect(motion.animate.mock.calls[0][0]).toBe(node);
		expect(motion.animate.mock.calls[0][1]).toEqual({ scale: 0.97 });
		expect(motion.animate.mock.calls[0][2]).toMatchObject(springs.snappy);

		expect(typeof release).toBe('function');
		(release as () => void)();

		expect(motion.animate).toHaveBeenCalledTimes(2);
		expect(motion.animate.mock.calls[1][1]).toEqual({ scale: 1 });
		expect(motion.animate.mock.calls[1][2]).toMatchObject(springs.bouncy);
	});

	it('honours a custom scale', () => {
		press(node, { scale: 0.9 });

		startPress();

		expect(motion.animate.mock.calls[0][1]).toEqual({ scale: 0.9 });
	});

	it('does nothing under reduced motion', () => {
		motion.reducedMotion.mockReturnValue(true);

		press(node, undefined);

		expect(motion.press).not.toHaveBeenCalled();
	});

	it('cancels the gesture and stops the animation on destroy', () => {
		const cancel = vi.fn();
		motion.press.mockReturnValueOnce(cancel);

		const result = press(node, undefined);
		startPress();
		const animation = motion.animate.mock.results[0].value;
		result?.destroy?.();

		expect(cancel).toHaveBeenCalledTimes(1);
		expect(animation.stop).toHaveBeenCalledTimes(1);
	});

	it('picks up a new scale from update', () => {
		const result = press(node, { scale: 0.97 });

		result?.update?.({ scale: 0.8 });
		startPress();

		expect(motion.animate.mock.calls[0][1]).toEqual({ scale: 0.8 });
	});
});
