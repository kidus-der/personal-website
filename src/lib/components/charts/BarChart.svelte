<script lang="ts">
	/**
	 * A grouped or stacked bar chart in the Bklit house style: hairline grid,
	 * rounded bar caps, a grow-from-baseline draw-in, and a tooltip that follows
	 * the pointer across the hovered band while the other bands fade back.
	 */
	import { animate, easings, reducedMotion } from '$lib/motion';
	import { bandScale, chartColor, linearScale, niceMax } from './math';
	import ChartTooltip from './ChartTooltip.svelte';
	import type { BarSeries, TooltipRow, ValueFormatter } from './types';

	interface Props {
		data: Record<string, unknown>[];
		/** Row key holding the category label for each band. */
		xKey: string;
		series: BarSeries[];
		/** CSS-style ratio, e.g. `'2 / 1'`. Drives the viewBox height. */
		aspectRatio?: string;
		lineCap?: 'round' | 'butt';
		showGrid?: boolean;
		showXAxis?: boolean;
		animate?: boolean;
		stacked?: boolean;
		formatValue?: ValueFormatter;
		/** Overrides the summary derived from the data. */
		ariaLabel?: string;
		class?: string;
	}

	let {
		data,
		xKey,
		series,
		aspectRatio = '2 / 1',
		lineCap = 'round',
		showGrid = true,
		showXAxis = true,
		// Renamed so `animate` keeps referring to the Motion helper.
		animate: animateOnMount = true,
		stacked = false,
		formatValue = (value: number) => value.toLocaleString(),
		ariaLabel,
		class: className = ''
	}: Props = $props();

	/** All geometry is in viewBox units; the SVG scales to its container. */
	const VIEW_WIDTH = 600;
	const DEFAULT_RATIO = 2;
	const MARGIN = { top: 8, right: 8, bottom: 24, left: 8 } as const;
	/** Fraction of each slot left empty between bands. */
	const BAND_GAP = 0.2;
	/** Fraction of each grouped sub-slot left empty between series. */
	const SERIES_GAP = 0.12;
	const MAX_CORNER_RADIUS = 4;
	const GRID_INTERVALS = 4;
	const DRAW_DURATION = 1.1;

	/** `'16 / 9'` and `'1.78'` are both valid; anything else falls back to 2 / 1. */
	function parseAspectRatio(value: string): number {
		const match = /^\s*(\d*\.?\d+)\s*(?:\/\s*(\d*\.?\d+)\s*)?$/.exec(value);
		if (!match) return DEFAULT_RATIO;
		const width = Number(match[1]);
		const height = match[2] === undefined ? 1 : Number(match[2]);
		if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
			return DEFAULT_RATIO;
		}
		return width / height;
	}

	/**
	 * Bars only grow upward from the baseline, so anything that is not a
	 * positive finite number — missing key, string, negative, NaN — is zero.
	 */
	function toValue(raw: unknown): number {
		return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : 0;
	}

	let progress = $state(0);
	let hoveredBand = $state<number | null>(null);
	let pointer = $state({ x: 0, y: 0 });
	let wrapper = $state<HTMLDivElement | null>(null);

	const viewHeight = $derived(VIEW_WIDTH / parseAspectRatio(aspectRatio));
	const plotWidth = $derived(VIEW_WIDTH - MARGIN.left - MARGIN.right);
	const plotHeight = $derived(viewHeight - MARGIN.top - MARGIN.bottom);
	const baseline = $derived(MARGIN.top + plotHeight);

	const seriesColors = $derived(series.map((s, i) => s.color ?? chartColor(i)));
	const seriesLabels = $derived(series.map((s) => s.label ?? s.key));

	/** Sanitised values, laid out as `[band][series]`. */
	const values = $derived(data.map((row) => series.map((s) => toValue(row[s.key]))));

	const maxValue = $derived(
		niceMax(
			values.reduce((max, row) => {
				const rowMax = stacked
					? row.reduce((sum, v) => sum + v, 0)
					: row.reduce((m, v) => Math.max(m, v), 0);
				return Math.max(max, rowMax);
			}, 0)
		)
	);

	const toHeight = $derived(linearScale([0, maxValue], [0, plotHeight]));
	const bands = $derived(bandScale(data.length, plotWidth, BAND_GAP));

	/** Width of one bar, and the sub-slot it is centred in. */
	const groupStep = $derived(series.length > 0 ? bands.band / series.length : 0);
	const barWidth = $derived(stacked ? bands.band : groupStep * (1 - SERIES_GAP));
	const cornerRadius = $derived(
		lineCap === 'round' ? Math.min(barWidth / 2, MAX_CORNER_RADIUS) : 0
	);

	interface BarRect {
		x: number;
		y: number;
		width: number;
		height: number;
	}

	const bars = $derived(
		values.map((row, bandIndex) => {
			const bandX = MARGIN.left + bands.x(bandIndex);
			let stackedTop = 0;
			return row.map((value, seriesIndex): BarRect => {
				const height = toHeight(value) * progress;
				if (stacked) {
					const y = baseline - stackedTop - height;
					stackedTop += height;
					return { x: bandX, y, width: barWidth, height };
				}
				return {
					x: bandX + seriesIndex * groupStep + (groupStep - barWidth) / 2,
					y: baseline - height,
					width: barWidth,
					height
				};
			});
		})
	);

	const gridLines = $derived(
		showGrid
			? Array.from(
					{ length: GRID_INTERVALS + 1 },
					(_, i) => baseline - (plotHeight * i) / GRID_INTERVALS
				)
			: []
	);

	const categories = $derived(data.map((row) => String(row[xKey] ?? '')));

	/**
	 * The hovered band, or null when nothing is hovered — and also when `data`
	 * shrank while the pointer was down a band that no longer exists, which
	 * would otherwise index past the end of `values`.
	 */
	const activeBand = $derived(
		hoveredBand !== null && hoveredBand < values.length ? hoveredBand : null
	);

	const tooltipRows = $derived<TooltipRow[]>(
		activeBand === null
			? []
			: series.map((s, i) => ({
					label: seriesLabels[i],
					value: formatValue(values[activeBand][i]),
					color: seriesColors[i]
				}))
	);

	const summary = $derived(
		data.length === 0 || series.length === 0
			? 'Bar chart with no data'
			: `${seriesLabels.join(', ')} by ${xKey}. ` +
					categories
						.map(
							(category, bandIndex) =>
								`${category}: ` +
								series
									.map((_, i) => `${seriesLabels[i]} ${formatValue(values[bandIndex][i])}`)
									.join(', ')
						)
						.join('. ')
	);
	const label = $derived(ariaLabel ?? summary);

	function trackPointer(event: MouseEvent, bandIndex: number): void {
		hoveredBand = bandIndex;
		const rect = wrapper?.getBoundingClientRect();
		pointer = {
			x: event.clientX - (rect?.left ?? 0),
			y: event.clientY - (rect?.top ?? 0)
		};
	}

	$effect(() => {
		if (!animateOnMount || reducedMotion()) {
			progress = 1;
			return;
		}
		progress = 0;
		const controls = animate(0, 1, {
			duration: DRAW_DURATION,
			ease: [...easings.outExpo],
			onUpdate: (value: number) => {
				progress = value;
			}
		});
		return () => controls.stop();
	});
