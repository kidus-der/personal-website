<!--
	FeaturedPost — the latest post at the top of the blog listing and in "From the
	Buna Print" on the home page.

	Two columns on a wide screen, stacked below 720px. The whole card is one link,
	which keeps the a11y tree simple: one target, named by the title inside it.
-->
<script lang="ts">
	import Tag from '$lib/components/ui/Tag.svelte';
	import type { BlogPost } from '$lib/types/content';
	import { formatDate } from '$lib/utils/dates';

	interface Props {
		post: BlogPost;
	}

	let { post }: Props = $props();

	const topic = $derived(post.tags?.[0]);
	const published = $derived(formatDate(post.publishedAt, 'short'));
</script>

<a class="featured-post" href="/blog/{post.slug}">
	<div class="featured-post__visual">
		{#if post.coverImage}
			<img class="featured-post__image" src={post.coverImage} alt={post.title} loading="lazy" />
		{:else}
			<span class="featured-post__placeholder" aria-hidden="true"></span>
		{/if}
	</div>

	<div class="featured-post__body">
		{#if topic}
			<Tag tone="accent">{topic}</Tag>
		{/if}
		<h3 class="featured-post__title">{post.title}</h3>
		<p class="featured-post__description">{post.description}</p>
		<!-- Two spans with a gap rather than one interpunct-joined string. -->
		<div class="featured-post__meta">
			<span>{published}</span>
			{#if post.readingTime}
				<span>{post.readingTime} min read</span>
			{/if}
		</div>
	</div>
</a>

<style>
	.featured-post {
		display: grid;
		grid-template-columns: 1fr;
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		background-color: var(--surface);
		overflow: hidden;
		color: inherit;
		transition:
			border-color 300ms var(--ease-out-expo),
			background-color 300ms var(--ease-out-expo);
	}

	.featured-post:hover,
	.featured-post:focus-visible {
		border-color: var(--border-strong);
		background-color: var(--surface-raised);
	}

	@media (min-width: 720px) {
		.featured-post {
			grid-template-columns: 5fr 6fr;
		}
	}

	.featured-post__visual {
		position: relative;
		aspect-ratio: 16 / 10;
		overflow: hidden;
		background-color: var(--surface-raised);
	}

	@media (min-width: 720px) {
		.featured-post__visual {
			aspect-ratio: auto;
			min-height: 100%;
		}
	}

	.featured-post__image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* The warm "buna" wash: ember in dark, ice in light — both are `--ember`. */
	.featured-post__placeholder {
		position: absolute;
		inset: 0;
		background-image:
			radial-gradient(
				circle at 25% 20%,
				color-mix(in srgb, var(--accent) 24%, transparent),
				transparent 60%
			),
			linear-gradient(150deg, var(--ember), transparent 80%);
	}

	.featured-post__body {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
		padding: clamp(1.25rem, 3vw, 2rem);
	}

	.featured-post__title {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.15;
		color: var(--text);
	}

	.featured-post__description {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
		font-size: var(--text-base);
		color: var(--text-muted);
	}

	.featured-post__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: auto;
		padding-top: 0.5rem;
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.featured-post {
			transition: none;
		}
	}
</style>
