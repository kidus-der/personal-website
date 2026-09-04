<!--
	Tag — the site's one chip primitive.

	Used for project stacks, publication topics, skill items and blog tags. It is
	deliberately non-interactive: filtering lives in `SmoothTabs`, so a chip never
	needs to be a button and can stay a plain span inside a card-wide link.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		/** `accent` tints the chip with the theme accent; `neutral` is the default hairline. */
		tone?: 'neutral' | 'accent';
		class?: string;
		children: Snippet;
	}

	let { tone = 'neutral', class: className = '', children }: Props = $props();
</script>

<span class={cn('tag', `tag--${tone}`, className)}>{@render children()}</span>

<style>
	.tag {
		display: inline-flex;
		align-items: center;
		border: 1px solid var(--border);
		border-radius: var(--radius-chip);
		padding: 0.125rem 0.5rem;
		font-family: var(--font-body);
		font-size: var(--text-xs);
		line-height: 1.5;
		white-space: nowrap;
	}

	.tag--neutral {
		background-color: color-mix(in srgb, var(--surface-raised) 60%, transparent);
		color: var(--text-muted);
	}

	.tag--accent {
		background-color: var(--accent-dim);
		border-color: color-mix(in srgb, var(--accent) 35%, transparent);
		color: var(--accent);
	}
</style>
