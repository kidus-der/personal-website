<!--
	Glance — "At a glance", the five-tile bento under the hero.

	Role, research, education, the latest post, and where I am. Every tile except
	the last is a link; the last one holds a button, so it stays an `<article>`
	rather than becoming an anchor with a control inside it.

	The tile copy is derived from `$content` rather than retyped, so the home page
	cannot drift from the about page: the role tile's title and summary come out
	of `experience[0]`, the counter out of `publications.length`, the sparkline
	out of `publicationsByYear()`.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, GRID_REVEAL, reducedMotion } from '$lib/motion';
	import { reveal } from '$lib/actions/reveal';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import BentoCard from '$lib/components/kokonut/BentoCard.svelte';
	import MouseEffectCard from '$lib/components/kokonut/MouseEffectCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Tag from '$lib/components/ui/Tag.svelte';
	import { education } from '$content/education';
	import { experience } from '$content/experience';
	import { publications, publicationsByYear } from '$content/publications';
	import { contactModal } from '$lib/state/contact.svelte';
	import type { BlogPost } from '$lib/types/content';
	import { cn } from '$lib/utils/cn';
	import { formatDate } from '$lib/utils/dates';
	import { firstClause } from '$lib/utils/text';

	interface Props {
		/** The newest post; the writing tile is dropped when there is none. */
		latestPost?: BlogPost;
		class?: string;
	}

	let { latestPost, class: className = '' }: Props = $props();

	const COUNTER_DURATION = 1.2;
	/** The two systems worth naming on a tile this small. */
	const SHIPPED = ['Halo with Qualcomm', 'Eva V1.6'];

	const role = experience[0];
	const papers = publications.length;
	const papersByYear = publicationsByYear();

	/**
	 * `education.graduation` is a `YYYY-MM`, and `formatDate` would invent a day
	 * for it. A degree finishes in a month, not on the first of one.
	 */
	const MONTH_FORMAT = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		timeZone: 'UTC'
	});
	/** Falls back to the raw string rather than throwing a `RangeError` at SSR. */
	function formatMonth(yearMonth: string): string {
		const date = new Date(`${yearMonth}-01T00:00:00Z`);
		return Number.isNaN(date.getTime()) ? yearMonth : MONTH_FORMAT.format(date);
	}

	const graduation = formatMonth(education.graduation);

	/**
	 * Starts at the final count so the server-rendered tile, and anyone whose
	 * script never runs, reads correctly; the count-up rewinds it on mount.
	 */
	let counted = $state(papers);

	onMount(() => {
		if (reducedMotion()) return;
		counted = 0;
		const controls = animate(0, papers, {
			duration: COUNTER_DURATION,
			onUpdate: (value: number) => (counted = Math.round(value))
		});
		return () => controls.stop();
	});
</script>

<section class={cn('glance', className)}>
	<div class="container">
		<div class="glance__grid" use:reveal={GRID_REVEAL}>
			<BentoCard
				title="{role.role}, {role.company}"
				description={firstClause(role.bullets[0])}
				span="md"
				href="/about"
			>
				<ul class="glance__chips">
					{#each SHIPPED as shipped (shipped)}
						<li><Tag tone="accent">{shipped}</Tag></li>
					{/each}
				</ul>
			</BentoCard>

			<BentoCard title="Research" href="/about#publications">
				<p class="glance__count">
					<span class="glance__counter">{counted}</span>
					<span class="glance__count-label">papers on synthetic-media forensics</span>
				</p>
				<BarChart
					data={papersByYear}
					xKey="year"
					series={[{ key: 'count' }]}
					aspectRatio="3 / 1"
					showGrid={false}
					showXAxis
					ariaLabel="Papers published per year"
				/>
			</BentoCard>

			<BentoCard title="Education">
				<div class="glance__stack">
					<span class="glance__strong">{education.degree}</span>
					<span>{education.school}</span>
					<span>{graduation}</span>
				</div>
			</BentoCard>

			{#if latestPost}
				<BentoCard title="Latest from the Buna Print" href="/blog/{latestPost.slug}">
					<div class="glance__stack">
						<span class="glance__strong">{latestPost.title}</span>
						<span>{formatDate(latestPost.publishedAt, 'short')}</span>
					</div>
				</BentoCard>
			{/if}

			<BentoCard title="Based in Edmonton">
				<MouseEffectCard class="glance__field">
					<p class="glance__invite">Open to research collaborations and interesting problems.</p>
					<Button variant="link" onclick={contactModal.show}>Get in touch</Button>
				</MouseEffectCard>
			</BentoCard>
		</div>
	</div>
</section>

<style>
	.glance {
		padding-block: var(--spacing-section);
	}

	.glance__grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.glance__grid {
			/* `BentoCard`'s `span` classes are written against a three-column grid. */
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.glance__chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		list-style: none;
	}

	.glance__count {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.glance__counter {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: 600;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		color: var(--accent);
	}

	.glance__count-label {
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	.glance__stack {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.glance__strong {
		color: var(--text);
	}

	.glance__invite {
		margin-bottom: 0.625rem;
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	/*
		`:global` because a `class` handed to a component is not touched by
		Svelte's style scoping. The dot field is a backdrop for this tile's text,
		not a card of its own, so its chrome comes off.
	*/
	.glance__grid :global(.glance__field) {
		border: 0;
		background-color: transparent;
		border-radius: var(--radius-md);
	}

	.glance__grid :global(.glance__field .mouse-effect-card__content) {
		padding: 0;
	}
</style>
