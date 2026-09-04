<!--
	Button — the plain control primitive.

	`SlideTextButton` and `ParticleButton` are the two showpiece buttons; this is
	the quiet one used everywhere else (forms, back links, secondary actions).
	It renders a real `<a>` when given an `href` and a real `<button>` otherwise,
	and leans on `use:press` for the only motion it has.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { press } from '$lib/actions/press';
	import { cn } from '$lib/utils/cn';

	interface Props {
		variant?: 'primary' | 'ghost' | 'link';
		size?: 'sm' | 'md' | 'lg';
		href?: string;
		/** Set on anchors only; ignored for buttons. */
		target?: string;
		rel?: string;
		type?: 'button' | 'submit';
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		href,
		target,
		rel,
		type = 'button',
		disabled = false,
		onclick,
		class: className = '',
		children
	}: Props = $props();

	const classes = $derived(cn('button', `button--${variant}`, `button--${size}`, className));
</script>

{#if href}
	<!--
		An anchor cannot be `disabled`, so a disabled link is expressed the way the
		platform allows: announced as disabled, taken out of the tab order, and made
		inert to the pointer by the `[aria-disabled='true']` rule below.
	-->
	<a
		{href}
		{target}
		{rel}
		class={classes}
		aria-disabled={disabled ? 'true' : undefined}
		tabindex={disabled ? -1 : undefined}
		{onclick}
		use:press
	>
		{@render children()}
	</a>
{:else}
	<button {type} class={classes} {disabled} {onclick} use:press>
		{@render children()}
	</button>
{/if}

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: 1px solid transparent;
		border-radius: var(--radius-pill);
		font-family: var(--font-body);
		font-weight: 500;
		line-height: 1;
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color 200ms var(--ease-out-expo),
			border-color 200ms var(--ease-out-expo),
			color 200ms var(--ease-out-expo);
	}

	.button:disabled,
	.button[aria-disabled='true'] {
		cursor: not-allowed;
		opacity: 0.5;
		pointer-events: none;
	}

	.button--sm {
		height: 2rem;
		padding-inline: 0.875rem;
		font-size: var(--text-xs);
	}

	.button--md {
		height: 2.5rem;
		padding-inline: 1.25rem;
		font-size: var(--text-sm);
	}

	.button--lg {
		height: 2.75rem;
		padding-inline: 1.5rem;
		font-size: var(--text-base);
	}

	.button--primary {
		background-color: var(--accent);
		color: var(--bg);
	}

	.button--primary:hover:not(:disabled) {
		background-color: var(--accent-strong);
	}

	.button--ghost {
		border-color: var(--border-strong);
		color: var(--text);
	}

	.button--ghost:hover:not(:disabled) {
		background-color: var(--accent-dim);
		border-color: var(--accent);
	}

	/* A control that reads as prose: no chrome, only an underline on hover. */
	.button--link {
		height: auto;
		padding: 0;
		border-radius: 0;
		color: var(--accent);
	}

	.button--link:hover:not(:disabled) {
		text-decoration: underline;
		text-underline-offset: 0.25em;
	}
</style>
