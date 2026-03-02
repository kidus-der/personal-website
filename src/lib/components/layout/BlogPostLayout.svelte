<script lang="ts">
	interface Props {
		title?: string;
		description?: string;
		publishedAt?: string;
		tags?: string[];
		children?: import('svelte').Snippet;
	}

	let { title, description, publishedAt, tags = [], children }: Props = $props();
</script>

<svelte:head>
	{#if title}<title>{title}</title>{/if}
	{#if description}<meta name="description" content={description} />{/if}
</svelte:head>

<article class="post">
	<header class="post__header">
		{#if tags.length > 0}
			<div class="post__tags">
				{#each tags as tag}
					<span class="post__tag">{tag}</span>
				{/each}
			</div>
		{/if}

		{#if title}
			<h1 class="post__title">{title}</h1>
		{/if}

		{#if description}
			<p class="post__description">{description}</p>
		{/if}

		{#if publishedAt}
			<time class="post__date" datetime={publishedAt}>
				{new Date(publishedAt).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})}
			</time>
		{/if}
	</header>

	<div class="post__body prose">
		{@render children?.()}
	</div>
</article>

<style>
	.post {
		max-width: 680px;
		margin: 0 auto;
		padding: 8rem var(--spacing-container) 6rem;
	}

	.post__header {
		margin-bottom: 4rem;
	}

	.post__tags {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}

	.post__tag {
		font-size: var(--text-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 0.25rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-full);
		color: var(--text-muted);
	}

	.post__title {
		font-size: var(--text-3xl);
		font-weight: 600;
		line-height: 1.15;
		letter-spacing: -0.02em;
		margin-bottom: 1rem;
	}

	.post__description {
		font-size: var(--text-lg);
		color: var(--text-muted);
		line-height: 1.7;
		margin-bottom: 1.5rem;
	}

	.post__date {
		font-size: var(--text-sm);
		color: var(--text-muted);
		letter-spacing: 0.02em;
	}

	:global(.post__body.prose) {
		font-size: var(--text-base);
		line-height: 1.8;
		color: var(--text);

		:global(h2) {
			font-size: var(--text-2xl);
			font-weight: 600;
			letter-spacing: -0.02em;
			margin: 3rem 0 1rem;
		}

		:global(h3) {
			font-size: var(--text-xl);
			font-weight: 600;
			margin: 2.5rem 0 0.75rem;
		}

		:global(p) {
			margin-bottom: 1.5rem;
		}

		:global(a) {
			color: var(--accent);
			text-decoration: underline;
			text-underline-offset: 3px;
		}

		:global(code) {
			font-family: var(--font-mono);
			font-size: 0.9em;
			background: var(--surface);
			padding: 0.15em 0.4em;
			border-radius: var(--radius-sm);
		}

		:global(pre) {
			background: var(--surface);
			padding: 1.5rem;
			border-radius: var(--radius-md);
			overflow-x: auto;
			margin: 2rem 0;
			border: 1px solid var(--border);

			:global(code) {
				background: none;
				padding: 0;
			}
		}

		:global(blockquote) {
			border-left: 2px solid var(--accent);
			padding-left: 1.5rem;
			margin: 2rem 0;
			color: var(--text-muted);
			font-style: italic;
		}

		:global(ul),
		:global(ol) {
			padding-left: 1.5rem;
			margin-bottom: 1.5rem;
		}

		:global(li) {
			margin-bottom: 0.5rem;
		}
	}
</style>
