<!--
	ThemeSwitch — KokonutUI `buttons/switch-button`, "minimal" variant.

	One button that flips the site between dark and light. The label always names
	the destination ("Switch to light theme"), not the current state, so a screen
	reader user hears what pressing it will do.

	The sun rotates a half turn between states and the optional text label cross
	fades. Both are CSS transitions keyed off the theme class: this is a state
	change with no orchestration, and `prefers-reduced-motion` turns it off with
	no JavaScript involved.
-->
<script lang="ts">
	import { press } from '$lib/actions/press';
	import { theme } from '$lib/state/theme.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		/** Show the current theme's name beside the icon. Off in the nav. */
		showLabel?: boolean;
		class?: string;
	}

	let { showLabel = false, class: className = '' }: Props = $props();

	const isLight = $derived(theme.current === 'light');
	const label = $derived(isLight ? 'Switch to dark theme' : 'Switch to light theme');
</script>

<button
	type="button"
	class={cn('theme-switch', showLabel && 'theme-switch--labelled', className)}
	aria-label={label}
	title={label}
	onclick={() => theme.toggle()}
	use:press
>
	<svg
		class="theme-switch__icon"
		class:theme-switch__icon--flipped={isLight}
		viewBox="0 0 24 24"
		width="16"
		height="16"
		fill="none"
		stroke="currentColor"
		stroke-width="1.75"
		stroke-linecap="round"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="4" />
		<path
			d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
		/>
	</svg>
	{#if showLabel}
		<span class="theme-switch__label">{isLight ? 'Light' : 'Dark'}</span>
	{/if}
</button>

<style>
	.theme-switch {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		height: 2.25rem;
		width: 2.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background-image: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--surface) 95%, transparent),
			color-mix(in srgb, var(--surface-raised) 95%, transparent)
		);
		color: var(--text);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		backdrop-filter: blur(8px);
		overflow: hidden;
		transition:
			border-color 200ms var(--ease-out-expo),
			color 200ms var(--ease-out-expo);
	}

	.theme-switch--labelled {
		width: auto;
		padding-inline: 0.875rem;
	}

	.theme-switch:hover {
		border-color: var(--border-strong);
		color: var(--accent);
	}

	/* The original's inset top highlight. */
	.theme-switch::before {
		content: '';
		position: absolute;
		inset: 1px;
		border-radius: inherit;
		pointer-events: none;
		background-image: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--text) 8%, transparent),
			transparent 40%
		);
		opacity: 0;
		transition: opacity 200ms var(--ease-out-expo);
	}

	.theme-switch:hover::before {
		opacity: 1;
	}

	.theme-switch__icon {
		transition: transform 500ms var(--ease-out-expo);
	}

	.theme-switch__icon--flipped {
		transform: rotate(180deg);
	}

	.theme-switch__label {
		line-height: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.theme-switch,
		.theme-switch::before,
		.theme-switch__icon {
			transition: none;
		}
	}
</style>
