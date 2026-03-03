# Site Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Overhaul theme colors, fix all content data, add an animated glassmorphism publication popup, and move the CTA to the home page — all on a feature branch.

**Architecture:** Four independent task groups committed separately. The publication modal is a self-contained Svelte 5 component that owns its open/close state and uses GSAP for spring animations. No global store needed — each `PublicationModal` instance manages its own visibility with `$state`. The modal uses `position: fixed` to escape layout stacking contexts.

**Tech Stack:** SvelteKit 2 + Svelte 5 (runes mode), TypeScript, GSAP, Tailwind v4 + CSS custom properties. Verification: `pnpm check` (0 errors required after each task).

---

## Task 1: Create feature branch

**Files:** none

**Step 1: Create and switch to feature branch**

```bash
git checkout -b feature/site-improvements
```

**Step 2: Verify you're on the branch**

```bash
git branch
# Expected: * feature/site-improvements
```

---

## Task 2: Theme — update color tokens

**Files:**
- Modify: `src/styles/app.css`

**Step 1: Replace the dark mode accent**

Find the dark mode block (`[data-theme="dark"], :root { ... }`) and change:
```css
/* BEFORE */
--accent: #e8ff47;
--accent-dim: rgba(232, 255, 71, 0.15);

/* AFTER */
--accent: #F05924;
--accent-dim: rgba(240, 89, 36, 0.15);
```

**Step 2: Replace the entire light mode block**

Find `[data-theme="light"] { ... }` and replace the full block with:
```css
[data-theme="light"] {
	--bg: #ffffff;
	--surface: #f4f6ff;
	--surface-raised: #eef1ff;
	--border: rgba(43, 92, 230, 0.12);
	--text: #0a0a0a;
	--text-muted: rgba(10, 10, 10, 0.5);
	--accent: #2B5CE6;
	--accent-dim: rgba(43, 92, 230, 0.10);
}
```

**Step 3: Run check**

```bash
pnpm check
# Expected: 0 errors, 0 warnings
```

**Step 4: Commit**

```bash
git add src/styles/app.css
git commit -m "feat: update theme colors — orange-red dark accent, royal blue light"
```

---

## Task 3: Content fixes — projects list

**Files:**
- Modify: `src/content/projects/index.ts`

**Step 1: Remove three projects and promote ELEVENT**

Replace the entire file content with:
```ts
import type { Project } from '$lib/types/content';

export const projects: Project[] = [
	{
		slug: 'coeus-ai',
		title: 'Coeus AI',
		description: 'AI-powered educational assistant with adaptive learning and real-time tutoring.',
		longDescription:
			'Full-stack educational AI assistant built with Next.js and Gemini 2.5 Flash. Features adaptive learning paths, real-time tutoring sessions, and personalized study plans powered by a RAG pipeline over course materials.',
		tags: ['Next.js', 'Gemini API', 'NextAuth', 'Prisma', 'PostgreSQL'],
		year: 2025,
		githubUrl: 'https://github.com/kidus-der/coeus-ai',
		images: [],
		featured: true
	},
	{
		slug: 'elevent',
		title: 'ELEVENT',
		description: 'Android event management app with real-time Firebase backend and QR code check-in.',
		longDescription:
			'Native Android application for event organizers and attendees. Supports event creation, QR-based check-in, real-time attendee tracking via Firebase, and geo-located event discovery through the Google Maps API.',
		tags: ['Java', 'Android', 'Firebase', 'Google Maps API'],
		year: 2024,
		githubUrl: 'https://github.com/kidus-der/Elevent',
		images: [],
		featured: true
	},
	{
		slug: 'poseidon-wildfire',
		title: 'Poseidon Wildfire Solution',
		description: 'AWS-powered wildfire detection system — 2nd place at the AWS Generative AI Hackathon.',
		longDescription:
			'Serverless wildfire detection pipeline built on AWS Lambda, S3, and Bedrock. Ingests satellite imagery, runs generative AI analysis to identify fire risk zones, and delivers real-time alerts. Placed 2nd at the AWS Generative AI Hackathon.',
		tags: ['AWS Lambda', 'AWS S3', 'AWS Bedrock', 'Python'],
		year: 2024,
		githubUrl: 'https://github.com/kidus-der/Poseidon-AWSHackathon',
		images: [],
		featured: false
	}
];
```

