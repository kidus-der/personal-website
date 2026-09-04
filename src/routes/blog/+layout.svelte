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

<div class="blog-shell">
	<Nav />
	<PageTransition>
		{@render children()}
	</PageTransition>
	<Footer />
</div>

<style>
	/* Mirrors the portfolio shell — see the note there on `--nav-height`. */
	.blog-shell {
		--nav-height: 4.5rem;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding-top: var(--nav-height);
	}

	@media (max-width: 768px) {
		.blog-shell {
			--nav-height: 4rem;
		}
	}
</style>
