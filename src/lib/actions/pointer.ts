/**
 * Pointer capability probe shared by the cursor-driven actions.
 *
 * Tilt and magnetic pull need a pointer that can hover: on a touch screen they
 * fire on tap and leave the element stuck mid-transform. The test is phrased as
 * an enable check rather than a "is this touch?" check so hybrid machines — a
 * laptop with both a trackpad and a touch screen, a tablet with a mouse — keep
 * the effects as long as some fine, hovering pointer is available.
 */

const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

/**
 * True when a hovering, fine-grained pointer is available.
 *
 * SSR-safe: returns `false` when there is no `matchMedia` to ask, so the
 * hover-only effects stay off rather than being registered blind. Read on every
 * call rather than cached, so a device that gains a mouse is picked up.
 */
export function finePointer(): boolean {
	if (typeof globalThis.matchMedia !== 'function') return false;
	try {
		return globalThis.matchMedia(FINE_POINTER_QUERY).matches;
	} catch {
		return false;
	}
}
