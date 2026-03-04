<script lang="ts">
	import { revealOnScroll } from '$lib/actions/revealOnScroll';
	import { cursorTarget } from '$lib/actions/cursor';
	import { projects } from '$content/projects';
</script>

<svelte:head>
	<title>Work — Kidus</title>
	<meta name="description" content="Selected projects by Kidus — design, engineering, and everything in between." />
</svelte:head>

<main class="work-page">
	<div class="work-page__inner">
		<header class="work-page__header" use:revealOnScroll>
			<span class="label">Work</span>
			<h1 class="work-page__title">My Projects</h1>
			<p class="work-page__sub">
				Here's a selection of my projects that I am proud of ranging from full-stack AI applications,
				interactive experiences, and ML research.
			</p>
		</header>

		<div class="work-list">
			{#each projects as project, i}
				<a
					href="/work/{project.slug}"
					class="work-item"
					use:revealOnScroll={{ delay: i * 0.05 }}
					use:cursorTarget={'hover'}
				>
					<div class="work-item__thumb">
						{#if project.images[0]}
							<img src={project.images[0]} alt={project.title} class="work-item__img" />
						{:else}
							<div class="work-item__placeholder"></div>
						{/if}
					</div>
					<div class="work-item__meta">
						<span class="work-item__year">{project.year}</span>
						<h2 class="work-item__title">{project.title}</h2>
						<p class="work-item__desc">{project.description}</p>
						<div class="work-item__tags">
							{#each project.tags as tag}
								<span class="tag" data-text={tag}>{tag}</span>
							{/each}
						</div>
					</div>
				</a>
			{/each}

			{#if projects.length === 0}
				<p class="work-empty">Projects coming soon.</p>
			{/if}
		</div>
	</div>
</main>

<style>
	.work-page {
		padding: 8rem var(--spacing-container) var(--spacing-section);
	}

	.work-page__inner {
		max-width: 1400px;
		margin: 0 auto;
	}

	.work-page__header {
		margin-bottom: 5rem;
	}

	.label {
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent);
		display: block;
		margin-bottom: 1rem;
	}

	.work-page__title {
		font-size: var(--text-3xl);
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.1;
		margin-bottom: 1.5rem;
	}

	.work-page__sub {
		font-size: var(--text-lg);
		color: var(--text-muted);
		max-width: 520px;
		line-height: 1.7;
	}

	.work-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.work-item {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		align-items: center;
		padding: 3rem 0;
		border-top: 1px solid var(--border);
		transition: border-color 0.3s;

		&:hover {
			border-color: var(--text-muted);

			.work-item__thumb {
				transform: scale(1.02);
			}
		}

		@media (max-width: 768px) {
			grid-template-columns: 1fr;
		}
	}

	.work-item__thumb {
		aspect-ratio: 4/3;
		border-radius: var(--radius-md);
		overflow: hidden;
		transition: transform 0.5s var(--ease-out-expo);
	}

	.work-item__placeholder {
		width: 100%;
		height: 100%;
		background: var(--surface-raised);
	}

	.work-item__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.work-item__meta {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.work-item__year {
		font-size: var(--text-xs);
		color: var(--text-muted);
		letter-spacing: 0.08em;
	}

	.work-item__title {
		font-size: var(--text-2xl);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.2;
		width: fit-content;
		background-image: linear-gradient(var(--accent), var(--accent));
		background-repeat: no-repeat;
		background-position: 0 100%;
		background-size: 0% 1px;
		transition: background-size 0.3s var(--ease-out-expo);
	}

	.work-item:hover .work-item__title {
		background-size: 100% 1px;
	}

	.work-item__desc {
		font-size: var(--text-base);
		color: var(--text-muted);
		line-height: 1.7;
	}

	.work-item__tags {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.tag {
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.2rem 0.65rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-full);
		color: var(--text-muted);
		position: relative;
	}

	.tag::after {
		content: attr(data-text);
		position: absolute;
		inset: 0;
		padding: 0.2rem 0.65rem;
		color: var(--accent);
		clip-path: inset(100% 0 0 0);
		transition: clip-path 0.35s var(--ease-out-expo);
		pointer-events: none;
		font-size: var(--text-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.work-item:hover .tag::after {
		clip-path: inset(0% 0 0 0);
	}

	.work-empty {
		color: var(--text-muted);
		padding: 4rem 0;
	}
</style>
