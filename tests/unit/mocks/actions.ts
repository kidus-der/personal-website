import { vi, type Mock } from 'vitest';

/**
 * Test doubles for the Svelte actions in `$lib/actions`.
 *
 * Every one of them is unobservable in jsdom for the same reason: `reveal`
 * waits on an IntersectionObserver that never fires (so its targets would stay
 * at `opacity: 0` forever), while `tilt` and `magnetic` bail out early with no
 * fine pointer and no layout. Stubbing them keeps markup assertions honest and
 * records which node each was applied to and what options it was handed.
 *
 * Used as, for example:
 *
 *   vi.mock('$lib/actions/tilt', async () => (await import('../mocks/actions')).tilt.module());
 *
 * The dynamic import keeps `vi.mock`'s hoisting happy while still handing both
 * the factory and the test file the same instance.
 */

export interface RecordedAction {
	node: HTMLElement;
	options: unknown;
}

export interface ActionMock {
	/** Every application so far, in mount order. Options track `update()`. */
	readonly calls: RecordedAction[];
	/** The spy itself, for call-count assertions. */
	readonly action: Mock;
	/** The module shape `vi.mock('$lib/actions/<name>', …)` should return. */
	module(): Record<string, Mock>;
	/** Call from `beforeEach`. */
	reset(): void;
}

/**
 * A recording stand-in for one action, named as the module exports it.
 *
 * `name` is what the action is imported as (`reveal`, `tilt`, `magnetic`), and
 * is what `module()` keys the returned object by.
 */
export function recordingAction(name: string): ActionMock {
	const calls: RecordedAction[] = [];

	const action: Mock = vi.fn((node: HTMLElement, options: unknown) => {
		const record: RecordedAction = { node, options };
		calls.push(record);
		return {
			update(next: unknown) {
				record.options = next;
			},
			destroy() {}
		};
	});

	return {
		calls,
		action,
		module: () => ({ [name]: action }),
		reset() {
			calls.length = 0;
			action.mockClear();
		}
	};
}

export const reveal = recordingAction('reveal');
export const tilt = recordingAction('tilt');
export const magnetic = recordingAction('magnetic');

/**
 * Reset all three. Cheaper to call than to remember which of them a given
 * component reaches for, and resetting an unused one costs nothing.
 */
export function resetActionMocks() {
	reveal.reset();
	tilt.reset();
	magnetic.reset();
}
