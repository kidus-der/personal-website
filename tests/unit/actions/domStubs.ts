/**
 * jsdom stubs shared by the action tests.
 *
 * jsdom runs no layout engine and implements no media queries, so anything that
 * measures a box or asks about the pointer has to be faked explicitly.
 */
import { vi } from 'vitest';

/** Give a node a measurable box. Defaults to 200x100 at the viewport origin. */
export function stubBox(el: HTMLElement, box: Partial<DOMRect> = {}) {
	const rect = { left: 0, top: 0, width: 200, height: 100, ...box } as DOMRect;
	el.getBoundingClientRect = () => rect;
}

/** Give a node a layout height, which jsdom otherwise always reports as 0. */
export function stubHeight(el: HTMLElement, height: number) {
	Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
}

/**
 * Stub `matchMedia` so the pointer probe reports a hovering fine pointer
 * ('fine') or a touch-only device ('coarse').
 */
export function stubPointer(kind: 'fine' | 'coarse') {
	vi.stubGlobal(
		'matchMedia',
		vi.fn((query: string) => ({
			matches: query.includes('pointer: fine') && kind === 'fine',
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false
		}))
	);
}

/**
 * Dispatch a pointer event. jsdom has no `PointerEvent` constructor, and the
 * actions only read `clientX`/`clientY`, so a `MouseEvent` of the right type is
 * an exact stand-in.
 */
export function pointerEvent(
	el: HTMLElement,
	type: 'pointermove' | 'pointerleave',
	coords: { clientX?: number; clientY?: number } = {}
) {
	el.dispatchEvent(new MouseEvent(type, { ...coords, bubbles: true }));
}

/** Shorthand for the common `pointermove` case. */
export function pointerMove(el: HTMLElement, clientX: number, clientY: number) {
	pointerEvent(el, 'pointermove', { clientX, clientY });
}

/** Shorthand for the common `pointerleave` case. */
export function pointerLeave(el: HTMLElement) {
	pointerEvent(el, 'pointerleave');
}
