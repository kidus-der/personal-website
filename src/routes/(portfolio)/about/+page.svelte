<!--
	/about — composition only.

	This route is the single place that reaches into `$content/*`; every section
	below takes its data as props. That keeps the sections renderable from
	fixtures in tests and leaves one file to look at when the content moves. The
	page's own work is the order of the bands, their headings, and the structured
	data describing the person the page is about.

	Two sections break the shared `.container` + `SectionHeading` shape, both
	deliberately: `Bio` carries its own heading and background because it is the
	page's opening statement rather than a band, and `Publications` carries its
	own heading because `id="publications"` has to sit on a section that includes
	the title — the bio links down to it.

	Prose that belongs to a single section (the bio's paragraphs, the
	publications lede) still lives in that section's markup rather than in
	`$content/*`, which holds structured records, not page copy.
-->
<script lang="ts">
	import SEO from '$lib/components/ui/SEO.svelte';
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';
	import Bio from '$lib/components/sections/about/Bio.svelte';
	import ExperienceTimeline from '$lib/components/sections/about/ExperienceTimeline.svelte';
	import Publications from '$lib/components/sections/about/Publications.svelte';
	import Skills from '$lib/components/sections/about/Skills.svelte';
	import EducationCard from '$lib/components/sections/about/Education.svelte';
	import { site } from '$content/site';
	import { experience } from '$content/experience';
	import { publications } from '$content/publications';
	import { skillGroups, radarScores } from '$content/skills';
	import { education, certifications } from '$content/education';
	import { jsonLd } from '$lib/utils/jsonLd';

	// The roles are newest first, so the first one is the job the page describes.
	// Deriving the structured data from it keeps the machine-readable copy from
	// drifting away from the timeline the moment a role changes.
	const currentRole = experience[0];

	const personJsonLd = jsonLd({
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: site.name,
		url: site.url,
		sameAs: Object.values(site.socials),
		jobTitle: currentRole.role,
		worksFor: { '@type': 'Organization', name: currentRole.company },
		alumniOf: { '@type': 'CollegeOrUniversity', name: education.school }
	});
</script>

<SEO
	title="About"
	description="About Kidus Dereje Zewde: ML engineer, researcher, and Computing Science student at the University of Alberta."
/>
<svelte:head>
	{@html personJsonLd}
</svelte:head>

<main class="about">
	<div class="container">
		<Bio />
	</div>

	<section class="about__band container">
		<SectionHeading title="Experience" />
		<ExperienceTimeline roles={experience} />
	</section>

	<div class="about__band container">
		<Publications items={publications} />
	</div>

	<section class="about__band container">
		<SectionHeading title="Skills" />
		<Skills groups={skillGroups} scores={radarScores} {certifications} />
	</section>

	<section class="about__band container">
		<SectionHeading title="Education" />
		<EducationCard {education} />
	</section>
</main>

<style>
	.about {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-section);
		padding-block: var(--spacing-section);
	}

	.about__band {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}
</style>
