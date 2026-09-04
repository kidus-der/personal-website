<!--
	The app-wide error page.

	Rendered outside both route groups, so it wires up its own `Nav` and `Footer`
	rather than inheriting either section's chrome — a reader who lands on a 404
	needs somewhere to go that is not the browser's back button. `MatrixText`
	scrambles the headline once, which reads as "something got corrupted" without
	needing to say so.
-->
<script lang="ts">
	import { page } from '$app/state';
	import MatrixText from '$lib/components/kokonut/MatrixText.svelte';
	import SlideTextButton from '$lib/components/kokonut/SlideTextButton.svelte';
	import Nav from '$lib/components/layout/Nav.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import SEO from '$lib/components/ui/SEO.svelte';

	const notFound = $derived(page.status === 404);
	const headline = $derived(notFound ? 'Page not found' : 'Something went wrong');
	const explanation = $derived(
		notFound
			? 'That address does not point at anything here. It may have moved, or never existed.'
			: 'The server could not finish the request. Trying again in a moment usually helps.'
	);
</script>

<SEO title={headline} description={explanation} />

<div class="error-shell">
	<Nav />
	<main class="error-page">
		<div class="container error-page__inner">
			<p class="error-page__status">{page.status}</p>
			<h1 class="error-page__headline">
				<MatrixText text={headline} />
			</h1>
			<p class="error-page__body">{explanation}</p>
			<SlideTextButton href="/" text="Back home" />
		</div>
	</main>
	<Footer />
</div>

<style>
	/* Mirrors the route-group shells — see the note there on `--nav-height`. */
	.error-shell {
		--nav-height: 4.5rem;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding-top: var(--nav-height);
	}

	@media (max-width: 768px) {
		.error-shell {
			--nav-height: 4rem;
		}
	}

	.error-page {
		flex: 1;
		display: flex;
		align-items: center;
	}

	.error-page__inner {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1.25rem;
		padding-block: var(--spacing-section);
	}

	.error-page__status {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.error-page__headline {
		font-family: var(--font-display);
		font-size: var(--text-3xl);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.05;
		color: var(--text);
	}

	.error-page__body {
		max-width: 46ch;
		font-size: var(--text-base);
		line-height: 1.6;
		color: var(--text-muted);
	}
</style>
