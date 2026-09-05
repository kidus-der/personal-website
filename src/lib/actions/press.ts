/**
 * use:press — the node dips while it is held and springs back on release.
 *
 * Motion's `press` gesture is used rather than raw pointer events so keyboard
 * activation and pointer cancellation are handled for us.
 *
 *   <button use:press>…</button>
 *   <button use:press={{ scale: 0.92 }}>…</button>
 */
import type { Action } from 'svelte/action';
import { animate, press as pressGesture, reducedMotion, springs } from '$lib/motion';
import type { PressOptions } from '$lib/types/motion';

type Animation = ReturnType<typeof animate>;

const DEFAULTS = { scale: 0.97 } as const satisfies Required<PressOptions>;

export const press: Action<HTMLElement, PressOptions | undefined> = (node, options) => {
	if (reducedMotion()) return { destroy() {} };

	let opts = { ...DEFAULTS, ...options };
	let animation: Animation | undefined;

	function scaleTo(scale: number, spring: (typeof springs)[keyof typeof springs]) {
		animation?.stop();
		animation = animate(node, { scale }, spring);
	}

	const cancel = pressGesture(node, () => {
		scaleTo(opts.scale, springs.snappy);
		return () => scaleTo(1, springs.bouncy);
	});

	return {
		update(next) {
			opts = { ...DEFAULTS, ...next };
		},
		destroy() {
			cancel();
			animation?.stop();
		}
	};
};
