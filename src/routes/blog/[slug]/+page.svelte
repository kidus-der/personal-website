<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// The mdsvex component wraps itself in `BlogPostLayout`; anything passed here
	// lands on that layout alongside the post's frontmatter.
	const Content = $derived(data.content);
</script>

<Content readingTime={data.readingTime} prev={data.prev} next={data.next} />
