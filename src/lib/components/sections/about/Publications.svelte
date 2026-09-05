<!--
	Publications — the papers accordion, introduced by a papers-per-year chart.

	Which row is open lives here rather than in the rows, because "one at a time"
	is a property of the set. The open row is tracked by publication id, not by
	index: an id survives the list being filtered or reordered, an index does not.

	The chart is a summary of the same list the rows below spell out, so it is
	given a plain-language caption rather than being left to speak for itself.
-->
<script lang="ts">
	import { BarChart } from '$lib/components/charts';
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';
	import PublicationRow from './PublicationRow.svelte';
	import { publicationsByYear } from '$content/publications';
	import type { Publication } from '$lib/types/content';

	interface Props {
		items: Publication[];
	}

	let { items }: Props = $props();

	const byYear = publicationsByYear();
	const series = [{ key: 'count', label: 'Papers' }];

	let openId = $state<string | null>(null);

	function toggle(id: string) {
		openId = openId === id ? null : id;
	}
</script>

<section id="publications" class="publications">
	<SectionHeading title="Publications" />

	<div class="publications__intro">
		<div class="publications__chart">
			<BarChart data={byYear} xKey="year" {series} aspectRatio="3 / 1" showGrid={false} showXAxis />
		</div>
		<p class="publications__lede">Nine papers on synthetic-media forensics, 2025 to today.</p>
	</div>

	<div class="publications__rows">
		{#each items as pub (pub.id)}
			<PublicationRow {pub} open={openId === pub.id} ontoggle={() => toggle(pub.id)} />
		{/each}
	</div>
</section>

<style>
	.publications {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	.publications__intro {
		display: grid;
		gap: 1.5rem;
		align-items: center;
	}

	@media (min-width: 768px) {
		.publications__intro {
			grid-template-columns: minmax(0, 22rem) minmax(0, 1fr);
			gap: 2.5rem;
		}
	}

	.publications__chart {
		min-width: 0;
	}

	.publications__lede {
		max-width: 34ch;
		font-size: var(--text-lg);
		line-height: 1.5;
		color: var(--text-muted);
	}

	.publications__rows {
		border-top: 1px solid var(--border);
	}
</style>
