<!--
	Home. Composition only: every band is a component under
	`$lib/components/sections/home/`, and the WebSite JSON-LD lives in the root
	layout rather than being repeated here.
-->
<script lang="ts">
	import ContactCta from '$lib/components/sections/home/ContactCta.svelte';
	import Glance from '$lib/components/sections/home/Glance.svelte';
	import Hero from '$lib/components/sections/home/Hero.svelte';
	import LatestWriting from '$lib/components/sections/home/LatestWriting.svelte';
	import SelectedWork from '$lib/components/sections/home/SelectedWork.svelte';
	import SEO from '$lib/components/ui/SEO.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<SEO
	title="Kidus Dereje"
	description="Kidus Dereje Zewde — Founding Engineer at Scam AI, researcher in deepfake and document forensics, Computing Science and Economics at the University of Alberta."
/>

<Hero />
<Glance latestPost={data.posts[0]} />
<SelectedWork />
<LatestWriting posts={data.posts} />
<ContactCta />
