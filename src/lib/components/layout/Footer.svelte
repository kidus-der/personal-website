<!--
	Footer — three columns, a wordmark, and the fine print.

	The newsletter form speaks the same protocol as the blog's `SubscribeSection`
	(`POST /api/subscribe` with a `website` honeypot); this is the compact,
	always-present entry point, that one is the full-width invitation at the end
	of the blog index.
-->
<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { navItems } from './navItems';
	import { site } from '$content/site';
	import { createSubscribeForm } from '$lib/state/subscribeForm.svelte';

	const year = new Date().getFullYear();

	const elsewhere = [
		{ label: 'GitHub', href: site.socials.github },
		{ label: 'LinkedIn', href: site.socials.linkedin },
		{ label: 'Google Scholar', href: site.socials.scholar },
		{ label: 'Email', href: `mailto:${site.email}` }
	];

	const form = createSubscribeForm();

	const successMessage = $derived(
		form.status === 'success' ? 'Check your inbox for a confirmation link.' : ''
	);
</script>

<footer class="footer">
	<div class="container">
		<div class="footer__columns">
			<section class="footer__column">
				<h2 class="footer__heading">Navigate</h2>
				<nav class="footer__links" aria-label="Navigate">
					{#each navItems as item (item.href)}
						<a class="footer__link" href={item.href}>{item.label}</a>
					{/each}
				</nav>
			</section>

			<section class="footer__column">
				<h2 class="footer__heading">Elsewhere</h2>
				<nav class="footer__links" aria-label="Elsewhere">
					{#each elsewhere as item (item.label)}
						<a
							class="footer__link"
							href={item.href}
							target={item.href.startsWith('mailto:') ? undefined : '_blank'}
							rel={item.href.startsWith('mailto:') ? undefined : 'noreferrer noopener'}
						>
							{item.label}
						</a>
					{/each}
				</nav>
			</section>

			<section class="footer__column footer__column--wide">
				<h2 class="footer__heading">Newsletter</h2>
				<p class="footer__lede">Occasional notes from the Buna Print</p>

				{#if form.status !== 'success'}
					<form class="footer__form" onsubmit={form.submit} novalidate>
						<input
							class="footer__honeypot"
							type="text"
							name="website"
							tabindex="-1"
							autocomplete="off"
							aria-hidden="true"
							bind:value={form.honeypot}
						/>
						<!-- Named for screen readers; the placeholder carries the visual hint. -->
						<label class="visually-hidden" for="footer-subscribe-email">Email address</label>
						<input
							id="footer-subscribe-email"
							class="footer__input"
							type="email"
							required
							placeholder="you@example.com"
							disabled={form.status === 'loading'}
							bind:value={form.email}
						/>
						<Button type="submit" size="sm" disabled={form.status === 'loading'}>
							{form.status === 'loading' ? 'Sending' : 'Subscribe'}
						</Button>
					</form>
				{/if}

				<!--
					Both live regions are in the DOM from the first render and are filled
					later. A region mounted with its text already in it is inserted, not
					updated, and most screen readers stay silent.
				-->
				<p class="footer__note" role="status">{successMessage}</p>
				<p class="footer__error" role="alert">{form.error}</p>
			</section>
		</div>

		<!-- Texture, not information: the name is already in the copyright line. -->
		<div class="footer__wordmark" aria-hidden="true">Kidus</div>

		<div class="footer__baseline">
			<span>© {year} Kidus Dereje Zewde</span>
			<span>Built with SvelteKit and Motion</span>
		</div>
	</div>
</footer>

<style>
	.footer {
		margin-top: var(--spacing-section);
		border-top: 1px solid var(--border);
		padding-block: 4rem 2rem;
		overflow: hidden;
	}

	.footer__columns {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 2.5rem;
	}

	@media (min-width: 768px) {
		.footer__columns {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.6fr);
		}
	}

	.footer__column {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		min-width: 0;
	}

	.footer__column--wide {
		grid-column: 1 / -1;
	}

	@media (min-width: 768px) {
		.footer__column--wide {
			grid-column: auto;
		}
	}

	.footer__heading {
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-muted);
	}

	.footer__links {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-start;
	}

	.footer__link {
		font-size: var(--text-sm);
		color: var(--text);
		text-decoration: none;
		transition: color 200ms var(--ease-out-expo);
	}

	.footer__link:hover {
		color: var(--accent);
	}

	.footer__lede {
		font-size: var(--text-sm);
		color: var(--text-muted);
		line-height: 1.6;
	}

	.footer__form {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.footer__honeypot {
		display: none;
	}

	.footer__input {
		flex: 1;
		min-width: 12rem;
		height: 2rem;
		padding-inline: 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-input);
		background-color: var(--surface);
		color: var(--text);
		font-family: var(--font-body);
		font-size: var(--text-xs);
	}

	.footer__input::placeholder {
		color: var(--text-muted);
	}

	.footer__input:focus-visible {
		outline: none;
		border-color: var(--accent);
	}

	.footer__input:disabled {
		opacity: 0.6;
	}

	.footer__note,
	.footer__error {
		font-size: var(--text-xs);
		line-height: 1.6;
	}

	.footer__note {
		color: var(--text-muted);
	}

	.footer__error {
		color: var(--accent-strong);
	}

	.footer__wordmark {
		margin-top: 3rem;
		font-family: var(--font-display);
		font-size: clamp(4rem, 14vw, 9rem);
		font-weight: 600;
		letter-spacing: -0.04em;
		line-height: 0.9;
		color: var(--text);
		opacity: 0.08;
		user-select: none;
	}

	.footer__baseline {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem 1.5rem;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.footer__link {
			transition: none;
		}
	}
</style>
