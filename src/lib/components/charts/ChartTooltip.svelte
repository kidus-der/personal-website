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

	/** Gap between the pointer and the near edge of the card. */
	const POINTER_GAP = 12;

	interface Placement {
		/** Horizontal centre, clamped so the card stays inside the wrapper. */
		x: number;
		/** True when the card hangs below the pointer instead of above it. */
		below: boolean;
	}

	let node = $state<HTMLDivElement | null>(null);

	/**
	 * Null until the card has been measured — which never happens on the server,
	 * so the fallback keeps the un-clamped pointer position for the SSR pass.
	 */
	let measured = $state<Placement | null>(null);
	const placement = $derived(measured ?? { x, below: false });

	/**
	 * The card is centred on `x` and sits above `y`. Near an edge that would put
	 * it outside the chart, so clamp the centre and flip it below the pointer.
	 *
	 * Measured from the live box rather than from props, because the card's width
	 * depends on its longest row — which only the browser knows.
	 */
	function computePlacement(el: HTMLElement, at: { x: number; y: number }): Placement {
		const width = el.offsetWidth;
		const height = el.offsetHeight;
		const bounds = (el.offsetParent as HTMLElement | null)?.clientWidth ?? 0;

		// Nothing measurable (SSR, jsdom, `display: none`) — leave it where the
		// chart put it rather than guessing at a correction.
		if (width === 0 || height === 0 || bounds === 0) return { x: at.x, below: false };

		const half = width / 2;
		// A card wider than its wrapper cannot satisfy both edges; centre it
		// rather than letting the clamps cross over.
		const minX = Math.min(half, bounds / 2);
		const maxX = Math.max(minX, bounds - half);

		return {
			x: Math.min(Math.max(at.x, minX), maxX),
			below: at.y < height + POINTER_GAP
		};
	}

	$effect(() => {
		// Position and content both change the answer: the content decides the
		// card's width, which decides the clamp.
		const at = { x, y, visible, label, rows };
		if (!node) return;
		measured = computePlacement(node, at);
	});
</script>

<div
	bind:this={node}
	class="chart-tooltip"
	data-testid="chart-tooltip"
	data-visible={visible}
	data-below={placement.below}
	aria-hidden={!visible}
	style:left="{placement.x}px"
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
		/* Keep the gap in sync with POINTER_GAP in the script. */
		transition:
			opacity 0.15s ease,
			transform 0.15s ease;
	}

	/* No room above the pointer — hang the card underneath it instead. */
	.chart-tooltip[data-below='true'] {
		transform: translate(-50%, 12px);
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
