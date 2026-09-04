<!--
	TagFilter — the chip row above the blog listing.

	Toggle buttons rather than tabs: the filter narrows one list in place, it does
	not switch between panels, so `aria-pressed` is the honest state and a plain
	`role="group"` the honest container.

	Controlled: the page owns `active` and re-renders on `onchange`.
-->
<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Props {
		/** Every distinct tag, already ordered by the caller. */
		tags: string[];
		/** The tag currently filtered on; `null` means "All". */
		active: string | null;
		onchange: (tag: string | null) => void;
		class?: string;
	}

	let { tags, active, onchange, class: className = '' }: Props = $props();
</script>

<div class={cn('tag-filter', className)} role="group" aria-label="Filter by tag">
	<button
		type="button"
		class="tag-filter__chip"
		class:tag-filter__chip--active={active === null}
		aria-pressed={active === null}
		onclick={() => onchange(null)}
	>
		All
	</button>
	{#each tags as tag (tag)}
		<button
			type="button"
			class="tag-filter__chip"
			class:tag-filter__chip--active={active === tag}
			aria-pressed={active === tag}
			onclick={() => onchange(tag)}
		>
			{tag}
		</button>
	{/each}
</div>

<style>
	.tag-filter {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag-filter__chip {
		border: 1px solid var(--border);
		border-radius: var(--radius-chip);
		background-color: color-mix(in srgb, var(--surface-raised) 60%, transparent);
		padding: 0.3125rem 0.75rem;
		font-family: var(--font-body);
		font-size: var(--text-sm);
		line-height: 1.4;
		color: var(--text-muted);
		cursor: pointer;
		transition:
			border-color 200ms var(--ease-out-quart),
			background-color 200ms var(--ease-out-quart),
			color 200ms var(--ease-out-quart);
	}

	.tag-filter__chip:hover,
	.tag-filter__chip:focus-visible {
		border-color: var(--border-strong);
		color: var(--text);
	}

	.tag-filter__chip--active {
		background-color: var(--accent-dim);
		border-color: color-mix(in srgb, var(--accent) 35%, transparent);
		color: var(--accent);
	}

	@media (prefers-reduced-motion: reduce) {
		.tag-filter__chip {
			transition: none;
		}
	}
</style>
