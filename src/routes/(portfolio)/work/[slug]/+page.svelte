<!--
	/work/[slug] — one project.

	Everything the page shows comes from `+page.ts`; the unknown-slug 404 is
	raised there rather than here, so it happens before any of this renders and
	SvelteKit can serve the real error page instead of a half-built one.

	The visual repeats `ProjectCard`'s image-or-monogram fallback rather than
	importing it: the card's version is welded to the card's aspect ratio, tag row
	and spotlight, and pulling a shared component out of it would mean editing a
	component this page does not own. Two short blocks of CSS is the cheaper debt.
-->
<script lang="ts">
	import SEO from '$lib/components/ui/SEO.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Tag from '$lib/components/ui/Tag.svelte';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const project = $derived(data.project);
	const cover = $derived(project.images[0]);
	const accent = $derived(project.accent ?? 'var(--accent)');
	const monogram = $derived(project.title.trim().charAt(0).toUpperCase());
	/** The detail page has room for the long copy when the project has any. */
	const body = $derived(project.longDescription ?? project.description);
</script>

<SEO title={project.title} description={project.description} />

<main class="project-page">
	<div class="container">
		<a class="project-page__back" href="/work">All work</a>

		<header class="project-page__header" data-reveal use:reveal>
			{#if project.tags.length > 0}
				<ul class="project-page__tags">
					{#each project.tags as tag (tag)}
						<li><Tag>{tag}</Tag></li>
					{/each}
				</ul>
			{/if}

			<h1 class="display-heading project-page__title">{project.title}</h1>
			<p class="project-page__lede">{body}</p>

			{#if project.url || project.githubUrl}
				<div class="project-page__links">
					{#if project.url}
						<Button href={project.url} variant="primary" target="_blank" rel="noopener noreferrer">
							Visit project
						</Button>
					{/if}
					{#if project.githubUrl}
						<Button
							href={project.githubUrl}
							variant="ghost"
							target="_blank"
							rel="noopener noreferrer"
						>
							View source
						</Button>
					{/if}
				</div>
			{/if}
		</header>

		<div class="project-page__visual" style="--project-accent: {accent}" data-reveal use:reveal>
			<!--
				`alt=""`: the content model carries no alt text, and every cover so far
				is a logo or a screenshot of a project this page has already named and
				described. Marking it decorative is honest; inventing "Coeus AI
				screenshot" would assert something we do not actually know.
			-->
			{#if cover}
				<img class="project-page__image" src={cover} alt="" />
			{:else}
				<span class="project-page__monogram" aria-hidden="true">{monogram}</span>
			{/if}
		</div>

		{#if project.highlights.length > 0}
			<section class="project-page__section" data-reveal use:reveal>
				<h2 class="display-heading project-page__section-title">Highlights</h2>
				<ul class="project-page__highlights">
					{#each project.highlights as highlight (highlight)}
						<li>{highlight}</li>
					{/each}
				</ul>
			</section>
		{/if}

		<nav class="project-page__nav" aria-label="More projects">
			<a class="project-nav-card" href="/work/{data.prev.slug}">
				<span class="project-nav-card__label">Previous</span>
				<span class="display-heading project-nav-card__title">{data.prev.title}</span>
			</a>
			<a class="project-nav-card project-nav-card--next" href="/work/{data.next.slug}">
				<span class="project-nav-card__label">Next</span>
				<span class="display-heading project-nav-card__title">{data.next.title}</span>
			</a>
		</nav>
	</div>
</main>

<style>
	.project-page {
		padding-block: 8rem var(--spacing-section);
	}

	.project-page__back {
		display: inline-block;
		margin-bottom: 2.5rem;
		font-size: var(--text-sm);
		color: var(--text-muted);
		transition: color 200ms var(--ease-out-expo);
	}

	.project-page__back:hover {
		color: var(--accent);
	}

	.project-page__header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1.25rem;
		margin-bottom: 3rem;
	}

	.project-page__tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		list-style: none;
	}

	.project-page__title {
		font-size: var(--text-3xl);
		line-height: 1.05;
	}

	.project-page__lede {
		max-width: 62ch;
		font-size: var(--text-lg);
		line-height: 1.7;
		color: var(--text-muted);
	}

	.project-page__links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.project-page__visual {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		background-image: linear-gradient(
			145deg,
			color-mix(in srgb, var(--project-accent) 28%, transparent),
			transparent 75%
		);
	}

	.project-page__image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.project-page__monogram {
		font-family: var(--font-display);
		font-size: clamp(4rem, 14vw, 9rem);
		font-weight: 600;
		line-height: 1;
		color: color-mix(in srgb, var(--project-accent) 70%, transparent);
	}

	.project-page__section {
		margin-top: 3.5rem;
		max-width: 68ch;
	}

	.project-page__section-title {
		margin-bottom: 1.25rem;
		font-size: var(--text-xl);
	}

	.project-page__highlights {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		list-style: none;
	}

	.project-page__highlights li {
		position: relative;
		padding-left: 1.25rem;
		font-size: var(--text-base);
		line-height: 1.7;
		color: var(--text-muted);
	}

	/* An accent dot rather than a glyph: no arrows in body copy. */
	.project-page__highlights li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.7em;
		width: 0.375rem;
		height: 0.375rem;
		border-radius: var(--radius-full);
		background-color: var(--accent);
	}

	.project-page__nav {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin-top: 4rem;
		padding-top: 2.5rem;
		border-top: 1px solid var(--border);
	}

	@media (max-width: 640px) {
		.project-page__nav {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.project-nav-card {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		background-color: var(--surface);
		transition:
			border-color 200ms var(--ease-out-expo),
			background-color 200ms var(--ease-out-expo);
	}

	.project-nav-card:hover {
		border-color: var(--border-strong);
		background-color: var(--surface-raised);
	}

	.project-nav-card--next {
		text-align: right;
	}

	.project-nav-card__label {
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	.project-nav-card__title {
		font-size: var(--text-lg);
		line-height: 1.25;
	}

	@media (prefers-reduced-motion: reduce) {
		.project-page__back,
		.project-nav-card {
			transition: none;
		}
	}
</style>