**Step 2: Run check**

```bash
pnpm check
# Expected: 0 errors
```

**Step 3: Commit**

```bash
git add src/content/projects/index.ts
git commit -m "feat: trim projects list to 3, promote ELEVENT as featured"
```

---

## Task 4: Content fixes — about page experience + hero subheadline

**Files:**
- Modify: `src/routes/(portfolio)/about/+page.svelte`
- Modify: `src/routes/(portfolio)/+page.svelte`

**Step 1: Fix experience array in about/+page.svelte**

Replace the entire `experience` array in the `<script>` block. It currently has 4 entries; replace with these 3 (correct titles + CV-accurate bullets, last entry removed):

```ts
const experience = [
	{
		role: 'Founding Engineer',
		company: 'Scam AI',
		period: 'Jan 2025 – Present',
		bullets: [
			'Engineered a synthetic data generation pipeline using LangChain, ElevenLabs, and Qwen-MT to produce high-quality scam samples in 14 languages for ML model training.',
			'Designed a multi-agent AI system using Deepgram, LiveKit, FastAPI, and a fine-tuned OpenAI 4.1 model to transcribe and score potential scam calls, achieving 80% success rate.',
			'Developed an agentic SMS scam detection API using FastAPI and a fine-tuned Qwen3.2-32B model via LangChain for adaptive real-time detection.',
			'Implemented CAM visualization for a deepfake detection model using PyTorch and EfficientNet to produce interpretable AI tampering heatmaps.'
		]
	},
	{
		role: 'Service Desk Assistant',
		company: 'University of Alberta',
		period: 'May 2025 – Present',
		bullets: [
			'Primary point of contact for 4,000+ residents, resolving high volumes of in-person and telephone inquiries regarding housing policies and maintenance.',
			'Managed daily operations using StarRez software to process check-ins/outs, occupancy records, and maintenance tickets with 100% data accuracy.',
			'Assisted students with financial accounts — residence fees, rent schedules, and penalty charges — while auditing files for billing compliance.'
		]
	},
	{
		role: 'Machine Learning Intern',
		company: 'Avolta Inc.',
		period: 'Oct 2023 – Jan 2024',
		bullets: [
			'Fine-tuned a pre-trained YOLOv5 object detection model on a specialized car theft dataset, increasing accuracy by 20%.',
			'Engineered ETL pipelines for ML data ingestion, streamlining feature processing for continuous model training and evaluation.',
			'Implemented automated data validation and augmentation scripts to ensure high-quality, consistent data streams.'
		]
	}
];
```

**Step 2: Also update the bio paragraph** in the same file — change "currently working as an ML Engineer at Scam AI" to "currently working as a Founding Engineer at Scam AI":

Find:
```svelte
of Alberta (graduating June 2026), currently working as an ML Engineer at Scam AI.
```
Replace with:
```svelte
of Alberta (graduating June 2026), currently working as a Founding Engineer at Scam AI.
```

**Step 3: Update home page subheadline in +page.svelte**

Find:
```svelte
ML Engineer at Scam AI, and published researcher in AI detection.
```
Replace with:
```svelte
Founding Engineer at Scam AI, and published researcher in AI detection.
```

**Step 4: Run check**

```bash
pnpm check
# Expected: 0 errors
```

**Step 5: Commit**

```bash
git add src/routes/(portfolio)/about/+page.svelte src/routes/(portfolio)/+page.svelte
git commit -m "feat: fix experience data — Founding Engineer title, 3 real entries"
```

---

## Task 5: Add Publication type to content types

**Files:**
- Modify: `src/lib/types/content.ts`

**Step 1: Add Publication interface**

Append to the end of `src/lib/types/content.ts`:

```ts
export interface Publication {
	title: string;
	venue: string;
	year: string;
	url: string;
	bullets: string[];
}
```

**Step 2: Run check**

```bash
pnpm check
# Expected: 0 errors
```

**Step 3: Commit**

```bash
git add src/lib/types/content.ts
git commit -m "feat: add Publication type with url and bullets fields"
```

---

## Task 6: Update publications data in about page

**Files:**
- Modify: `src/routes/(portfolio)/about/+page.svelte`

**Step 1: Add Publication import and replace publications array**

