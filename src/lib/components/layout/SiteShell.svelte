<!--
	SiteShell — the nav / content / footer frame both route groups and the error
	page sit inside.

	The three had drifted into near-identical copies of the same column: the same
	`--nav-height` reservation, the same `min-height: 100dvh`, the same two
	breakpoints. They keep separate class hooks (`site-shell--portfolio`,
	`--blog`, `--error`) so a section can still style its own frame without the
	others inheriting it.

	The one real difference is the route transition. `+error.svelte` is rendered
	outside both groups and has no route to transition between, so the `error`
	variant renders its children directly; the other two wrap them in
	`PageTransition`.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Nav from './Nav.svelte';
	import Footer from './Footer.svelte';
	import PageTransition from './PageTransition.svelte';

	export type SiteShellVariant = 'portfolio' | 'blog' | 'error';

	interface Props {
		variant: SiteShellVariant;
		children: Snippet;
	}

	let { variant, children }: Props = $props();
</script>

<div class="site-shell site-shell--{variant}">
	<Nav />
	{#if variant === 'error'}
		{@render children()}
	{:else}
		<PageTransition>
			{@render children()}
		</PageTransition>
	{/if}
	<Footer />
</div>

<style>
	/*
		The nav is fixed, so the shell reserves its height. `--nav-height` inherits
		into the page, which lets a full-bleed hero pull back up under the bar with
		`margin-top: calc(-1 * var(--nav-height))` instead of guessing the number.
	*/
	.site-shell {
		--nav-height: 4.5rem;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding-top: var(--nav-height);
	}

	@media (max-width: 768px) {
		.site-shell {
			--nav-height: 4rem;
		}
	}
</style>
