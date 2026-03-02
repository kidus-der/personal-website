/**
 * use:cursorTarget
 *
 * Marks an element as a cursor variant trigger.
 * When the user hovers this element, the cursor store variant changes.
 *
 * Usage:
 *   <a use:cursorTarget="hover">...</a>
 *   <div use:cursorTarget="drag">...</div>
 */
import { cursorStore } from '$lib/stores/cursor';
import type { CursorVariant } from '$lib/types/animation';

export function cursorTarget(node: HTMLElement, variant: CursorVariant = 'hover') {
	function enter() {
		cursorStore.setVariant(variant);
	}
	function leave() {
		cursorStore.setVariant('default');
	}

	node.addEventListener('mouseenter', enter);
	node.addEventListener('mouseleave', leave);

	return {
		update(newVariant: CursorVariant) {
			variant = newVariant;
		},
		destroy() {
			node.removeEventListener('mouseenter', enter);
			node.removeEventListener('mouseleave', leave);
		}
	};
}
