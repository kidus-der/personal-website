<script lang="ts">
	/**
	 * A radar (spider) chart in the Bklit house style: hairline concentric grid,
	 * one translucent polygon per series, a scale-out-from-centre draw-in, and
	 * hover that glows one series while the rest fade back.
	 *
	 * Series values are percentages (0..100) keyed by metric.
	 */
	import { createDrawProgress } from './drawProgress.svelte';
	import { chartColor, polarToCartesian, radarPoints, type Point } from './math';
	import type { RadarMetric, RadarSeries } from './types';
	import './charts.css';

	interface Props {
		metrics: RadarMetric[];
		data: RadarSeries[];
		/** Width and height of the square viewBox. */
		size?: number;
		/** Concentric grid rings drawn inside the outer edge. */
		levels?: number;
		animate?: boolean;
		/** Draw a dot at each vertex. */
		showPoints?: boolean;
		/** Overrides the summary derived from the data. */
		ariaLabel?: string;
		class?: string;
	}

	let {
		metrics,
		data,
		size = 320,
		levels = 5,
		// Renamed so `animate` keeps referring to the Motion helper.
		animate: animateOnMount = true,
		showPoints = false,
		ariaLabel,
		class: className = ''
	}: Props = $props();

	/**
	 * Fractions of `size`, so a chart at any size keeps the same proportions:
	 * the plot radius, the gap the axis labels sit in, and the vertex dots.
	 */
	const MARGIN_RATIO = 0.1875;
	const LABEL_OFFSET_RATIO = 0.075;
	const POINT_RADIUS_RATIO = 0.01;
	const FILL_OPACITY = 0.2;
	/** Half a unit of slop when deciding whether a label sits on the centre line. */
	const ANCHOR_EPSILON = 0.5;

	const draw = createDrawProgress({ enabled: () => animateOnMount });

	let hoveredIndex = $state<number | null>(null);

	/**
	 * The hovered series, or null when nothing is hovered — and also when `data`
	 * shrank past the hovered index. Without that bounds check the surviving
	 * polygons stay faded forever, because the element that would have fired
	 * `mouseleave` no longer exists.
	 */
	const activeIndex = $derived(
		hoveredIndex !== null && hoveredIndex < data.length ? hoveredIndex : null
	);

	const centre = $derived(size / 2);
	const radius = $derived(Math.max(0, centre - size * MARGIN_RATIO));
	const axisCount = $derived(metrics.length);

	/** Scales a vertex toward the centre by the draw-in progress. */
	function towardCentre(point: Point, cx: number, cy: number, t: number): Point {
		return { x: cx + (point.x - cx) * t, y: cy + (point.y - cy) * t };
	}

	function formatPoints(points: readonly Point[]): string {
		return points.map((p) => `${p.x},${p.y}`).join(' ');
	}

	const gridRings = $derived(
		Array.from({ length: Math.max(0, Math.floor(levels)) }, (_, level) =>
			formatPoints(
				radarPoints(
					Array.from({ length: axisCount }, () => 100),
					axisCount,
					centre,
					centre,
					(radius * (level + 1)) / Math.max(1, Math.floor(levels))
				)
			)
		)
	);

	const axes = $derived(
		metrics.map((metric, index) => ({
			metric,
			vertex: polarToCartesian(centre, centre, radius, (index * 360) / Math.max(1, axisCount)),
			labelAt: polarToCartesian(
				centre,
				centre,
				radius + size * LABEL_OFFSET_RATIO,
				(index * 360) / Math.max(1, axisCount)
			)
		}))
	);

	const series = $derived(
		data.map((entry, index) => {
			const raw = metrics.map((metric) => entry.values[metric.key] ?? 0);
			const points = radarPoints(raw, axisCount, centre, centre, radius).map((point) =>
				towardCentre(point, centre, centre, draw.value)
			);
			return { entry, points, color: entry.color ?? chartColor(index) };
		})
	);

	const pointRadius = $derived(Math.max(2, size * POINT_RADIUS_RATIO));

	/** Labels outside the rim read outward: left of centre right-aligned, and vice versa. */
	function anchorFor(x: number): 'start' | 'middle' | 'end' {
		if (Math.abs(x - centre) < ANCHOR_EPSILON) return 'middle';
		return x > centre ? 'start' : 'end';
	}

	const summary = $derived(
		metrics.length === 0 || data.length === 0
			? 'Radar chart with no data'
			: `Comparison across ${metrics.map((m) => m.label).join(', ')}. ` +
					data
						.map(
							(entry) =>
								`${entry.label}: ` +
								metrics.map((m) => `${m.label} ${entry.values[m.key] ?? 0}`).join(', ')
						)
						.join('. ')
	);
	const label = $derived(ariaLabel ?? summary);
</script>

<div class="radar-chart {className}" style:--radar-size="{size}px">
	<svg viewBox="0 0 {size} {size}" role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg">
		<title>{label}</title>

		{#each gridRings as points, level (level)}
			<polygon
				class="radar-grid-ring"
				{points}
				fill="none"
				stroke="var(--border)"
				stroke-width="1"
			/>
		{/each}

		{#each axes as axis, index (`${axis.metric.key}-${index}`)}
			<line
				class="radar-axis"
				x1={centre}
				y1={centre}
				x2={axis.vertex.x}
				y2={axis.vertex.y}
				stroke="var(--border)"
				stroke-width="1"
			/>
		{/each}

		{#each series as entry, index (`${entry.entry.label}-${index}`)}
			<!-- The parent `role="img"` hides the shapes from assistive tech; the
			     pointer handlers only drive the visual emphasis. -->
			<polygon
				role="presentation"
				class="radar-area chart-series"
				points={formatPoints(entry.points)}
				fill={entry.color}
				fill-opacity={FILL_OPACITY}
				stroke={entry.color}
				stroke-width="2"
				stroke-linejoin="round"
				data-faded={activeIndex !== null && activeIndex !== index}
				style:filter={activeIndex === index ? `drop-shadow(0 0 6px ${entry.color})` : ''}
				onmouseenter={() => (hoveredIndex = index)}
				onmouseleave={() => (hoveredIndex = null)}
			/>
		{/each}

		{#if showPoints}
			{#each series as entry, seriesIndex (`${entry.entry.label}-${seriesIndex}`)}
				{#each entry.points as point, pointIndex (pointIndex)}
					<circle
						class="radar-point chart-series"
						cx={point.x}
						cy={point.y}
						r={pointRadius}
						fill={entry.color}
						data-faded={activeIndex !== null && activeIndex !== seriesIndex}
					/>
				{/each}
			{/each}
		{/if}

		{#each axes as axis, index (`${axis.metric.key}-${index}`)}
			<text
				class="radar-label"
				x={axis.labelAt.x}
				y={axis.labelAt.y}
				text-anchor={anchorFor(axis.labelAt.x)}
				dominant-baseline="middle"
				font-size={Math.max(9, size * 0.034)}
			>
				{axis.metric.label}
			</text>
		{/each}
	</svg>
</div>

<style>
	.radar-chart {
		width: 100%;
		max-width: var(--radar-size);
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.radar-label {
		fill: var(--text-muted);
		font-family: var(--font-mono);
		letter-spacing: 0.01em;
	}
</style>
