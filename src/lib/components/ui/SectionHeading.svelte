<!--
	SectionHeading — the shared header for every content band.

	Title in the display face, an optional lede, and an optional right-side action
	(usually a "see everything" link). There is deliberately no eyebrow label:
	the design brief drops all-caps kickers in favour of a single sentence-case
	title carrying the section's name.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		title: string;
		lede?: string;
		/** Heading rank. Sections on a page use 2; nested groups use 3. */
		level?: 2 | 3;
		class?: string;
		/** Rendered to the right of the title — a link, a button, a filter. */
		action?: Snippet;
	}

	let { title, lede, level = 2, class: className = '', action }: Props = $props();
</script>

<header class={cn('section-heading', className)}>
	<div class="section-heading__row">
		<svelte:element this={`h${level}`} class="section-heading__title">{title}</svelte:element>
		{#if action}
			<div class="section-heading__action">{@render action()}</div>
		{/if}
	</div>
	{#if lede}
		<p class="section-heading__lede">{lede}</p>
	{/if}
</header>

<style>
	.section-heading {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-heading__row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.section-heading__title {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.15;
		color: var(--text);
	}

	.section-heading__action {
		flex-shrink: 0;
	}

	.section-heading__lede {
		max-width: 56ch;
		font-size: var(--text-base);
		color: var(--text-muted);
	}
</style>
