<!--
	ProjectCard — one project in the work grid and in "Selected work" on the home
	page. A `SpotlightCard` with a visual block on top and the project's metadata
	beneath.

	The GitHub link is a sibling of the card link, absolutely positioned over its
	corner, rather than a child of it. An `<a>` inside an `<a>` is not just
	invalid: the HTML parser closes the outer anchor when it meets the inner one,
	so a server-rendered card would hydrate into a broken tree. Being a sibling,
	its click never reaches the card link, so it needs no propagation guard.
	Hover reporting moves up to this wrapper for the same reason — it has to cover
	the source link too, or the grid would un-dim its siblings whenever the
	pointer crossed the icon.

	The cover image is `alt=""`: it sits inside a link whose accessible name
	already comes from the title beside it, so a description here would only make
	a screen reader read the project name twice.
-->
<script lang="ts">
	import SpotlightCard from '$lib/components/kokonut/SpotlightCard.svelte';
	import Tag from '$lib/components/ui/Tag.svelte';
	import type { Project } from '$lib/types/content';

	interface Props {
		project: Project;
		/** Another card in the grid is hovered — recede. */
		dimmed?: boolean;
		onhoverstart?: () => void;
		onhoverend?: () => void;
	}

	let { project, dimmed = false, onhoverstart, onhoverend }: Props = $props();

	/** As many stack chips as fit on one line at the narrowest card width. */
	const MAX_TAGS = 4;

	const cover = $derived(project.images[0]);
	const accent = $derived(project.accent ?? 'var(--accent)');
	const monogram = $derived(project.title.trim().charAt(0).toUpperCase());
	const tags = $derived(project.tags.slice(0, MAX_TAGS));
</script>

<!--
	Hover reporting only; the card and the source link inside are both real
	links, so there is nothing here a keyboard user cannot reach.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="project-card"
	onpointerenter={() => onhoverstart?.()}
	onpointerleave={() => onhoverend?.()}
>
	<SpotlightCard href="/work/{project.slug}" color={project.accent} {dimmed}>
		<div class="project-card__visual" style="--project-accent: {accent}">
			{#if cover}
				<img class="project-card__image" src={cover} alt="" loading="lazy" />
			{:else}
				<span class="project-card__monogram" aria-hidden="true">{monogram}</span>
			{/if}
		</div>

		<div class="project-card__body">
			<div class="project-card__head">
				<h3 class="project-card__title">{project.title}</h3>
				<span class="project-card__year">{project.year}</span>
			</div>
			<p class="project-card__description">{project.description}</p>
			{#if tags.length > 0}
				<ul class="project-card__tags">
					{#each tags as tag (tag)}
						<li><Tag>{tag}</Tag></li>
					{/each}
				</ul>
			{/if}
		</div>
	</SpotlightCard>

	{#if project.githubUrl}
		<a
			class="project-card__source"
			href={project.githubUrl}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="Source on GitHub"
		>
			<!-- GitHub octicon (MIT, GitHub Inc.) -->
			<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
				<path
					d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
				/>
			</svg>
		</a>
	{/if}
</div>

<style>
	.project-card {
		position: relative;
		height: 100%;
	}

	.project-card__visual {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 16 / 10;
		overflow: hidden;
		border-bottom: 1px solid var(--border);
		background-image: linear-gradient(
			145deg,
			color-mix(in srgb, var(--project-accent) 28%, transparent),
			transparent 75%
		);
	}

	.project-card__image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.project-card__monogram {
		font-family: var(--font-display);
		font-size: clamp(3rem, 8vw, 4.5rem);
		font-weight: 600;
		line-height: 1;
		color: color-mix(in srgb, var(--project-accent) 70%, transparent);
	}

	.project-card__body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 1.25rem;
		/* Keeps the longest tag row clear of the source link in the corner. */
		padding-inline-end: 3rem;
	}

	.project-card__head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.project-card__title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.2;
		color: var(--text);
	}

	.project-card__year {
		flex-shrink: 0;
		font-size: var(--text-xs);
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.project-card__description {
		font-size: var(--text-sm);
		line-height: 1.55;
		color: var(--text-muted);
	}

	.project-card__tags {
		margin-top: auto;
		padding-top: 0.25rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		list-style: none;
	}

	.project-card__source {
		position: absolute;
		right: 1rem;
		bottom: 1rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: var(--radius-md);
		color: var(--text-muted);
		transition:
			color 200ms var(--ease-out-expo),
			background-color 200ms var(--ease-out-expo);
	}

	.project-card__source:hover,
	.project-card__source:focus-visible {
		color: var(--text);
		background-color: var(--surface-raised);
	}

	@media (prefers-reduced-motion: reduce) {
		.project-card__source {
			transition: none;
		}
	}
</style>
