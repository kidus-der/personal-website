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
	(
		_element: unknown,
		_keyframes: unknown,
		options?: { onUpdate?: (value: number) => void; onComplete?: () => void }
	) => {
		// Motion drives `onUpdate` from its own ticker; jump straight to the end so
		// components that write derived state from it settle synchronously. The
		// same goes for `onComplete`, which is how an entrance releases its
		// element from the pre-hide.
		options?.onUpdate?.(1);
		options?.onComplete?.();
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

/**
 * `inView`, inert by default: it records the element and the callback and hands
 * back a stop function, exactly like the real one, but never decides that
 * anything is on screen. jsdom has no IntersectionObserver worth driving, so a
 * test that cares runs the recorded callback itself — see `ParticleNetwork.test.ts`.
 */
export const inViewMock = vi.fn<
	(element: Element, onStart: () => (() => void) | void) => () => void
>(() => () => {});

/** The module shape `vi.mock('$lib/motion', …)` should return. */
export async function motionModule() {
	const config = await import('$lib/motion/config');
	// `markRevealed` is plain DOM writes; jsdom runs it, so the real one is used.
	const { markRevealed } = await import('$lib/motion/prehide');
	return {
		...config,
		markRevealed,
		animate: animateMock,
		reducedMotion: reducedMotionMock,
		inView: inViewMock,
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
	inViewMock.mockClear();
	reducedMotionMock.mockClear();
	reducedMotionMock.mockReturnValue(false);
}

/** Marks the next `reducedMotion()` reads as "user prefers reduced motion". */
export function preferReducedMotion() {
	reducedMotionMock.mockReturnValue(true);
}
