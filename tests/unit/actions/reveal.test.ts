import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as motionModule from '$lib/motion';
import { easings } from '$lib/motion/config';
import { reveal } from '$lib/actions/reveal';
import type { MotionMock } from './motionMock';

vi.mock('$lib/motion', async () => (await import('./motionMock')).createMotionMock());

const motion = motionModule as unknown as MotionMock;

/** Runs the `onStart` handler that the action registered with `inView`. */
function enterView(index = 0) {
	const [observed, onStart] = motion.inView.mock.calls[index];
	return onStart(observed, {} as IntersectionObserverEntry);
}

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

describe('reveal', () => {
	it('hides the node synchronously and observes it with the default amount', () => {
		reveal(node, undefined);

		expect(node.style.opacity).toBe('0');
		expect(node.style.transform).toBe('translateY(16px)');
		expect(motion.inView).toHaveBeenCalledTimes(1);
		expect(motion.inView.mock.calls[0][0]).toBe(node);
		expect(motion.inView.mock.calls[0][2]).toEqual({ amount: 0.2 });
	});

	it('honours the y and amount options', () => {
		reveal(node, { y: 40, amount: 'all' });

		expect(node.style.transform).toBe('translateY(40px)');
		expect(motion.inView.mock.calls[0][2]).toEqual({ amount: 'all' });
	});

	it('animates to the visible state when the node enters view', () => {
		reveal(node, { delay: 0.1, duration: 0.5 });
		expect(motion.animate).not.toHaveBeenCalled();

		enterView();

		expect(motion.animate).toHaveBeenCalledTimes(1);
		const [subject, keyframes, options] = motion.animate.mock.calls[0];
		expect(subject).toEqual([node]);
		expect(keyframes).toEqual({ opacity: 1, y: 0 });
		expect(options).toMatchObject({ duration: 0.5, delay: 0.1, ease: easings.outExpo });
	});

	it('does not re-animate on a second entry when once is left at its default', () => {
		reveal(node, undefined);

		expect(enterView()).toBeUndefined();
		enterView();

		expect(motion.animate).toHaveBeenCalledTimes(1);
	});

	it('animates back out on leave when once is false', () => {
		reveal(node, { once: false, y: 20 });

		const onLeave = enterView();
		expect(typeof onLeave).toBe('function');
		(onLeave as () => void)();

		expect(motion.animate).toHaveBeenCalledTimes(2);
		expect(motion.animate.mock.calls[1][1]).toEqual({ opacity: 0, y: 20 });
	});

	it('staggers the direct children when a stagger interval is given', () => {
		const first = document.createElement('span');
		const second = document.createElement('span');
		node.append(first, second);

		reveal(node, { stagger: 0.06, delay: 0.2 });

		expect(first.style.opacity).toBe('0');
		expect(second.style.transform).toBe('translateY(16px)');
		expect(node.style.opacity).toBe('');

		enterView();

		expect(motion.stagger).toHaveBeenCalledWith(0.06, { startDelay: 0.2 });
		const [subject, , options] = motion.animate.mock.calls[0];
		expect(subject).toEqual([first, second]);
		expect(typeof (options as { delay: unknown }).delay).toBe('function');
	});

	it('falls back to the node itself when a staggered node has no children', () => {
		reveal(node, { stagger: 0.06 });
		enterView();

		expect(motion.animate.mock.calls[0][0]).toEqual([node]);
	});

	it('leaves the node at its final state and registers nothing under reduced motion', () => {
		motion.reducedMotion.mockReturnValue(true);

		reveal(node, { y: 24 });

		expect(node.style.opacity).toBe('');
		expect(node.style.transform).toBe('');
		expect(motion.inView).not.toHaveBeenCalled();
		expect(motion.animate).not.toHaveBeenCalled();
	});

	it('stops observing and cancels a running animation on destroy', () => {
		const stopObserving = vi.fn();
		motion.inView.mockReturnValueOnce(stopObserving);

		const result = reveal(node, undefined);
		enterView();
		const animation = motion.animate.mock.results[0].value;

		result?.destroy?.();

		expect(stopObserving).toHaveBeenCalledTimes(1);
		expect(animation.stop).toHaveBeenCalledTimes(1);
	});

	it('returns a destroy that is safe to call under reduced motion', () => {
		motion.reducedMotion.mockReturnValue(true);
		const result = reveal(node, undefined);

		expect(() => result?.destroy?.()).not.toThrow();
	});
});
