<script lang="ts">
	import { onMount } from 'svelte';
	import { createHeroRevealTimeline } from '$lib/animation/timelines/heroReveal';
	import { revealOnScroll } from '$lib/actions/revealOnScroll';
	import { cursorTarget } from '$lib/actions/cursor';
	import { magnetic } from '$lib/actions/magnetic';
	import { projects } from '$content/projects';

	let eyebrow: HTMLElement;
	let headline: HTMLElement;
	let subheadline: HTMLElement;
	let cta: HTMLElement;

	const featured = projects.filter((p) => p.featured).slice(0, 2);

	onMount(() => {
		const tl = createHeroRevealTimeline({ eyebrow, headline, subheadline, cta });
		tl.play();
	});
</script>

<svelte:head>
	<title>Kidus Dereje — ML Engineer & Builder</title>
	<meta name="description" content="Kidus Dereje Zewde — ML Engineer, researcher, and software builder. Computing Science + Economics at the University of Alberta." />
</svelte:head>

<main>
	<!-- ================================================
		HERO
	================================================ -->
	<section class="hero">
		<div class="hero__inner">
			<span bind:this={eyebrow} class="hero__eyebrow">ML Engineer · Researcher · Builder</span>

			<h1 bind:this={headline} class="hero__headline">
				<span class="line">Building intelligent</span>
				<span class="line">systems with</span>
				<span class="line hero__headline--accent">intention.</span>
			</h1>

			<p bind:this={subheadline} class="hero__sub">
				Computing Science + Economics student at the University of Alberta,
				ML Engineer at Scam AI, and published researcher in AI detection.
			</p>

			<div bind:this={cta} class="hero__cta">
				<a href="/work" class="btn btn--primary" use:cursorTarget={'hover'} use:magnetic>
					View my work
				</a>
				<a href="/blog" class="btn btn--ghost" use:cursorTarget={'hover'}>
					Read my writing
				</a>
			</div>
		</div>

		<!-- Ambient accent blob -->
		<div class="hero__blob" aria-hidden="true"></div>
	</section>

	<!-- ================================================
		SELECTED WORK TEASER
	================================================ -->
	<section class="selected">
		<div class="selected__inner">
			<div class="selected__header" use:revealOnScroll>
				<span class="label">Selected work</span>
				<a href="/work" class="selected__all" use:cursorTarget={'hover'}>View all →</a>
			</div>

			<div class="selected__grid">
				{#each featured as project, i}
					<a
						href="/work/{project.slug}"
						class="project-card"
						use:revealOnScroll={{ delay: i * 0.1 }}
						use:cursorTarget={'hover'}
					>
						<div class="project-card__thumb">
							<div class="project-card__placeholder"></div>
						</div>
						<div class="project-card__info">
							<span class="project-card__index">0{i + 1}</span>
							<div>
								<h3 class="project-card__title">{project.title}</h3>
								<p class="project-card__desc">{project.description}</p>
							</div>
							<span class="project-card__year">{project.year}</span>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>
</main>

<style>
	main {
		padding-top: 0;
	}

	/* ── Hero ─────────────────────────────────────── */
	.hero {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		padding: 0 var(--spacing-container);
		position: relative;
		overflow: hidden;
	}

	.hero__inner {
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
		padding-top: 6rem;
	}

	.hero__eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		font-size: var(--text-xs);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 2rem;

		&::before {
			content: '';
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: var(--accent);
			animation: pulse-accent 2s ease-in-out infinite;
		}
	}

	@keyframes pulse-accent {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.3; }
	}

	.hero__headline {
		font-size: var(--text-display);
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.03em;
		margin-bottom: 2rem;
	}

	.hero__headline .line {
		display: block;
	}

	.hero__headline--accent {
		color: var(--accent);
	}

	.hero__sub {
		font-size: var(--text-lg);
		color: var(--text-muted);
		max-width: 480px;
		line-height: 1.7;
		margin-bottom: 3rem;
	}

	.hero__cta {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.hero__blob {
		position: absolute;
		width: 600px;
		height: 600px;
		border-radius: 50%;
		background: radial-gradient(circle, var(--accent-dim) 0%, transparent 70%);
		top: 10%;
		right: -10%;
		pointer-events: none;
		filter: blur(80px);
		z-index: -1;
	}

	/* ── Buttons ──────────────────────────────────── */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.85rem 2rem;
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

	/* ── Selected work ────────────────────────────── */
	.selected {
		padding: var(--spacing-section) var(--spacing-container);
	}

	.selected__inner {
		max-width: 1400px;
		margin: 0 auto;
	}

	.selected__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 3rem;
	}

	.selected__all {
		font-size: var(--text-sm);
		color: var(--text-muted);
		transition: color 0.2s;

		&:hover {
			color: var(--accent);
		}
	}

	.label {
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.selected__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 480px), 1fr));
		gap: 1.5rem;
	}

	/* ── Project card ─────────────────────────────── */
	.project-card {
		display: block;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--surface);
		transition: border-color 0.3s, transform 0.4s var(--ease-out-expo);

		&:hover {
			border-color: var(--text-muted);
			transform: translateY(-4px);

			.project-card__thumb {
				transform: scale(1.03);
			}
		}
	}

	.project-card__thumb {
		aspect-ratio: 16/9;
		overflow: hidden;
		transition: transform 0.6s var(--ease-out-expo);
	}

	.project-card__placeholder {
		width: 100%;
		height: 100%;
		background: var(--surface-raised);
	}

	.project-card__info {
		display: flex;
		align-items: flex-start;
		gap: 1.5rem;
		padding: 1.5rem;
	}

	.project-card__index {
		font-size: var(--text-xs);
		color: var(--text-muted);
		font-feature-settings: 'tnum';
		margin-top: 0.1rem;
	}

	.project-card__title {
		font-size: var(--text-lg);
		font-weight: 500;
		margin-bottom: 0.25rem;
	}

	.project-card__desc {
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.project-card__year {
		font-size: var(--text-xs);
		color: var(--text-muted);
		margin-left: auto;
		margin-top: 0.1rem;
	}
</style>
