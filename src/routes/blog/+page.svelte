<script lang="ts">
	import type { PageData } from './$types';
	import type { BlogPost } from '$lib/types/content';

	let { data }: { data: PageData } = $props();

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	const gradients = [
		'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
		'linear-gradient(135deg, #0d1117 0%, #161b22 40%, #21262d 100%)',
		'linear-gradient(135deg, #1a0a2e 0%, #2d1b69 50%, #11998e 100%)',
		'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
		'linear-gradient(135deg, #1a1a1a 0%, #222 40%, #2d4a22 100%)'
	];

	function getGradient(index: number) {
		return gradients[index % gradients.length];
	}

	const featured = $derived(data.posts[0] as BlogPost | undefined);
	const rest = $derived(data.posts.slice(1) as BlogPost[]);
</script>

<svelte:head>
	<title>Blog — Kidus Dereje</title>
	<meta name="description" content="Writing on machine learning, AI research, and software engineering." />
</svelte:head>

<div class="blog-listing">
	<header class="blog-listing__header">
		<h1 class="blog-listing__title">Writing</h1>
		<p class="blog-listing__sub">
			Notes on machine learning, AI research, and the process of building things that matter.
		</p>
	</header>

	{#if data.posts.length === 0}
		<p class="blog-listing__empty">No posts yet. Check back soon.</p>
	{:else}

		<!-- Featured post -->
		{#if featured}
			<a href="/blog/{featured.slug}" class="featured-card">
				<div class="featured-card__visual" style="background: {getGradient(0)}">
					<div class="featured-card__overlay"></div>
					<span class="featured-card__badge">
						{featured.tags[0] ?? 'Writing'}
					</span>
				</div>
				<div class="featured-card__body">
					<span class="featured-card__label">Featured post</span>
					<h2 class="featured-card__title"><span class="featured-card__title-inner">{featured.title}</span></h2>
					<p class="featured-card__excerpt">{featured.description}</p>
					<div class="featured-card__meta">
						<span>{formatDate(featured.publishedAt)}</span>
						{#if featured.readingTime}
							<span>·</span>
							<span>{featured.readingTime} min read</span>
						{/if}
					</div>
				</div>
			</a>
		{/if}

		<!-- Recent posts grid -->
		{#if rest.length > 0}
			<section class="recent-section">
				<h2 class="recent-section__heading">More posts</h2>
				<div class="posts-grid">
					{#each rest as post, i}
						<a href="/blog/{post.slug}" class="post-card">
							<div class="post-card__thumb" style="background: {getGradient(i + 1)}">
								<span class="post-card__category">{post.tags[0] ?? 'Writing'}</span>
							</div>
							<div class="post-card__body">
								<h3 class="post-card__title">
									<span class="post-card__title-inner">{post.title}</span>
								</h3>
								<p class="post-card__excerpt">{post.description}</p>
								<div class="post-card__meta">
									<span>{formatDate(post.publishedAt)}</span>
									{#if post.readingTime}
										<span>·</span>
										<span>{post.readingTime} min read</span>
									{/if}
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}

	{/if}
</div>

<style>
	.blog-listing {
		max-width: 1100px;
		margin: 0 auto;
		padding: 4rem var(--spacing-container) 6rem;
	}

	.blog-listing__header {
		margin-bottom: 3rem;
		padding-bottom: 2.5rem;
		border-bottom: 1px solid var(--border);
	}

	.blog-listing__title {
		font-size: var(--text-3xl);
		font-weight: 600;
		letter-spacing: -0.03em;
		margin-bottom: 0.75rem;
	}

	.blog-listing__sub {
		font-size: var(--text-lg);
		color: var(--text-muted);
		line-height: 1.7;
		max-width: 520px;
	}

	.blog-listing__empty {
		color: var(--text-muted);
		font-size: var(--text-base);
	}

	/* ── Featured card ──────────────────────────── */
	.featured-card {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--surface);
		margin-bottom: 4rem;
		transition: border-color 0.3s, transform 0.4s var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1));

		&:hover {
			border-color: var(--text-muted);
			transform: translateY(-3px);

			.featured-card__title-inner {
				background-size: 100% 1px;
			}
		}

		@media (max-width: 720px) {
			grid-template-columns: 1fr;
		}
	}

	.featured-card__visual {
		position: relative;
		min-height: 300px;

		@media (max-width: 720px) {
			min-height: 200px;
		}
	}

	.featured-card__overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to right, transparent, rgba(0,0,0,0.3));

		@media (max-width: 720px) {
			background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.4));
		}
	}

	.featured-card__badge {
		position: absolute;
		top: 1.25rem;
		left: 1.25rem;
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent);
		background: rgba(0,0,0,0.5);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full);
		border: 1px solid var(--accent);
	}

	.featured-card__body {
		padding: 2.5rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 1rem;
	}

	.featured-card__label {
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.featured-card__title {
		font-size: var(--text-2xl);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.25;
		color: var(--text);
	}

	.featured-card__excerpt {
		font-size: var(--text-base);
		color: var(--text-muted);
		line-height: 1.7;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.featured-card__meta {
		display: flex;
		gap: 0.5rem;
		font-size: var(--text-xs);
		color: var(--text-muted);
		letter-spacing: 0.04em;
	}

	/* ── Recent section ─────────────────────────── */
	.recent-section__heading {
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 1.75rem;
	}

	.posts-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;

		@media (max-width: 900px) {
			grid-template-columns: repeat(2, 1fr);
		}

		@media (max-width: 580px) {
			grid-template-columns: 1fr;
		}
	}

	/* ── Post card ──────────────────────────────── */
	.post-card {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--surface);
		transition: border-color 0.3s, transform 0.4s var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1));

		&:hover {
			border-color: var(--text-muted);
			transform: translateY(-3px);

			.post-card__thumb {
				scale: 1.03;
			}

			.post-card__title-inner {
				background-size: 100% 1px;
			}
		}
	}

	.post-card__thumb {
		aspect-ratio: 4/3;
		position: relative;
		transition: scale 0.5s var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1));
	}

	.post-card__category {
		position: absolute;
		top: 0.875rem;
		left: 0.875rem;
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent);
		background: rgba(0,0,0,0.5);
		padding: 0.2rem 0.6rem;
		border-radius: var(--radius-full);
		border: 1px solid var(--accent);
	}

	.post-card__body {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		flex: 1;
	}

	.post-card__title {
		font-size: var(--text-base);
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.35;
		color: var(--text);
	}

	.post-card__title-inner {
		background-image: linear-gradient(var(--accent), var(--accent));
		background-repeat: no-repeat;
		background-position: 0 100%;
		background-size: 0% 1px;
		transition: background-size 0.3s ease;
	}

	.post-card__excerpt {
		font-size: var(--text-sm);
		color: var(--text-muted);
		line-height: 1.65;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.post-card__meta {
		display: flex;
		gap: 0.4rem;
		font-size: var(--text-xs);
		color: var(--text-muted);
		letter-spacing: 0.04em;
		margin-top: auto;
		padding-top: 0.5rem;
	}
</style>
