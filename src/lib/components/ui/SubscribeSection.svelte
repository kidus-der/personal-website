<!--
	SubscribeSection — the mailing-list card at the foot of the blog.

	The POST goes to `/api/subscribe`, which sends a double opt-in email; the
	confirm endpoint redirects back with `?subscribed=1`, which is what the banner
	reads. The hidden `website` field is a honeypot: a bot that fills it in is
	rejected server-side.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { ParticleButton } from '$lib/components/kokonut';
	import { cn } from '$lib/utils/cn';

	type FormState = 'idle' | 'loading' | 'success' | 'error';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	let email = $state('');
	let honeypot = $state('');
	let formState = $state<FormState>('idle');
	let errorMessage = $state('');

	// Set when the confirm endpoint redirects back after a click-through.
	const redirectedSuccess = $derived(page.url.searchParams.get('subscribed') === '1');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (formState === 'loading') return;

		formState = 'loading';
		errorMessage = '';

		try {
			const res = await fetch('/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, website: honeypot })
			});
			const data = await res.json();

			if (!res.ok) {
				formState = 'error';
				errorMessage = data.error ?? 'Something went wrong. Please try again.';
			} else {
				formState = 'success';
			}
		} catch {
			formState = 'error';
			errorMessage = 'Network error. Please try again.';
		}
	}
</script>

<section class={cn('subscribe', className)}>
	{#if redirectedSuccess}
		<p class="subscribe__banner">You're subscribed. You'll get an email when a new post drops.</p>
	{/if}

	<div class="subscribe__card">
		<div class="subscribe__copy">
			<h2 class="subscribe__heading">Stay in the loop</h2>
			<p class="subscribe__sub">Get an email when a new post drops.</p>
		</div>

		{#if formState === 'success'}
			<p class="subscribe__success">Check your inbox for a confirmation link.</p>
		{:else}
			<form class="subscribe__form" onsubmit={handleSubmit} novalidate>
				<!-- Honeypot: hidden from people and assistive tech, visible to bots. -->
				<input
					type="text"
					name="website"
					tabindex="-1"
					aria-hidden="true"
					autocomplete="off"
					bind:value={honeypot}
					style="display:none"
				/>

				<input
					type="email"
					class="subscribe__input"
					placeholder="your@email.com"
					bind:value={email}
					disabled={formState === 'loading'}
					required
					aria-label="Email address"
				/>
				<ParticleButton type="submit" disabled={formState === 'loading'}>
					{formState === 'loading' ? 'Sending' : 'Subscribe'}
				</ParticleButton>

				{#if formState === 'error'}
					<p class="subscribe__error">{errorMessage}</p>
				{/if}
			</form>
		{/if}
	</div>
</section>

<style>
	.subscribe {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 4rem;
	}

	.subscribe__banner {
		border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
		border-radius: var(--radius-card);
		background-color: var(--accent-dim);
		padding: 0.875rem 1.25rem;
		font-size: var(--text-sm);
		color: var(--text);
	}

	.subscribe__card {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		background-color: var(--surface);
		padding: clamp(1.5rem, 4vw, 2.25rem);
	}

	@media (min-width: 720px) {
		.subscribe__card {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: 2.5rem;
		}
	}

	.subscribe__heading {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text);
	}

	.subscribe__sub {
		margin-top: 0.25rem;
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.subscribe__form {
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
		flex: 1;
		min-width: 0;
	}

	@media (min-width: 720px) {
		.subscribe__form {
			max-width: 26rem;
		}
	}

	.subscribe__input {
		flex: 1;
		min-width: 12rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-input);
		background-color: var(--bg);
		padding: 0.625rem 0.875rem;
		font-family: var(--font-body);
		font-size: var(--text-sm);
		color: var(--text);
		outline: none;
		transition: border-color 200ms var(--ease-out-quart);
	}

	.subscribe__input::placeholder {
		color: var(--text-muted);
	}

	.subscribe__input:focus {
		border-color: var(--accent);
	}

	.subscribe__input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.subscribe__success {
		flex: 1;
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.subscribe__error {
		flex-basis: 100%;
		font-size: var(--text-xs);
		color: var(--accent-strong);
	}

	@media (prefers-reduced-motion: reduce) {
		.subscribe__input {
			transition: none;
		}
	}
</style>
