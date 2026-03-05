<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const Content = $derived(data.content);
</script>

<Content readingTime={data.readingTime} />
