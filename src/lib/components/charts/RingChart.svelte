<script lang="ts">
	/**
	 * Concentric progress rings, in the Bklit house style: hairline tracks, one
	 * `--chart-N` coloured arc per datum, a draw-in on mount, and a centre
	 * readout that swaps to whichever ring the pointer is over.
	 */
	import { createDrawProgress } from './drawProgress.svelte';
	import { chartColor, clamp01, ringRadius } from './math';
	import type { RingDatum, ValueFormatter } from './types';
	import './charts.css';

	interface Props {
		data: RingDatum[];
		/** Width and height of the square viewBox. */
		size?: number;
		strokeWidth?: number;
		/** Empty space between neighbouring ring strokes. */
		ringGap?: number;
		/** Shown under the total when nothing is hovered. */
		centerLabel?: string;
		formatValue?: ValueFormatter;
		animate?: boolean;
		/** Overrides the summary derived from the data. */
		ariaLabel?: string;
		class?: string;
	}

	let {
		data,
		size = 200,
		strokeWidth = 12,
		ringGap = 6,
		centerLabel = 'Total',
		formatValue = (value: number) => value.toLocaleString(),
		// Renamed so `animate` keeps referring to the Motion helper.
		animate: animateOnMount = true,
		ariaLabel,
		class: className = ''
	}: Props = $props();

	const draw = createDrawProgress({ enabled: () => animateOnMount });

	let hoveredIndex = $state<number | null>(null);

	const centre = $derived(size / 2);

	/**
	 * The outermost ring sits exactly inside the viewBox, and the rest step
	 * inward, so any number of rings fits without a hand-tuned inner radius.
	 * Very dense charts clamp rather than collapse through the centre — the fix
	 * there is a larger `size`, not a degenerate layout.
	 */
	const baseInnerRadius = $derived(
		Math.max(
			strokeWidth,
			centre - strokeWidth - Math.max(0, data.length - 1) * (strokeWidth + ringGap)
		)
	);

	const rings = $derived(
		data.map((datum, index) => {
			const radius = ringRadius(index, baseInnerRadius, strokeWidth, ringGap);
			const circumference = 2 * Math.PI * radius;
			// A non-positive maximum has no meaningful fill; draw an empty ring
			// rather than dividing by zero into the `stroke-dashoffset`.
			const fraction = datum.maxValue > 0 ? clamp01(datum.value / datum.maxValue) : 0;
			return {
				datum,
				radius,
				circumference,
				fraction,
				color: datum.color ?? chartColor(index)
			};
		})
	);

	const total = $derived(data.reduce((sum, datum) => sum + (datum.value || 0), 0));

	/**
	 * The hovered ring, or null when nothing is hovered — and also when `data`
	 * shrank past the hovered index. Without that bounds check the surviving
	 * rings stay faded forever, because the element that would have fired
	 * `mouseleave` no longer exists.
	 */
	const activeIndex = $derived(
		hoveredIndex !== null && hoveredIndex < data.length ? hoveredIndex : null
	);
	const hovered = $derived(activeIndex === null ? null : data[activeIndex]);
	const centerValueText = $derived(formatValue(hovered ? hovered.value : total));
	const centerLabelText = $derived(hovered ? hovered.label : centerLabel);

	const summary = $derived(
		data.length === 0
			? 'Ring chart with no data'
			: `${centerLabel} ${formatValue(total)}. ` +
					data
						.map((d) => `${d.label} ${formatValue(d.value)} of ${formatValue(d.maxValue)}`)
						.join(', ')
	);
	const label = $derived(ariaLabel ?? summary);
</script>

<div class="ring-chart {className}" style:--ring-size="{size}px">
	<svg viewBox="0 0 {size} {size}" role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg">
		<title>{label}</title>

		{#each rings as ring, index (`${ring.datum.label}-${index}`)}
			<circle
				class="ring-track"
				cx={centre}
				cy={centre}
				r={ring.radius}
				fill="none"
				stroke="var(--border)"
				stroke-width={strokeWidth}
			/>
		{/each}

		{#each rings as ring, index (`${ring.datum.label}-${index}`)}
			<!-- The parent `role="img"` hides the shapes from assistive tech; the
			     pointer handlers only drive the visual centre readout. -->
			<circle
				role="presentation"
				class="ring-progress chart-series"
				cx={centre}
				cy={centre}
				r={ring.radius}
				fill="none"
				stroke={ring.color}
				stroke-width={strokeWidth}
				stroke-linecap="round"
				stroke-dasharray={ring.circumference}
				stroke-dashoffset={ring.circumference * (1 - ring.fraction * draw.value)}
				transform="rotate(-90 {centre} {centre})"
				data-faded={activeIndex !== null && activeIndex !== index}
				style:filter={activeIndex === index ? `drop-shadow(0 0 6px ${ring.color})` : ''}
				onmouseenter={() => (hoveredIndex = index)}
				onmouseleave={() => (hoveredIndex = null)}
			/>
		{/each}

		<text
			class="ring-center-value"
			data-testid="ring-center-value"
			x={centre}
			y={centre}
			text-anchor="middle"
			font-size={size * 0.15}
		>
			{centerValueText}
		</text>
		<text
			class="ring-center-label"
			data-testid="ring-center-label"
			x={centre}
			y={centre + size * 0.1}
			text-anchor="middle"
			font-size={size * 0.055}
		>
			{centerLabelText}
		</text>
	</svg>
</div>

<style>
	.ring-chart {
		width: 100%;
		max-width: var(--ring-size);
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.ring-center-value {
		fill: var(--text);
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-weight: 500;
		letter-spacing: -0.02em;
		dominant-baseline: middle;
	}

	.ring-center-label {
		fill: var(--text-muted);
		font-family: var(--font-mono);
		letter-spacing: 0.01em;
		dominant-baseline: middle;
	}
</style>
