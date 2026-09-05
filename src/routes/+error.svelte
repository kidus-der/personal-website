<!--
	The app-wide error page.

	Rendered outside both route groups, so it puts up its own `SiteShell` rather
	than inheriting either section's chrome — a reader who lands on a 404 needs
	somewhere to go that is not the browser's back button. `MatrixText` scrambles
	the headline once, which reads as "something got corrupted" without needing to
	say so, and the same `FlowField` the rest of the site uses drifts behind it, at
	its soft intensity — this is the one page with nothing else on it to look at.
-->
<script lang="ts">
	import { page } from '$app/state';
	import FlowField from '$lib/components/kokonut/FlowField.svelte';
	import MatrixText from '$lib/components/kokonut/MatrixText.svelte';
	import SlideTextButton from '$lib/components/kokonut/SlideTextButton.svelte';
	import SiteShell from '$lib/components/layout/SiteShell.svelte';
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

<SiteShell variant="error">
	<main class="error-page">
		<FlowField intensity="soft" />

		<div class="container error-page__inner">
			<p class="error-page__status">{page.status}</p>
			<h1 class="error-page__headline">
				<MatrixText text={headline} />
			</h1>
			<p class="error-page__body">{explanation}</p>
			<SlideTextButton href="/" text="Back home" />
		</div>
	</main>
</SiteShell>

<style>
	.error-page {
		position: relative;
		flex: 1;
		display: flex;
		align-items: center;
		overflow: hidden;
	}

	.error-page__inner {
		/* Above the path field, which is absolutely positioned into the main. */
		position: relative;
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
