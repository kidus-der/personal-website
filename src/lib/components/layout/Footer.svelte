<script lang="ts">
	const year = new Date().getFullYear();

	const socials = [
		{ href: 'https://github.com/kidus-der', label: 'GitHub' },
		{ href: 'https://linkedin.com/in/kidus-der', label: 'LinkedIn' }
	];
</script>

<footer class="footer">
	<div class="footer__inner">
		<p class="footer__copy">&copy; {year} Kidus</p>
		<nav class="footer__socials" aria-label="Social links">
			{#each socials as social}
				<a href={social.href} target="_blank" rel="noopener noreferrer" class="footer__social-link">
					{social.label}
				</a>
			{/each}
		</nav>
	</div>
</footer>

<style>
	.footer {
		padding: 3rem var(--spacing-container);
		border-top: 1px solid var(--border);
		margin-top: auto;
	}

	.footer__inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1400px;
		margin: 0 auto;
	}

	.footer__copy {
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	.footer__socials {
		display: flex;
		gap: 1.5rem;
	}

	.footer__social-link {
		font-size: var(--text-xs);
		color: var(--text-muted);
		transition: color 0.2s;
		letter-spacing: 0.04em;

		&:hover {
			color: var(--accent);
		}
	}
</style>
