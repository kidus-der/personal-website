<!--
	SelectedWork — three featured projects.

	The grid owns the hover state so that pointing at one card recedes the other
	two: a card cannot know about its siblings, and `:hover ~ *` only reaches
	forward, not back.
-->
<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import ProjectCard from '$lib/components/sections/work/ProjectCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';
	import { featuredProjects } from '$content/projects';
	import { cn } from '$lib/utils/cn';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	const GRID_STAGGER = { stagger: 0.06 };

	const projects = featuredProjects();

	/** Slug of the hovered card, or null when the pointer is elsewhere. */
	let hovered = $state<string | null>(null);
</script>

<section class={cn('selected-work', className)}>
	<div class="container">
		<SectionHeading title="Selected work" lede="Three things I'm proud of.">
			{#snippet action()}
				<Button variant="link" href="/work">All projects</Button>
			{/snippet}
		</SectionHeading>

		<div class="selected-work__grid" use:reveal={GRID_STAGGER}>
			{#each projects as project (project.slug)}
				<ProjectCard
					{project}
					dimmed={hovered !== null && hovered !== project.slug}
					onhoverstart={() => (hovered = project.slug)}
					onhoverend={() => (hovered = null)}
				/>
			{/each}
		</div>
	</div>
</section>

<style>
	.selected-work {
		padding-block: var(--spacing-section);
	}

	.selected-work__grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		margin-top: 2.5rem;
	}

	@media (min-width: 720px) {
		.selected-work__grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1000px) {
		.selected-work__grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
