<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { createPageEnterTimeline } from '$lib/animation/timelines/pageEnter';
	import Nav from '$lib/components/layout/Nav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import CustomCursor from '$lib/components/animation/CustomCursor.svelte';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let pageEl: HTMLDivElement;

	onMount(() => {
		const tl = createPageEnterTimeline(pageEl);
		tl.play();
	});

	afterNavigate(() => {
		if (!pageEl) return;
		const tl = createPageEnterTimeline(pageEl);
		tl.play();
	});
</script>

<!-- Custom cursor overlay — only rendered in portfolio section -->
<CustomCursor />

<div class="portfolio-shell">
	<Nav />
	<div bind:this={pageEl} class="page-content">
		{@render children()}
	</div>
	<Footer />
</div>

<style>
	.portfolio-shell {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		cursor: none;
	}

	.page-content {
		flex: 1;
	}
</style>
