<!--
	SmoothTabs — KokonutUI `navigation/smooth-tab`.

	A tablist whose indicator slides between tabs, used as the category filter on
	`/work`. It follows the WAI-ARIA tabs pattern with automatic activation: the
	arrow keys move both focus and selection, Home and End jump to the ends, and
	only the selected tab is in the tab order.

	Selection is held locally and re-synced from `active` whenever the parent
	changes it. The parent owns the truth (on `/work` that is the `?category=`
	query parameter), but a click must not wait for a navigation round trip
	before the indicator moves.

	An `active` id matching no tab selects nothing and hides the indicator, the
	way `MorphicNav` handles an unknown route: quietly selecting the first tab
	would misreport a bad `?category=` value as a real filter. The first tab stays
	tabbable so the row is still reachable.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { createIndicator } from './indicator.svelte';
	import { cn } from '$lib/utils/cn';

	export interface Tab {
		id: string;
		label: string;
	}

	interface Props {
		tabs: Tab[];
		/** The selected tab's id. */
		active: string;
		onchange: (id: string) => void;
		/** Names the tablist for assistive tech. */
		label?: string;
		class?: string;
	}

	let { tabs, active, onchange, label = 'Filter', class: className = '' }: Props = $props();

	// A writable `$derived`: it tracks `active`, and assigning to it holds a local
	// override until the parent next changes `active`. That is exactly the
	// optimistic-then-corrected behaviour this needs, in one declaration.
	let selected = $derived(active);
	let indicatorEl = $state<HTMLSpanElement | undefined>();
	let tabEls = $state<(HTMLButtonElement | undefined)[]>([]);

	/** -1 when `active` names no tab. */
	const selectedIndex = $derived(tabs.findIndex((tab) => tab.id === selected));
	/** Keeps one tab in the page's tab order even when nothing is selected. */
	const tabbableIndex = $derived(selectedIndex === -1 ? 0 : selectedIndex);

	createIndicator(
		() => indicatorEl,
		() => (selectedIndex === -1 ? undefined : tabEls[selectedIndex])
	);

	function select(index: number, moveFocus: boolean) {
		const tab = tabs[index];
		if (!tab || tab.id === selected) return;
		selected = tab.id;
		if (moveFocus) tick().then(() => tabEls[index]?.focus());
		onchange(tab.id);
	}

	function handleKeydown(event: KeyboardEvent) {
		const last = tabs.length - 1;
		// With nothing selected, the arrows start from the tabbable tab.
		const from = tabbableIndex;
		let next: number;
		switch (event.key) {
			case 'ArrowRight':
				next = from === last ? 0 : from + 1;
				break;
			case 'ArrowLeft':
				next = from === 0 ? last : from - 1;
				break;
			case 'Home':
				next = 0;
				break;
			case 'End':
				next = last;
				break;
			default:
				return;
		}
		event.preventDefault();
		select(next, true);
	}
</script>

<div class={cn('smooth-tabs', className)} role="tablist" aria-label={label}>
	<span bind:this={indicatorEl} class="smooth-tabs__indicator" aria-hidden="true"></span>
	{#each tabs as tab, index (tab.id)}
		<button
			bind:this={tabEls[index]}
			type="button"
			role="tab"
			class="smooth-tabs__tab"
			class:smooth-tabs__tab--selected={index === selectedIndex}
			aria-selected={index === selectedIndex}
			tabindex={index === tabbableIndex ? 0 : -1}
			onclick={() => select(index, false)}
			onkeydown={handleKeydown}
		>
			{tab.label}
		</button>
	{/each}
</div>

<style>
	.smooth-tabs {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.125rem;
		max-width: 100%;
		padding: 0.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		background-color: var(--surface);
		overflow-x: auto;
		scrollbar-width: none;
	}

	.smooth-tabs::-webkit-scrollbar {
		display: none;
	}

	.smooth-tabs__indicator {
		position: absolute;
		left: 0;
		top: 0.25rem;
		bottom: 0.25rem;
		width: 0;
		opacity: 0;
		border-radius: var(--radius-pill);
		background-color: var(--accent-dim);
		border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
		pointer-events: none;
	}

	.smooth-tabs__tab {
		position: relative;
		padding: 0.375rem 0.875rem;
		border-radius: var(--radius-pill);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: 500;
		line-height: 1.25;
		white-space: nowrap;
		color: var(--text-muted);
		transition: color 200ms var(--ease-out-expo);
	}

	.smooth-tabs__tab:hover {
		color: var(--text);
	}

	.smooth-tabs__tab--selected {
		color: var(--accent);
	}

	@media (prefers-reduced-motion: reduce) {
		.smooth-tabs__tab {
			transition: none;
		}
	}
</style>
