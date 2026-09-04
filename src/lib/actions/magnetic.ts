/**
 * use:magnetic — the node springs toward the cursor while it hovers, and back
 * to its origin when the cursor leaves.
 *
 *   <button use:magnetic>…</button>
 *   <a use:magnetic={{ strength: 0.4 }}>…</a>
 */
import type { Action } from 'svelte/action';
import { animate, reducedMotion, springs } from '$lib/motion';
import type { MagneticOptions } from '$lib/types/motion';
import { coarsePointer } from './pointer';

type Animation = ReturnType<typeof animate>;

const DEFAULTS = { strength: 0.3 } as const satisfies Required<MagneticOptions>;

export const magnetic: Action<HTMLElement, MagneticOptions | undefined> = (node, options) => {
	// Without a hovering pointer there is nothing to be magnetic about, and on
	// touch the node would stay displaced after the tap.
	if (reducedMotion() || coarsePointer()) return { destroy() {} };

	let opts = { ...DEFAULTS, ...options };
	let animation: Animation | undefined;

	function springTo(x: number, y: number) {
		animation?.stop();
		animation = animate(node, { x, y }, springs.soft);
	}

	function handlePointerMove(event: PointerEvent) {
		const rect = node.getBoundingClientRect();
		const centreX = rect.left + rect.width / 2;
		const centreY = rect.top + rect.height / 2;
		springTo((event.clientX - centreX) * opts.strength, (event.clientY - centreY) * opts.strength);
	}

	function handlePointerLeave() {
		springTo(0, 0);
	}

	node.addEventListener('pointermove', handlePointerMove);
	node.addEventListener('pointerleave', handlePointerLeave);

	return {
		update(next) {
			opts = { ...DEFAULTS, ...next };
		},
		destroy() {
			node.removeEventListener('pointermove', handlePointerMove);
			node.removeEventListener('pointerleave', handlePointerLeave);
			animation?.stop();
		}
	};
};
