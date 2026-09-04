<!--
	BentoCard — KokonutUI `cards/bento-grid`.

	A hairline tile for the "At a glance" grid: title, optional description, and a
	snippet of feature content beneath (a counter, a sparkline, a timeline). It
	tilts a couple of degrees under the pointer and lifts on hover.

	The lift and the tilt share one `transform` rule. Composing them as separate
	declarations would mean the last one wins; instead the hover state only moves
	`--lift`, and the single rule below folds it together with the `--rx`/`--ry`
	that `use:tilt` springs onto the element.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tilt } from '$lib/actions/tilt';
	import { cn } from '$lib/utils/cn';

	interface Props {
		title: string;
		description?: string;
		/** Grid footprint: `md` spans two columns, `lg` spans two columns and two rows. */
		span?: 'sm' | 'md' | 'lg';
		href?: string;
		class?: string;
		/** Feature content rendered beneath the title and description. */
		children?: Snippet;
	}

	let { title, description, span = 'sm', href, class: className = '', children }: Props = $props();

	/** The original's ±2° — a hint of depth, not a flourish. */
	const TILT_OPTIONS = { max: 2 };

	const classes = $derived(cn('bento-card', `bento-card--${span}`, className));
</script>

<svelte:element this={href ? 'a' : 'article'} {href} class={classes} use:tilt={TILT_OPTIONS}>
	<h3 class="bento-card__title">{title}</h3>
	{#if description}
		<p class="bento-card__description">{description}</p>
	{/if}
	{#if children}
		<div class="bento-card__feature">{@render children()}</div>
	{/if}
	{#if href}
		<svg
			class="bento-card__arrow"
			viewBox="0 0 16 16"
			width="16"
			height="16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M5 11 11 5" />
			<path d="M6 5h5v5" />
		</svg>
	{/if}
</svelte:element>

<style>
	.bento-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		position: relative;
		min-height: 180px;
		padding: 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background-color: var(--surface);
		color: inherit;
		text-decoration: none;
		/* Both the hover lift and the pointer tilt, composed once. */
		transform: translateY(var(--lift, 0px)) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
		transition:
			transform 300ms var(--ease-out-expo),
			border-color 300ms var(--ease-out-expo),
			background-color 300ms var(--ease-out-expo);
	}

	.bento-card:hover,
	.bento-card:focus-visible {
		--lift: -4px;
		border-color: var(--border-strong);
		background-color: var(--surface-raised);
	}

	/* Span classes are targeted by the parent grid; the widths only make sense
	   once there is more than one column, so they start at the md breakpoint. */
	@media (min-width: 768px) {
		.bento-card--md {
			grid-column: span 2;
		}

		.bento-card--lg {
			grid-column: span 2;
			grid-row: span 2;
		}
	}

	.bento-card__title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.2;
		/* Room for the arrow so a long title never runs under it. */
		padding-inline-end: 1.5rem;
		color: var(--text);
	}

	.bento-card__description {
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.bento-card__feature {
		margin-top: auto;
		padding-top: 0.75rem;
	}

	.bento-card__arrow {
		position: absolute;
		top: 1.25rem;
		inset-inline-end: 1.25rem;
		color: var(--text-muted);
		opacity: 0;
		transition:
			opacity 200ms var(--ease-out-expo),
			color 200ms var(--ease-out-expo);
	}

	.bento-card:hover .bento-card__arrow,
	.bento-card:focus-visible .bento-card__arrow {
		opacity: 1;
		color: var(--accent);
	}

	@media (prefers-reduced-motion: reduce) {
		.bento-card,
		.bento-card__arrow {
			transition: none;
		}
	}
</style>
