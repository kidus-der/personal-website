<!--
	ProjectGrid — the `/work` grid and the home page's "Selected work" band.

	It owns two things the card cannot: the three-to-one column layout, and which
	card is hovered. Sibling dimming has to live here because a card has no way to
	know that one of its neighbours is under the pointer; each card reports its
	own hover and the grid decides who recedes. `createHoverGroup` is that state,
	shared with the two blog grids — see `$lib/state/hoverGroup.svelte` for why it
	is keyed by slug and why it re-checks the key against what is on screen.

	The `id` sits on the section, not the list, so it stays a valid reference
	target while the category filter is showing nothing. The section is named by
	a visually-hidden `<h2>`: the cards' own titles are `<h3>`, so without it the
	page would step from its `<h1>` straight to level 3.
-->
<script lang="ts">
	import ProjectCard from './ProjectCard.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { createHoverGroup } from '$lib/state/hoverGroup.svelte';
	import { cn } from '$lib/utils/cn';
	import type { Project } from '$lib/types/content';

	interface Props {
		projects: Project[];
		/** Set when something outside the grid needs to point at it. */
		id?: string;
		class?: string;
	}

	let { projects, id, class: className = '' }: Props = $props();

	/** Unique per instance, so two grids on one page do not share a label. */
	const headingId = $props.id();

	const hover = createHoverGroup(() => projects.map((project) => project.slug));
</script>

<section {id} class={cn('project-grid', className)} aria-labelledby={headingId}>
	<!-- Named for assistive tech: the page's own `<h1>` and the tab row already say what this is. -->
	<h2 id={headingId} class="visually-hidden">Projects</h2>

	{#if projects.length === 0}
		<p class="project-grid__empty">Nothing in this category yet.</p>
	{:else}
		<ul class="project-grid__list" data-reveal-group use:reveal={{ stagger: 0.06 }}>
			{#each projects as project (project.slug)}
				<li class="project-grid__item">
					<ProjectCard
						{project}
						dimmed={hover.dimmed(project.slug)}
						onhoverstart={() => hover.enter(project.slug)}
						onhoverend={() => hover.leave(project.slug)}
					/>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.project-grid__list {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.25rem;
		list-style: none;
	}

	@media (max-width: 1024px) {
		.project-grid__list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 640px) {
		.project-grid__list {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.project-grid__item {
		display: flex;
	}

	/* The card fills its cell so a short description does not shrink the card. */
	.project-grid__item > :global(.project-card) {
		flex: 1;
	}

	.project-grid__empty {
		padding: 3rem 0;
		font-size: var(--text-base);
		color: var(--text-muted);
	}
</style>
