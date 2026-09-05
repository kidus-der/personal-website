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
		class="chip tag-filter__chip"
		class:tag-filter__chip--active={active === null}
		aria-pressed={active === null}
		onclick={() => onchange(null)}
	>
		All
	</button>
	{#each tags as tag (tag)}
		<button
			type="button"
			class="chip tag-filter__chip"
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

	/* Base pill comes from the global `.chip` utility; only the pressed state
	   is local. Doubled up as `.chip.tag-filter__chip--active` so it outranks
	   `.chip:hover` regardless of stylesheet order. */
	.chip.tag-filter__chip--active {
		background-color: var(--accent-dim);
		border-color: color-mix(in srgb, var(--accent) 35%, transparent);
		color: var(--accent);
	}
</style>
