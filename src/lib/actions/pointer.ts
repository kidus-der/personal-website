/**
 * Pointer capability probe shared by the cursor-driven actions.
 *
 * Tilt and magnetic pull are meaningless without a hovering pointer, and on a
 * touch screen they fire on tap and leave the element stuck mid-transform, so
 * both bail out on a coarse pointer.
 */

const COARSE_POINTER_QUERY = '(pointer: coarse)';

/**
 * True when the primary pointer is coarse (touch, most styluses).
 *
 * SSR-safe: returns `false` when there is no `matchMedia` to ask. Read on every
 * call rather than cached, so a device that switches input mode is picked up.
 */
export function coarsePointer(): boolean {
	if (typeof globalThis.matchMedia !== 'function') return false;
	try {
		return globalThis.matchMedia(COARSE_POINTER_QUERY).matches;
	} catch {
		return false;
	}
}
