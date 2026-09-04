/**
 * use:reveal — the one entrance animation the site uses away from the hero.
 *
 * The node (or, with `stagger`, its direct children) is hidden synchronously on
 * mount so there is no flash of the final state before the observer fires, then
 * faded and lifted into place the first time it scrolls into view. The inline
 * styles are removed again once the animation completes, so the element goes
 * back to being styled purely by the stylesheet — a `transform` from `use:tilt`
 * or a `:hover` rule would otherwise lose to the inline `transform: none` that
 * Motion leaves behind.
 *
 *   <section use:reveal>…</section>
 *   <ul use:reveal={{ stagger: 0.06 }}>…</ul>
 *
 * The staggered children are captured once, at mount: children added later are
 * neither hidden nor animated. That suits the static, server-rendered lists this
 * is used on; a list that grows at runtime wants `reveal` on each item instead.
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

/**
 * Fraction of a tall element's own height that can ever be on screen at once.
 * A little under 1 so the threshold is actually crossed rather than grazed.
 */
const TALL_ELEMENT_MARGIN = 0.9;

/** The elements this instance animates: the children when staggering, else the node. */
function resolveTargets(node: HTMLElement, staggerEach: number | undefined): HTMLElement[] {
	if (staggerEach === undefined) return [node];
	const children = Array.from(node.children).filter(
		(child): child is HTMLElement => child instanceof HTMLElement
	);
	// A staggered container that renders nothing yet still deserves a reveal.
	return children.length > 0 ? children : [node];
}

/**
 * `intersectionRatio` is capped at `viewportHeight / elementHeight`, so a
 * numeric threshold an element is too tall to ever reach would leave it hidden
 * forever. Measured once, at mount.
 */
function resolveAmount(node: HTMLElement, amount: RevealOptions['amount']) {
	if (typeof amount !== 'number') return amount;
	const height = node.offsetHeight;
	// 0 means "not laid out yet" (or jsdom): nothing useful to clamp against.
	if (height <= 0) return amount;
	return Math.min(amount, (window.innerHeight / height) * TALL_ELEMENT_MARGIN);
}

function hide(targets: HTMLElement[], y: number) {
	for (const target of targets) {
		target.style.opacity = '0';
		target.style.transform = `translateY(${y}px)`;
	}
}

/** Hand the element back to the stylesheet once it has arrived. */
function clearInlineState(targets: HTMLElement[]) {
	for (const target of targets) {
		target.style.removeProperty('opacity');
		target.style.removeProperty('transform');
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

	const play = (
		keyframes: { opacity: number; y: number },
		withDelay: typeof delay,
		onComplete: () => void
	) => {
		animation?.stop();
		animation = animate(targets, keyframes, {
			duration: opts.duration,
			delay: withDelay,
			ease: easings.outExpo,
			onComplete
		});
	};

	const stopObserving = inView(
		node,
		() => {
			// Motion stops observing once `onStart` returns a non-function, so with
			// `once` this fires a single time anyway; the flag is belt and braces.
			if (opts.once && revealed) return;
			revealed = true;
			play({ opacity: 1, y: 0 }, delay, () => clearInlineState(targets));

			if (opts.once) return;
			// Re-hiding on the way out is what keeps the next entrance an entrance,
			// now that the inline styles are dropped when the reveal completes.
			return () => play({ opacity: 0, y: opts.y }, 0, () => hide(targets, opts.y));
		},
		{ amount: resolveAmount(node, opts.amount) }
	);

	return {
		destroy() {
			stopObserving();
			animation?.stop();
		}
	};
};
