import { vi, type Mock } from 'vitest';

/**
 * Test doubles for the actions the home sections reach for themselves.
 *
 * `tests/unit/kokonut/actionsMock.ts` already covers `use:tilt` for the Kokonut
 * cards; these are the other two. Both are stubbed rather than run for real:
 * `reveal` would leave every child at `opacity: 0` forever (jsdom never fires
 * the observer Motion's `inView` wraps), and `magnetic` bails out in jsdom
 * before doing anything, so a test could not otherwise see that it was wired up.
 */

export interface RecordedAction {
	node: HTMLElement;
	options: unknown;
}

/** Every `use:reveal` application so far, in mount order. */
export const revealCalls: RecordedAction[] = [];
/** Every `use:magnetic` application so far, in mount order. */
export const magneticCalls: RecordedAction[] = [];

function recorder(log: RecordedAction[]): Mock {
	return vi.fn((node: HTMLElement, options: unknown) => {
		const record: RecordedAction = { node, options };
		log.push(record);
		return {
			update(next: unknown) {
				record.options = next;
			},
			destroy() {}
		};
	});
}

export const revealMock = recorder(revealCalls);
export const magneticMock = recorder(magneticCalls);

/** The module shape `vi.mock('$lib/actions/reveal', …)` should return. */
export function revealModule() {
	return { reveal: revealMock };
}

/** The module shape `vi.mock('$lib/actions/magnetic', …)` should return. */
export function magneticModule() {
	return { magnetic: magneticMock };
}

/** Call from `beforeEach`. */
export function resetHomeActionMocks() {
	revealCalls.length = 0;
	magneticCalls.length = 0;
	revealMock.mockClear();
	magneticMock.mockClear();
}
