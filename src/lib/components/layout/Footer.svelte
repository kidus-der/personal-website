<script lang="ts">
	const year = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="footer__inner">
		<p class="footer__copy">&copy; {year} Kidus</p>
	</div>
</footer>

<style>
	.footer {
		padding: 3rem var(--spacing-container);
		border-top: 1px solid var(--border);
		margin-top: auto;
	}

	.footer__inner {
		max-width: 1400px;
		margin: 0 auto;
	}

	.footer__copy {
		font-size: var(--text-xs);
		color: var(--text-muted);
	}
</style>
