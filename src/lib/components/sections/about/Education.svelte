<!--
	Education — one hairline card. Degree and school on the left, graduation on
	the right, sharing the month spelling the experience timeline uses.
-->
<script lang="ts">
	import { formatMonth } from '$lib/utils/period';
	import type { Education } from '$lib/types/content';

	interface Props {
		education: Education;
	}

	let { education }: Props = $props();
</script>

<div class="education">
	<div class="education__body">
		<h3 class="education__degree">{education.degree}</h3>
		<p class="education__school">{education.school}</p>
		{#if education.detail}
			<p class="education__detail">{education.detail}</p>
		{/if}
	</div>
	<p class="education__graduation">{formatMonth(education.graduation)}</p>
</div>

<style>
	.education {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem 2rem;
		padding: 1.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		background-color: var(--surface);
	}

	.education__body {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.education__degree {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.2;
		color: var(--text);
	}

	.education__school {
		font-size: var(--text-base);
		color: var(--text-muted);
	}

	.education__detail {
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.education__graduation {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--text-muted);
	}
</style>
