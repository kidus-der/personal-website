import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as motionModule from '$lib/motion';
import { springs } from '$lib/motion/config';
import { tilt } from '$lib/actions/tilt';
import type { MotionMock } from './motionMock';

vi.mock('$lib/motion', async () => (await import('./motionMock')).createMotionMock());

const motion = motionModule as unknown as MotionMock;

/** jsdom has no layout: give the node a 200x100 box at the viewport origin. */
function stubBox(el: HTMLElement, box: Partial<DOMRect> = {}) {
	const rect = { left: 0, top: 0, width: 200, height: 100, ...box } as DOMRect;
	el.getBoundingClientRect = () => rect;
}

function stubPointer(kind: 'fine' | 'coarse') {
	vi.stubGlobal(
		'matchMedia',
		vi.fn((query: string) => ({
			matches: query.includes('coarse') && kind === 'coarse',
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false
		}))
	);
}

function pointerMove(el: HTMLElement, clientX: number, clientY: number) {
	el.dispatchEvent(new MouseEvent('pointermove', { clientX, clientY, bubbles: true }));
}

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

describe('tilt', () => {
	it('writes rotation and glow variables from the pointer position', () => {
		tilt(node, undefined);

		pointerMove(node, 150, 25);

		// px = 0.75, py = 0.25 → rx = +max/2, ry = +max/2 with max = 9.
		expect(node.style.getPropertyValue('--rx')).toBe('4.5deg');
		expect(node.style.getPropertyValue('--ry')).toBe('4.5deg');
		expect(node.style.getPropertyValue('--gx')).toBe('75%');
		expect(node.style.getPropertyValue('--gy')).toBe('25%');
	});

	it('inverts rx across the y axis and ry across the x axis', () => {
		tilt(node, { max: 10 });

		pointerMove(node, 0, 100);

		expect(node.style.getPropertyValue('--rx')).toBe('-10deg');
		expect(node.style.getPropertyValue('--ry')).toBe('-10deg');
	});

	it('springs back to rest on pointer leave', () => {
		tilt(node, undefined);
		pointerMove(node, 150, 25);

		node.dispatchEvent(new MouseEvent('pointerleave', { bubbles: true }));

		expect(node.style.getPropertyValue('--rx')).toBe('0deg');
		expect(node.style.getPropertyValue('--ry')).toBe('0deg');
		expect(node.style.getPropertyValue('--gx')).toBe('50%');
		expect(node.style.getPropertyValue('--gy')).toBe('50%');
	});

	it('animates with the named spring', () => {
		tilt(node, { spring: 'bouncy' });
		pointerMove(node, 150, 25);

		expect(motion.animate.mock.calls[0][2]).toMatchObject(springs.bouncy);
	});

	it('ignores a zero-sized box rather than dividing by zero', () => {
		stubBox(node, { width: 0, height: 0 });
		tilt(node, undefined);

		pointerMove(node, 10, 10);

		expect(motion.animate).not.toHaveBeenCalled();
	});

	it('does nothing under reduced motion', () => {
		motion.reducedMotion.mockReturnValue(true);
		tilt(node, undefined);

		pointerMove(node, 150, 25);

		expect(motion.animate).not.toHaveBeenCalled();
		expect(node.style.getPropertyValue('--rx')).toBe('');
	});

	it('does nothing on a coarse pointer', () => {
		stubPointer('coarse');
		tilt(node, undefined);

		pointerMove(node, 150, 25);

		expect(motion.animate).not.toHaveBeenCalled();
	});

	it('detaches its listeners and stops the animation on destroy', () => {
		const result = tilt(node, undefined);
		pointerMove(node, 150, 25);
		const animation = motion.animate.mock.results[0].value;

		result?.destroy?.();
		pointerMove(node, 20, 80);

		expect(animation.stop).toHaveBeenCalledTimes(1);
		expect(motion.animate).toHaveBeenCalledTimes(1);
	});

	it('picks up a new max from update', () => {
		const result = tilt(node, { max: 9 });

		result?.update?.({ max: 20 });
		pointerMove(node, 200, 0);

		expect(node.style.getPropertyValue('--ry')).toBe('20deg');
	});
});
