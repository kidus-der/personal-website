import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import BarChart from '$lib/components/charts/BarChart.svelte';

const mocks = vi.hoisted(() => {
	const stop = vi.fn();
	return {
		stop,
		reducedMotion: vi.fn(() => false),
		animate: vi.fn(
			(_from: number, to: number, options?: { onUpdate?: (value: number) => void }) => {
				options?.onUpdate?.(to);
				return { stop };
			}
		)
	};
});

vi.mock('$lib/motion', async () => {
	const config = await vi.importActual<typeof import('$lib/motion/config')>('$lib/motion/config');
	return { ...config, animate: mocks.animate, reducedMotion: mocks.reducedMotion };
});

const data = [
	{ month: 'Jan', reads: 10, shares: 5 },
	{ month: 'Feb', reads: 20, shares: 0 },
	{ month: 'Mar', reads: 40, shares: 15 }
];

const series = [{ key: 'reads' }, { key: 'shares' }];

function bars(container: HTMLElement): SVGRectElement[] {
	return [...container.querySelectorAll<SVGRectElement>('.bar')];
}

function heightOf(bar: SVGRectElement): number {
	return Number(bar.getAttribute('height'));
}

/** Bars are emitted band by band, series within band. */
function barAt(container: HTMLElement, band: number, seriesIndex: number): SVGRectElement {
	return bars(container)[band * series.length + seriesIndex];
}

