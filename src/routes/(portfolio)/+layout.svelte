<script lang="ts">
	import type { Snippet } from 'svelte';
	import Nav from '$lib/components/layout/Nav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import PageTransition from '$lib/components/layout/PageTransition.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="portfolio-shell">
	<Nav />
	<PageTransition>
		{@render children()}
	</PageTransition>
	<Footer />
</div>

<style>
	/*
		The nav is fixed, so the shell reserves its height. `--nav-height` inherits
		into the page, which lets a full-bleed hero pull back up under the bar with
		`margin-top: calc(-1 * var(--nav-height))` instead of guessing the number.
	*/
	.portfolio-shell {
		--nav-height: 4.5rem;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding-top: var(--nav-height);
	}

	@media (max-width: 768px) {
		.portfolio-shell {
			--nav-height: 4rem;
		}
	}
</style>
