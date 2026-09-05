<script lang="ts">
	import type { PageData } from './$types';
	import { BeamsBackground } from '$lib/components/kokonut';
	import FeaturedPost from '$lib/components/sections/blog/FeaturedPost.svelte';
	import PostCard from '$lib/components/sections/blog/PostCard.svelte';
	import TagFilter from '$lib/components/sections/blog/TagFilter.svelte';
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';
	import SEO from '$lib/components/ui/SEO.svelte';
	import SubscribeSection from '$lib/components/ui/SubscribeSection.svelte';
	import { reveal } from '$lib/actions/reveal';

	let { data }: { data: PageData } = $props();

	/** `null` is "All". Deliberately outlives a data change, so a client-side
	 * navigation can land on a tag no remaining post carries. */
	let activeTag = $state<string | null>(null);

	const tags = $derived(
		[...new Set(data.posts.flatMap((post) => post.tags ?? []))].sort((a, b) => a.localeCompare(b))
	);

	const filtered = $derived.by(() => {
		const tag = activeTag;
		if (tag === null) return data.posts;
		return data.posts.filter((post) => post.tags?.includes(tag));
	});

	const featured = $derived(filtered[0]);
	const rest = $derived(filtered.slice(1));
</script>

<SEO
	title="The Buna Print"
	description="Writing on machine learning, research, and everything else."
/>

<main class="blog">
	<div class="blog__masthead">
		<BeamsBackground intensity="subtle" />
		<div class="container">
			<header class="blog__header">
				<h1 class="display-heading blog__title">The Buna Print</h1>
				<p class="blog__title-am" lang="am">የቡና እትም</p>
				<p class="blog__lede">A home for ideas, perspectives, thoughts, and everything else.</p>
			</header>
		</div>
	</div>

	<div class="container">
		<div class="blog__inner">
			{#if data.posts.length === 0}
				<p class="blog__empty">No posts yet. Check back soon.</p>
			{:else}
				{#if tags.length > 0}
					<TagFilter {tags} active={activeTag} onchange={(tag) => (activeTag = tag)} />
				{/if}

				{#if !featured}
					<p class="blog__empty">No posts with that tag yet.</p>
				{:else}
					<FeaturedPost post={featured} />

					{#if rest.length > 0}
						<section class="blog__more">
							<SectionHeading title="More posts" level={2} />
							<div class="blog__grid" use:reveal={{ stagger: 0.06 }}>
								{#each rest as post, index (post.slug)}
									<PostCard {post} {index} />
								{/each}
							</div>
						</section>
					{/if}
				{/if}
			{/if}

			<SubscribeSection />
		</div>
	</div>
</main>

<style>
	.blog {
		padding-bottom: var(--spacing-section);
	}

	/* --- Masthead --------------------------------------------------- */
	.blog__masthead {
		position: relative;
		overflow: hidden;
		padding-top: 8rem;
		padding-bottom: 3rem;
		border-bottom: 1px solid var(--border);
	}

	.blog__header {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 1100px;
		margin-inline: auto;
	}

	.blog__title {
		/* A notch under `--text-display`: this is a masthead, not the home hero. */
		font-size: clamp(2.5rem, 6vw, 4.5rem);
		line-height: 1.05;
	}

	.blog__title-am {
		font-family: var(--font-ethiopic);
		font-size: var(--text-xl);
		line-height: 1.4;
		color: var(--accent);
	}

	.blog__lede {
		max-width: 48ch;
		margin-top: 0.5rem;
		font-size: var(--text-lg);
		color: var(--text-muted);
	}

	/* --- List ------------------------------------------------------- */
	.blog__inner {
		display: flex;
		flex-direction: column;
		gap: 3rem;
		max-width: 1100px;
		margin-inline: auto;
		padding-top: 3rem;
	}

	.blog__empty {
		font-size: var(--text-base);
		color: var(--text-muted);
	}

	.blog__more {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.blog__grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 640px) {
		.blog__grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 960px) {
		.blog__grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
