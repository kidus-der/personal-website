<!--
	Skills — a self-assessment radar beside the concrete stack, with the
	certifications under both.

	The radar is one shape, so it takes a single-series `data` array; the values
	are keyed by metric key, which is what lets the chart line a score up with its
	axis regardless of array order.

	The group cards are `SpotlightCard tilt={false}`: they keep the pointer glow
	that ties them to the rest of the site's cards but drop the rotation. Five
	cards tilting next to a chart that is itself the focal point would be noise.

	`SpotlightCard` is a surface, not a container: it clips at its border radius
	(`overflow: hidden` on its inner box) and deliberately holds no padding, so
	every consumer pads its own content — `ProjectCard` does it on
	`.project-card__body`. This section skipped that step, which put the group
	heading's glyphs on the border line and had the clip shave the ascenders and
	the left stems off "Languages", "ML & data" and "Dev & testing". `.skills__group`
	is that padded box.

	Data arrives as props, like every other section on this page, so the route
	stays the one place that reaches into `$content/*`.
-->
<script lang="ts">
	import { RadarChart } from '$lib/components/charts';
	import SpotlightCard from '$lib/components/kokonut/SpotlightCard.svelte';
	import Tag from '$lib/components/ui/Tag.svelte';
	import type { RadarScore, SkillGroup } from '$lib/types/content';

	interface Props {
		groups: SkillGroup[];
		scores: RadarScore[];
		certifications: string[];
	}

	let { groups, scores, certifications }: Props = $props();

	const RADAR_SIZE = 320;
	const RADAR_LEVELS = 4;

	const metrics = $derived(scores.map((score) => ({ key: score.key, label: score.label })));
	const radarData = $derived([
		{
			label: 'Kidus',
			values: Object.fromEntries(scores.map((score) => [score.key, score.value]))
		}
	]);
</script>

<div class="skills">
	<div class="skills__columns">
		<div class="skills__radar">
			<RadarChart {metrics} data={radarData} size={RADAR_SIZE} levels={RADAR_LEVELS} />
		</div>

		<div class="skills__groups">
			{#each groups as group (group.name)}
				<SpotlightCard tilt={false}>
					<div class="skills__group">
						<h3 class="display-heading skills__group-name">{group.name}</h3>
						<div class="skills__items">
							{#each group.items as item (item)}
								<Tag>{item}</Tag>
							{/each}
						</div>
					</div>
				</SpotlightCard>
			{/each}
		</div>
	</div>

	<div class="skills__certifications">
		<h3 class="display-heading skills__certifications-title">Certifications</h3>
		<ul>
			{#each certifications as certification (certification)}
				<li>{certification}</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	.skills {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	.skills__columns {
		display: grid;
		gap: 2.5rem;
	}

	/* Two columns only once the radar can sit at its natural size beside them. */
	@media (min-width: 900px) {
		.skills__columns {
			grid-template-columns: minmax(0, 20rem) minmax(0, 1fr);
			align-items: start;
		}
	}

	.skills__radar {
		display: flex;
		justify-content: center;
	}

	.skills__groups {
		display: grid;
		gap: 1rem;
		grid-template-columns: minmax(0, 1fr);
		/*
			Each card is as tall as its own chip list. Stretching them to the row
			leaves the short groups — Databases beside a five-row Frameworks card —
			as a heading floating over half a card of empty surface.
		*/
		align-items: start;
	}

	/*
		`align-items` alone is not enough: `SpotlightCard` carries `height: 100%`
		for the equal-height grids it was written for, and a percentage height on a
		grid item resolves against the whole row however the item is aligned in it.
	*/
	.skills__groups > :global(.spotlight-card) {
		height: auto;
	}

	@media (min-width: 640px) {
		.skills__groups {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	/*
		The padded box inside the clipping card. Without it the heading sits on the
		card's border and `overflow: hidden` takes a slice off its glyphs.
	*/
	.skills__group {
		padding: 1.25rem;
	}

	.skills__group-name {
		font-size: var(--text-lg);
		letter-spacing: -0.01em;
		/* The display face's ascenders overshoot a 1.1 line box; this is the room
		   they need so a capital never meets the top padding edge. */
		padding-block-start: 0.05em;
		text-wrap: balance;
	}

	.skills__items {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.875rem;
	}

	.skills__certifications-title {
		font-size: var(--text-lg);
		letter-spacing: -0.01em;
	}

	.skills__certifications ul {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0.875rem 0 0;
		padding: 0;
		list-style: none;
		font-size: var(--text-base);
		line-height: 1.6;
		color: var(--text-muted);
	}
</style>
