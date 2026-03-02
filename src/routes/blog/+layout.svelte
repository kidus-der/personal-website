<script lang="ts">
	import { themeStore } from '$lib/stores/theme';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="blog-shell">
	<header class="blog-nav">
		<nav class="blog-nav__inner">
			<a href="/" class="blog-nav__home">← kidus.dev</a>
			<a href="/blog" class="blog-nav__logo">Blog</a>
			<button
				class="blog-nav__theme"
				onclick={() => themeStore.toggle()}
				aria-label="Toggle theme"
			>
				{#if $themeStore === 'dark'}☀{:else}☾{/if}
			</button>
		</nav>
	</header>

	<main class="blog-main">
		{@render children()}
	</main>

	<footer class="blog-footer">
		<a href="/" class="blog-footer__link">kidus.dev</a>
		<span class="blog-footer__sep">·</span>
		<a href="/blog" class="blog-footer__link">All posts</a>
	</footer>
</div>

<style>
	.blog-shell {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	.blog-nav {
		padding: 1.5rem var(--spacing-container);
		border-bottom: 1px solid var(--border);
	}

	.blog-nav__inner {
		display: flex;
		align-items: center;
		max-width: 760px;
		margin: 0 auto;
		gap: 1.5rem;
	}

	.blog-nav__home {
		font-size: var(--text-sm);
		color: var(--text-muted);
		transition: color 0.2s;
		margin-right: auto;

		&:hover {
			color: var(--accent);
		}
	}

	.blog-nav__logo {
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	.blog-nav__theme {
		font-size: 1rem;
		color: var(--text-muted);
		transition: color 0.2s;

		&:hover {
			color: var(--accent);
		}
	}

	.blog-main {
		flex: 1;
	}

	.blog-footer {
		padding: 2.5rem var(--spacing-container);
		border-top: 1px solid var(--border);
		display: flex;
		gap: 0.75rem;
		align-items: center;
		justify-content: center;
	}

	.blog-footer__link {
		font-size: var(--text-sm);
		color: var(--text-muted);
		transition: color 0.2s;

		&:hover {
			color: var(--text);
		}
	}

	.blog-footer__sep {
		color: var(--border);
	}
</style>