At the top of the `<script>` block, add the import:
```ts
import type { Publication } from '$lib/types/content';
```

Replace the entire `publications` array with (typed + real data from CV):
```ts
const publications: Publication[] = [
	{
		title: 'Do Deepfake Detectors Work in Reality?',
		venue: 'IEEE (submitted for review)',
		year: '2025',
		url: 'https://arxiv.org/abs/2502.10920',
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
```

**Step 2: Run check**

```bash
pnpm check
# Expected: 0 errors
```

**Step 3: Commit**

```bash
git add src/routes/(portfolio)/about/+page.svelte
git commit -m "feat: update publications with real titles, arXiv URLs, and bullet points"
```

---

## Task 7: Build PublicationModal component

**Files:**
- Create: `src/lib/components/ui/PublicationModal.svelte`

**Step 1: Create the component**

Create `src/lib/components/ui/PublicationModal.svelte` with this full content:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from '$lib/animation/gsap.config';
	import type { Publication } from '$lib/types/content';

	interface Props {
		pub: Publication;
		index: number;
	}

	let { pub, index }: Props = $props();

	let open = $state(false);
	let overlayEl: HTMLDivElement;
	let cardEl: HTMLDivElement;
	let bulletEls: HTMLLIElement[] = [];

	let openTl: gsap.core.Timeline | null = null;

	function openModal() {
		open = true;
		// Tick needed for the DOM to render before animating
		setTimeout(() => {
			if (!overlayEl || !cardEl) return;
			openTl = gsap.timeline();
			openTl
				.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' })
				.fromTo(
					cardEl,
					{ opacity: 0, scale: 0.85, y: 20 },
					{ opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.4)' },
					'<0.05'
				)
				.fromTo(
					bulletEls,
					{ opacity: 0, y: 12 },
					{ opacity: 1, y: 0, duration: 0.3, stagger: 0.07, ease: 'power2.out' },
					'-=0.15'
				);
		}, 0);
	}

	function closeModal() {
		if (!overlayEl || !cardEl) return;
		gsap
			.timeline({
				onComplete: () => {
					open = false;
				}
			})
			.to(cardEl, { opacity: 0, scale: 0.9, y: 10, duration: 0.25, ease: 'power2.in' })
			.to(overlayEl, { opacity: 0, duration: 0.25, ease: 'power2.in' }, '<');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) closeModal();
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<!-- Trigger button -->
<button class="pub-trigger" onclick={openModal} aria-haspopup="dialog">
	<div class="pub-trigger__inner">
		<div class="pub-trigger__text">
			<p class="pub-trigger__title">{pub.title}</p>
			<span class="pub-trigger__meta">{pub.venue} · {pub.year}</span>
		</div>
		<span class="pub-trigger__cta">View →</span>
	</div>
</button>

