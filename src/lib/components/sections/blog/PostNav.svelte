<!--
	PostNav — the two hairline cards that close a post.

	`prev` is the newer post and `next` the older one, matching the archive's
	newest-first order. The labels say "Newer" and "Older" rather than
	"Previous"/"Next", which readers reliably read backwards on a reverse-chron
	blog.

	Renders nothing at all when a post has no neighbours, so a one-post archive
	does not grow an empty footer.
-->
<script lang="ts">
	import type { BlogPost } from '$lib/types/content';
	import { cn } from '$lib/utils/cn';

	interface Props {
		/** The newer post, or `null` at the top of the archive. */
		prev: BlogPost | null;
		/** The older post, or `null` at the bottom of the archive. */
		next: BlogPost | null;
		class?: string;
	}

	let { prev, next, class: className = '' }: Props = $props();
</script>

{#if prev || next}
	<nav class={cn('post-nav', className)} aria-label="Post navigation">
		{#if prev}
			<a class="post-nav__card" href="/blog/{prev.slug}">
				<span class="post-nav__label">Newer</span>
				<span class="post-nav__title">{prev.title}</span>
			</a>
		{/if}
		{#if next}
			<a class="post-nav__card post-nav__card--older" href="/blog/{next.slug}">
				<span class="post-nav__label">Older</span>
				<span class="post-nav__title">{next.title}</span>
			</a>
		{/if}
	</nav>
{/if}

<style>
	.post-nav {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		margin-top: 2.5rem;
	}

	@media (min-width: 720px) {
		.post-nav {
			grid-template-columns: repeat(2, 1fr);
		}

		/* Keeps the older card on the right even when there is no newer one. */
		.post-nav__card--older {
			grid-column: 2;
			text-align: right;
		}
	}

	.post-nav__card {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		background-color: var(--surface);
		padding: 1.125rem 1.25rem;
		color: inherit;
		transition:
			border-color 300ms var(--ease-out-expo),
			background-color 300ms var(--ease-out-expo);
	}

	.post-nav__card:hover,
	.post-nav__card:focus-visible {
		border-color: var(--border-strong);
		background-color: var(--surface-raised);
	}

	.post-nav__label {
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	.post-nav__title {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.25;
		color: var(--text);
	}

	@media (prefers-reduced-motion: reduce) {
		.post-nav__card {
			transition: none;
		}
	}
</style>
