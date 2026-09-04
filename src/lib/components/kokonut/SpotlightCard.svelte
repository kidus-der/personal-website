<!--
	SpotlightCard — KokonutUI `cards/spotlight-cards`.

	A hairline card that tilts under the pointer, lights an aurora glow where the
	cursor is, sweeps a shimmer across on hover and draws an accent line along its
	bottom edge. Sibling dimming is the parent's job: the card only reports
	`onhoverstart` / `onhoverend` and renders `dimmed` when told to.

	Division of labour, deliberately:
	  - `use:tilt` springs `--rx`/`--ry`/`--gx`/`--gy` onto the card; the CSS below
	    decides what to do with them. Turning `tilt` off is a max of 0°, which keeps
	    the glow tracking the pointer while the card stays flat — one code path
	    instead of a conditional action.
	  - The shimmer, the accent line and the dim state are CSS: pure hover states
	    with no orchestration, free under `prefers-reduced-motion`.
	  - Only the glow's opacity is sprung through Motion, because it has to fade
	    rather than snap when the pointer crosses in and out quickly.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { animate, reducedMotion, springs } from '$lib/motion';
	import { tilt } from '$lib/actions/tilt';
	import { cn } from '$lib/utils/cn';

	interface Props {
		/** Accent for the tint, glow and bottom line. Defaults to the theme accent. */
		color?: string;
		/** Set false for the flat variant (skills cards): glow only, no rotation. */
		tilt?: boolean;
		/** Another card in the group is hovered — recede. */
		dimmed?: boolean;
		href?: string;
		class?: string;
		onhoverstart?: () => void;
		onhoverend?: () => void;
		children: Snippet;
	}

	let {
		color,
		tilt: tiltEnabled = true,
		dimmed = false,
		href,
		class: className = '',
		onhoverstart,
		onhoverend,
		children
	}: Props = $props();

	/** The original's TILT_MAX. */
	const TILT_MAX = 9;

	let glowEl = $state<HTMLSpanElement | undefined>();
	let glowAnimation: ReturnType<typeof animate> | undefined;
	/** Guards against pointer and focus both reporting the same hover. */
	let active = false;

	const tiltOptions = $derived({ max: tiltEnabled ? TILT_MAX : 0 });
	const classes = $derived(cn('spotlight-card', dimmed && 'spotlight-card--dimmed', className));

	function fadeGlow(opacity: number) {
		if (!glowEl) return;
		glowAnimation?.stop();
		if (reducedMotion()) {
			glowEl.style.opacity = String(opacity);
			return;
		}
		glowAnimation = animate(glowEl, { opacity }, springs.soft);
	}

	function enter() {
		if (active) return;
		active = true;
		fadeGlow(1);
		onhoverstart?.();
	}

	function leave() {
		if (!active) return;
		active = false;
		fadeGlow(0);
		onhoverend?.();
	}
</script>

{#snippet surface()}
	<!-- Layer order matches the original: tint, glow, shimmer, content, line. -->
	<span class="spotlight-card__tint" aria-hidden="true"></span>
	<span bind:this={glowEl} class="spotlight-card__glow" aria-hidden="true"></span>
	<span class="spotlight-card__shimmer" aria-hidden="true"></span>
	<div class="spotlight-card__content">{@render children()}</div>
	<span class="spotlight-card__line" aria-hidden="true"></span>
{/snippet}

<!--
	One element, two tags: `<a>` when the whole card is a link, `<article>` when
	it is not. `svelte:element` keeps the attribute list and the action in one
	place instead of duplicating them across an `{#if}`.

	The pointer handlers only report hover to the parent and fade a decorative
	glow — there is nothing here for a keyboard user to miss, and both tags this
	resolves to (`a` with an href, `article`) already carry a role. The compiler
	cannot see that through the dynamic tag, hence the suppression.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:element
	this={href ? 'a' : 'article'}
	{href}
	class={classes}
	style="--card-color: {color ?? 'var(--accent)'}"
	use:tilt={tiltOptions}
	onpointerenter={enter}
	onpointerleave={leave}
	onfocusin={enter}
	onfocusout={leave}
>
	<span class="spotlight-card__inner">{@render surface()}</span>
</svelte:element>

<style>
	.spotlight-card {
		display: block;
		position: relative;
		/* Resolves to `auto` unless the parent has a definite height, so this
		   only bites in a grid of equal-height cards — which is the point. */
		height: 100%;
		/* The tilt lives on the child, so the perspective belongs here. */
		perspective: 1000px;
		border-radius: var(--radius-card);
		color: inherit;
		text-decoration: none;
		transition:
			opacity 300ms var(--ease-out-expo),
			transform 300ms var(--ease-out-expo);
	}

	.spotlight-card--dimmed {
		opacity: 0.45;
		transform: scale(0.98);
	}

	.spotlight-card__inner {
		display: block;
		position: relative;
		height: 100%;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		background-color: color-mix(in srgb, var(--surface) 70%, transparent);
		transform-style: preserve-3d;
		transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
		transition: border-color 300ms var(--ease-out-expo);
	}

	.spotlight-card:hover .spotlight-card__inner {
		border-color: color-mix(in srgb, var(--card-color) 32%, var(--border));
	}

	/* Always-on tint so the card carries its colour even at rest. */
	.spotlight-card__tint {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(
			circle at 50% 0%,
			color-mix(in srgb, var(--card-color) 6%, transparent),
			transparent 70%
		);
	}

	/* Aurora: follows the pointer through --gx/--gy, faded in by Motion. */
	.spotlight-card__glow {
		position: absolute;
		inset: 0;
		opacity: 0;
		pointer-events: none;
		background: radial-gradient(
			circle at var(--gx, 50%) var(--gy, 50%),
			color-mix(in srgb, var(--card-color) 22%, transparent),
			transparent 60%
		);
	}

	.spotlight-card__shimmer {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(
			115deg,
			transparent 40%,
			color-mix(in srgb, var(--text) 10%, transparent) 50%,
			transparent 60%
		);
		transform: translateX(-100%);
	}

	.spotlight-card:hover .spotlight-card__shimmer {
		animation: spotlight-sweep 1.2s var(--ease-out-quart);
	}

	@keyframes spotlight-sweep {
		to {
			transform: translateX(200%);
		}
	}

	/* A column so a card's last row can be pushed to the bottom edge. */
	.spotlight-card__content {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.spotlight-card__line {
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		height: 2px;
		background-color: var(--card-color);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 400ms var(--ease-out-expo);
	}

	.spotlight-card:hover .spotlight-card__line,
	.spotlight-card:focus-visible .spotlight-card__line {
		transform: scaleX(1);
	}

	@media (prefers-reduced-motion: reduce) {
		.spotlight-card,
		.spotlight-card__inner,
		.spotlight-card__line {
			transition: none;
		}

		.spotlight-card:hover .spotlight-card__shimmer {
			animation: none;
		}
	}
</style>
