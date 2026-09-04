<!--
	ShareLinks — the three share targets under a post.

	Two outbound intents and a copy button. The copy button is a `<button>`, not a
	link, because it navigates nowhere; its confirmation is announced through
	`aria-live` since the only visible change is the label itself.

	`navigator.clipboard` is missing on insecure origins and in older browsers, so
	the write is guarded and a failure simply leaves the label alone rather than
	claiming a copy that never happened.
-->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		/** The post title, used as the tweet text. */
		title: string;
		/** The absolute post URL. */
		url: string;
		class?: string;
	}

	let { title, url, class: className = '' }: Props = $props();

	/** How long the "Copied" label stands before reverting. */
	const CONFIRM_MS = 1500;

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	const xHref = $derived(
		`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
	);
	const linkedInHref = $derived(
		`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
	);

	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			// No clipboard access — say nothing rather than claim a copy.
			return;
		}
		copied = true;
		clearTimeout(timer);
		timer = setTimeout(() => (copied = false), CONFIRM_MS);
	}

	onDestroy(() => clearTimeout(timer));
</script>

<div class={cn('share-links', className)}>
	<span class="share-links__label">Share this post</span>

	<div class="share-links__row">
		<a
			class="share-links__item"
			href={xHref}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="Share on X"
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path
					d="M18.9 2.5h3.4l-7.4 8.5 8.7 11.5h-6.8l-5.3-7-6.1 7H1.9l7.9-9.1L1.5 2.5h7l4.8 6.4 5.6-6.4Zm-1.2 18h1.9L7.3 4.4H5.3l12.4 16.1Z"
				/>
			</svg>
			<span>X</span>
		</a>

		<a
			class="share-links__item"
			href={linkedInHref}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="Share on LinkedIn"
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path
					d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.2 1.45-2.2 2.96V21h-4V9Z"
				/>
			</svg>
			<span>LinkedIn</span>
		</a>

		<button type="button" class="share-links__item" onclick={copy}>
			{#if copied}
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="m20 6-11 11-5-5" />
				</svg>
			{:else}
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<rect x="9" y="9" width="12" height="12" rx="2" />
					<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
				</svg>
			{/if}
			<span aria-live="polite">{copied ? 'Copied' : 'Copy link'}</span>
		</button>
	</div>
</div>

<style>
	.share-links {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.25rem;
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
	}

	.share-links__label {
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.share-links__row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.share-links__item {
		display: inline-flex;
		align-items: center;
		gap: 0.4375rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-chip);
		background-color: color-mix(in srgb, var(--surface-raised) 60%, transparent);
		padding: 0.3125rem 0.75rem;
		font-family: var(--font-body);
		font-size: var(--text-sm);
		line-height: 1.4;
		color: var(--text-muted);
		cursor: pointer;
		transition:
			border-color 200ms var(--ease-out-quart),
			color 200ms var(--ease-out-quart);
	}

	.share-links__item:hover,
	.share-links__item:focus-visible {
		border-color: var(--border-strong);
		color: var(--text);
	}

	@media (prefers-reduced-motion: reduce) {
		.share-links__item {
			transition: none;
		}
	}
</style>
