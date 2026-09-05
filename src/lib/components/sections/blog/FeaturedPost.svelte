<!--
	FeaturedPost — the latest post at the top of the blog listing and in "From the
	Buna Print" on the home page.

	The same `SpotlightCard` treatment as `PostCard` and `ProjectCard`, so the
	largest card on the page is not the one that sits still: tilt, pointer glow,
	shimmer and an accent bottom line, and it dims with the grid below it when a
	smaller card is hovered.

	Two columns on a wide screen, stacked below 720px. The whole card is one link,
	which keeps the a11y tree simple: one target, named by the title inside it.
	The cover is therefore `alt=""` — describing it would only repeat that name.
-->
<script lang="ts">
	import SpotlightCard from '$lib/components/kokonut/SpotlightCard.svelte';
	import Tag from '$lib/components/ui/Tag.svelte';
	import type { BlogPost } from '$lib/types/content';
	import { formatDate } from '$lib/utils/dates';

	interface Props {
		post: BlogPost;
		/**
		 * Heading rank for the title. The default 2 suits the card following an
		 * `<h1>` directly, as on `/blog`; pass 3 where a section `<h2>` already
		 * introduces it, as under "From the Buna Print" on the home page.
		 */
		level?: 2 | 3;
		/** Another card in the group is hovered — recede. */
		dimmed?: boolean;
		onhoverstart?: () => void;
		onhoverend?: () => void;
	}

	let { post, level = 2, dimmed = false, onhoverstart, onhoverend }: Props = $props();

	const topic = $derived(post.tags?.[0]);
	const published = $derived(formatDate(post.publishedAt, 'short'));
</script>

<SpotlightCard
	class="featured-post"
	href="/blog/{post.slug}"
	color="var(--accent)"
	{dimmed}
	{onhoverstart}
	{onhoverend}
>
	<div class="featured-post__layout">
		<div class="featured-post__visual">
			{#if post.coverImage}
				<img class="featured-post__image" src={post.coverImage} alt="" loading="lazy" />
			{:else}
				<span class="featured-post__placeholder" aria-hidden="true"></span>
			{/if}
		</div>

		<div class="featured-post__body">
			{#if topic}
				<Tag tone="accent">{topic}</Tag>
			{/if}
			<svelte:element this={`h${level}`} class="featured-post__title">{post.title}</svelte:element>
			<p class="featured-post__description">{post.description}</p>
			<!-- Two spans with a gap rather than one interpunct-joined string. -->
			<div class="featured-post__meta">
				<span>{published}</span>
				{#if post.readingTime}
					<span>{post.readingTime} min read</span>
				{/if}
			</div>
		</div>
	</div>
</SpotlightCard>

<style>
	/*
		The two-column split lives on a child of the card rather than on the card
		itself: `SpotlightCard` owns its own box, and the visual has to be able to
		run to the card's clipped edge while the body is padded.
	*/
	.featured-post__layout {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr;
	}

	@media (min-width: 720px) {
		.featured-post__layout {
			grid-template-columns: 5fr 6fr;
		}
	}

	.featured-post__visual {
		position: relative;
		aspect-ratio: 16 / 10;
		overflow: hidden;
		border-bottom: 1px solid var(--border);
		background-color: var(--surface-raised);
	}

	@media (min-width: 720px) {
		.featured-post__visual {
			aspect-ratio: auto;
			min-height: 100%;
			border-bottom: 0;
			border-inline-end: 1px solid var(--border);
		}
	}

	/*
		Taken out of flow, exactly like the placeholder below it. Left in flow, a
		portrait cover contributes its own intrinsic height to the row — `height:
		100%` resolves to `auto` against a grid area nothing has sized yet — and a
		three-line post ends up in a card six hundred pixels tall. Out of flow, the
		body sets the height and the cover fills whatever that comes to.
	*/
	.featured-post__image {
		position: absolute;
		inset: 0;
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

	/* The card clips and holds no padding of its own, so the body pads itself. */
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
</style>
