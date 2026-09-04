<!--
	/about — composition only.

	Every word on this page comes from `$content/*`; nothing is retyped here. The
	page's job is the order of the bands, the section headings, and the structured
	data that describes the person the page is about.

	`Bio` brings its own heading and background because it is the page's opening
	statement rather than a band like the others; the four sections below it share
	the same `.container` + `SectionHeading` shape.
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
	import { education } from '$content/education';
	import { jsonLd } from '$lib/utils/jsonLd';

	const personJsonLd = jsonLd({
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: site.name,
		url: site.url,
		sameAs: Object.values(site.socials),
		jobTitle: 'Founding Engineer',
		worksFor: { '@type': 'Organization', name: 'Scam AI' },
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
		<Skills />
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
