import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as motionModule from '$lib/motion';
import { easings } from '$lib/motion/config';
import { reveal } from '$lib/actions/reveal';
import type { MotionMock } from '../mocks/motionFactory';
import { stubHeight } from './domStubs';

vi.mock('$lib/motion', async () => (await import('../mocks/motionFactory')).createMotionMock());

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
	it('hides a node that carries no data-reveal, so third-party use still works', () => {
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

	it('drops the inline hidden styles once the reveal completes', () => {
		reveal(node, undefined);
		expect(node.style.opacity).toBe('0');

		enterView();

		// Leaving `transform: none; opacity: 1` behind would beat any stylesheet
		// transform on the element — a tilt, a hover lift, anything.
		expect(node.style.transform).toBe('');
		expect(node.style.opacity).toBe('');
		expect(node.getAttribute('style')).toBe('');
	});

	it('drops the inline hidden styles from every staggered child', () => {
		const first = document.createElement('span');
		const second = document.createElement('span');
		node.append(first, second);

		reveal(node, { stagger: 0.06 });
		enterView();

		expect(first.getAttribute('style')).toBe('');
		expect(second.getAttribute('style')).toBe('');
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
		// The hidden state has to be re-applied, or the cleared inline styles
		// would leave the node visible until it scrolls back into view.
		expect(node.style.opacity).toBe('0');
		expect(node.style.transform).toBe('translateY(20px)');
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

	it('clamps amount for a node taller than the viewport, which can never reach 0.2', () => {
		// intersectionRatio tops out at viewportHeight / elementHeight, so a node
		// six viewports tall never exceeds ~0.17 and would stay hidden forever.
		stubHeight(node, window.innerHeight * 6);

		reveal(node, undefined);

		const { amount } = motion.inView.mock.calls[0][2] as { amount: number };
		expect(amount).toBeCloseTo(0.15, 5);
	});

	it('never raises a small amount when clamping', () => {
		stubHeight(node, window.innerHeight * 6);

		reveal(node, { amount: 0.05 });

		expect(motion.inView.mock.calls[0][2]).toEqual({ amount: 0.05 });
	});

	it('leaves amount alone for a node shorter than the viewport', () => {
		stubHeight(node, Math.round(window.innerHeight / 2));

		reveal(node, undefined);

		expect(motion.inView.mock.calls[0][2]).toEqual({ amount: 0.2 });
	});

	it('leaves amount alone when the height is unmeasurable', () => {
		// jsdom reports 0; so does a node that has not been laid out yet.
		reveal(node, undefined);

		expect(motion.inView.mock.calls[0][2]).toEqual({ amount: 0.2 });
	});

	it('leaves the keyword amounts alone', () => {
		stubHeight(node, window.innerHeight * 6);

		reveal(node, { amount: 'some' });

		expect(motion.inView.mock.calls[0][2]).toEqual({ amount: 'some' });
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

	describe('with the stylesheet pre-hide', () => {
		it('never writes an inline opacity when the node carries data-reveal', () => {
			node.setAttribute('data-reveal', '');

			reveal(node, undefined);

			// The stylesheet already hid it. Writing `opacity: 0` here is what made
			// server-rendered content flash: visible, then hidden, then faded back.
			expect(node.style.opacity).toBe('');
			expect(node.style.transform).toBe('translateY(16px)');
		});

		it('marks the node revealed once the entrance completes', () => {
			node.setAttribute('data-reveal', '');

			reveal(node, undefined);
			expect(node.hasAttribute('data-revealed')).toBe(false);

			enterView();

			expect(node).toHaveAttribute('data-revealed', '');
			expect(node.getAttribute('style')).toBe('');
		});

		it('leaves the children of a data-reveal-group to the stylesheet', () => {
			const first = document.createElement('span');
			const second = document.createElement('span');
			node.append(first, second);
			node.setAttribute('data-reveal-group', '');

			reveal(node, { stagger: 0.06 });

			expect(first.style.opacity).toBe('');
			expect(second.style.opacity).toBe('');
			expect(first.style.transform).toBe('translateY(16px)');
		});

		it('marks every staggered child revealed once they land', () => {
			const first = document.createElement('span');
			const second = document.createElement('span');
			node.append(first, second);
			node.setAttribute('data-reveal-group', '');

			reveal(node, { stagger: 0.06 });
			enterView();

			expect(first).toHaveAttribute('data-revealed', '');
			expect(second).toHaveAttribute('data-revealed', '');
		});

		it('releases the group itself, so children rendered into it later are visible', () => {
			const first = document.createElement('span');
			node.append(first);
			node.setAttribute('data-reveal-group', '');

			reveal(node, { stagger: 0.06 });
			enterView();

			expect(node).toHaveAttribute('data-revealed', '');

			// The /work and /blog filters swap the list's children while keeping
			// the list. The pre-hide selector matches children by position, so a
			// child rendered in after the reveal has run would be hidden by a rule
			// this instance is never going to lift again — it would sit invisible
			// until the 3s safety net caught it.
			first.remove();
			const late = document.createElement('span');
			node.append(late);

			expect(
				late.matches('[data-reveal-group]:not([data-revealed]) > *:not([data-revealed])')
			).toBe(false);
		});

		it('re-arms the group when a non-once stagger scrolls back out', () => {
			node.append(document.createElement('span'));
			node.setAttribute('data-reveal-group', '');

			reveal(node, { stagger: 0.06, once: false });
			const leave = enterView() as () => void;
			expect(node).toHaveAttribute('data-revealed', '');

			leave();

			expect(node.hasAttribute('data-revealed')).toBe(false);
		});

		it('still hides a group child that the group does not own', () => {
			// A grid whose parent was never marked: the stylesheet is not hiding
			// these, so the action has to.
			const child = document.createElement('span');
			node.append(child);

			reveal(node, { stagger: 0.06 });

			expect(child.style.opacity).toBe('0');
		});

		it('claims the node on mount, so the safety net stands down', () => {
			node.setAttribute('data-reveal', '');

			reveal(node, undefined);

			// The net exists for a script that never ran. This one did, and owns
			// the element's entrance — letting the net fire at 3s anyway would
			// leave a below-the-fold element already at full opacity, with no
			// fade left to play when it finally scrolls into view.
			expect(node).toHaveAttribute('data-motion-ready', '');
		});

		it('drops the claim once the node has arrived', () => {
			node.setAttribute('data-reveal', '');

			reveal(node, undefined);
			enterView();

			expect(node.hasAttribute('data-motion-ready')).toBe(false);
			expect(node).toHaveAttribute('data-revealed', '');
		});

		it('claims every staggered child', () => {
			const first = document.createElement('span');
			const second = document.createElement('span');
			node.append(first, second);
			node.setAttribute('data-reveal-group', '');

			reveal(node, { stagger: 0.06 });

			expect(first).toHaveAttribute('data-motion-ready', '');
			expect(second).toHaveAttribute('data-motion-ready', '');
		});

		it('marks the node revealed synchronously under reduced motion', () => {
			motion.reducedMotion.mockReturnValue(true);
			node.setAttribute('data-reveal', '');

			reveal(node, undefined);

			// Without this the pre-hide rule would keep a node hidden forever on a
			// machine where the action never animates anything.
			expect(node).toHaveAttribute('data-revealed', '');
			expect(node.style.opacity).toBe('');
		});

		it('marks staggered children revealed synchronously under reduced motion', () => {
			motion.reducedMotion.mockReturnValue(true);
			const child = document.createElement('span');
			node.append(child);
			node.setAttribute('data-reveal-group', '');

			reveal(node, { stagger: 0.06 });

			expect(child).toHaveAttribute('data-revealed', '');
		});

		it('re-arms the pre-hide when a non-once reveal scrolls back out', () => {
			node.setAttribute('data-reveal', '');

			reveal(node, { once: false });
			const leave = enterView() as () => void;
			expect(node).toHaveAttribute('data-revealed', '');

			leave();

			expect(node.hasAttribute('data-revealed')).toBe(false);
		});
	});
});
