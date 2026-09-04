<!--
	BlogPostLayout — the mdsvex layout every post is rendered into.

	Frontmatter arrives as props; `readingTime`, `prev` and `next` are handed down
	from `+page.svelte`, which computes them in `+page.ts`.

	The table of contents is scanned from the rendered DOM rather than the
	markdown source: rehype-slug has already assigned the ids by then, so the TOC
	and the anchors can never drift apart. It appears only from two headings up —
	a single-heading post does not need a map of itself.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { site } from '$content/site';
	import { parallax } from '$lib/actions/parallax';
	import SEO from '$lib/components/ui/SEO.svelte';
	import Tag from '$lib/components/ui/Tag.svelte';
	import SubscribeSection from '$lib/components/ui/SubscribeSection.svelte';
	import PostNav from '$lib/components/sections/blog/PostNav.svelte';
	import ReadingProgress from '$lib/components/sections/blog/ReadingProgress.svelte';
	import ShareLinks from '$lib/components/sections/blog/ShareLinks.svelte';
	import type { BlogPost } from '$lib/types/content';
	import { formatDate } from '$lib/utils/dates';
	import { jsonLd } from '$lib/utils/jsonLd';
	// mdsvex output is never seen by Svelte's style scoper, so `.prose` lives in
	// a plain stylesheet imported here rather than in this component's style block.
	import '../../../styles/prose.css';

	interface Heading {
		id: string;
		text: string;
		level: number;
	}

	interface Props {
		title?: string;
		description?: string;
		publishedAt?: string;
		updatedAt?: string;
		tags?: string[];
		readingTime?: number;
		coverImage?: string;
		/** The newer post in the archive, if any. */
		prev?: BlogPost | null;
		/** The older post in the archive, if any. */
		next?: BlogPost | null;
		children?: import('svelte').Snippet;
	}

	let {
		title,
		description,
		publishedAt,
		updatedAt,
		tags = [],
		readingTime,
		coverImage,
		prev = null,
		next = null,
		children
	}: Props = $props();

	/** The TOC is a map, not a list: below two entries it is noise. */
	const MIN_TOC_HEADINGS = 2;

	/** The prose itself is the reading-progress target: the bar hits 100% at the
	 * end of the writing, not at the end of the share links below it. */
	let proseEl: HTMLDivElement | undefined = $state();
	let headings: Heading[] = $state([]);
	let activeId = $state('');

	const pageUrl = $derived(page.url.href);
	const published = $derived(publishedAt ? formatDate(publishedAt, 'long') : '');

	onMount(() => {
		if (!proseEl) return;
		const els = proseEl.querySelectorAll('h2[id], h3[id]');
		headings = Array.from(els).map((el) => ({
			id: el.id,
			text: el.textContent?.replace(/^#\s*/, '').trim() ?? '',
			level: el.tagName === 'H2' ? 2 : 3
		}));
		if (headings.length < MIN_TOC_HEADINGS) return;

		// The band is deliberately narrow and high: whichever heading last crossed
		// into the top tenth of the viewport is the one being read.
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) activeId = entry.target.id;
				}
			},
			{ rootMargin: '-10% 0px -80% 0px' }
		);
		els.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	});

	const articleJsonLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: title,
			description: description ?? '',
			author: { '@type': 'Person', name: site.name, url: site.url },
			datePublished: publishedAt,
			dateModified: updatedAt ?? publishedAt,
			url: pageUrl,
			image: coverImage ? `${site.url}${coverImage}` : undefined
		})
	);
</script>

<SEO
	title={title ?? 'Blog'}
	description={description ?? ''}
	type="article"
	{publishedAt}
	{updatedAt}
	{tags}
	{coverImage}
