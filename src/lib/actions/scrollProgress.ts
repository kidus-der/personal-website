/**
 * use:scrollProgress — write how far a target has travelled through the
 * viewport onto the node as `--progress` (0 at the top edge, 1 at the bottom).
 *
 * Deliberately still active under reduced motion: it drives static UI such as a
 * reading bar or a timeline fill, not motion.
 *
 *   <div class="bar" use:scrollProgress></div>
 *   <div class="rail" use:scrollProgress={{ target: article }}></div>
 */
import type { Action } from 'svelte/action';
import { scroll } from '$lib/motion';
import type { ScrollProgressOptions } from '$lib/types/motion';

export const scrollProgress: Action<HTMLElement, ScrollProgressOptions | undefined> = (
	node,
	options
) => {
	// Seed the variable so consumers have a value before the first scroll frame.
	node.style.setProperty('--progress', '0');

	let target = options?.target ?? node;
	let cancel = subscribe();

	function subscribe() {
		return scroll((progress: number) => node.style.setProperty('--progress', String(progress)), {
			target,
			offset: ['start center', 'end center']
		});
	}

	return {
		// A `bind:this` target is undefined on the first render and only arrives
		// in the update, so the subscription has to be able to move.
		update(next) {
			const nextTarget = next?.target ?? node;
			if (nextTarget === target) return;
			cancel();
			target = nextTarget;
			cancel = subscribe();
		},
		destroy() {
			cancel();
		}
	};
};
