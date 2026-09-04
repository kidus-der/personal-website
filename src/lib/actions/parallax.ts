/**
 * use:parallax — translate the node on the scroll timeline, so it drifts
 * against the page as it crosses the viewport.
 *
 *   <img use:parallax />
 *   <img use:parallax={{ speed: 0.35 }} />
 */
import type { Action } from 'svelte/action';
import { animate, reducedMotion, scroll } from '$lib/motion';
import type { ParallaxOptions } from '$lib/types/motion';

const DEFAULTS = { speed: 0.2 } as const satisfies Required<ParallaxOptions>;

export const parallax: Action<HTMLElement, ParallaxOptions | undefined> = (node, options) => {
	if (reducedMotion()) return { destroy() {} };

	const { speed } = { ...DEFAULTS, ...options };
	const travel = speed * 100;

	// The animation is never played on its own clock: `scroll` takes it over and
	// scrubs it, so the easing must stay linear or the drift would look uneven.
	const animation = animate(node, { y: [-travel, travel] }, { ease: 'linear' });
	const cancel = scroll(animation, {
		target: node,
		offset: ['start end', 'end start']
	});

	return {
		destroy() {
			cancel();
			animation.stop();
		}
	};
};
