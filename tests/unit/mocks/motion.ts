import { vi, type Mock } from 'vitest';

/**
 * A single `$lib/motion` test double, shared by every Kokonut component test.
 *
 * Used as `vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule())`
 * — the dynamic import inside the factory keeps `vi.mock`'s hoisting happy while
 * still handing both the factory and the test file the same mock instances.
 */

export interface MockAnimation {
	stop: Mock;
	complete: Mock;
	pause: Mock;
	play: Mock;
	finished: Promise<void>;
}

/** Every animation handed out so far, in call order. */
export const animations: MockAnimation[] = [];

export const animateMock = vi.fn(
	(_element: unknown, _keyframes: unknown, options?: { onUpdate?: (value: number) => void }) => {
		// Motion drives `onUpdate` from its own ticker; jump straight to the end so
		// components that write derived state from it settle synchronously.
		options?.onUpdate?.(1);
		const animation: MockAnimation = {
			stop: vi.fn(),
			complete: vi.fn(),
			pause: vi.fn(),
			play: vi.fn(),
			finished: Promise.resolve()
		};
		animations.push(animation);
		return animation;
	}
);

export const reducedMotionMock = vi.fn(() => false);

/** The module shape `vi.mock('$lib/motion', …)` should return. */
export async function motionModule() {
	const config = await import('$lib/motion/config');
	return {
		...config,
		animate: animateMock,
		reducedMotion: reducedMotionMock,
		inView: vi.fn(() => () => {}),
		scroll: vi.fn(() => () => {}),
		stagger: vi.fn(() => 0),
		spring: vi.fn(),
		press: vi.fn(() => () => {}),
		hover: vi.fn(() => () => {})
	};
}

/** Call from `beforeEach`. Clears recorded calls and restores the default flags. */
export function resetMotionMocks() {
	animations.length = 0;
	animateMock.mockClear();
	reducedMotionMock.mockClear();
	reducedMotionMock.mockReturnValue(false);
}

/** Marks the next `reducedMotion()` reads as "user prefers reduced motion". */
export function preferReducedMotion() {
	reducedMotionMock.mockReturnValue(true);
}
