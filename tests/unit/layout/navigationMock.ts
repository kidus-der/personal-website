import { vi } from 'vitest';

/**
 * A `$app/navigation` test double shared by the layout-chrome tests.
 *
 * SvelteKit's real `afterNavigate` needs a router, which no unit test has. This
 * records the callbacks instead, so a test can drive a navigation by hand.
 *
 * Used as
 * `vi.mock('$app/navigation', async () => (await import('./navigationMock')).navigationModule())`
 * — the dynamic import keeps `vi.mock`'s hoisting happy while handing both the
 * factory and the test file the same instances.
 */

export type NavigationCallback = (navigation: unknown) => void;

/** Every `afterNavigate` registration so far, in mount order. */
export const afterNavigateCallbacks: NavigationCallback[] = [];

export const gotoMock = vi.fn();

/** The module shape `vi.mock('$app/navigation', …)` should return. */
export function navigationModule() {
	return {
		afterNavigate: (callback: NavigationCallback) => {
			afterNavigateCallbacks.push(callback);
		},
		beforeNavigate: vi.fn(),
		onNavigate: vi.fn(),
		goto: gotoMock,
		invalidate: vi.fn(),
		invalidateAll: vi.fn(),
		pushState: vi.fn(),
		replaceState: vi.fn(),
		preloadData: vi.fn(),
		preloadCode: vi.fn()
	};
}

/** Call from `beforeEach`. */
export function resetNavigationMocks() {
	afterNavigateCallbacks.length = 0;
	gotoMock.mockClear();
}

/** Fire every registered `afterNavigate` callback, the way the router would. */
export function runAfterNavigate(navigation: unknown = { type: 'link' }) {
	for (const callback of [...afterNavigateCallbacks]) callback(navigation);
}
