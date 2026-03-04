<script lang="ts">
	import { revealOnScroll } from '$lib/actions/revealOnScroll';
	import type { Publication } from '$lib/types/content';
	import PublicationModal from '$lib/components/ui/PublicationModal.svelte';
	import { gsap } from 'gsap';
	import { cursorTarget } from '$lib/actions/cursor';

	const experience = [
		{
			role: 'Founding Engineer',
			company: 'Scam AI',
			period: 'Jan 2025 – Present',
			bullets: [
				'Engineered a synthetic data generation pipeline using LangChain, ElevenLabs, and Qwen-MT to produce high-quality scam samples in <span class="bullet-accent">14 languages</span> for ML model training.',
				'Designed a multi-agent AI system using Deepgram, LiveKit, FastAPI, and a fine-tuned OpenAI 4.1 model to transcribe and score potential scam calls, achieving <span class="bullet-accent">80% success rate</span>.',
				'Developed an agentic SMS scam detection API using FastAPI and a fine-tuned Qwen3.2-32B model via LangChain for adaptive real-time detection.',
				'Implemented CAM visualization for a deepfake detection model using PyTorch and EfficientNet to produce <span class="bullet-accent">interpretable AI tampering heatmaps</span>.'
			]
		},
		{
			role: 'Service Desk Assistant',
			company: 'University of Alberta',
			period: 'May 2025 – Present',
			bullets: [
				'Primary point of contact for <span class="bullet-accent">4,000+ residents</span>, resolving high volumes of in-person and telephone inquiries regarding housing policies and maintenance.',
				'Managed daily operations using StarRez software to process check-ins/outs, occupancy records, and maintenance tickets with <span class="bullet-accent">100% data accuracy</span>.',
				'Assisted students with financial accounts — residence fees, rent schedules, and penalty charges — while auditing files for billing compliance.'
			]
		},
		{
			role: 'Machine Learning Intern',
			company: 'Avolta Inc.',
			period: 'Oct 2023 – Jan 2024',
			bullets: [
				'Fine-tuned a pre-trained YOLOv5 object detection model on a specialized car theft dataset, increasing accuracy by <span class="bullet-accent">20%</span>.',
				'Engineered ETL pipelines for ML data ingestion, streamlining feature processing for continuous model training and evaluation.',
				'Implemented automated data validation and augmentation scripts to ensure <span class="bullet-accent">high-quality, consistent data streams</span>.'
			]
		}
	];

	const publications: Publication[] = [
		{
			title: 'Do Deepfake Detectors Work in Reality?',
			venue: 'ACM',
			year: '2025',
			url: 'https://arxiv.org/abs/2502.10920',
			officialUrl: 'https://dl.acm.org/doi/10.1145/3709022.3736545',
			bullets: [
				'Investigated the vulnerability of deepfake detection methods to real-world data manipulations, particularly super-resolution post-processing.',
				'Contributed to the creation of a novel real-world faceswap dataset to benchmark deepfake detectors in practical settings.'
			]
		},
		{
			title: 'Can Multi-modal (reasoning) LLMs work as deepfake detectors?',
			venue: 'arXiv preprint',
			year: '2025',
			url: 'https://arxiv.org/abs/2503.20084',
			bullets: [
				'Benchmarked 12 state-of-the-art multi-modal LLMs (including GPT-4o, Gemini 2, Claude 3.7) for zero-shot deepfake detection across multiple datasets.',
				'Conducted ablation studies investigating the impact of model size, version updates, and reasoning capabilities on detection performance.',
				'Analyzed failure modes and interpretability through score distribution analysis and reasoning pathway examination.'
			]
		},
		{
			title: 'Can Multi-modal (reasoning) LLMs detect document manipulation?',
			venue: 'arXiv preprint',
			year: '2025',
			url: 'https://arxiv.org/abs/2508.11021',
			bullets: [
				'Benchmarked GPT-4o, Gemini, and Llama 3.2 for detecting document fraud across diverse forgery types.',
				'Demonstrated that top-performing LLMs show superior zero-shot generalization over traditional SVM and CNN baselines for out-of-distribution forgeries.',
				'Revealed that model size and advanced reasoning show limited correlation with detection accuracy, while providing interpretable and scalable fraud mitigation.'
			]
		},
		{
			title: 'How well are open-source AI-generated image detection models out-of-the-box?',
			venue: 'arXiv preprint',
			year: '2026',
			url: 'https://arxiv.org/abs/2602.07814',
			bullets: [
				'Led the first large-scale zero-shot benchmark of AI-generated image detectors: 23 pretrained models, 12 datasets, 2.6 million image samples.',
				'Identified critical generalization gaps — detector performance is highly context-dependent (Spearman ρ as low as 0.01) and training data alignment outweighs architecture.',
				'Developed deployment guidelines showing that modern generators (Midjourney, Flux) frequently defeat existing detectors, with a framework for threat-specific model selection.'
			]
		}
	];

	let tooltipEl: HTMLSpanElement | undefined = $state();
	let tooltipTl: gsap.core.Timeline | null = null;

	function showTooltip() {
		if (!tooltipEl) return;
		tooltipTl?.kill();
		tooltipTl = gsap.timeline();
		tooltipTl.fromTo(
			tooltipEl,
			{ opacity: 0, y: 8, scale: 0.93 },
			{ opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.4)', transformOrigin: 'bottom left' }
		);
	}

	function hideTooltip() {
		if (!tooltipEl) return;
		tooltipTl?.kill();
		tooltipTl = gsap.timeline();
		tooltipTl.to(tooltipEl, {
			opacity: 0,
			y: 6,
			scale: 0.93,
			duration: 0.18,
			ease: 'power2.in',
			transformOrigin: 'bottom left'
		});
	}

	const skills = [
		{
			category: 'Languages',
			items: ['Python', 'TypeScript / JavaScript', 'Java', 'C / C++', 'SQL', 'Swift', 'R']
		},
		{
			category: 'Frameworks',
			items: ['React / Next.js', 'SvelteKit', 'Django / FastAPI', 'PyTorch', 'TensorFlow', 'scikit-learn']
		},
		{
			category: 'ML / Data',
			items: ['NumPy / Pandas', 'HuggingFace', 'OpenCV', 'Gemini API', 'RAG Pipelines', 'Matplotlib']
		},
		{
			category: 'Databases',
			items: ['PostgreSQL', 'Firebase', 'MongoDB', 'MySQL', 'Prisma', 'Supabase']
		},
		{
			category: 'DevOps',
			items: ['Docker', 'AWS (Lambda, S3, Bedrock)', 'GitHub Actions', 'Vercel', 'Git']
		}
	];
