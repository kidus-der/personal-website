<script lang="ts">
	import { page } from '$app/stores';

	type FormState = 'idle' | 'loading' | 'success' | 'error';

	let email: string = $state('');
	let honeypot: string = $state('');
	let formState: FormState = $state('idle');
	let errorMessage: string = $state('');

	// Show success banner if redirected from confirm endpoint
	const redirectedSuccess = $derived($page.url.searchParams.get('subscribed') === '1');

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

<section class="subscribe-section">
	{#if redirectedSuccess}
		<div class="subscribe-section__banner">
			<span class="subscribe-section__check">✓</span>
			You're subscribed! You'll get an email when a new post drops.
		</div>
	{/if}

	<div class="subscribe-section__inner">
		<div class="subscribe-section__copy">
			<h2 class="subscribe-section__heading">Stay in the loop.</h2>
			<p class="subscribe-section__sub">Get an email when a new post drops.</p>
		</div>

		{#if formState === 'success'}
			<p class="subscribe-section__success">
				<span class="subscribe-section__check">✓</span>
				Check your inbox for a confirmation link.
			</p>
		{:else}
			<form class="subscribe-section__form" onsubmit={handleSubmit} novalidate>
				<!-- Honeypot -->
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
					class="subscribe-section__input"
					placeholder="your@email.com"
					bind:value={email}
					disabled={formState === 'loading'}
					required
					aria-label="Email address"
				/>
				<button
					type="submit"
					class="btn btn--primary subscribe-section__btn"
					disabled={formState === 'loading'}
				>
					{formState === 'loading' ? 'Sending…' : 'Subscribe →'}
				</button>
			</form>

			{#if formState === 'error'}
				<p class="subscribe-section__error">{errorMessage}</p>
			{/if}
		{/if}
	</div>
</section>

<style>
	.subscribe-section {
		margin-top: 4rem;
	}

	.subscribe-section__banner {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		background: var(--accent-dim);
		border: 1px solid var(--accent);
		border-radius: var(--radius-lg);
		padding: 0.875rem 1.25rem;
		font-size: var(--text-sm);
		color: var(--text);
		margin-bottom: 1.5rem;
	}

	.subscribe-section__inner {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 2rem 2.5rem;
		display: flex;
		align-items: center;
		gap: 2.5rem;

		@media (max-width: 640px) {
			flex-direction: column;
			align-items: flex-start;
			gap: 1.5rem;
			padding: 1.5rem;
		}
	}

	.subscribe-section__copy {
		flex-shrink: 0;
	}

	.subscribe-section__heading {
		font-size: var(--text-lg);
		font-weight: 600;
		letter-spacing: -0.02em;
		margin-bottom: 0.25rem;
		color: var(--text);
	}

	.subscribe-section__sub {
		font-size: var(--text-sm);
		color: var(--text-muted);
		line-height: 1.6;
	}

	.subscribe-section__form {
		display: flex;
		gap: 0.625rem;
		flex: 1;
		min-width: 0;

		@media (max-width: 640px) {
			flex-direction: column;
			width: 100%;
		}
	}

	.subscribe-section__input {
		flex: 1;
		min-width: 0;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-full);
		padding: 0.625rem 1rem;
		font-size: var(--text-sm);
		color: var(--text);
		outline: none;
		transition: border-color 0.2s;

		&::placeholder {
			color: var(--text-muted);
		}

		&:focus {
			border-color: var(--accent);
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		@media (max-width: 640px) {
			width: 100%;
		}
	}

	.subscribe-section__btn {
		flex-shrink: 0;
		white-space: nowrap;

		@media (max-width: 640px) {
			width: 100%;
			justify-content: center;
		}
	}

	.subscribe-section__success {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: var(--text-sm);
		color: var(--text-muted);
		flex: 1;
	}

	.subscribe-section__check {
		color: var(--accent);
		font-weight: 700;
	}

	.subscribe-section__error {
		font-size: var(--text-xs);
		color: #e05252;
		margin-top: 0.5rem;
		flex-basis: 100%;
	}
</style>
