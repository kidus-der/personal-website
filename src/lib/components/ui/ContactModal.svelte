<!--
	ContactModal — the Resend-backed contact form, in a dialog.

	The component no longer ships its own trigger. Two places on the home page
	open it (the "At a glance" location tile and the contact band), so the open
	flag lives in `$lib/state/contact.svelte` and is bound in by whoever renders
	the single instance. `open` is `$bindable` because the modal closes *itself*:
	the exit animation has to finish before the node leaves the DOM.

	The card is portalled to `<body>`. A `position: fixed` overlay is only
	viewport-relative until an ancestor grows a transform, filter or
	`will-change` — and this page is full of tilting cards — so the dialog is
	moved out from under all of them.

	The network and validation behaviour is unchanged from the GSAP-era version:
	the same payload, the same endpoint, the same error handling. Only the
	presentation and the animation moved.
-->
<script lang="ts">
	import { animate, durations, easings, reducedMotion, springs } from '$lib/motion';
	import Button from './Button.svelte';

	interface Props {
		/** Bound by the owner; the modal sets it back to `false` once it has closed. */
		open?: boolean;
		/** Fired after the exit animation, not when the close is requested. */
		onclose?: () => void;
	}

	let { open = $bindable(false), onclose }: Props = $props();

	/** Enter and exit both scale from here, so the two read as one gesture. */
	const ENTER_SCALE = 0.92;
	const EXIT_SCALE = 0.96;

	let overlayEl = $state<HTMLDivElement | undefined>();
	let cardEl = $state<HTMLDivElement | undefined>();

	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let errorMsg = $state('');
	let name = $state('');
	let email = $state('');
	let subject = $state('');
	let message = $state('');

	/** Whether the entrance has run for the current opening. */
	let entered = false;
	/** Guards against a second close while the exit animation is in flight. */
	let closing = false;
	/** Whatever had focus when the dialog opened; focus goes back there. */
	let opener: HTMLElement | null = null;

	$effect(() => {
		if (open) {
			// `cardEl`/`overlayEl` are read so the effect re-runs once they bind.
			if (entered || !cardEl || !overlayEl) return;
			entered = true;
			// Read before moving focus into the dialog, or the opener is lost.
			opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			cardEl.focus();
			if (reducedMotion()) return;
			// Spread: Motion normalises the options object it is handed, and both
			// of these are shared module-level tokens.
			animate(
				overlayEl,
				{ opacity: [0, 1] },
				{ duration: durations.base, ease: [...easings.outQuart] }
			);
			animate(cardEl, { opacity: [0, 1], scale: [ENTER_SCALE, 1] }, { ...springs.snappy });
			return;
		}

		if (!entered) return;
		entered = false;
		if (opener?.isConnected) opener.focus();
		opener = null;
		// Reset here rather than in `requestClose`, so a close driven from outside
		// — the owner simply setting the flag false — clears the last submission
		// too. The typed fields are deliberately kept: reopening should not have
		// thrown away a half-written message.
		status = 'idle';
		errorMsg = '';
	});

	async function requestClose() {
		if (closing || !open) return;
		closing = true;
		if (!reducedMotion() && cardEl && overlayEl) {
			// The tuple annotation is what makes it a cubic bezier rather than a
			// widened `number[]`, which Motion's `Easing` union does not accept.
			const timing = {
				duration: durations.fast,
				ease: [...easings.outQuart] as [number, number, number, number]
			};
			await Promise.all([
				animate(cardEl, { opacity: [1, 0], scale: [1, EXIT_SCALE] }, timing).finished,
				animate(overlayEl, { opacity: [1, 0] }, timing).finished
			]);
		}
		closing = false;
		// The effect above does the rest of the teardown, whichever way it closed.
		open = false;
		onclose?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) requestClose();
	}

	/**
	 * Moves the node to `<body>`. Svelte removes it again on destroy, but only
	 * from its original parent, so the action has to do the removal itself.
	 */
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
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!--
		The overlay is a backdrop, not a control: it carries `role="presentation"`
		so the click-to-dismiss shortcut never appears in the a11y tree. Escape is
		the keyboard equivalent, handled on the window above — which is the keyboard
		route the rule below asks for, just not bound to this node.
	-->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		use:portal
		bind:this={overlayEl}
		class="contact-modal__overlay"
		data-testid="contact-modal-overlay"
		role="presentation"
		onclick={requestClose}
	>
		<div
			bind:this={cardEl}
			class="contact-modal__card"
			role="dialog"
			aria-modal="true"
			aria-label="Contact form"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<button class="contact-modal__close" onclick={requestClose} aria-label="Close">
				<svg
					viewBox="0 0 16 16"
					width="16"
					height="16"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					aria-hidden="true"
				>
					<path d="m4 4 8 8M12 4l-8 8" />
				</svg>
			</button>

			<h2 class="contact-modal__title">Let's build something.</h2>
			<p class="contact-modal__lede">Send a note and I'll get back to you.</p>

			{#if status === 'success'}
				<div class="contact-modal__success">
					<p class="contact-modal__success-heading">Message sent!</p>
					<p class="contact-modal__success-lede">
						Thanks for reaching out. I'll get back to you soon.
					</p>
					<Button variant="ghost" onclick={requestClose}>Close</Button>
				</div>
			{:else}
				<form data-testid="contact-modal-form" onsubmit={handleSubmit}>
					<div class="contact-modal__row">
						<div class="contact-modal__field">
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
						<div class="contact-modal__field">
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

					<div class="contact-modal__field">
						<label for="contact-subject">Subject</label>
						<input
							id="contact-subject"
							type="text"
							bind:value={subject}
							placeholder="What's this about?"
							required
						/>
					</div>

					<div class="contact-modal__field">
						<label for="contact-message">Message</label>
						<textarea
							id="contact-message"
							bind:value={message}
							rows={5}
							placeholder="A line or two is plenty."
							required
						></textarea>
					</div>

					<div class="contact-modal__footer">
						{#if status === 'error'}
							<p class="contact-modal__error" role="alert">{errorMsg}</p>
						{/if}
						<Button type="submit" disabled={status === 'loading'}>
							{status === 'loading' ? 'Sending…' : 'Send message'}
						</Button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}

<style>
	.contact-modal__overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(1rem, 4vw, 2rem);
		background-color: color-mix(in srgb, var(--bg) 72%, transparent);
		backdrop-filter: blur(6px);
	}

	.contact-modal__card {
		position: relative;
		width: 100%;
		max-width: 34rem;
		max-height: 90dvh;
		overflow-y: auto;
		padding: clamp(1.5rem, 4vw, 2.25rem);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-card);
		background-color: var(--surface-raised);
	}

	.contact-modal__close {
		position: absolute;
		top: 1rem;
		inset-inline-end: 1rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-full);
		color: var(--text-muted);
		transition:
			color 200ms var(--ease-out-expo),
			background-color 200ms var(--ease-out-expo);
	}

	.contact-modal__close:hover,
	.contact-modal__close:focus-visible {
		color: var(--text);
		background-color: var(--surface);
	}

	.contact-modal__title {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.15;
		/* Keeps a long title clear of the close button. */
		padding-inline-end: 2.5rem;
		color: var(--text);
	}

	.contact-modal__lede {
		margin-top: 0.5rem;
		margin-bottom: 1.75rem;
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.contact-modal__row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	@media (min-width: 540px) {
		.contact-modal__row {
			grid-template-columns: 1fr 1fr;
		}
	}

	.contact-modal__field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		margin-bottom: 1rem;
	}

	/* Sentence case, not an all-caps kicker — see the copy rules in the spec. */
	.contact-modal__field label {
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	.contact-modal__field input,
	.contact-modal__field textarea {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-input);
		background-color: var(--bg);
		color: var(--text);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		transition: border-color 200ms var(--ease-out-expo);
	}

	.contact-modal__field input::placeholder,
	.contact-modal__field textarea::placeholder {
		color: var(--text-muted);
		opacity: 0.7;
	}

	.contact-modal__field input:focus,
	.contact-modal__field textarea:focus {
		border-color: var(--accent);
	}

	.contact-modal__field textarea {
		min-height: 7.5rem;
		line-height: 1.6;
		resize: vertical;
	}

	.contact-modal__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.contact-modal__error {
		flex: 1 1 12rem;
		font-size: var(--text-xs);
		color: var(--accent);
	}

	.contact-modal__success {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		padding-block: 0.5rem 0.25rem;
	}

	.contact-modal__success-heading {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--text);
	}

	.contact-modal__success-lede {
		margin-bottom: 1rem;
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.contact-modal__close,
		.contact-modal__field input,
		.contact-modal__field textarea {
			transition: none;
		}
	}
</style>
