<script lang="ts">
	import { page } from '$app/stores';

	interface Props {
		title: string;
		description: string;
		type?: 'website' | 'article';
		publishedAt?: string;
		updatedAt?: string;
		tags?: string[];
		/** Override the auto-generated OG image URL */
		coverImage?: string;
	}

	const SITE_NAME = 'Kidus Dereje';
	const SITE_URL = 'https://kidus.dev';

	let {
		title,
		description,
		type = 'website',
		publishedAt,
		updatedAt,
		tags,
		coverImage
	}: Props = $props();

	const fullTitle = $derived(
		title === SITE_NAME ? title : `${title} — ${SITE_NAME}`
	);

	const canonical = $derived($page.url.href);

	const ogImage = $derived(() => {
		if (coverImage) {
			// Absolute-ify relative paths (e.g. /images/cover.jpg)
			return coverImage.startsWith('http') ? coverImage : `${SITE_URL}${coverImage}`;
		}
		const params = new URLSearchParams({ title, description, type });
		if (tags?.length) params.set('tags', tags.join(','));
		return `${SITE_URL}/og?${params}`;
	});
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<meta name="author" content={SITE_NAME} />
	<link rel="canonical" href={canonical} />

	<!-- Open Graph -->
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content={type} />
	<meta property="og:image" content={ogImage()} />
	<meta property="og:site_name" content={SITE_NAME} />

	<!-- Twitter / X Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage()} />

	<!-- Article-specific tags -->
	{#if type === 'article' && publishedAt}
		<meta property="article:published_time" content={publishedAt} />
		{#if updatedAt}
			<meta property="article:modified_time" content={updatedAt} />
		{/if}
		<meta property="article:author" content={SITE_NAME} />
		{#each tags ?? [] as tag}
			<meta property="article:tag" content={tag} />
		{/each}
	{/if}
</svelte:head>
