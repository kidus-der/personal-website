<script lang="ts">
	import { onMount } from 'svelte';
	import { createHeroRevealTimeline } from '$lib/animation/timelines/heroReveal';
	import { revealOnScroll } from '$lib/actions/revealOnScroll';
	import { cursorTarget } from '$lib/actions/cursor';
	import { magnetic } from '$lib/actions/magnetic';
	import { projects } from '$content/projects';
	import { themeStore } from '$lib/stores/theme';
	import SEO from '$lib/components/ui/SEO.svelte';
	import VantaBackground from '$lib/components/animation/VantaBackground.svelte';
	import ContactModal from '$lib/components/ui/ContactModal.svelte';

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

<SEO
	title="Kidus Dereje"
	description="Kidus Dereje Zewde — Founding Engineer, researcher, and software builder. Computing Science + Economics at the University of Alberta."
/>

<main>
	<!-- ================================================
		HERO
	================================================ -->
	<section class="hero">
		<VantaBackground effect="GLOBE" interactive={true} />
		<div class="hero__inner">
			<div class="hero__content">
				<span bind:this={eyebrow} class="hero__eyebrow"><span class="hero__eyebrow-name">Kidus: </span>ML Engineer · Researcher · Builder</span>

				<h1 bind:this={headline} class="hero__headline">
					<span class="line">Building intelligent</span>
					<span class="line">systems with</span>
					<span class="line hero__headline--accent">intention.</span>
				</h1>

				<p bind:this={subheadline} class="hero__sub">
					Founding Engineer at <a href="https://www.scam.ai/en" target="_blank" rel="noopener noreferrer" class="accent-link">Scam AI</a>,
					Computing Science + Economics student at the University of Alberta,
					and a published <a href="https://scholar.google.com/citations?hl=en&user=t-5ck6wAAAAJ" target="_blank" rel="noopener noreferrer" class="accent-link">researcher</a> and lover of all things AI and ML.
				</p>

				<div bind:this={cta} class="hero__cta">
					<div class="hero__cta-buttons">
						<a href="/work" class="btn btn--primary" use:cursorTarget={'hover'} use:magnetic>
							View my work
						</a>
						<a href="/blog" class="btn btn--ghost" use:cursorTarget={'hover'}>
							Read my Blog
						</a>
					</div>
					<div class="hero__socials">
						<a href="https://github.com/kidus-der" target="_blank" rel="noopener noreferrer"
						   class="hero__social-link" use:cursorTarget={'hover'} use:magnetic aria-label="GitHub">
							<img
							src={$themeStore === 'dark'
								? '/icons/github/GitHub_Invertocat_White.svg'
								: '/icons/github/GitHub_Invertocat_Black.svg'}
							alt="GitHub"
							class="hero__social-icon"
						/>
						</a>
						<a href="https://www.linkedin.com/in/kidus-dereje-zewde-804424241/" target="_blank" rel="noopener noreferrer"
						   class="hero__social-link" use:cursorTarget={'hover'} use:magnetic aria-label="LinkedIn">
							<img src="/icons/linkedin.svg" alt="LinkedIn" class="hero__social-icon" />
						</a>
						<a href="https://scholar.google.com/citations?hl=en&user=t-5ck6wAAAAJ" target="_blank" rel="noopener noreferrer"
						   class="hero__social-link" use:cursorTarget={'hover'} use:magnetic aria-label="Google Scholar">
							<img src="/icons/google-scholar-icon.svg" alt="Google Scholar" class="hero__social-icon" />
						</a>
					</div>
				</div>
			</div>
		</div>

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
							{#if project.images[0]}
								<img src={project.images[0]} alt={project.title} class="project-card__img" />
							{:else}
								<div class="project-card__placeholder"></div>
							{/if}
						</div>
						<div class="project-card__info">
							<span class="project-card__index">0{i + 1}</span>
							<div>
								<h3 class="project-card__title" data-text={project.title}>{project.title}</h3>
								<p class="project-card__desc">{project.description}</p>
							</div>
							<span class="project-card__year">{project.year}</span>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- ================================================
		CTA
	================================================ -->
	<section class="cta" use:revealOnScroll>
		<div class="cta__inner">
			<h2 class="cta__heading">Let's build something.</h2>
			<p class="cta__sub">
				Open to interesting research collaborations and any other opportunities!
			</p>
			<ContactModal />
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
		position: relative;
		z-index: 1;
	}

	.hero__content {
		max-width: 640px;
	}

	.hero__eyebrow-name {
		color: var(--accent);
	}

	.hero__eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		font-size: calc(var(--text-xs) * 1.4);
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
		font-size: calc(var(--text-display) * 1.2);
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
		font-size: calc(var(--text-lg) * 1.2);
		color: var(--text-muted);
		max-width: 480px;
		line-height: 1.7;
		margin-bottom: 3rem;
	}

	.hero__cta {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1.25rem;
	}

	.hero__cta-buttons {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.hero__socials {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.hero__social-link {
		display: block;
		border-radius: var(--radius-sm);
		transition: opacity 0.2s, transform 0.2s var(--ease-out-expo);
	}

	.hero__social-link:hover {
		opacity: 0.8;
		transform: translateY(-2px);
	}

	.hero__social-icon {
		display: block;
		height: 2.75rem;
		width: 2.75rem;
		object-fit: contain;
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
		border-color: var(--accent);
		color: var(--accent);
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

	.project-card__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
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
		position: relative;
	}

	.project-card__title::after {
		content: attr(data-text);
		position: absolute;
		inset: 0;
		color: var(--accent);
		clip-path: inset(100% 0 0 0);
		transition: clip-path 0.35s var(--ease-out-expo);
		pointer-events: none;
	}

	.project-card:hover .project-card__title::after {
		clip-path: inset(0% 0 0 0);
	}

	.project-card__desc {
		font-size: var(--text-sm);
		color: var(--text-muted);
		text-decoration: underline;
		text-decoration-color: transparent;
		text-underline-offset: 3px;
		text-decoration-thickness: 1px;
		transition: text-decoration-color 0.3s var(--ease-out-expo);
	}

	.project-card:hover .project-card__desc {
		text-decoration-color: var(--accent);
	}

	.project-card__year {
		font-size: var(--text-xs);
		color: var(--text-muted);
		margin-left: auto;
		margin-top: 0.1rem;
	}

	/* ── CTA ──────────────────────────────────────── */
	.cta {
		padding: var(--spacing-section) var(--spacing-container);
		border-top: 1px solid var(--border);
	}

	.cta__inner {
		max-width: 1400px;
		margin: 0 auto;
	}

	.cta__heading {
		font-size: var(--text-3xl);
		font-weight: 600;
		letter-spacing: -0.03em;
		margin-bottom: 1rem;
	}

	.cta__sub {
		font-size: var(--text-lg);
		color: var(--text-muted);
		max-width: 480px;
		line-height: 1.7;
		margin-bottom: 2.5rem;
	}
</style>