/>
<svelte:head>
	{#if title}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- built by `jsonLd()` from our own data -->
		{@html articleJsonLd}
	{/if}
</svelte:head>

<ReadingProgress target={proseEl} />

<main class="post-page">
	<div class="container">
		<div class="post-page__inner">
			<div class="post-cover">
				{#if coverImage}
					<img class="post-cover__image" src={coverImage} alt="" use:parallax={{ speed: 0.15 }} />
				{:else}
					<span class="post-cover__placeholder" aria-hidden="true"></span>
				{/if}
			</div>

			<header class="post-header">
				<a class="post-header__back" href="/blog">All posts</a>

				{#if tags.length > 0}
					<div class="post-header__tags">
						{#each tags as tag (tag)}
							<Tag tone="accent">{tag}</Tag>
						{/each}
					</div>
				{/if}

				{#if title}
					<h1 class="post-header__title">{title}</h1>
				{/if}

				{#if description}
					<p class="post-header__description">{description}</p>
				{/if}

				{#if published || readingTime}
					<!-- Two spans with a gap rather than one interpunct-joined string. -->
					<div class="post-header__meta">
						{#if published}
							<span><time datetime={publishedAt}>{published}</time></span>
						{/if}
						{#if readingTime}
							<span>{readingTime} min read</span>
						{/if}
					</div>
				{/if}
			</header>

			<div class="post-body">
				{#if headings.length >= MIN_TOC_HEADINGS}
					<aside class="toc">
						<p class="toc__label">On this page</p>
						<nav aria-label="Table of contents">
							<ul class="toc__list">
								{#each headings as heading (heading.id)}
									<li
										class="toc__item"
										class:toc__item--nested={heading.level === 3}
										class:toc__item--active={activeId === heading.id}
									>
										<a class="toc__link" href="#{heading.id}">{heading.text}</a>
									</li>
								{/each}
							</ul>
						</nav>
					</aside>
				{/if}

				<article class="post-article">
					<div class="prose" bind:this={proseEl}>
						{@render children?.()}
					</div>

					<ShareLinks title={title ?? 'This post'} url={pageUrl} />
					<PostNav {prev} {next} />
				</article>
			</div>

			<SubscribeSection />
		</div>
	</div>
</main>

<style>
	.post-page {
		padding-top: 7rem;
		padding-bottom: var(--spacing-section);
	}

	/* The container is the site-wide 1180px; prose reads better narrower. */
	.post-page__inner {
		max-width: 1100px;
		margin-inline: auto;
	}

	/* --- Cover ----------------------------------------------------- */
	.post-cover {
		position: relative;
		height: clamp(220px, 44vh, 460px);
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		background-color: var(--surface-raised);
	}

	/* Taller than its frame so the parallax drift never reveals an edge. */
	.post-cover__image {
		position: absolute;
		inset: -8% 0;
		width: 100%;
		height: 116%;
		object-fit: cover;
	}

	.post-cover__placeholder {
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

	/* --- Header ---------------------------------------------------- */
	.post-header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
		padding-top: 3rem;
		margin-bottom: 3.5rem;
	}

	.post-header__back {
		font-size: var(--text-sm);
		color: var(--text-muted);
		transition: color 200ms var(--ease-out-quart);
	}

	.post-header__back:hover,
	.post-header__back:focus-visible {
		color: var(--accent);
	}

	.post-header__tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.post-header__title {
		font-family: var(--font-display);
		font-size: var(--text-3xl);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.1;
		color: var(--text);
	}

	.post-header__description {
		max-width: 60ch;
		font-size: var(--text-lg);
		color: var(--text-muted);
	}

	.post-header__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	/* --- Body ------------------------------------------------------ */
	.post-body {
		display: grid;
		grid-template-columns: 1fr;
		gap: 3rem;
		align-items: start;
	}

	@media (min-width: 900px) {
		.post-body {
			grid-template-columns: minmax(0, 15rem) minmax(0, 1fr);
			gap: 4rem;
		}

		/* No TOC: the article is the only child and takes the whole width. */
		.post-article:only-child {
			grid-column: 1 / -1;
		}
	}

	.post-article {
		min-width: 0;
	}

	/* --- Table of contents ----------------------------------------- */
	.toc {
		display: none;
	}

	@media (min-width: 900px) {
		.toc {
			display: block;
			position: sticky;
			top: 8rem;
			max-height: calc(100vh - 10rem);
			overflow-y: auto;
			scrollbar-width: none;
			border: 1px solid var(--border);
			border-radius: var(--radius-card);
			background-color: var(--surface);
			padding: 1.25rem;
		}
	}

	.toc::-webkit-scrollbar {
		display: none;
	}

	.toc__label {
		margin-bottom: 0.75rem;
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.toc__list {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.toc__item--nested {
		padding-left: 0.75rem;
	}

	.toc__link {
		display: block;
		padding: 0.25rem 0;
		font-size: var(--text-sm);
		line-height: 1.5;
		color: var(--text-muted);
		text-decoration: underline;
		text-decoration-color: transparent;
		text-decoration-thickness: 1px;
		text-underline-offset: 2px;
		transition:
			color 200ms var(--ease-out-quart),
			text-decoration-color 300ms var(--ease-out-expo);
	}

	.toc__link:hover,
	.toc__link:focus-visible {
		color: var(--text);
		text-decoration-color: var(--accent);
	}

	.toc__item--active .toc__link {
		color: var(--accent);
		text-decoration-color: var(--accent);
	}

	@media (prefers-reduced-motion: reduce) {
		.post-header__back,
		.toc__link {
			transition: none;
		}
	}
</style>
