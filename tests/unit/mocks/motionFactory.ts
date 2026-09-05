/**
 * Shared fake for `$lib/motion`, used by the action tests.
 *
 * The real package drives a rAF loop and reads real layout, neither of which
 * jsdom provides. The fake keeps the surface the actions use, records every
 * call, and applies object keyframes synchronously so actions that write CSS
 * variables from an `onUpdate` callback can still be asserted on.
 *
 * Every spy is given an explicit signature so `mock.calls[n][i]` stays typed in
 * the tests.
 *
 * Usage (the factory must not close over test state, so import it lazily):
 *
 *   vi.mock('$lib/motion', async () => (await import('../mocks/motionFactory')).createMotionMock());
 */
import { vi } from 'vitest';
import { springs, easings, durations } from '$lib/motion/config';
import { markRevealed } from '$lib/motion/prehide';

export interface FakeAnimation {
	stop: ReturnType<typeof vi.fn>;
}

export type Cancel = () => void;
export type InViewStart = (
	element: Element,
	entry: IntersectionObserverEntry
) => void | (() => void);
export type PressStart = (element: Element, event: PointerEvent) => void | (() => void);
export type ScrollCallback = (progress: number) => void;

export interface AnimateOptions {
	onUpdate?: (latest: unknown) => void;
	onComplete?: () => void;
	[key: string]: unknown;
}

export interface ScrollTargetOptions {
	target?: Element;
	offset?: unknown;
}

function isPlainObject(subject: unknown): subject is Record<string, unknown> {
	return (
		typeof subject === 'object' &&
		subject !== null &&
		!Array.isArray(subject) &&
		!(subject instanceof Node)
	);
}

export function createMotionMock() {
	const animate = vi.fn(
		(subject: unknown, keyframes: unknown, options?: AnimateOptions): FakeAnimation => {
			// Object subjects are mutated in place by the real library; mirror that
			// so `onUpdate` handlers observe the target values.
			if (isPlainObject(subject) && isPlainObject(keyframes)) Object.assign(subject, keyframes);
			options?.onUpdate?.(0);
			options?.onComplete?.();
			return { stop: vi.fn() };
		}
	);

	const inView = vi.fn<
		(target: Element, onStart: InViewStart, options?: { amount?: unknown }) => Cancel
	>(() => vi.fn());

	const scroll = vi.fn<
		(onScroll: ScrollCallback | FakeAnimation, options?: ScrollTargetOptions) => Cancel
	>(() => vi.fn());

	const press = vi.fn<(target: Element, onPressStart: PressStart) => Cancel>(() => vi.fn());

	const hover = vi.fn<(target: Element, onHoverStart: PressStart) => Cancel>(() => vi.fn());

	const stagger = vi.fn(
		(each: number, options?: { startDelay?: number }) => (index: number) =>
			index * each + (options?.startDelay ?? 0)
	);

	return {
		animate,
		inView,
		scroll,
		press,
		hover,
		stagger,
		spring: vi.fn(),
		reducedMotion: vi.fn(() => false),
		// Plain DOM writes; jsdom runs them, so the real helper is used.
		markRevealed,
		springs,
		easings,
		durations
	};
}

/** The shape `import * as motion from '$lib/motion'` takes once mocked. */
export type MotionMock = ReturnType<typeof createMotionMock>;