<!-- Modal -->
{#if open}
	<div
		bind:this={overlayEl}
		class="modal-overlay"
		role="presentation"
		onclick={closeModal}
	>
		<div
			bind:this={cardEl}
			class="modal-card"
			role="dialog"
			aria-modal="true"
			aria-label={pub.title}
			onclick={(e) => e.stopPropagation()}
		>
			<button class="modal-close" onclick={closeModal} aria-label="Close">×</button>

			<span class="modal-label">Publication</span>

			<h2 class="modal-title">{pub.title}</h2>

			<a
				href={pub.url}
				target="_blank"
				rel="noopener noreferrer"
				class="modal-link"
			>
				Read on arXiv →
			</a>

			<hr class="modal-divider" />

			<ul class="modal-bullets">
				{#each pub.bullets as bullet, i}
					<li bind:this={bulletEls[i]}>{bullet}</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}

<style>
	/* ── Trigger ──────────────────────────────────── */
	.pub-trigger {
		width: 100%;
		text-align: left;
		padding: 1.5rem 0;
		border-bottom: 1px solid var(--border);
		transition: border-color 0.2s;
		cursor: pointer;
		font-family: inherit;
	}

	.pub-trigger:last-of-type {
		border-bottom: none;
	}

	.pub-trigger:hover {
		border-color: var(--accent);
	}

	.pub-trigger:hover .pub-trigger__title {
		color: var(--accent);
	}

	.pub-trigger:hover .pub-trigger__cta {
		opacity: 1;
		transform: translateX(0);
	}

	.pub-trigger__inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
	}

	.pub-trigger__text {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.pub-trigger__title {
		font-size: var(--text-base);
		color: var(--text);
		line-height: 1.6;
		transition: color 0.2s;
	}

	.pub-trigger__meta {
		font-size: var(--text-xs);
		color: var(--text-muted);
		letter-spacing: 0.04em;
	}

	.pub-trigger__cta {
		font-size: var(--text-sm);
		color: var(--accent);
		white-space: nowrap;
		opacity: 0;
		transform: translateX(-6px);
		transition: opacity 0.2s, transform 0.2s var(--ease-out-expo);
		flex-shrink: 0;
	}

	/* ── Modal overlay ──────────────────────────── */
	.modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(0, 0, 0, 0.6);
	}

	/* ── Glass card ─────────────────────────────── */
	.modal-card {
		position: relative;
		width: 100%;
		max-width: 640px;
		max-height: 90dvh;
		overflow-y: auto;
		padding: 2.5rem;
		border-radius: var(--radius-lg);
		background: rgba(17, 17, 17, 0.82);
		backdrop-filter: blur(24px) saturate(180%);
		-webkit-backdrop-filter: blur(24px) saturate(180%);
		border: 1px solid rgba(255, 255, 255, 0.10);
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);

		:global([data-theme="light"]) & {
			background: rgba(244, 246, 255, 0.88);
			border: 1px solid rgba(43, 92, 230, 0.15);
			box-shadow: 0 24px 60px rgba(0, 0, 0, 0.15);
		}
	}

	.modal-close {
		position: absolute;
		top: 1.25rem;
		right: 1.25rem;
		font-size: 1.25rem;
		color: var(--text-muted);
		line-height: 1;
		transition: color 0.2s;
		font-family: inherit;
		cursor: pointer;

		&:hover {
			color: var(--text);
		}
	}

	.modal-label {
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent);
		display: block;
		margin-bottom: 0.875rem;
	}

	.modal-title {
		font-size: var(--text-xl);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.3;
		color: var(--text);
		margin-bottom: 1.5rem;
		padding-right: 2rem;
	}

	.modal-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1.4rem;
		background: var(--accent);
		color: var(--bg);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: 500;
		letter-spacing: 0.04em;
		transition: transform 0.2s var(--ease-out-expo), opacity 0.2s;
		margin-bottom: 1.75rem;

		&:hover {
			transform: translateY(-2px);
			opacity: 0.9;
		}
	}

	.modal-divider {
		border: none;
		border-top: 1px solid var(--border);
		margin-bottom: 1.5rem;
	}

	.modal-bullets {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;

		li {
			font-size: var(--text-sm);
			color: var(--text-muted);
			line-height: 1.7;
			padding-left: 1.25rem;
			position: relative;

			&::before {
				content: '→';
				position: absolute;
				left: 0;
				color: var(--accent);
				font-size: 0.75em;
				top: 0.2em;
			}
		}
	}
