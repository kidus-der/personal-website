<script lang="ts">
	import { onMount } from 'svelte';
	import { theme } from '$lib/state/theme.svelte';
	import { jsonLd } from '$lib/utils/jsonLd';
	import '@fontsource-variable/geist';
	import '@fontsource-variable/geist-mono';
	import '@fontsource-variable/fraunces';
	import '@fontsource/noto-sans-ethiopic';
	import '../styles/app.css';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	const websiteJsonLd = jsonLd({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Kidus Dereje',
		url: 'https://kidusder.com',
		author: { '@type': 'Person', name: 'Kidus Dereje Zewde' }
	});

	onMount(() => {
		injectAnalytics();
		injectSpeedInsights();

		// Reconcile the theme rune with what the blocking script already applied.
		theme.init();
	});
</script>

<svelte:head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="theme-color" content="#000000" />
	<!-- WebSite structured data -->
	{@html websiteJsonLd}
	<link
		rel="icon"
		type="image/jpeg"
		href={theme.current === 'light'
			? '/icons/website-icon/website-icon-light-mode.png'
			: '/icons/website-icon/website-icon-dark-mode.png'}
	/>
</svelte:head>

{@render children()}