</script>

<!-- The wrapper positions the tooltip and is the one place hover is cleared,
     so leaving via a gap between bands still dismisses it. `presentation`
     because the chart's semantics live on the `role="img"` SVG below. -->
<div
	bind:this={wrapper}
	class="bar-chart {className}"
	role="presentation"
	onmouseleave={() => (hoveredBand = null)}
>
	<svg
		viewBox="0 0 {VIEW_WIDTH} {viewHeight}"
		role="img"
		aria-label={label}
		xmlns="http://www.w3.org/2000/svg"
	>
		<title>{label}</title>

		{#each gridLines as y, index (index)}
			<line
				class="bar-grid-line"
				x1={MARGIN.left}
				x2={VIEW_WIDTH - MARGIN.right}
				y1={y}
				y2={y}
				stroke="var(--border)"
				stroke-width="1"
			/>
		{/each}

		{#if activeBand !== null}
			<rect
				class="bar-band-highlight"
				x={MARGIN.left + activeBand * bands.step}
				y={MARGIN.top}
				width={bands.step}
				height={plotHeight}
				fill="var(--text)"
				opacity="0.04"
			/>
		{/if}

		{#each bars as row, bandIndex (bandIndex)}
			{#each row as bar, seriesIndex (series[seriesIndex].key)}
				<rect
					class="bar"
					x={bar.x}
					y={bar.y}
					width={bar.width}
					height={bar.height}
					rx={cornerRadius}
					fill={seriesColors[seriesIndex]}
					data-faded={activeBand !== null && activeBand !== bandIndex}
					style:filter={activeBand === bandIndex
						? `drop-shadow(0 0 6px ${seriesColors[seriesIndex]})`
						: ''}
				/>
			{/each}
		{/each}

		{#if showXAxis}
			{#each categories as category, index (index)}
				<text
					class="bar-x-label"
					x={MARGIN.left + bands.x(index) + bands.band / 2}
					y={viewHeight - 6}
					text-anchor="middle"
					font-size="11"
				>
					{category}
				</text>
			{/each}
		{/if}

		<!-- Transparent full-height hit areas: hovering the gap above a short
		     bar should still open that band's tooltip. -->
		{#each categories as category, index (index)}
			<rect
				role="presentation"
				class="bar-hit"
				data-band={category}
				x={MARGIN.left + index * bands.step}
				y="0"
				width={bands.step}
				height={viewHeight}
				fill="transparent"
				onmouseenter={(event) => trackPointer(event, index)}
				onmousemove={(event) => trackPointer(event, index)}
			/>
		{/each}
	</svg>

	<ChartTooltip
		label={activeBand === null ? '' : categories[activeBand]}
		rows={tooltipRows}
		x={pointer.x}
		y={pointer.y}
		visible={activeBand !== null}
	/>
</div>

<style>
	.bar-chart {
		position: relative;
		width: 100%;
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.bar {
		opacity: 1;
		transition:
			opacity 0.2s ease,
			filter 0.2s ease;
	}

	.bar[data-faded='true'] {
		opacity: 0.3;
	}

	.bar-x-label {
		fill: var(--text-muted);
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
	}

	@media (prefers-reduced-motion: reduce) {
		.bar {
			transition: none;
		}
	}
</style>
