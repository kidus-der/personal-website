<!--
	ExperienceTimeline — the three technical roles, newest first.

	An `<ol>` because this genuinely is a sequence: the roles are ordered by time
	and the design draws a rail through them. That is also why numbered markers
	are allowed here and nowhere else on the site.

	The rail sits outside the list rather than inside it. Two reasons: an `<ol>`
	may only contain `<li>` children, and `use:reveal={{ stagger }}` animates the
	list's direct children — a rail in there would be lifted and faded along with
	the roles. Keeping it a sibling lets `use:scrollProgress` track the list as
	its target while writing `--progress` onto the rail the fill actually reads.
-->
<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import { scrollProgress } from '$lib/actions/scrollProgress';
	import { formatPeriod } from '$lib/utils/period';
	import type { Experience } from '$lib/types/content';

	interface Props {
		roles: Experience[];
	}

	let { roles }: Props = $props();

	/** Matches the grid stagger used elsewhere on the site. */
	const STAGGER = 0.08;

	let listEl = $state<HTMLElement | undefined>();
</script>

<div class="timeline">
	<!--
		Decorative: the sequence is already carried by the ordered list, so the
		rail has nothing to say to a screen reader.
	-->
	<div class="timeline__rail" aria-hidden="true" use:scrollProgress={{ target: listEl }}>
		<span class="timeline__rail-fill"></span>
	</div>

	<ol class="timeline__list" bind:this={listEl} data-reveal-group use:reveal={{ stagger: STAGGER }}>
		{#each roles as role, index (`${role.company}-${role.role}-${role.period.start}`)}
			<li class="timeline__item">
				<span
					class="timeline__marker"
					class:timeline__marker--current={index === 0}
					aria-hidden="true"
				></span>

				<div class="timeline__head">
					<h3 class="display-heading timeline__role">{role.role}</h3>
					<p class="timeline__meta">
						<span class="timeline__company">
							{#if role.url}
								<a href={role.url} target="_blank" rel="noopener noreferrer">{role.company}</a>
							{:else}
								{role.company}
							{/if}
						</span>
						{#if role.location}
							<span class="timeline__location">{role.location}</span>
						{/if}
						<span class="timeline__period">{formatPeriod(role.period)}</span>
					</p>
				</div>

				<ul class="timeline__bullets bullet-list">
					{#each role.bullets as bullet (bullet)}
						<li>{bullet}</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ol>
</div>

<style>
	.timeline {
		position: relative;
		/* The rail's own width plus the gap to the text. */
		padding-left: 1.75rem;
	}

	.timeline__rail {
		position: absolute;
		top: 0.5rem;
		bottom: 0.5rem;
		left: 0;
		width: 1px;
		background-color: var(--border);
	}

	.timeline__rail-fill {
		display: block;
		width: 100%;
		height: 100%;
		background-color: var(--accent);
		transform-origin: top;
		transform: scaleY(var(--progress, 0));
	}

	.timeline__list {
		display: flex;
		flex-direction: column;
		gap: 3rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.timeline__item {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.timeline__marker {
		position: absolute;
		/* Centres a 9px dot on the 1px rail, which sits at the padding edge. */
		left: calc(-1.75rem - 4px);
		top: 0.45rem;
		width: 9px;
		height: 9px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-full);
		background-color: var(--bg);
	}

	.timeline__marker--current {
		border-color: var(--accent);
		background-color: var(--accent);
		box-shadow: 0 0 0 4px var(--accent-dim);
	}

	.timeline__head {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.timeline__role {
		font-size: var(--text-xl);
		letter-spacing: -0.01em;
		line-height: 1.2;
	}

	/* Separate spans with a gap instead of a joined "·" string. */
	.timeline__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.timeline__company {
		color: var(--text);
	}

	.timeline__company a {
		color: var(--text);
		text-decoration: underline;
		text-underline-offset: 0.2em;
		text-decoration-color: color-mix(in srgb, var(--text) 30%, transparent);
	}

	.timeline__company a:hover {
		color: var(--accent);
		text-decoration-color: var(--accent);
	}

	.timeline__period {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: 0.01em;
	}

	/* Marker, spacing and colour come from the global `.bullet-list`. */
	.timeline__bullets {
		max-width: 68ch;
	}
</style>
