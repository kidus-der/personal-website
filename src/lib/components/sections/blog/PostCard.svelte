<!--
	PostCard — a post in the blog listing grid and beneath the featured post on
	the home page. The compact counterpart to `FeaturedPost`.

	Built on `SpotlightCard`, like `ProjectCard`: the same 3D tilt, pointer-
	following glow, shimmer sweep and accent bottom line, and the same sibling
	dimming driven by whichever grid is rendering it. A post and a project are the
	same kind of object on this site — a cover, a title, a line of prose, some
	metadata — and there was no reason for them to behave differently under the
	pointer.

	Posts rarely ship with cover art, so the thumbnail falls back to a gradient
	drawn from the chart palette. Cycling it by `index` keeps a grid of untitled
	posts from reading as five copies of the same tile; that same colour is what
	the card lights its glow and its bottom line with, so the whole card is tinted
	by one value rather than two.

	The cover is `alt=""`: the whole card is one link already named by its title.
-->
<script lang="ts">
	import SpotlightCard from '$lib/components/kokonut/SpotlightCard.svelte';
	import Tag from '$lib/components/ui/Tag.svelte';
	import type { BlogPost } from '$lib/types/content';
	import { formatDate } from '$lib/utils/dates';

	interface Props {
		post: BlogPost;
		/** Position in the grid; picks the placeholder gradient and the card tint. */
		index?: number;
		/** Another card in the grid is hovered — recede. */
		dimmed?: boolean;
		onhoverstart?: () => void;
		onhoverend?: () => void;
	}

	let { post, index = 0, dimmed = false, onhoverstart, onhoverend }: Props = $props();

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

<SpotlightCard
	class="post-card"
	href="/blog/{post.slug}"
	color={thumbColor}
	{dimmed}
	{onhoverstart}
	{onhoverend}
>
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
</SpotlightCard>

<style>
	.post-card__thumb {
		position: relative;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		border-bottom: 1px solid var(--border);
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

	/* The card clips and holds no padding of its own, so the body pads itself. */
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
</style>
