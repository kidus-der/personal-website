<!--
	PostCard — a post in the blog listing grid and beneath the featured post on
	the home page. The compact counterpart to `FeaturedPost`.

	Posts rarely ship with cover art, so the thumbnail falls back to a gradient
	drawn from the chart palette. Cycling it by `index` keeps a grid of untitled
	posts from reading as five copies of the same tile.

	The cover is `alt=""`: the whole card is one link already named by its title.
-->
<script lang="ts">
	import Tag from '$lib/components/ui/Tag.svelte';
	import type { BlogPost } from '$lib/types/content';
	import { formatDate } from '$lib/utils/dates';

	interface Props {
		post: BlogPost;
		/** Position in the grid; picks the placeholder gradient. */
		index?: number;
	}

	let { post, index = 0 }: Props = $props();

	/** Theme-aware, so the palette re-tints with the light/dark switch. */
	const THUMB_COLORS = [
		'var(--chart-1)',
		'var(--chart-2)',
		'var(--chart-3)',
		'var(--chart-4)',
		'var(--chart-5)'
	];

	const topic = $derived(post.tags?.[0]);
	const published = $derived(formatDate(post.publishedAt, 'short'));
	const thumbColor = $derived(
		THUMB_COLORS[((index % THUMB_COLORS.length) + THUMB_COLORS.length) % THUMB_COLORS.length]
	);
</script>

<a class="post-card" href="/blog/{post.slug}">
	<div class="post-card__thumb" style="--thumb-color: {thumbColor}">
		{#if post.coverImage}
			<img class="post-card__image" src={post.coverImage} alt="" loading="lazy" />
		{:else}
			<span class="post-card__placeholder" aria-hidden="true"></span>
		{/if}
	</div>

	<div class="post-card__body">
		{#if topic}
			<Tag>{topic}</Tag>
		{/if}
		<h3 class="post-card__title">{post.title}</h3>
		<p class="post-card__description">{post.description}</p>
		<!-- Two spans with a gap rather than one interpunct-joined string. -->
		<div class="post-card__meta">
			<span>{published}</span>
			{#if post.readingTime}
				<span>{post.readingTime} min read</span>
			{/if}
		</div>
	</div>
</a>

<style>
	.post-card {
		display: flex;
		flex-direction: column;
		height: 100%;
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		background-color: var(--surface);
		overflow: hidden;
		color: inherit;
		transition:
			border-color 300ms var(--ease-out-expo),
			background-color 300ms var(--ease-out-expo);
	}

	.post-card:hover,
	.post-card:focus-visible {
		border-color: var(--border-strong);
		background-color: var(--surface-raised);
	}

	.post-card__thumb {
		position: relative;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		background-color: var(--surface-raised);
	}

	.post-card__image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.post-card__placeholder {
		position: absolute;
		inset: 0;
		background-image:
			radial-gradient(
				circle at 30% 25%,
				color-mix(in srgb, var(--thumb-color) 34%, transparent),
				transparent 65%
			),
			linear-gradient(
				155deg,
				color-mix(in srgb, var(--thumb-color) 18%, transparent),
				transparent 80%
			);
	}

	.post-card__body {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 1.125rem;
	}

	.post-card__title {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.25;
		color: var(--text);
	}

	.post-card__description {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.post-card__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.875rem;
		margin-top: auto;
		padding-top: 0.25rem;
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.post-card {
			transition: none;
		}
	}
</style>
