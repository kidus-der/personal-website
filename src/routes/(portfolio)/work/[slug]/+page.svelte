<script lang="ts">
	import { page } from '$app/stores';
	import { projects } from '$content/projects';
	import { revealOnScroll } from '$lib/actions/revealOnScroll';
	import { cursorTarget } from '$lib/actions/cursor';
	import { error } from '@sveltejs/kit';

	const slug = $page.params.slug;
	const project = projects.find((p) => p.slug === slug);

	if (!project) {
		error(404, 'Project not found');
	}
</script>

<svelte:head>
	<title>{project?.title} — Kidus</title>
	<meta name="description" content={project?.description} />
</svelte:head>

<main class="project-page">
	<div class="project-page__inner">
		<a href="/work" class="back-link" use:cursorTarget={'hover'}>
			← All work
		</a>

		<header class="project-header" use:revealOnScroll>
			<div class="project-header__tags">
				{#each project?.tags ?? [] as tag}
					<span class="tag">{tag}</span>
				{/each}
			</div>
			<h1 class="project-header__title">{project?.title}</h1>
			<p class="project-header__desc">{project?.longDescription ?? project?.description}</p>

			<div class="project-header__links">
				{#if project?.url}
					<a href={project.url} target="_blank" rel="noopener noreferrer" class="btn btn--primary" use:cursorTarget={'hover'}>
						Visit project
					</a>
				{/if}
				{#if project?.githubUrl}
					<a href={project.githubUrl} target="_blank" rel="noopener noreferrer" class="btn btn--ghost" use:cursorTarget={'hover'}>
						View source
					</a>
				{/if}
			</div>
		</header>

		<div class="project-visual" use:revealOnScroll={{ threshold: 0.1 }}>
			<div class="project-visual__placeholder"></div>
		</div>
	</div>
</main>

<style>
	.project-page {
		padding: 7rem var(--spacing-container) var(--spacing-section);
	}

	.project-page__inner {
		max-width: 1100px;
		margin: 0 auto;
	}

	.back-link {
		font-size: var(--text-sm);
		color: var(--text-muted);
		transition: color 0.2s;
		display: inline-block;
		margin-bottom: 3rem;

		&:hover {
			color: var(--accent);
		}
	}

	.project-header {
		margin-bottom: 4rem;
	}

	.project-header__tags {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}

	.tag {
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.2rem 0.65rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-full);
		color: var(--text-muted);
	}

	.project-header__title {
		font-size: var(--text-3xl);
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.1;
		margin-bottom: 1.5rem;
	}

	.project-header__desc {
		font-size: var(--text-lg);
		color: var(--text-muted);
		max-width: 640px;
		line-height: 1.7;
		margin-bottom: 2.5rem;
	}

	.project-header__links {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		padding: 0.75rem 1.75rem;
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: 500;
		letter-spacing: 0.04em;
		transition: background 0.25s, color 0.25s, transform 0.2s var(--ease-out-expo);
	}

	.btn:hover {
		transform: translateY(-2px);
	}

	.btn--primary {
		background: var(--accent);
		color: var(--bg);
	}

	.btn--ghost {
		border: 1px solid var(--border);
		color: var(--text-muted);
	}

	.btn--ghost:hover {
		border-color: var(--text-muted);
		color: var(--text);
	}

	.project-visual {
		border-radius: var(--radius-lg);
		overflow: hidden;
		border: 1px solid var(--border);
	}

	.project-visual__placeholder {
		aspect-ratio: 16/9;
		background: var(--surface-raised);
	}
</style>
