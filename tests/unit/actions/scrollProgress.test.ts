import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as motionModule from '$lib/motion';
import { scrollProgress } from '$lib/actions/scrollProgress';
import type { MotionMock, ScrollCallback } from '../mocks/motionFactory';

vi.mock('$lib/motion', async () => (await import('../mocks/motionFactory')).createMotionMock());

const motion = motionModule as unknown as MotionMock;

/** Runs the progress callback the action handed to `scroll`. */
function emitProgress(progress: number) {
	(motion.scroll.mock.calls[0][0] as ScrollCallback)(progress);
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

describe('scrollProgress', () => {
	it('seeds --progress and tracks the node against the viewport centre', () => {
		scrollProgress(node, undefined);

		expect(node.style.getPropertyValue('--progress')).toBe('0');
		expect(motion.scroll).toHaveBeenCalledTimes(1);
		expect(motion.scroll.mock.calls[0][1]).toEqual({
			target: node,
			offset: ['start center', 'end center']
		});
	});

	it('writes the progress value onto the node', () => {
		scrollProgress(node, undefined);

		emitProgress(0.42);

		expect(node.style.getPropertyValue('--progress')).toBe('0.42');
	});

	it('tracks a separate target when one is given', () => {
		const target = document.createElement('section');
		document.body.appendChild(target);

		scrollProgress(node, { target });

		expect(motion.scroll.mock.calls[0][1]).toMatchObject({ target });
		emitProgress(1);
		expect(node.style.getPropertyValue('--progress')).toBe('1');

		target.remove();
	});

	it('still reports progress under reduced motion — it drives static UI', () => {
		motion.reducedMotion.mockReturnValue(true);

		scrollProgress(node, undefined);
		emitProgress(0.5);

		expect(motion.scroll).toHaveBeenCalledTimes(1);
		expect(node.style.getPropertyValue('--progress')).toBe('0.5');
	});

	it('re-subscribes when the target arrives late, as a bind:this target does', () => {
		const cancel = vi.fn();
		motion.scroll.mockReturnValueOnce(cancel);
		const target = document.createElement('section');
		document.body.appendChild(target);

		const result = scrollProgress(node, { target: undefined });
		expect(motion.scroll.mock.calls[0][1]).toMatchObject({ target: node });

		result?.update?.({ target });

		expect(cancel).toHaveBeenCalledTimes(1);
		expect(motion.scroll).toHaveBeenCalledTimes(2);
		expect(motion.scroll.mock.calls[1][1]).toMatchObject({ target });

		target.remove();
	});

	it('does not re-subscribe when the target is unchanged', () => {
		const result = scrollProgress(node, undefined);

		result?.update?.(undefined);

		expect(motion.scroll).toHaveBeenCalledTimes(1);
	});

	it('cancels the scroll subscription on destroy', () => {
		const cancel = vi.fn();
		motion.scroll.mockReturnValueOnce(cancel);

		const result = scrollProgress(node, undefined);
		result?.destroy?.();

		expect(cancel).toHaveBeenCalledTimes(1);
	});
});
