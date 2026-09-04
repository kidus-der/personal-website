import { vi, type Mock } from 'vitest';

/**
 * A test double for `use:reveal`.
 *
 * The real action hides its targets synchronously and waits on an
 * IntersectionObserver that never fires in jsdom, which would leave every
 * asserted node at `opacity: 0`. Stubbing it keeps the markup assertions honest
 * and records the options each application was handed.
 *
 * Used as
 * `vi.mock('$lib/actions/reveal', async () => (await import('./revealMock')).revealModule())`.
 */

export interface RecordedReveal {
	node: HTMLElement;
	options: unknown;
}

/** Every `use:reveal` application so far, in mount order. */
export const revealCalls: RecordedReveal[] = [];

export const revealMock: Mock = vi.fn((node: HTMLElement, options: unknown) => {
	const record: RecordedReveal = { node, options };
	revealCalls.push(record);
	return {
		update(next: unknown) {
			record.options = next;
		},
		destroy() {}
	};
});

/** The module shape `vi.mock('$lib/actions/reveal', …)` should return. */
export function revealModule() {
	return { reveal: revealMock };
}

/** Call from `beforeEach`. */
export function resetRevealMock() {
	revealCalls.length = 0;
	revealMock.mockClear();
}
