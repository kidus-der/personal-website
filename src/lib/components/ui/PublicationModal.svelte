<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from '$lib/animation/gsap.config';
	import type { Publication } from '$lib/types/content';
	import { activePublicationIndex } from '$lib/stores/publications';

	interface Props {
		pub: Publication;
		index: number;
	}

	let { pub, index }: Props = $props();

	let open = $state(false);
	let overlayEl: HTMLDivElement | undefined = $state();
	let cardEl: HTMLDivElement | undefined = $state();
	let bulletEls: HTMLLIElement[] = $state([]);

	let activeTl: gsap.core.Timeline | null = null;

	function openModal() {
		bulletEls = [];
		open = true;
		activePublicationIndex.set(index);
		setTimeout(() => {
			if (!overlayEl || !cardEl) return;
			activeTl?.kill();
			activeTl = gsap.timeline();
			activeTl
				.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' })
				.fromTo(
					cardEl,
					{ opacity: 0, scale: 0.85, y: 20 },
					{ opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.4)' },
					'<0.05'
				)
				.fromTo(
					bulletEls,
					{ opacity: 0, y: 12 },
					{ opacity: 1, y: 0, duration: 0.3, stagger: 0.07, ease: 'power2.out' },
					'-=0.15'
				);
		}, 0);
	}

	function closeModal() {
		if (!overlayEl || !cardEl) return;
		activeTl?.kill();
		activeTl = gsap.timeline({
			onComplete: () => {
				open = false;
				activePublicationIndex.update((v) => (v === index ? null : v));
			}
		});
		activeTl
			.to(cardEl, { opacity: 0, scale: 0.9, y: 10, duration: 0.25, ease: 'power2.in' })
			.to(overlayEl, { opacity: 0, duration: 0.25, ease: 'power2.in' }, '<');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) closeModal();
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.isConnected) node.remove();
			}
		};
	}

	onMount(() => {
		const unsub = activePublicationIndex.subscribe((activeIdx) => {
			if (open && activeIdx !== null && activeIdx !== index) {
				closeModal();
			}
		});
		window.addEventListener('keydown', handleKeydown);
		return () => {
			unsub();
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<!-- Trigger button -->
<button class="pub-trigger" onclick={openModal} aria-haspopup="dialog">
	<div class="pub-trigger__inner">
		<div class="pub-trigger__text">
			<p class="pub-trigger__title">{pub.title}</p>
			<span class="pub-trigger__meta">{pub.venue} · {pub.year}</span>
		</div>
		<span class="pub-trigger__cta" aria-hidden="true">View →</span>
	</div>
</button>

<!-- Modal -->
{#if open}
	<div
		use:portal
		bind:this={overlayEl}
		class="modal-overlay"
		role="presentation"
		onclick={closeModal}
		onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') closeModal(); }}
	>
		<div
			bind:this={cardEl}
			class="modal-card"
			role="dialog"
			aria-modal="true"
			aria-label={pub.title}
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<button class="modal-close" onclick={closeModal} aria-label="Close">×</button>

			<span class="modal-label">Publication</span>

			<h2 class="modal-title">{pub.title}</h2>

			<div class="modal-links">
				<a href={pub.url} target="_blank" rel="noopener noreferrer" class="modal-link modal-link--ghost">
					arXiv →
				</a>
				{#if pub.officialUrl}
					<a href={pub.officialUrl} target="_blank" rel="noopener noreferrer" class="modal-link modal-link--primary">
						Read Publication →
					</a>
				{/if}
			</div>

			<hr class="modal-divider" />

			<ul class="modal-bullets">
				{#each pub.bullets as bullet, i}
					<li bind:this={bulletEls[i]}>{bullet}</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}

<style>
	/* ── Trigger ──────────────────────────────────── */
	.pub-trigger {
		width: 100%;
		text-align: left;
		padding: 1.5rem 0;
		border-bottom: 1px solid var(--border);
		transition: border-color 0.2s;
		cursor: pointer;
		font-family: inherit;
		background: none;
	}

	.pub-trigger:hover {
		border-color: var(--accent);
	}

	.pub-trigger:hover .pub-trigger__title {
		color: var(--accent);
	}

	.pub-trigger:hover .pub-trigger__cta {
		opacity: 1;
		transform: translateX(0);
	}

	.pub-trigger__inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
	}

	.pub-trigger__text {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.pub-trigger__title {
		font-size: var(--text-base);
		color: var(--text);
		line-height: 1.6;
		transition: color 0.2s;
	}

	.pub-trigger__meta {
		font-size: var(--text-xs);
		color: var(--text-muted);
		letter-spacing: 0.04em;
	}

	.pub-trigger__cta {
		font-size: var(--text-sm);
		color: var(--accent);
		white-space: nowrap;
		opacity: 0;
		transform: translateX(-6px);
		transition: opacity 0.2s, transform 0.2s var(--ease-out-expo);
		flex-shrink: 0;
	}

	/* ── Modal overlay ──────────────────────────── */
	.modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(0, 0, 0, 0.6);
	}

	/* ── Modal card ─────────────────────────────── */
	.modal-card {
		position: relative;
		width: 100%;
		max-width: 640px;
		max-height: 90dvh;
		overflow-y: auto;
		padding: 2.5rem;
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
	}

	:global([data-theme="light"]) .modal-card {
		background: var(--surface);
		border: 1px solid rgba(43, 92, 230, 0.15);
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.15);
	}

	.modal-close {
		position: absolute;
		top: 1.25rem;
		right: 1.25rem;
		font-size: 1.25rem;
		color: var(--text-muted);
		line-height: 1;
		transition: color 0.2s;
		font-family: inherit;
		cursor: pointer;
		background: none;
		border: none;
	}

	.modal-close:hover {
		color: var(--text);
	}

	.modal-label {
		font-size: var(--text-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent);
		display: block;
		margin-bottom: 0.875rem;
	}

	.modal-title {
		font-size: var(--text-xl);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.3;
		color: var(--text);
		margin-bottom: 1.5rem;
		padding-right: 2rem;
	}

	.modal-links {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 1.75rem;
	}

	.modal-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1.4rem;
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: 500;
		letter-spacing: 0.04em;
		transition: transform 0.2s var(--ease-out-expo), opacity 0.2s;
	}

	.modal-link:hover {
		transform: translateY(-2px);
		opacity: 0.9;
	}

	.modal-link--primary {
		background: var(--accent);
		color: var(--bg);
	}

	.modal-link--ghost {
		border: 1px solid var(--accent);
		color: var(--accent);
	}

	.modal-divider {
		border: none;
		border-top: 1px solid var(--border);
		margin-bottom: 1.5rem;
	}

	.modal-bullets {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.modal-bullets li {
		font-size: var(--text-sm);
		color: var(--text-muted);
		line-height: 1.7;
		padding-left: 1.25rem;
		position: relative;
	}

	.modal-bullets li::before {
		content: '→';
		position: absolute;
		left: 0;
		color: var(--accent);
		font-size: 0.75em;
		top: 0.2em;
	}
</style>
