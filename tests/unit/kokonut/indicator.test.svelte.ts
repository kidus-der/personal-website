import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { flushSync } from 'svelte';
import {
	createIndicator,
	measureIndicator,
	moveIndicator
} from '$lib/components/kokonut/indicator.svelte';
import { springs } from '$lib/motion/config';
import { animateMock, preferReducedMotion, resetMotionMocks } from './motionMock';

vi.mock('$lib/motion', async () => (await import('./motionMock')).motionModule());

/** An element that reports a fixed box, the way a laid-out control would. */
function control(left: number, width: number): HTMLElement {
	const element = document.createElement('button');
	Object.defineProperty(element, 'offsetLeft', { value: left, configurable: true });
	Object.defineProperty(element, 'offsetWidth', { value: width, configurable: true });
	return element;
}

function indicatorElement(): HTMLElement {
	return document.createElement('span');
}

/** Every `animate` call made against `element`, in order. */
function callsFor(element: HTMLElement) {
	return animateMock.mock.calls.filter((call) => call[0] === element);
}

describe('measureIndicator', () => {
	it('reads the control box out of the row coordinate space', () => {
		expect(measureIndicator(control(64, 70))).toEqual({ x: 64, width: '70px', opacity: 1 });
	});

	it('hides itself when there is no control', () => {
		expect(measureIndicator(undefined)).toEqual({ x: 0, width: '0px', opacity: 0 });
		expect(measureIndicator(null)).toEqual({ x: 0, width: '0px', opacity: 0 });
	});
});

describe('moveIndicator', () => {
	beforeEach(resetMotionMocks);

	it('springs the indicator onto its target', () => {
		const element = indicatorElement();
		const target = { x: 12, width: '40px', opacity: 1 };
		moveIndicator(element, target, false);
		expect(animateMock).toHaveBeenCalledWith(
			element,
			target,
			expect.objectContaining(springs.snappy)
		);
	});

	it('places instantly when asked', () => {
		moveIndicator(indicatorElement(), { x: 0, width: '0px', opacity: 0 }, true);
		expect(animateMock.mock.calls[0][2]).toMatchObject({ duration: 0 });
	});

	it('places instantly under reduced motion even when not asked', () => {
		preferReducedMotion();
		moveIndicator(indicatorElement(), { x: 12, width: '40px', opacity: 1 }, false);
		expect(animateMock.mock.calls[0][2]).toMatchObject({ duration: 0 });
	});

	it('copies the target so a later mutation cannot reach the animation', () => {
		const target = { x: 12, width: '40px', opacity: 1 };
		moveIndicator(indicatorElement(), target, true);
		target.x = 999;
		expect(animateMock.mock.calls[0][1]).toMatchObject({ x: 12 });
	});
});

describe('createIndicator', () => {
	let dispose: (() => void) | undefined;

	beforeEach(resetMotionMocks);

	afterEach(() => {
		dispose?.();
		dispose = undefined;
	});

	/** Mounts the controller in an effect root and hands back its levers. */
	function setup(initial: HTMLElement | undefined) {
		const element = indicatorElement();
		let target = $state<HTMLElement | undefined>(initial);
		dispose = $effect.root(() => {
			createIndicator(
				() => element,
				() => target
			);
		});
		flushSync();
		return {
			element,
			setTarget(next: HTMLElement | undefined) {
				target = next;
				flushSync();
			}
		};
	}

	it('places the indicator on its first target without animating', () => {
		const { element } = setup(control(64, 70));
		const calls = callsFor(element);
		expect(calls).toHaveLength(1);
		expect(calls[0][1]).toMatchObject({ x: 64, width: '70px', opacity: 1 });
		expect(calls[0][2]).toMatchObject({ duration: 0 });
	});

	it('springs to every subsequent target', () => {
		const { element, setTarget } = setup(control(64, 70));
		setTarget(control(198, 58));

		const calls = callsFor(element);
		expect(calls).toHaveLength(2);
		expect(calls[1][1]).toMatchObject({ x: 198, width: '58px', opacity: 1 });
		expect(calls[1][2]).toMatchObject(springs.snappy);
	});

	it('hides the indicator when the target goes away', () => {
		const { element, setTarget } = setup(control(64, 70));
		setTarget(undefined);
		expect(callsFor(element).at(-1)?.[1]).toMatchObject({ opacity: 0 });
	});

	it('starts hidden when nothing is active at mount', () => {
		const { element } = setup(undefined);
		expect(callsFor(element).at(-1)?.[1]).toMatchObject({ x: 0, width: '0px', opacity: 0 });
	});

	it('re-measures on resize', () => {
		const target = control(64, 70);
		const { element } = setup(target);
		animateMock.mockClear();

		Object.defineProperty(target, 'offsetLeft', { value: 90, configurable: true });
		Object.defineProperty(target, 'offsetWidth', { value: 80, configurable: true });
		window.dispatchEvent(new Event('resize'));

		expect(callsFor(element).at(-1)?.[1]).toMatchObject({ x: 90, width: '80px' });
	});

	it('stops listening once its owner is torn down', () => {
		const { element } = setup(control(64, 70));
		dispose?.();
		dispose = undefined;
		animateMock.mockClear();

		window.dispatchEvent(new Event('resize'));
		expect(callsFor(element)).toHaveLength(0);
	});

	it('stops the running animation on teardown', () => {
		setup(control(64, 70));
		const animation = animateMock.mock.results.at(-1)?.value as { stop: () => void };
		dispose?.();
		dispose = undefined;
		expect(animation.stop).toHaveBeenCalled();
	});
});
