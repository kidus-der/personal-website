<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { registerGSAPPlugins } from '$lib/animation/gsap.config';
	import { initLenis, destroyLenis } from '$lib/animation/lenis.config';
	import { themeStore } from '$lib/stores/theme';
	import '../styles/app.css';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		// Register GSAP plugins once
		registerGSAPPlugins();

		// Inject Vercel Analytics + Speed Insights (client-side, auto page-view tracking)
		injectAnalytics();
		injectSpeedInsights();

		// Init smooth scroll
		initLenis();

		// Sync theme with persisted value
		themeStore.init();
	});

	// Pause Lenis during SvelteKit navigation to prevent janky scroll
	beforeNavigate(() => {
		destroyLenis();
	});

	afterNavigate(() => {
		initLenis();
	});
</script>

<!--
	Blocking inline theme script — runs before paint to prevent flash.
	This must stay synchronous and inline.
-->
<svelte:head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="theme-color" content="#0a0a0a" />
	<!-- WebSite structured data -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Kidus Dereje',
		url: 'https://kidus.dev',
		author: { '@type': 'Person', name: 'Kidus Dereje Zewde' }
	})}</script>`}
	<!-- svelte-ignore -->
	{@html `<script>
		(function() {
			try {
				var stored = localStorage.getItem('theme');
				var preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
				document.documentElement.setAttribute('data-theme', stored || preferred);
			} catch(e) {}
		})();
	</script>`}
	<link
		rel="icon"
		type="image/jpeg"
		href={$themeStore === 'light'
			? '/icons/website-icon/website-icon-light-mode.png'
			: '/icons/website-icon/website-icon-dark-mode.png'}
	/>
</svelte:head>

{@render children()}