beforeEach(() => {
	mocks.reducedMotion.mockReturnValue(false);
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe('BarChart structure', () => {
	it('renders one bar per datum per series', () => {
		const { container } = render(BarChart, { props: { data, xKey: 'month', series } });
		expect(bars(container)).toHaveLength(data.length * series.length);
	});

	it('renders an empty chart without throwing', () => {
		const { container } = render(BarChart, { props: { data: [], xKey: 'month', series } });
		expect(bars(container)).toHaveLength(0);
		expect(container.querySelector('svg')).not.toBeNull();
	});

	it('renders nothing plotted when there are no series', () => {
		const { container } = render(BarChart, { props: { data, xKey: 'month', series: [] } });
		expect(bars(container)).toHaveLength(0);
	});

	it('derives the viewBox from the aspect ratio', () => {
		const { container } = render(BarChart, {
			props: { data, xKey: 'month', series, aspectRatio: '1 / 1' }
		});
		expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 600 600');
	});

	it('falls back to 2 / 1 for an unparseable aspect ratio', () => {
		const { container } = render(BarChart, {
			props: { data, xKey: 'month', series, aspectRatio: 'nonsense' }
		});
		expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 600 300');
	});
});

describe('BarChart geometry', () => {
	it('scales bar heights in proportion to their values', () => {
		const { container } = render(BarChart, { props: { data, xKey: 'month', series } });
		const jan = heightOf(barAt(container, 0, 0));
		const feb = heightOf(barAt(container, 1, 0));
		const mar = heightOf(barAt(container, 2, 0));
		expect(feb / jan).toBeCloseTo(2, 5);
		expect(mar / jan).toBeCloseTo(4, 5);
	});

	it('renders a zero value as a zero-height bar rather than a NaN', () => {
		const { container } = render(BarChart, { props: { data, xKey: 'month', series } });
		const zeroBar = barAt(container, 1, 1);
		expect(zeroBar.getAttribute('height')).toBe('0');
		expect(zeroBar.getAttribute('y')).not.toContain('NaN');
	});

	it('treats missing and non-numeric values as zero', () => {
		const { container } = render(BarChart, {
			props: {
				data: [{ month: 'Jan' }, { month: 'Feb', reads: 'oops' }, { month: 'Mar', reads: 10 }],
				xKey: 'month',
				series: [{ key: 'reads' }]
			}
		});
		expect(heightOf(bars(container)[0])).toBe(0);
		expect(heightOf(bars(container)[1])).toBe(0);
		expect(heightOf(bars(container)[2])).toBeGreaterThan(0);
	});

	it('clamps negative values to the baseline', () => {
		const { container } = render(BarChart, {
			props: {
				data: [
					{ month: 'Jan', reads: -5 },
					{ month: 'Feb', reads: 10 }
				],
				xKey: 'month',
				series: [{ key: 'reads' }]
			}
		});
		expect(heightOf(bars(container)[0])).toBe(0);
	});

	it('grows every bar from a shared baseline', () => {
		const { container } = render(BarChart, { props: { data, xKey: 'month', series } });
		const baselines = bars(container).map((bar) => Number(bar.getAttribute('y')) + heightOf(bar));
		for (const baseline of baselines) expect(baseline).toBeCloseTo(baselines[0], 5);
	});

	it('never lets a bar overflow the plot area', () => {
		const { container } = render(BarChart, {
			props: { data, xKey: 'month', series: [{ key: 'reads' }] }
		});
		for (const bar of bars(container)) {
			expect(Number(bar.getAttribute('y'))).toBeGreaterThanOrEqual(0);
			expect(Number(bar.getAttribute('x'))).toBeGreaterThanOrEqual(0);
			expect(Number(bar.getAttribute('x')) + Number(bar.getAttribute('width'))).toBeLessThanOrEqual(
				600
			);
		}
	});

	it('gives grouped bars distinct x positions inside a band', () => {
		const { container } = render(BarChart, { props: { data, xKey: 'month', series } });
		const first = Number(barAt(container, 0, 0).getAttribute('x'));
		const second = Number(barAt(container, 0, 1).getAttribute('x'));
		expect(second).toBeGreaterThan(first);
	});

	it('stacks series on top of one another when stacked', () => {
		const { container } = render(BarChart, {
			props: { data, xKey: 'month', series, stacked: true }
		});
		const lower = barAt(container, 0, 0);
		const upper = barAt(container, 0, 1);
		expect(upper.getAttribute('x')).toBe(lower.getAttribute('x'));
		expect(upper.getAttribute('width')).toBe(lower.getAttribute('width'));
		expect(Number(upper.getAttribute('y')) + heightOf(upper)).toBeCloseTo(
			Number(lower.getAttribute('y')),
			5
		);
	});

	it('rounds bar corners for a round line cap only', () => {
		const { container: round } = render(BarChart, { props: { data, xKey: 'month', series } });
		expect(Number(bars(round)[0].getAttribute('rx'))).toBeGreaterThan(0);
		cleanup();
		const { container: butt } = render(BarChart, {
			props: { data, xKey: 'month', series, lineCap: 'butt' as const }
		});
		expect(Number(bars(butt)[0].getAttribute('rx'))).toBe(0);
	});
});

describe('BarChart chrome', () => {
	it('renders grid lines by default and hides them on request', () => {
		const { container } = render(BarChart, { props: { data, xKey: 'month', series } });
		expect(container.querySelectorAll('.bar-grid-line').length).toBeGreaterThan(0);
		cleanup();
		const { container: bare } = render(BarChart, {
			props: { data, xKey: 'month', series, showGrid: false }
		});
		expect(bare.querySelectorAll('.bar-grid-line')).toHaveLength(0);
	});

	it('labels the x axis with the category values', () => {
		const { container } = render(BarChart, { props: { data, xKey: 'month', series } });
		const labels = [...container.querySelectorAll('.bar-x-label')].map((n) =>
			n.textContent?.trim()
		);
		expect(labels).toEqual(['Jan', 'Feb', 'Mar']);
	});

	it('hides the x axis on request', () => {
		const { container } = render(BarChart, {
			props: { data, xKey: 'month', series, showXAxis: false }
		});
		expect(container.querySelectorAll('.bar-x-label')).toHaveLength(0);
	});

	it('stringifies a non-string category value', () => {
		const { container } = render(BarChart, {
			props: { data: [{ month: 2024, reads: 3 }], xKey: 'month', series: [{ key: 'reads' }] }
		});
		expect(container.querySelector('.bar-x-label')?.textContent?.trim()).toBe('2024');
	});
});

describe('BarChart tooltip', () => {
	it('stays hidden until a band is hovered', () => {
		const { getByTestId } = render(BarChart, { props: { data, xKey: 'month', series } });
		expect(getByTestId('chart-tooltip').dataset.visible).toBe('false');
	});

	it('shows the band label and every series value on hover', async () => {
		const { container, getByTestId } = render(BarChart, {
			props: { data, xKey: 'month', series: [{ key: 'reads', label: 'Reads' }, { key: 'shares' }] }
		});
		const hit = container.querySelectorAll('.bar-hit')[2];
		await fireEvent.mouseMove(hit, { clientX: 140, clientY: 60 });

		const tooltip = getByTestId('chart-tooltip');
		expect(tooltip.dataset.visible).toBe('true');
		expect(getByTestId('chart-tooltip-label')).toHaveTextContent('Mar');
		const rows = tooltip.querySelectorAll('.chart-tooltip-row');
		expect(rows).toHaveLength(2);
		expect(rows[0]).toHaveTextContent('Reads');
		expect(rows[0]).toHaveTextContent('40');
		// A series with no explicit label falls back to its key.
		expect(rows[1]).toHaveTextContent('shares');
	});

	it('follows the pointer inside the wrapper', async () => {
		const { container, getByTestId } = render(BarChart, {
			props: { data, xKey: 'month', series }
		});
		await fireEvent.mouseMove(container.querySelectorAll('.bar-hit')[0], {
			clientX: 140,
			clientY: 60
		});
		const tooltip = getByTestId('chart-tooltip');
		expect(tooltip.style.left).toBe('140px');
		expect(tooltip.style.top).toBe('60px');
	});

	it('hides again when the pointer leaves the plot', async () => {
		const { container, getByTestId } = render(BarChart, {
			props: { data, xKey: 'month', series }
		});
		const hit = container.querySelectorAll('.bar-hit')[0];
		await fireEvent.mouseMove(hit, { clientX: 10, clientY: 10 });
		await fireEvent.mouseLeave(container.querySelector('.bar-chart')!);
		expect(getByTestId('chart-tooltip').dataset.visible).toBe('false');
	});

	it('drops the hover when the hovered band disappears from the data', async () => {
		const { container, getByTestId, rerender } = render(BarChart, {
			props: { data, xKey: 'month', series }
		});
		await fireEvent.mouseMove(container.querySelectorAll('.bar-hit')[2], {
			clientX: 10,
			clientY: 10
		});
		expect(getByTestId('chart-tooltip').dataset.visible).toBe('true');

		await rerender({ data: [data[0]], xKey: 'month', series });
		expect(getByTestId('chart-tooltip').dataset.visible).toBe('false');
		expect(container.querySelector('.bar-band-highlight')).toBeNull();
	});
});

describe('BarChart hover emphasis', () => {
	it('fades the bands that are not hovered', async () => {
		const { container } = render(BarChart, { props: { data, xKey: 'month', series } });
		expect(bars(container).every((bar) => bar.getAttribute('data-faded') === 'false')).toBe(true);

		await fireEvent.mouseMove(container.querySelectorAll('.bar-hit')[0], {
			clientX: 10,
			clientY: 10
		});
		expect(barAt(container, 0, 0).getAttribute('data-faded')).toBe('false');
		expect(barAt(container, 1, 0).getAttribute('data-faded')).toBe('true');
		expect(barAt(container, 0, 0).style.filter).toContain('drop-shadow');
	});

	it('highlights the hovered band', async () => {
		const { container } = render(BarChart, { props: { data, xKey: 'month', series } });
		expect(container.querySelector('.bar-band-highlight')).toBeNull();
		await fireEvent.mouseMove(container.querySelectorAll('.bar-hit')[1], {
			clientX: 10,
			clientY: 10
		});
		expect(container.querySelector('.bar-band-highlight')).not.toBeNull();
	});
});

describe('BarChart colours', () => {
	it('falls back to the chart tokens per series, not per bar', () => {
		const { container } = render(BarChart, { props: { data, xKey: 'month', series } });
		expect(barAt(container, 0, 0).getAttribute('fill')).toBe('var(--chart-1)');
		expect(barAt(container, 0, 1).getAttribute('fill')).toBe('var(--chart-2)');
		expect(barAt(container, 2, 0).getAttribute('fill')).toBe('var(--chart-1)');
	});

	it('honours an explicit series colour', () => {
		const { container } = render(BarChart, {
			props: { data, xKey: 'month', series: [{ key: 'reads', color: '#00ff00' }] }
		});
		expect(bars(container)[0].getAttribute('fill')).toBe('#00ff00');
	});
});

describe('BarChart animation', () => {
	it('animates the grow-in on mount', () => {
		render(BarChart, { props: { data, xKey: 'month', series } });
		expect(mocks.animate).toHaveBeenCalledTimes(1);
	});

	it('draws the final heights immediately when motion is reduced', () => {
		mocks.reducedMotion.mockReturnValue(true);
		const { container } = render(BarChart, { props: { data, xKey: 'month', series } });
		expect(mocks.animate).not.toHaveBeenCalled();
		expect(heightOf(barAt(container, 2, 0))).toBeGreaterThan(0);
	});

	it('skips the animation when animate is false', () => {
		const { container } = render(BarChart, {
			props: { data, xKey: 'month', series, animate: false }
		});
		expect(mocks.animate).not.toHaveBeenCalled();
		expect(heightOf(barAt(container, 2, 0))).toBeGreaterThan(0);
	});

	it('stops the animation when the chart unmounts', () => {
		const { unmount } = render(BarChart, { props: { data, xKey: 'month', series } });
		unmount();
		expect(mocks.stop).toHaveBeenCalled();
	});
});

describe('BarChart accessibility', () => {
	it('describes itself with a derived summary', () => {
		const { container } = render(BarChart, { props: { data, xKey: 'month', series } });
		const svg = container.querySelector('svg');
		expect(svg?.getAttribute('role')).toBe('img');
		expect(svg?.getAttribute('aria-label')).toContain('reads');
		expect(svg?.getAttribute('aria-label')).toContain('Jan');
		expect(svg?.querySelector('title')?.textContent).toBe(svg?.getAttribute('aria-label'));
	});

	it('prefers an explicit aria-label', () => {
		const { container } = render(BarChart, {
			props: { data, xKey: 'month', series, ariaLabel: 'Monthly reads' }
		});
		expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Monthly reads');
	});
});
