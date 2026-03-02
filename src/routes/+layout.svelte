<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { registerGSAPPlugins } from '$lib/animation/gsap.config';
	import { initLenis, destroyLenis } from '$lib/animation/lenis.config';
	import { themeStore } from '$lib/stores/theme';
	import '../styles/app.css';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		// Register GSAP plugins once
		registerGSAPPlugins();

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
</svelte:head>

{@render children()}
