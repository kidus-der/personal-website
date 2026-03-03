<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const Content = $derived(data.content);
</script>

<svelte:head>
	<title>{data.metadata?.title ?? 'Post'} — Kidus</title>
	{#if data.metadata?.description}
		<meta name="description" content={data.metadata.description} />
	{/if}
</svelte:head>

<Content readingTime={data.readingTime} />
