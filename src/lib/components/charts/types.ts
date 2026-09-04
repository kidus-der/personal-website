/**
 * Data shapes shared by the chart components and their consumers.
 *
 * Kept in one module so a page can type its chart data without importing three
 * `.svelte` files, and so the components agree on the contract by construction.
 */

/** One concentric ring in a {@link RingChart}. */
export interface RingDatum {
	readonly label: string;
	readonly value: number;
	/** The value the ring is full at. Non-positive maxima draw an empty ring. */
	readonly maxValue: number;
	/** Defaults to the `--chart-N` token for the ring's index. */
	readonly color?: string;
}

/** One plotted series in a {@link BarChart}, read out of each row by `key`. */
export interface BarSeries {
	readonly key: string;
	/** Defaults to the `--chart-N` token for the series' index. */
	readonly color?: string;
	/** Legend and tooltip name. Defaults to `key`. */
	readonly label?: string;
}

/** One axis of a {@link RadarChart}. */
export interface RadarMetric {
	readonly key: string;
	readonly label: string;
}

/** One plotted polygon in a {@link RadarChart}. Values are percentages (0..100). */
export interface RadarSeries {
	readonly label: string;
	/** Defaults to the `--chart-N` token for the series' index. */
	readonly color?: string;
	readonly values: Readonly<Record<string, number>>;
}

/** One line of a {@link ChartTooltip} — a colour swatch, a name and a value. */
export interface TooltipRow {
	readonly label: string;
	readonly value: string;
	readonly color: string;
}

/** Formats a raw datum for display. Defaults to `toLocaleString()`. */
export type ValueFormatter = (value: number) => string;