</script>

<svelte:head>
	<title>About — Kidus Dereje</title>
	<meta name="description" content="About Kidus Dereje Zewde — ML Engineer, researcher, and Computing Science student at the University of Alberta." />
</svelte:head>

<main class="about-page">
	<div class="about-page__inner">

		<!-- Bio -->
		<section class="about-bio" use:revealOnScroll>
			<span class="label">About</span>
			<h1 class="about-bio__heading">
				Building at the intersection of
				<em>machine learning and software engineering.</em>
			</h1>
			<div class="about-bio__body">
				<p>
					<!-- svelte-ignore a11y_interactive_supports_focus -->
					<span
						class="selam-wrap"
						role="button"
						tabindex="0"
						use:cursorTarget={'hover'}
						onmouseenter={showTooltip}
						onmouseleave={hideTooltip}
						onfocus={showTooltip}
						onblur={hideTooltip}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') showTooltip();
							else if (e.key === 'Escape') hideTooltip();
						}}
					><span class="bio-highlight">ሰላም</span><span
							bind:this={tooltipEl}
							class="selam-tooltip"
							role="tooltip"
							aria-hidden="true"
						>In the Amharic language, <strong class="selam-hl">ሰላም</strong> (pronounced sälam) means <strong class="selam-hl">Peace</strong>. It is the standard way of greeting someone in Ethiopia and Eritrea.</span></span> and Hello! I'm Kidus Dereje Zewde — a Computing Science + Economics
					student at <span class="bio-highlight">University of Alberta</span> (graduating June 2026), currently
					working as a Founding Engineer at
					<a href="https://www.scam.ai/en" target="_blank" rel="noopener noreferrer" class="accent-link">Scam AI</a>.
					My work sits at the boundary between research and production: I've published
					4 papers on deepfake and AI-generated content detection, and I build systems
					that put those ideas into practice.
				</p>
				<p>
					I care about the full stack — from model architecture to user-facing product — and
					I'm drawn to problems where <span class="bio-highlight">rigorous engineering</span> and <span class="bio-highlight">creative thinking</span> both matter.
				</p>
			</div>
		</section>

		<!-- Education -->
		<section class="about-section" use:revealOnScroll>
			<h2 class="about-section__title">Education</h2>
			<div class="edu-card">
				<div class="edu-card__left">
					<span class="edu-card__degree">BSc Computing Science + Economics Minor</span>
					<span class="edu-card__cert">with additional Certificate in Innovation and Entrepreneurship</span>
					<span class="edu-card__school">University of Alberta</span>
				</div>
				<span class="edu-card__period">Expected June 2026</span>
			</div>
		</section>

		<!-- Experience -->
		<section class="about-section" use:revealOnScroll>
			<h2 class="about-section__title">Experience</h2>
			<div class="timeline">
				{#each experience as job, i}
					<div class="timeline__item" use:revealOnScroll={{ delay: i * 0.08 }}>
						<div class="timeline__header">
							<div>
								<span class="timeline__role">{job.role}</span>
								<span class="timeline__company">{job.company}</span>
							</div>
							<span class="timeline__period">{job.period}</span>
						</div>
						<ul class="timeline__bullets">
							{#each job.bullets as bullet}
								<li>{@html bullet}</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</section>

		<!-- Publications -->
		<section class="about-section" use:revealOnScroll>
			<h2 class="about-section__title">Publications</h2>
			<div class="pub-list">
				{#each publications as pub, i}
					<div use:revealOnScroll={{ delay: i * 0.06 }}>
						<PublicationModal {pub} index={i} />
					</div>
				{/each}
			</div>
		</section>

		<!-- Skills -->
		<section class="about-section about-skills" use:revealOnScroll>
			<h2 class="about-section__title">Skills</h2>
			<div class="about-skills__grid">
				{#each skills as group, i}
					<div class="skill-group" use:revealOnScroll={{ delay: i * 0.07 }}>
						<h3 class="skill-group__category">{group.category}</h3>
						<ul class="skill-group__list">
							{#each group.items as item}
								<li>{item}</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</section>

	</div>
</main>

<style>
	.about-page {
		padding: 8rem var(--spacing-container) var(--spacing-section);
	}

	.about-page__inner {
		max-width: 1000px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-section);
	}

	.label {
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent);
		display: block;
		margin-bottom: 1.5rem;
	}

	/* ── Section shared ────────────────────────── */
	.about-section {
		padding-top: 1rem;
		border-top: 1px solid var(--border);
	}

	.about-section__title {
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 2rem;
	}

	/* ── Bio ────────────────────────────────────── */
	.about-bio__heading {
		font-size: var(--text-3xl);
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.15;
		margin-bottom: 2.5rem;

		em {
			font-style: normal;
			color: var(--accent);
		}
	}

	.about-bio__body {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-width: 640px;

		p {
			font-size: var(--text-lg);
			color: var(--text-muted);
			line-height: 1.75;
		}
	}

	.bio-highlight {
		color: var(--accent);
	}

	/* ── Education ─────────────────────────────── */
	.edu-card {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 2rem;
		padding: 1.5rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);

		@media (max-width: 640px) {
			flex-direction: column;
		}
	}

	.edu-card__left {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.edu-card__degree {
		font-size: var(--text-base);
		font-weight: 500;
		color: var(--text);
		width: fit-content;
		background-image: linear-gradient(var(--accent), var(--accent));
		background-repeat: no-repeat;
		background-position: 0 100%;
		background-size: 0% 1px;
		transition: background-size 0.3s var(--ease-out-expo);
	}

	.edu-card__cert {
		font-size: var(--text-xs);
		color: var(--text-muted);
		width: fit-content;
		background-image: linear-gradient(var(--accent), var(--accent));
		background-repeat: no-repeat;
		background-position: 0 100%;
		background-size: 0% 1px;
		transition: background-size 0.3s var(--ease-out-expo);
	}

	.edu-card:hover .edu-card__degree,
	.edu-card:hover .edu-card__cert {
		background-size: 100% 1px;
	}

	.edu-card__school {
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.edu-card__period {
		font-size: var(--text-sm);
		color: var(--accent);
		white-space: nowrap;
	}

	/* ── Timeline ──────────────────────────────── */
	.timeline {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.timeline__item {
		padding-left: 1.5rem;
		border-left: 2px solid var(--border);
	}

	.timeline__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.5rem;
		margin-bottom: 0.75rem;

		@media (max-width: 640px) {
			flex-direction: column;
			gap: 0.25rem;
		}
	}

	.timeline__role {
		display: block;
		font-size: var(--text-base);
		font-weight: 500;
		color: var(--text);
		margin-bottom: 0.2rem;
		width: fit-content;
		background-image: linear-gradient(var(--accent), var(--accent));
		background-repeat: no-repeat;
		background-position: 0 100%;
		background-size: 0% 1px;
		transition: background-size 0.3s var(--ease-out-expo);
	}

	.timeline__item:hover .timeline__role {
		background-size: 100% 1px;
	}

	.timeline__company {
		display: block;
		font-size: var(--text-sm);
		color: var(--accent);
	}

	.timeline__period {
		font-size: var(--text-xs);
		color: var(--text-muted);
		white-space: nowrap;
		letter-spacing: 0.04em;
		margin-top: 0.2rem;
	}

	.timeline__bullets {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;

		li {
			font-size: var(--text-sm);
			color: var(--text-muted);
			line-height: 1.65;
			padding-left: 1rem;
			position: relative;

			&::before {
				content: '–';
				position: absolute;
				left: 0;
				color: var(--text-muted);
			}
		}
	}

	:global(.bullet-accent) {
		color: var(--accent);
		font-weight: 500;
	}

	/* ── Publications ──────────────────────────── */
	.pub-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* ── Skills ─────────────────────────────────── */
	.about-skills__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 2.5rem;
	}

	.skill-group__category {
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 1.25rem;
	}

	.skill-group__list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;

		li {
			font-size: var(--text-sm);
			color: var(--text);
		}
	}

	/* ── Selam tooltip ──────────────────────────────── */
	.selam-wrap {
		position: relative;
		display: inline-block;
		cursor: none;
	}

	.selam-tooltip {
		position: absolute;
		bottom: calc(100% + 10px);
		left: 0;
		width: 280px;
		padding: 0.875rem 1rem;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		line-height: 1.65;
		font-weight: 400;
		font-style: normal;
		pointer-events: none;
		opacity: 0;
		z-index: 10;
		white-space: normal;

		/* Dark mode (default) */
		background: rgb(255, 255, 255, 1);
		border: 3px solid var(--accent);
		color: rgba(35, 35, 37, 0.9);
	}

	:global([data-theme='light']) .selam-tooltip {
		background: rgba(43, 92, 230, 1);
		border-color: 3px solid var(--accent);
		color: rgba(255, 255, 255, 0.92);
	}

	.selam-hl {
		color: var(--accent);
		font-weight: 700;
		font-style: normal;
	}

	:global([data-theme='light']) .selam-hl {
		color: #F05924;
		font-weight: 700;
	}

	@media (max-width: 640px) {
		.selam-tooltip {
			display: none;
		}
	}

</style>
