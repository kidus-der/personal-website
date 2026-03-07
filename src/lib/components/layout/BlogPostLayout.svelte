<script lang="ts">
	import { onMount } from 'svelte';
	import { revealOnScroll } from '$lib/actions/revealOnScroll';
	import { cursorTarget } from '$lib/actions/cursor';
	import { cursorStore } from '$lib/stores/cursor';
	import SEO from '$lib/components/ui/SEO.svelte';
	import { page } from '$app/stores';

	const pageUrl = $derived($page.url.href);

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
		children
	}: Props = $props();

	let proseEl: HTMLDivElement | undefined = $state();
	let coverImgEl: HTMLImageElement | undefined = $state();
	let headings: Heading[] = $state([]);
	let activeId: string = $state('');

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	onMount(() => {
		if (!proseEl) return;
		const els = proseEl.querySelectorAll('h2[id], h3[id]');
		headings = Array.from(els).map((el) => ({
			id: el.id,
			text: el.textContent?.replace(/^#\s*/, '').trim() ?? '',
			level: el.tagName === 'H2' ? 2 : 3
		}));
		if (headings.length >= 2) {
			const observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) activeId = entry.target.id;
					}
				},
				{ rootMargin: '-10% 0px -80% 0px' }
			);
			els.forEach((el) => observer.observe(el));
			const disconnectObserver = () => observer.disconnect();
			// Attach prose link cursor handlers then return combined cleanup
			const proseLinks = Array.from(proseEl.querySelectorAll('a'));
			const enter = () => cursorStore.setVariant('hover');
			const leave = () => cursorStore.setVariant('default');
			proseLinks.forEach((link) => {
				link.addEventListener('mouseenter', enter);
				link.addEventListener('mouseleave', leave);
			});
			return () => {
				disconnectObserver();
				proseLinks.forEach((link) => {
					link.removeEventListener('mouseenter', enter);
					link.removeEventListener('mouseleave', leave);
				});
			};
		}
		// No TOC — still attach prose link cursor handlers
		const proseLinks = Array.from(proseEl.querySelectorAll('a'));
		const enter = () => cursorStore.setVariant('hover');
		const leave = () => cursorStore.setVariant('default');
		proseLinks.forEach((link) => {
			link.addEventListener('mouseenter', enter);
			link.addEventListener('mouseleave', leave);
		});
		return () => {
			proseLinks.forEach((link) => {
				link.removeEventListener('mouseenter', enter);
				link.removeEventListener('mouseleave', leave);
			});
		};
	});

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
		{@html `<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: title,
			description: description ?? '',
			author: { '@type': 'Person', name: 'Kidus Dereje Zewde', url: 'https://kidus.dev' },
			datePublished: publishedAt,
			dateModified: updatedAt ?? publishedAt,
			url: pageUrl,
			image: coverImage ? `https://kidus.dev${coverImage}` : undefined
		})}</script>`}
	{/if}
</svelte:head>

<main class="post-page">
	<div class="post-page__inner">
		<!-- Cover image — smaller, gradient melt, parallax -->
		<div class="post-cover-wrap">
			{#if coverImage}
				<img bind:this={coverImgEl} src={coverImage} alt={title ?? 'Post cover'} />
			{:else}
				<div class="post-cover__placeholder"></div>
			{/if}
		</div>

		<!-- Header — back link + meta -->
		<header class="post-header" use:revealOnScroll>
			<a href="/blog" class="back-link" use:cursorTarget={'hover'}>← All posts</a>

			{#if tags.length > 0}
				<div class="post__tags">
					{#each tags as tag}
						<span class="post__tag">{tag}</span>
					{/each}
				</div>
			{/if}

			{#if title}
				<h1 class="post__title">{title}</h1>
			{/if}

			{#if description}
				<p class="post__desc">{description}</p>
			{/if}

			{#if publishedAt || readingTime}
				<div class="post__meta">
					{#if publishedAt}
						<span class="post__meta-item">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
								<line x1="16" y1="2" x2="16" y2="6"></line>
								<line x1="8" y1="2" x2="8" y2="6"></line>
								<line x1="3" y1="10" x2="21" y2="10"></line>
							</svg>
							<time datetime={publishedAt}>{formatDate(publishedAt)}</time>
						</span>
					{/if}
					{#if publishedAt && readingTime}
						<span class="post__meta-sep" aria-hidden="true">·</span>
					{/if}
					{#if readingTime}
						<span class="post__meta-item">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<circle cx="12" cy="12" r="10"></circle>
								<polyline points="12 6 12 12 16 14"></polyline>
							</svg>
							<span>{readingTime} min read</span>
						</span>
					{/if}
				</div>
			{/if}
		</header>

		<!-- Body: TOC (left 1/3) | Article (right 2/3) -->
		<div class="post-body">
			<!-- TOC: first child → left column. Hidden when < 2 headings. -->
			{#if headings.length >= 2}
				<aside class="toc-card" aria-label="Table of contents">
					<p class="toc__label">On this page</p>
					<nav>
						<ul class="toc__list">
							{#each headings as heading}
								<li
									class="toc__item"
									class:toc__item--h3={heading.level === 3}
									class:toc__item--active={activeId === heading.id}
								>
									<a href="#{heading.id}" class="toc__link" use:cursorTarget={'hover'}>{heading.text}</a>
								</li>
							{/each}
						</ul>
					</nav>
				</aside>
			{/if}

			<!-- Article: second child → right column. :only-child → full-width when no TOC. -->
			<article class="prose-article">
				<div class="prose" bind:this={proseEl}>
					{@render children?.()}
				</div>
			</article>
		</div>
	</div>
</main>

<style>
	/* ── Page shell ──────────────────────────────────────────── */
	.post-page {
		padding: 7rem var(--spacing-container) var(--spacing-section);
	}
	.post-page__inner {
		max-width: 1100px;
		margin: 0 auto;
	}

	/* ── Cover image ─────────────────────────────────────────── */
	.post-cover-wrap {
		overflow: hidden;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		height: clamp(275px, 62.5vh, 650px);
		margin-bottom: 0;
	}
	.post-cover__placeholder {
		width: 100%;
		height: 100%;
		background: var(--surface-raised);
	}
	.post-cover-wrap img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* ── Post header ─────────────────────────────────────────── */
	.post-header {
		padding-top: 3rem;
		margin-bottom: 4rem;
	}

	.back-link {
		font-size: var(--text-sm);
		color: var(--text-muted);
		display: inline-block;
		margin-bottom: 2rem;
		transition: color 0.2s;
	}
	.back-link:hover {
		color: var(--accent);
	}

	.post__tags {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}
	/* Match project page tag style exactly */
	.post__tag {
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.2rem 0.65rem;
		border: 1px solid var(--accent);
		border-radius: var(--radius-full);
		color: var(--accent);
	}

	/* Match project page title style */
	.post__title {
		font-size: var(--text-3xl);
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.1;
		margin-bottom: 1rem;
	}

	/* Match project page desc style */
	.post__desc {
		font-size: var(--text-lg);
		color: var(--text-muted);
		max-width: 640px;
		line-height: 1.7;
		margin-bottom: 1.25rem;
	}

	.post__meta {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: var(--text-sm);
		color: var(--text-muted);
	}
	.post__meta-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.post__meta-sep {
		opacity: 0.4;
	}

	/* ── Two-column body ─────────────────────────────────────── */
	.post-body {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 4rem;
		align-items: start;
	}

	/* When no TOC: article is :only-child → spans full width */
	.prose-article:only-child {
		grid-column: 1 / -1;
	}

	@media (max-width: 900px) {
		.post-body {
			grid-template-columns: 1fr;
		}
		.toc-card {
			display: none;
		}
	}

	/* ── TOC card ────────────────────────────────────────────── */
	.toc-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		position: sticky;
		top: 9rem;
		max-height: calc(100vh - 10.5rem);
		overflow-y: auto;
		scrollbar-width: none;
	}
	.toc-card::-webkit-scrollbar {
		display: none;
	}

	.toc__label {
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.toc__list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.toc__item--h3 {
		padding-left: 0.75rem;
	}

	/* Multi-line underline — text-decoration follows each line of text */
	.toc__link {
		display: block;
		font-size: var(--text-sm);
		line-height: 1.5;
		color: var(--text-muted);
		padding: 0.25rem 0;
		text-decoration: underline;
		text-decoration-color: transparent;
		text-underline-offset: 2px;
		text-decoration-thickness: 1px;
		transition:
			text-decoration-color 0.3s var(--ease-out-expo),
			color 0.2s;
	}
	.toc__link:hover {
		color: var(--text);
		text-decoration-color: var(--accent);
	}
	/* Active: permanent underline + accent color */
	.toc__item--active .toc__link {
		color: var(--accent);
		text-decoration-color: var(--accent);
	}

	/* ── Prose article ───────────────────────────────────────── */
	:global(.prose) {
		font-size: 1.0625rem;
		line-height: 1.85;
		color: var(--text);
	}

	:global(.prose h2) {
		font-size: var(--text-2xl);
		font-weight: 600;
		letter-spacing: -0.02em;
		margin: 3rem 0 1rem;
		scroll-margin-top: 5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border);
	}
	:global(.prose h3) {
		font-size: var(--text-xl);
		font-weight: 600;
		margin: 2.5rem 0 0.75rem;
		scroll-margin-top: 5rem;
		padding-left: 0.875rem;
		border-left: 3px solid var(--accent);
	}
	:global(.prose h4) {
		font-size: var(--text-lg);
		font-weight: 600;
		margin: 2rem 0 0.5rem;
		scroll-margin-top: 5rem;
	}

	/* Heading anchor links (rehype-autolink-headings behavior: wrap) */
	:global(.prose h2 a),
	:global(.prose h3 a),
	:global(.prose h4 a) {
		color: inherit;
		text-decoration: none;
	}
	:global(.prose h2 a::after),
	:global(.prose h3 a::after),
	:global(.prose h4 a::after) {
		content: ' #';
		opacity: 0;
		color: var(--accent);
		font-weight: 400;
		font-size: 0.8em;
		transition: opacity 0.15s ease;
	}
	:global(.prose h2:hover a::after),
	:global(.prose h3:hover a::after),
	:global(.prose h4:hover a::after) {
		opacity: 1;
	}

	:global(.prose p) {
		margin-bottom: 1.75rem;
	}

	:global(.prose a) {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	:global(.prose strong) {
		font-weight: 700;
		color: var(--accent);
	}
	:global(.prose em) {
		font-style: italic;
		color: var(--accent);
	}

	/* Inline code — accent tint for readability in both themes */
	:global(.prose code) {
		font-family: var(--font-mono);
		font-size: 0.875em;
		background: var(--surface-raised);
		color: var(--accent);
		padding: 0.15em 0.4em;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}

	/* Code blocks — always dark (Shiki github-dark-dimmed) */
	:global(.prose .shiki) {
		background: #22272e !important;
		border-radius: var(--radius-md);
		border: 1px solid rgba(255, 255, 255, 0.08);
		margin: 2rem 0;
		overflow: hidden;
	}
	:global(.prose .shiki pre) {
		padding: 1.25rem 1.5rem;
		overflow-x: auto;
		background: transparent !important;
		margin: 0;
	}
	:global(.prose .shiki code) {
		font-family: var(--font-mono);
		font-size: 0.85em;
		background: none;
		border: none;
		padding: 0;
		color: inherit;
	}

	/* Blockquotes */
	:global(.prose blockquote) {
		border-left: 3px solid var(--accent);
		background: var(--surface);
		padding: 1rem 1.5rem;
		margin: 2rem 0;
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
		color: var(--text);
		font-style: normal;
	}

	:global(.prose ul),
	:global(.prose ol) {
		padding-left: 1.5rem;
		margin-bottom: 1.5rem;
	}
	:global(.prose li) {
		margin-bottom: 0.5rem;
	}
	:global(.prose li > ul),
	:global(.prose li > ol) {
		margin-top: 0.25rem;
		margin-bottom: 0.25rem;
	}

	:global(.prose hr) {
		border: none;
		height: 1px;
		background: var(--border);
		margin: 3rem 0;
	}

	:global(.prose table) {
		display: block;
		width: max-content;
		max-width: 100%;
		overflow-x: auto;
		margin: 2rem 0;
		border-collapse: collapse;
		font-size: var(--text-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
	}
	:global(.prose thead) {
		border-bottom: 2px solid var(--accent);
	}
	:global(.prose th) {
		text-align: left;
		padding: 0.75rem 1rem;
		font-weight: 600;
		color: var(--text);
		white-space: nowrap;
	}
	:global(.prose td) {
		padding: 0.65rem 1rem;
		vertical-align: top;
		border-bottom: 1px solid var(--border);
	}
	:global(.prose tbody tr:last-child td) {
		border-bottom: none;
	}
	:global(.prose tbody tr:nth-child(even)) {
		background: var(--surface);
	}

	:global(.prose img) {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 2rem auto;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}
	/* The Frame | እይታ — portrait and landscape both constrained */
	:global(.prose h2[id^="the-frame"] ~ p img) {
		max-width: 70%;
		max-height: 70vh;
	}

	:global(.prose img + em) {
		display: block;
		text-align: center;
		font-size: var(--text-sm);
		color: var(--text-muted);
		margin-top: -1.25rem;
		margin-bottom: 2rem;
	}

	/* Callout boxes */
	:global(.prose .callout) {
		margin: 2rem 0;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		overflow: hidden;
	}
	:global(.prose .callout__title) {
		padding: 0.6rem 1rem;
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: 0.02em;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
	}
	:global(.prose .callout__body) {
		padding: 1rem 1.25rem;
	}
	:global(.prose .callout__body > *:last-child) {
		margin-bottom: 0;
	}
	:global(.prose .callout--note) {
		border-left: 3px solid #6cb6ff;
	}
	:global(.prose .callout--tip) {
		border-left: 3px solid #57ab5a;
	}
	:global(.prose .callout--warning) {
		border-left: 3px solid #e3b341;
	}
	:global(.prose .callout--danger) {
		border-left: 3px solid #f47067;
	}
	:global(.prose .callout--important) {
		border-left: 3px solid var(--accent);
	}
</style>
