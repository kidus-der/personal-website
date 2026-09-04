import { vi, type Mock } from 'vitest';

/**
 * Test doubles for the Svelte actions in `$lib/actions`.
 *
 * The real `tilt` action bails out in jsdom (no fine pointer, no layout), so a
 * component test can neither observe that it was wired up nor what options it
 * was handed. These stubs record both.
 *
 * Used as
 * `vi.mock('$lib/actions/tilt', async () => (await import('./actionsMock')).tiltModule())`.
 */

export interface RecordedAction {
	node: HTMLElement;
	options: unknown;
}

/** Every `use:tilt` application so far, in mount order. */
export const tiltCalls: RecordedAction[] = [];

export const tiltMock: Mock = vi.fn((node: HTMLElement, options: unknown) => {
	const record: RecordedAction = { node, options };
	tiltCalls.push(record);
	return {
		update(next: unknown) {
			record.options = next;
		},
		destroy() {}
	};
});

/** The module shape `vi.mock('$lib/actions/tilt', …)` should return. */
export function tiltModule() {
	return { tilt: tiltMock };
}

/** Call from `beforeEach`. */
export function resetActionMocks() {
	tiltCalls.length = 0;
	tiltMock.mockClear();
}
