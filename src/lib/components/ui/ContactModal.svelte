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

	`aria-modal="true"` is a promise to assistive tech, so the component keeps it:
	Tab cycles inside the card, everything else on the path up to `<body>` is
	`inert` while it is open, and the body stops scrolling behind it. All three
	are undone on close and on unmount, restoring whatever was there before —
	another modal on the page must not have its `inert` marks stolen.

	The network and validation behaviour is unchanged from the GSAP-era version:
	the same payload, the same endpoint, the same error handling. Only the
	presentation and the animation moved.
-->
<script lang="ts">
	import { onDestroy } from 'svelte';
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

	/**
	 * Whether the dialog is in the DOM. Distinct from `open`, which is the
	 * owner's intent: a close sets `open` false immediately and leaves `visible`
	 * true for the length of the exit animation. That gap is also how a re-open
	 * mid-exit is detected — `open` is true again by the time the exit resolves.
	 */
	let visible = $state(false);

	/** Whether the entrance has run for the current opening. */
	let entered = false;
	/**
	 * Bumped on every opening. A submission captures it and checks it again after
	 * the await, so a request that lands after the dialog closed and reopened is
	 * discarded rather than reported into a fresh form. `open` alone cannot say
	 * this: by the time the promise resumes, it may be true again for a *later*
	 * opening.
	 */
	let generation = 0;
	/** Guards against a second close while the exit animation is in flight. */
	let closing = false;
	/** Whatever had focus when the dialog opened; focus goes back there. */
	let opener: HTMLElement | null = null;
	/** Elements this instance marked `inert`, and whether they already were. */
	let inerted: { element: Element; had: boolean }[] = [];
	/** The body's own `overflow` from before the scroll lock, or null when unlocked. */
	let previousOverflow: string | null = null;

	/**
	 * The standard tabbable set. Elements hidden by CSS are not filtered out:
	 * every control in this card is always rendered, and `offsetParent` — the
	 * usual visibility probe — is meaningless in jsdom, so the filter would only
	 * make the trap untestable.
	 */
	const FOCUSABLE = [
		'a[href]',
		'button:not([disabled])',
		'input:not([disabled]):not([type="hidden"])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'[tabindex]:not([tabindex="-1"])'
	].join(',');

	function focusables(): HTMLElement[] {
		if (!cardEl) return [];
		return [...cardEl.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
			(element) => !element.hasAttribute('inert') && !element.hasAttribute('hidden')
		);
	}

	/** Marks everything off the path from `node` up to `<body>` as `inert`. */
	function isolate(node: HTMLElement) {
		let current: HTMLElement | null = node;
		while (current && current !== document.body && current.parentElement) {
			for (const sibling of current.parentElement.children) {
				if (sibling === current || sibling.hasAttribute('inert')) {
					// Already inert — leave it, and leave it alone on release too.
					if (sibling !== current) inerted.push({ element: sibling, had: true });
					continue;
				}
				inerted.push({ element: sibling, had: false });
				sibling.setAttribute('inert', '');
			}
			current = current.parentElement;
		}
	}

	function release() {
		for (const { element, had } of inerted) {
			if (!had) element.removeAttribute('inert');
		}
		inerted = [];
	}

	function lockScroll() {
		if (previousOverflow !== null) return;
		previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
	}

	function unlockScroll() {
		if (previousOverflow === null) return;
		document.body.style.overflow = previousOverflow;
		previousOverflow = null;
	}

	function playEnter() {
		if (reducedMotion() || !cardEl || !overlayEl) return;
		// Spread: Motion normalises the options object it is handed, and both of
		// these are shared module-level tokens.
		animate(
			overlayEl,
			{ opacity: [0, 1] },
			{ duration: durations.base, ease: [...easings.outQuart] }
		);
		animate(cardEl, { opacity: [0, 1], scale: [ENTER_SCALE, 1] }, { ...springs.snappy });
	}

	/** The owner's flag drives mounting; a flag turned off drives the exit. */
	$effect(() => {
		if (open) {
			visible = true;
			return;
		}
		if (visible && !closing) requestClose();
	});

	/** Runs once per opening, as soon as the card is actually in the DOM. */
	$effect(() => {
		if (!visible || !cardEl || !overlayEl || entered) return;
		entered = true;
		generation += 1;
		// Every opening starts from a clean slate, so a submission that finished
		// after the last close cannot greet the next opener with its result.
		status = 'idle';
		errorMsg = '';
		// Read before moving focus into the dialog, or the opener is lost.
		opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		isolate(overlayEl);
		lockScroll();
		cardEl.focus();
		playEnter();
	});

	async function requestClose() {
		if (closing || !visible) return;
		closing = true;
		// Set before the animation: `open` is the owner's intent, and a `show()`
		// during the exit has to be able to flip it back.
		open = false;

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

		if (open) {
			// Re-opened while the exit was running: abandon the close and put the
			// card back rather than tearing down a dialog the user just asked for.
			playEnter();
			cardEl?.focus();
			return;
		}

		release();
		unlockScroll();
		entered = false;
		visible = false;
		if (opener?.isConnected) opener.focus();
		opener = null;
		onclose?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!visible) return;
		if (event.key === 'Escape') {
			requestClose();
			return;
		}
		if (event.key === 'Tab') trapTab(event);
	}

	/** Keeps Tab and Shift+Tab inside the card, wrapping at either end. */
	function trapTab(event: KeyboardEvent) {
		const items = focusables();
		if (items.length === 0) {
			event.preventDefault();
			cardEl?.focus();
			return;
		}
		const first = items[0];
		const last = items[items.length - 1];
		const active = document.activeElement;
		const inside = active instanceof HTMLElement && cardEl?.contains(active);

		if (event.shiftKey) {
			if (!inside || active === first) {
				event.preventDefault();
				last.focus();
			}
			return;
		}
		if (!inside || active === last) {
			event.preventDefault();
			first.focus();
		}
	}

	// Unmounting while open would otherwise leave the page inert and unscrollable.
	onDestroy(() => {
		release();
		unlockScroll();
	});

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
		const submission = generation;
		/** The dialog is still the one that sent this request. */
		const current = () => open && generation === submission;
		status = 'loading';
		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, subject, message })
			});
			const data = await res.json();
			// Closed while the request was in flight: the result belongs to a
			// dialog that is gone, and writing it would surface on the next open.
			if (!current()) return;
			if (!res.ok) {
				status = 'error';
				errorMsg = data.error;
				return;
			}
			status = 'success';
		} catch {
			if (!current()) return;
			status = 'error';
			errorMsg = 'Network error. Please try again.';
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
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
