<script lang="ts">
	import type { Snippet } from 'svelte';
	import SiteShell from '$lib/components/layout/SiteShell.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<SiteShell variant="portfolio">
	{@render children()}
</SiteShell>
