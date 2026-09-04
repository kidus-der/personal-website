<!--
	ProjectGrid — the `/work` grid and the home page's "Selected work" band.

	It owns two things the card cannot: the three-to-one column layout, and which
	card is hovered. Sibling dimming has to live here because a card has no way to
	know that one of its neighbours is under the pointer; each card reports its
	own hover and the grid decides who recedes.

	`hovered` is compared by slug rather than held as a boolean per card so that
	a `pointerleave` arriving after the pointer has already entered the next card
	— which happens on a fast diagonal drag — cannot clear a hover that a
	different card now owns.

	The `id` sits on the region, not the list, so it stays a valid reference
	target while the category filter is showing nothing.
-->
<script lang="ts">
	import ProjectCard from './ProjectCard.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { cn } from '$lib/utils/cn';
	import type { Project } from '$lib/types/content';

	interface Props {
		projects: Project[];
		/** Set when something outside the grid needs to point at it. */
		id?: string;
		class?: string;
	}

	let { projects, id, class: className = '' }: Props = $props();

	/** Slug of the card under the pointer, or `undefined` when none is. */
	let hovered = $state<string | undefined>(undefined);
</script>

<div {id} class={cn('project-grid', className)}>
	{#if projects.length === 0}
		<p class="project-grid__empty">Nothing in this category yet.</p>
	{:else}
		<ul class="project-grid__list" use:reveal={{ stagger: 0.06 }}>
			{#each projects as project (project.slug)}
				<li class="project-grid__item">
					<ProjectCard
						{project}
						dimmed={hovered !== undefined && hovered !== project.slug}
						onhoverstart={() => (hovered = project.slug)}
						onhoverend={() => {
							if (hovered === project.slug) hovered = undefined;
						}}
					/>
				</li>
			{/each}
		</ul>
	{/if}
</div>

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
