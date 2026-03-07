<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from '$lib/animation/gsap.config';
	import { cursorTarget } from '$lib/actions/cursor';
	import { magnetic } from '$lib/actions/magnetic';

	interface Props {
		label?: string;
	}

	let { label = 'Get in touch' }: Props = $props();

	let open = $state(false);
	let overlayEl: HTMLDivElement | undefined = $state();
	let cardEl: HTMLDivElement | undefined = $state();
	let status: 'idle' | 'loading' | 'success' | 'error' = $state('idle');
	let errorMsg = $state('');
	let name = $state('');
	let email = $state('');
	let subject = $state('');
	let message = $state('');

	let activeTl: gsap.core.Timeline | null = null;

	function openModal() {
		open = true;
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
				);
		}, 0);
	}

	function closeModal() {
		if (!overlayEl || !cardEl) return;
		activeTl?.kill();
		activeTl = gsap.timeline({
			onComplete: () => {
				open = false;
				status = 'idle';
				errorMsg = '';
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

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		status = 'loading';
		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, subject, message })
			});
			const data = await res.json();
			if (!res.ok) {
				status = 'error';
				errorMsg = data.error;
				return;
			}
			status = 'success';
		} catch {
			status = 'error';
			errorMsg = 'Network error. Please try again.';
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<button class="btn btn--primary" onclick={openModal} use:cursorTarget={'hover'} use:magnetic>
	{label}
</button>

{#if open}
	<div
		use:portal
		bind:this={overlayEl}
		class="modal-overlay"
		role="presentation"
		onclick={closeModal}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') closeModal();
		}}
	>
		<div
			bind:this={cardEl}
			class="modal-card"
			role="dialog"
			aria-modal="true"
			aria-label="Contact form"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<button class="modal-close" onclick={closeModal} aria-label="Close" use:cursorTarget={'hover'}>×</button>

			<span class="modal-label">Contact</span>
			<h2 class="modal-title">Let's build something.</h2>
			<p class="modal-sub">Fill out the form and I'll get back to you.</p>

			{#if status === 'success'}
				<div class="modal-success">
					<span class="modal-success__icon">✓</span>
					<p class="modal-success__heading">Message sent!</p>
					<p class="modal-success__sub">Thanks for reaching out. I'll get back to you soon.</p>
					<button class="btn btn--ghost" onclick={closeModal} use:cursorTarget={'hover'}>Close</button>
				</div>
			{:else}
				<form onsubmit={handleSubmit}>
					<div class="form-row">
						<div class="form-field">
							<label for="contact-name">Name</label>
							<input
								id="contact-name"
								type="text"
								bind:value={name}
								placeholder="Your name"
								required
								autocomplete="name"
							/>
						</div>
						<div class="form-field">
							<label for="contact-email">Email</label>
							<input
								id="contact-email"
								type="email"
								bind:value={email}
								placeholder="you@example.com"
								required
								autocomplete="email"
							/>
						</div>
					</div>

					<div class="form-field">
						<label for="contact-subject">Subject</label>
						<input
							id="contact-subject"
							type="text"
							bind:value={subject}
							placeholder="What's this about?"
							required
						/>
					</div>

					<div class="form-field">
						<label for="contact-message">Message</label>
						<textarea
							id="contact-message"
							bind:value={message}
							rows={5}
							placeholder="Tell me more..."
							required
						></textarea>
					</div>

					<div class="form-footer">
						{#if status === 'error'}
							<p class="form-error">{errorMsg}</p>
						{/if}
						<button
							type="submit"
							class="btn btn--primary"
							class:btn--loading={status === 'loading'}
							disabled={status === 'loading'}
							use:cursorTarget={'hover'}
						>
							{status === 'loading' ? 'Sending…' : 'Send message'}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* ── Trigger ──────────────────────────────────── */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.85rem 2rem;
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: 500;
		letter-spacing: 0.04em;
		transition: background 0.25s, color 0.25s, transform 0.2s var(--ease-out-expo);
		font-family: inherit;
		cursor: none;
	}

	.btn:hover {
		transform: translateY(-2px);
	}

	.btn--primary {
		background: var(--accent);
		color: var(--bg);
		border: none;
	}

	.btn--ghost {
		border: 1px solid var(--border);
		color: var(--text-muted);
		background: none;
	}

	.btn--ghost:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.btn--loading {
		opacity: 0.7;
		pointer-events: none;
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
		cursor: none;
	}

	/* ── Modal card ─────────────────────────────── */
	.modal-card {
		position: relative;
		width: 100%;
		max-width: 560px;
		max-height: 90dvh;
		overflow-y: auto;
		padding: 2.5rem;
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
		cursor: none;
	}

	:global([data-theme='light']) .modal-card {
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
		cursor: none;
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
		margin-bottom: 0.75rem;
	}

	.modal-title {
		font-size: var(--text-xl);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.3;
		color: var(--text);
		margin-bottom: 0.5rem;
		padding-right: 2rem;
	}

	.modal-sub {
		font-size: var(--text-sm);
		color: var(--text-muted);
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	/* ── Form ───────────────────────────────────── */
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	@media (max-width: 540px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 1rem;
	}

	.form-field label {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
	}

	.form-field input,
	.form-field textarea {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0.65rem 0.875rem;
		font-size: var(--text-sm);
		color: var(--text);
		font-family: inherit;
		transition: border-color 0.2s;
		outline: none;
		width: 100%;
	}

	.form-field input::placeholder,
	.form-field textarea::placeholder {
		color: var(--text-muted);
		opacity: 0.6;
	}

	.form-field input:focus,
	.form-field textarea:focus {
		border-color: var(--accent);
	}

	.form-field textarea {
		resize: vertical;
		min-height: 120px;
		line-height: 1.6;
	}

	.form-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.form-error {
		font-size: var(--text-xs);
		color: var(--accent);
		flex: 1;
	}

	/* ── Success state ──────────────────────────── */
	.modal-success {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 2rem 0 0.5rem;
		gap: 0.75rem;
	}

	.modal-success__icon {
		font-size: 2rem;
		color: var(--accent);
		line-height: 1;
	}

	.modal-success__heading {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--text);
	}

	.modal-success__sub {
		font-size: var(--text-sm);
		color: var(--text-muted);
		line-height: 1.6;
		margin-bottom: 1rem;
	}
</style>
