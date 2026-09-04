/**
 * use:reveal — the one entrance animation the site uses away from the hero.
 *
 * The node (or, with `stagger`, its direct children) is hidden synchronously on
 * mount so there is no flash of the final state before the observer fires, then
 * faded and lifted into place the first time it scrolls into view.
 *
 *   <section use:reveal>…</section>
 *   <ul use:reveal={{ stagger: 0.06 }}>…</ul>
 */
import type { Action } from 'svelte/action';
import { animate, easings, inView, reducedMotion, stagger } from '$lib/motion';
import type { RevealOptions } from '$lib/types/motion';

type Animation = ReturnType<typeof animate>;

const DEFAULTS = {
	y: 16,
	delay: 0,
	duration: 0.6,
	once: true,
	amount: 0.2
} as const satisfies Required<Omit<RevealOptions, 'stagger'>>;

/** The elements this instance animates: the children when staggering, else the node. */
function resolveTargets(node: HTMLElement, staggerEach: number | undefined): HTMLElement[] {
	if (staggerEach === undefined) return [node];
	const children = Array.from(node.children).filter(
		(child): child is HTMLElement => child instanceof HTMLElement
	);
	// A staggered container that renders nothing yet still deserves a reveal.
	return children.length > 0 ? children : [node];
}

function hide(targets: HTMLElement[], y: number) {
	for (const target of targets) {
		target.style.opacity = '0';
		target.style.transform = `translateY(${y}px)`;
	}
}

export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options) => {
	// Reduced motion means no entrance at all: the node is already at its final
	// state in the markup, so the correct behaviour is to touch nothing.
	if (reducedMotion()) return { destroy() {} };

	const opts = { ...DEFAULTS, ...options };
	const targets = resolveTargets(node, opts.stagger);
	const delay =
		opts.stagger === undefined ? opts.delay : stagger(opts.stagger, { startDelay: opts.delay });

	let animation: Animation | undefined;
	let revealed = false;

	hide(targets, opts.y);

	const play = (keyframes: { opacity: number; y: number }, withDelay: typeof delay) => {
		animation?.stop();
		animation = animate(targets, keyframes, {
			duration: opts.duration,
			delay: withDelay,
			ease: easings.outExpo
		});
	};

	const stopObserving = inView(
		node,
		() => {
			// `once` keeps the reveal a one-off even though the observer stays
			// attached — re-entering must not restart it.
			if (opts.once && revealed) return;
			revealed = true;
			play({ opacity: 1, y: 0 }, delay);

			if (opts.once) return;
			return () => play({ opacity: 0, y: opts.y }, 0);
		},
		{ amount: opts.amount }
	);

	return {
		destroy() {
			stopObserving();
			animation?.stop();
		}
	};
};
