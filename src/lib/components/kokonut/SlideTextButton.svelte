<!--
	SlideTextButton — KokonutUI `buttons/slide-text-button`.

	A pill whose label is a two-item stack; hovering (or focusing) slides the stack
	up by 100% so the second label takes the first one's place.

	The slide is a CSS transition rather than a Motion animation: it is a pure
	hover state with no orchestration, it survives rapid pointer flicker for free,
	and `prefers-reduced-motion` disables it without any JS. The element is always
	a real `<a>` or `<button>`, never a div with handlers.
-->
<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Props {
		text: string;
		hoverText?: string;
		href?: string;
		variant?: 'default' | 'ghost';
		type?: 'button' | 'submit';
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		class?: string;
	}

	let {
		text,
		hoverText,
		href,
		variant = 'default',
		type = 'button',
		disabled = false,
		onclick,
		class: className = ''
	}: Props = $props();

	const classes = $derived(cn('slide-button', `slide-button--${variant}`, className));
</script>

{#snippet labels()}
	<span class="slide-button__stack">
		<span class="slide-button__label">{text}</span>
		<!-- Duplicate copy: announced once via the resting label above. -->
		<span class="slide-button__label" aria-hidden="true">{hoverText ?? text}</span>
	</span>
{/snippet}

{#if href}
	<!--
		An anchor cannot be `disabled`, so a disabled link is expressed the way the
		platform allows: announced as disabled, taken out of the tab order, and made
		inert to the pointer by the `[aria-disabled='true']` style rule below.
	-->
	<a
		{href}
		class={classes}
		aria-disabled={disabled ? 'true' : undefined}
		tabindex={disabled ? -1 : undefined}
		{onclick}>{@render labels()}</a
	>
{:else}
	<button {type} class={classes} {disabled} {onclick}>{@render labels()}</button>
{/if}

<style>
	.slide-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 2.5rem;
		padding-inline: 1.25rem;
		border: 1px solid transparent;
		border-radius: var(--radius-pill);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: 500;
		line-height: 1;
		text-decoration: none;
		cursor: pointer;
		overflow: hidden;
		transition:
			background-color 200ms var(--ease-out-expo),
			border-color 200ms var(--ease-out-expo);
	}

	.slide-button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	/* The anchor's stand-in for `:disabled` — also blocks hover and clicks. */
	.slide-button[aria-disabled='true'] {
		cursor: not-allowed;
		opacity: 0.5;
		pointer-events: none;
	}

	.slide-button--default {
		background-color: var(--accent);
		color: var(--bg);
	}

	.slide-button--default:hover:not(:disabled) {
		background-color: var(--accent-strong);
	}

	.slide-button--ghost {
		background-color: transparent;
		border-color: var(--border-strong);
		color: var(--text);
	}

	.slide-button--ghost:hover:not(:disabled) {
		background-color: var(--accent-dim);
		border-color: var(--accent);
	}

	/* The stack is exactly one label tall; sliding it up reveals the second. */
	.slide-button__stack {
		position: relative;
		display: block;
		height: 1.25em;
		overflow: hidden;
	}

	.slide-button__label {
		display: block;
		height: 1.25em;
		line-height: 1.25em;
		white-space: nowrap;
		transition: transform 400ms var(--ease-out-expo);
	}

	.slide-button:hover:not(:disabled) .slide-button__label,
	.slide-button:focus-visible .slide-button__label {
		transform: translateY(-100%);
	}

	@media (prefers-reduced-motion: reduce) {
		.slide-button,
		.slide-button__label {
			transition: none;
		}
	}
</style>
