<!--
	MorphicNav — KokonutUI `navigation/morphic-navbar`.

	A pill of links with one indicator that morphs from item to item as the route
	changes. The original swaps a background class per item; springing a single
	shared element instead is what makes the pill appear to travel.

	Routing is the caller's business: this component takes `current` as a prop and
	never reads `$app/state`, which keeps it renderable from a test and reusable
	inside the mobile menu.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { measureIndicator, moveIndicator } from './indicator';
	import { cn } from '$lib/utils/cn';

	export interface NavItem {
		href: string;
		label: string;
	}

	interface Props {
		items: NavItem[];
		/** The current pathname, e.g. `/work/prime-radiant`. */
		current: string;
		/** Names the landmark. Give a second nav on the page its own label. */
		label?: string;
		class?: string;
	}

	let { items, current, label = 'Primary', class: className = '' }: Props = $props();

	let indicatorEl = $state<HTMLSpanElement | undefined>();
	let linkEls = $state<(HTMLAnchorElement | undefined)[]>([]);
	let animation: ReturnType<typeof moveIndicator> | undefined;
	let placed = false;

	/**
	 * Home matches only itself; every other item owns its whole subtree, so
	 * `/work/prime-radiant` keeps "Work" marked as the current page.
	 */
	function isActive(href: string): boolean {
		return href === '/' ? current === '/' : current.startsWith(href);
	}

	const activeIndex = $derived(items.findIndex((item) => isActive(item.href)));

	function place() {
		if (!indicatorEl) return;
		animation?.stop();
		animation = moveIndicator(
			indicatorEl,
			measureIndicator(activeIndex === -1 ? undefined : linkEls[activeIndex]),
			!placed
		);
		placed = true;
	}

	// Re-measure whenever the route or the item list changes. `$effect` runs
	// after Svelte has flushed the DOM, so the anchors are laid out and their
	// `bind:this` slots are filled by the time we read a box.
	$effect(() => {
		void activeIndex;
		void linkEls;
		place();
	});

	onMount(() => {
		// The pill's own width changes with the viewport, and so does the offset
		// of every item inside it.
		const onResize = () => place();
		window.addEventListener('resize', onResize);
		return () => {
			window.removeEventListener('resize', onResize);
			animation?.stop();
		};
	});
</script>

<nav class={cn('morphic-nav', className)} aria-label={label}>
	<span bind:this={indicatorEl} class="morphic-nav__indicator" aria-hidden="true"></span>
	{#each items as item, index (item.href)}
		<a
			bind:this={linkEls[index]}
			href={item.href}
			class="morphic-nav__link"
			class:morphic-nav__link--active={index === activeIndex}
			aria-current={index === activeIndex ? 'page' : undefined}
		>
			{item.label}
		</a>
	{/each}
</nav>

<style>
	.morphic-nav {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.125rem;
		padding: 0.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		background-color: color-mix(in srgb, var(--surface) 80%, transparent);
		backdrop-filter: blur(12px);
	}

	.morphic-nav__indicator {
		position: absolute;
		left: 0;
		top: 0.25rem;
		bottom: 0.25rem;
		width: 0;
		opacity: 0;
		border-radius: var(--radius-pill);
		background-color: var(--accent);
		pointer-events: none;
	}

	.morphic-nav__link {
		position: relative;
		padding: 0.375rem 1rem;
		border-radius: var(--radius-pill);
		font-size: var(--text-sm);
		font-weight: 500;
		line-height: 1.25;
		white-space: nowrap;
		color: var(--text-muted);
		transition: color 200ms var(--ease-out-expo);
	}

	.morphic-nav__link:hover {
		color: var(--text);
	}

	.morphic-nav__link--active,
	.morphic-nav__link--active:hover {
		/* Sits on the accent pill, so it takes the page background as its ink. */
		color: var(--bg);
	}

	@media (prefers-reduced-motion: reduce) {
		.morphic-nav__link {
			transition: none;
		}
	}
</style>