</style>
```

**Step 2: Run check**

```bash
pnpm check
# Expected: 0 errors
```

**Step 3: Commit**

```bash
git add src/lib/components/ui/PublicationModal.svelte
git commit -m "feat: add PublicationModal component with GSAP glassmorphism animation"
```

---

## Task 8: Wire PublicationModal into about page

**Files:**
- Modify: `src/routes/(portfolio)/about/+page.svelte`

**Step 1: Add import to script block**

Add to the imports at the top of `<script>`:
```ts
import PublicationModal from '$lib/components/ui/PublicationModal.svelte';
```

**Step 2: Replace the publications section markup**

Find the `<!-- Publications -->` section in the template:
```svelte
<!-- Publications -->
<section class="about-section" use:revealOnScroll>
	<h2 class="about-section__title">Publications</h2>
	<div class="pub-list">
		{#each publications as pub, i}
			<div class="pub-item" use:revealOnScroll={{ delay: i * 0.06 }}>
				<p class="pub-item__title">{pub.title}</p>
				<span class="pub-item__meta">{pub.venue} · {pub.year}</span>
			</div>
		{/each}
	</div>
</section>
```

Replace with:
```svelte
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
```

**Step 3: Remove the now-unused `.pub-item` and `.pub-item__title`/`.pub-item__meta` CSS rules** from the `<style>` block in `about/+page.svelte` (the modal owns its own styles now):

Find and delete these CSS blocks:
```css
.pub-item { ... }
.pub-item__title { ... }
.pub-item__meta { ... }
```

**Step 4: Run check**

```bash
pnpm check
# Expected: 0 errors
```

**Step 5: Commit**

```bash
git add src/routes/(portfolio)/about/+page.svelte
git commit -m "feat: wire PublicationModal into about page, replace static pub list"
```

---

## Task 9: Move CTA from about page to home page

**Files:**
- Modify: `src/routes/(portfolio)/about/+page.svelte`
- Modify: `src/routes/(portfolio)/+page.svelte`

**Step 1: Remove CTA section from about page**

In `about/+page.svelte`, find and delete the entire `<!-- Contact CTA -->` section:
```svelte
<!-- Contact CTA -->
<section class="about-cta" use:revealOnScroll>
	<h2 class="about-cta__heading">Let's build something.</h2>
	<p class="about-cta__sub">
		Open to internships, research collaborations, and interesting full-time roles starting mid-2026.
	</p>
	<a href="mailto:kidus@ualberta.ca" class="btn" use:cursorTarget={'hover'}>
		Get in touch
	</a>
</section>
```

Also remove the corresponding CSS rules from its `<style>` block:
```css
.about-cta { ... }
.about-cta__heading { ... }
.about-cta__sub { ... }
.btn { ... }
```

**Step 2: Add CTA section to home page**

In `(portfolio)/+page.svelte`, replace the closing `</main>` tag:
```svelte
</main>
```
With:
```svelte
	<!-- ================================================
		CTA
	================================================ -->
	<section class="cta" use:revealOnScroll>
		<div class="cta__inner">
			<h2 class="cta__heading">Let's build something.</h2>
			<p class="cta__sub">
				Open to internships, research collaborations, and interesting full-time roles starting mid-2026.
			</p>
			<a href="mailto:kidusdereje41@gmail.com" class="btn btn--primary" use:cursorTarget={'hover'} use:magnetic>
				Get in touch
			</a>
		</div>
	</section>
</main>
```

**Step 3: Add CTA CSS to home page `<style>` block**

Append before the closing `</style>` tag in `+page.svelte`:
```css
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
```

**Step 4: Run check**

```bash
pnpm check
# Expected: 0 errors
```

**Step 5: Commit**

```bash
git add src/routes/(portfolio)/about/+page.svelte src/routes/(portfolio)/+page.svelte
git commit -m "feat: move CTA section from about page to home page bottom"
```

---

## Task 10: Final verification + build

**Step 1: Full type check**

```bash
pnpm check
# Expected: 0 errors, 0 warnings
```

**Step 2: Production build**

```bash
pnpm build
# Expected: clean build, no errors
```

**Step 3: Update CLAUDE.md and memory**

- In `CLAUDE.md`: note that `PublicationModal` is in `src/lib/components/ui/` and that publications data now lives in `about/+page.svelte` as a typed `Publication[]` array.
- In `/home/kidus/.claude/projects/-home-kidus-projects-personal-website/memory/MEMORY.md`: add entry for the glassmorphism modal pattern and the GSAP open/close timeline approach.

**Step 4: Final commit for docs**

```bash
git add CLAUDE.md /home/kidus/.claude/projects/-home-kidus-projects-personal-website/memory/MEMORY.md
git commit -m "docs: update CLAUDE.md and memory with modal component pattern"
```

---

## Execution Summary

| Task | Description | Key file(s) |
|---|---|---|
| 1 | Create feature branch | — |
| 2 | Theme tokens | `src/styles/app.css` |
| 3 | Trim projects list | `src/content/projects/index.ts` |
| 4 | Fix experience + hero text | `about/+page.svelte`, `+page.svelte` |
| 5 | Add Publication type | `src/lib/types/content.ts` |
| 6 | Update publications data | `about/+page.svelte` |
| 7 | Build PublicationModal | `src/lib/components/ui/PublicationModal.svelte` |
| 8 | Wire modal in about page | `about/+page.svelte` |
| 9 | Move CTA to home | `about/+page.svelte`, `+page.svelte` |
| 10 | Verify + build + docs | CLAUDE.md, memory |
