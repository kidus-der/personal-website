<script lang="ts">
	/**
	 * The floating readout a chart shows for whatever the pointer is over.
	 *
	 * Positioned absolutely in pixels, so it must be rendered inside a
	 * `position: relative` wrapper — the chart components own that wrapper and
	 * hand it pointer coordinates relative to it.
	 *
	 * It stays mounted when hidden so the fade-out has something to animate, and
	 * is inert to the pointer so it can never steal the hover that produced it.
	 */
	import type { TooltipRow } from './types';

	interface Props {
		/** The category the rows belong to — a bar's band, a ring's name. */
		label: string;
		rows: TooltipRow[];
		/** Offsets in pixels from the top-left of the positioned wrapper. */
		x: number;
		y: number;
		visible: boolean;
	}

	let { label, rows, x, y, visible }: Props = $props();
</script>

<div
	class="chart-tooltip"
	data-testid="chart-tooltip"
	data-visible={visible}
	aria-hidden={!visible}
	style:left="{x}px"
	style:top="{y}px"
	style:pointer-events="none"
>
	<span class="chart-tooltip-label" data-testid="chart-tooltip-label">{label}</span>
	{#each rows as row, index (`${row.label}-${index}`)}
		<span class="chart-tooltip-row">
			<span class="chart-tooltip-swatch" style:background={row.color}></span>
			<span class="chart-tooltip-row-label">{row.label}</span>
			<span class="chart-tooltip-value">{row.value}</span>
		</span>
	{/each}
</div>

<style>
	.chart-tooltip {
		position: absolute;
		z-index: 2;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 6rem;
		padding: 0.5rem 0.625rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface);
		white-space: nowrap;
		/* Sit above the pointer, horizontally centred on it. */
		transform: translate(-50%, calc(-100% - 12px));
		opacity: 0;
		transition:
			opacity 0.15s ease,
			transform 0.15s ease;
	}

	.chart-tooltip[data-visible='true'] {
		opacity: 1;
	}

	.chart-tooltip-label {
		font-size: 0.6875rem;
		color: var(--text-muted);
	}

	.chart-tooltip-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: var(--text);
	}

	.chart-tooltip-swatch {
		width: 0.5rem;
		height: 0.5rem;
		flex: none;
		border-radius: 2px;
	}

	.chart-tooltip-row-label {
		flex: 1;
	}

	.chart-tooltip-value {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-weight: 500;
	}

	@media (prefers-reduced-motion: reduce) {
		.chart-tooltip {
			transition: none;
		}
	}
</style>
