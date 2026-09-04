/**
 * Bklit-style SVG charts.
 *
 * ```svelte
 * import { RingChart, BarChart, RadarChart } from '$lib/components/charts';
 * ```
 */

export { default as RingChart } from './RingChart.svelte';
export { default as BarChart } from './BarChart.svelte';
export { default as RadarChart } from './RadarChart.svelte';
export { default as ChartTooltip } from './ChartTooltip.svelte';

export {
	polarToCartesian,
	describeArc,
	ringRadius,
	clamp01,
	radarPoints,
	radarPath,
	bandScale,
	DEFAULT_BAND_GAP,
	linearScale,
	niceMax,
	chartColor,
	type Point,
	type BandScale
} from './math';

export type {
	RingDatum,
	BarSeries,
	RadarMetric,
	RadarSeries,
	TooltipRow,
	ValueFormatter
} from './types';
