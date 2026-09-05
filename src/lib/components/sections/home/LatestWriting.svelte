<!--
	LatestWriting — "From the Buna Print": the newest post large, the next two
	beside it.

	The whole band disappears when there is nothing published, rather than
	rendering a heading over an empty grid. The two-up grid disappears on its own
	when there is only one post.
-->
<script lang="ts">
	import { GRID_REVEAL } from '$lib/motion';
	import { reveal } from '$lib/actions/reveal';
	import FeaturedPost from '$lib/components/sections/blog/FeaturedPost.svelte';
	import PostCard from '$lib/components/sections/blog/PostCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';
	import type { BlogPost } from '$lib/types/content';
	import { cn } from '$lib/utils/cn';

	interface Props {
		/** Newest first. Only the first three are used. */
		posts: BlogPost[];
		class?: string;
	}

	let { posts, class: className = '' }: Props = $props();

	const featured = $derived(posts[0]);
	const rest = $derived(posts.slice(1, 3));
</script>

{#if featured}
	<section class={cn('latest-writing', className)}>
		<div class="container">
			<SectionHeading
				title="From the Buna Print"
				lede="Notes on machine learning, research, and everything else."
			>
				{#snippet action()}
					<Button variant="link" href="/blog">All posts</Button>
				{/snippet}
			</SectionHeading>

			<div class="latest-writing__featured">
				<FeaturedPost post={featured} level={3} />
			</div>

			{#if rest.length > 0}
				<div class="latest-writing__grid" data-reveal-group use:reveal={GRID_REVEAL}>
					{#each rest as post, index (post.slug)}
						<PostCard {post} {index} />
					{/each}
				</div>
			{/if}
		</div>
	</section>
{/if}

<style>
	.latest-writing {
		padding-block: var(--spacing-section);
	}

	.latest-writing__featured {
		margin-top: 2.5rem;
	}

	.latest-writing__grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		margin-top: 1rem;
	}

	@media (min-width: 720px) {
		.latest-writing__grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
