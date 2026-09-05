/**
 * use:reveal — the one entrance animation the site uses away from the hero.
 *
 * The node (or, with `stagger`, its direct children) is faded and lifted into
 * place the first time it scrolls into view, then handed back to the stylesheet:
 * the inline styles are removed once the animation completes, so a `transform`
 * from `use:tilt` or a `:hover` rule is not beaten by the `transform: none`
 * Motion would otherwise leave behind.
 *
 *   <section data-reveal use:reveal>…</section>
 *   <ul data-reveal-group use:reveal={{ stagger: 0.06 }}>…</ul>
 *
 * **Who does the hiding.** The markup carries `data-reveal` (or, for a stagger,
 * `data-reveal-group` on the parent) and `app.css` hides those elements while
 * `<html>` has the `js` class — see CLAUDE.md, "Animation system". Hiding in the
 * stylesheet rather than here is what removes the flash: the action used to
 * write `opacity: 0` on mount, which meant server-rendered content painted,
 * disappeared a beat later and faded back in. The action now only sets the
 * starting transform, and marks each target `data-revealed` when it arrives,
 * which is what releases the stylesheet's hold.
 *
 * An element with neither attribute — third-party use, or a call site that has
 * not been updated — falls back to the old behaviour and is hidden inline. That
 * still works; it just flashes.
 *
 * A staggered group is released alongside its children, so a list that swaps
 * its items after the reveal has run — the `/work` and `/blog` filters — does
 * not hand the new items to a pre-hide rule nothing will lift.
 *
 * On mount the action also sets `data-motion-ready`, which stands the
 * stylesheet's three-second safety net down for that element. The net is there
 * for a script that never ran; this one has, and a net that fired anyway would
 * push a section that is only waiting to be scrolled to up to full opacity,
 * leaving it nothing to fade in with when it finally gets there.
 *
 * The staggered children are captured once, at mount: children added later are
 * neither hidden nor animated. That suits the static, server-rendered lists this
 * is used on; a list that grows at runtime wants `reveal` on each item instead.
 */
import type { Action } from 'svelte/action';
import { animate, easings, inView, markRevealed, reducedMotion, stagger } from '$lib/motion';
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
 * Is the stylesheet already hiding this target?
 *
 * Either it carries `data-reveal` itself, or it is a direct child of the
 * `data-reveal-group` this instance is animating — the two selectors `app.css`
 * pre-hides.
 */
function isPreHidden(target: HTMLElement, group: HTMLElement | null): boolean {
	if (target.hasAttribute('data-reveal')) return true;
	return (
		group !== null && target.parentElement === group && group.hasAttribute('data-reveal-group')
	);
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

/** The state a target waits in. `opacity` only for targets the CSS is not hiding. */
function hide(targets: HTMLElement[], y: number, group: HTMLElement | null, force = false) {
	// Re-arming the group is what puts the pre-hide back in charge of its
	// children after a non-`once` reveal has scrolled out again.
	group?.removeAttribute('data-revealed');
	for (const target of targets) {
		target.removeAttribute('data-revealed');
		// This action owns the entrance from here; the safety net can stand down.
		target.setAttribute('data-motion-ready', '');
		if (force || !isPreHidden(target, group)) target.style.opacity = '0';
		target.style.transform = `translateY(${y}px)`;
	}
}

/**
 * Hand the targets — and the group they came from — back to the stylesheet.
 *
 * Releasing the group as well as its children is not belt and braces. The
 * pre-hide selector matches a group's children *by position*, so a child
 * rendered into a kept list after the reveal has run — which is exactly what
 * the `/work` category filter and the `/blog` tag filter do — would be hidden
 * by a rule this instance is never going to lift again, and would only appear
 * when the 3s safety net caught it.
 */
function release(targets: HTMLElement[], group: HTMLElement | null) {
	markRevealed(targets);
	group?.setAttribute('data-revealed', '');
}

export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options) => {
	const opts = { ...DEFAULTS, ...options };
	const group = opts.stagger === undefined ? null : node;
	const targets = resolveTargets(node, opts.stagger);

	// Reduced motion means no entrance at all. The markup is already at its final
	// state, so the only thing to do is release the pre-hide — the media query in
	// `app.css` does that too, but marking the targets keeps the two answers to
	// "does this user get animations" from ever disagreeing.
	if (reducedMotion()) {
		for (const target of targets) target.setAttribute('data-revealed', '');
		return { destroy() {} };
	}

	const delay =
		opts.stagger === undefined ? opts.delay : stagger(opts.stagger, { startDelay: opts.delay });

	let animation: Animation | undefined;
	let revealed = false;

	hide(targets, opts.y, group);

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
			play({ opacity: 1, y: 0 }, delay, () => release(targets, group));

			if (opts.once) return;
			// Re-hiding on the way out is what keeps the next entrance an entrance,
			// now that the inline styles are dropped when the reveal completes. The
			// inline opacity is forced here: the element is mid-exit, not waiting on
			// a stylesheet that has already had its say.
			return () => play({ opacity: 0, y: opts.y }, 0, () => hide(targets, opts.y, group, true));
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
