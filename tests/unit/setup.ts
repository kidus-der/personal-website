import '@testing-library/jest-dom/vitest';

/**
 * jsdom implements neither matchMedia nor the observer APIs that Motion and our
 * actions rely on. Minimal, inert stubs keep component code from throwing; tests
 * that care about behaviour override these per-test with `vi.stubGlobal`.
 */

if (!globalThis.matchMedia) {
	globalThis.matchMedia = ((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	})) as unknown as typeof globalThis.matchMedia;
}

class MockResizeObserver implements ResizeObserver {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
}

class MockIntersectionObserver implements IntersectionObserver {
	readonly root: Element | Document | null = null;
	readonly rootMargin: string = '0px';
	readonly thresholds: ReadonlyArray<number> = [0];
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
}

if (!globalThis.ResizeObserver) {
	globalThis.ResizeObserver = MockResizeObserver;
}

if (!globalThis.IntersectionObserver) {
	globalThis.IntersectionObserver = MockIntersectionObserver;
}

/**
 * jsdom 30 no longer exposes a Storage implementation by default. An in-memory
 * shim keeps the theme module's persistence path exercisable.
 */
if (!globalThis.localStorage) {
	const store = new Map<string, string>();
	const memoryStorage: Storage = {
		get length() {
			return store.size;
		},
		clear: () => store.clear(),
		getItem: (key) => store.get(key) ?? null,
		key: (index) => [...store.keys()][index] ?? null,
		removeItem: (key) => void store.delete(key),
		setItem: (key, value) => void store.set(key, String(value))
	};
	globalThis.localStorage = memoryStorage;
}
