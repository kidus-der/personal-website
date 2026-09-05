<!--
	/work — every project, filtered by category.

	The filter is a query parameter rather than component state so a filtered view
	is linkable and survives a reload, and `+page.ts` — not this component — is
	the one place that decides what a valid category is. Changing a tab replaces
	the history entry instead of pushing one: five tabs would otherwise bury the
	page a visitor came from under five back presses.

	`SmoothTabs` has no `aria-controls`, so the relationship between the tabs and
	the grid is carried the other way: the grid has a stable id, and a polite live
	region reports how many projects the new filter left. Without it, a screen
	reader user hears the tab's own selected state change and nothing about the
	content that just swapped underneath it.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { PROJECT_CATEGORIES } from '$content/projects';
	import SmoothTabs from '$lib/components/kokonut/SmoothTabs.svelte';
	import ProjectGrid from '$lib/components/sections/work/ProjectGrid.svelte';
	import SEO from '$lib/components/ui/SEO.svelte';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const tabs = PROJECT_CATEGORIES.map((category) => ({ id: category.id, label: category.label }));

	const count = $derived(data.projects.length);
	const status = $derived(`${count} ${count === 1 ? 'project' : 'projects'}`);

	function selectCategory(id: string) {
		// `keepFocus` so the tab the visitor just activated keeps focus across the
		// navigation; `noScroll` so filtering does not throw them back to the top.
		goto(id === 'all' ? '/work' : `/work?category=${id}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}
</script>

<SEO title="Work" description="Selected projects across AI, full-stack, systems and mobile." />

<main class="work-page">
	<div class="container">
		<header class="work-page__header" use:reveal>
			<h1 class="display-heading work-page__title">Work</h1>
			<p class="work-page__lede">Projects I've built, from research tooling to production apps.</p>
		</header>

		<div class="work-page__filter">
			<SmoothTabs {tabs} active={data.category} onchange={selectCategory} label="Filter projects" />
			<!-- Announced, never seen: the tab row already shows which filter is on. -->
			<p class="visually-hidden" aria-live="polite">{status}</p>
		</div>

		<ProjectGrid id="project-grid" projects={data.projects} />
	</div>
</main>

<style>
	.work-page {
		padding-block: 8rem var(--spacing-section);
	}

	.work-page__header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2.5rem;
	}

	.work-page__title {
		font-size: var(--text-3xl);
		line-height: 1.05;
	}

	.work-page__lede {
		max-width: 52ch;
		font-size: var(--text-lg);
		line-height: 1.6;
		color: var(--text-muted);
	}

	.work-page__filter {
		margin-bottom: 2.5rem;
	}
</style>
