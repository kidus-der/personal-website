import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import RadarChart from '$lib/components/charts/RadarChart.svelte';

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

const metrics = [
	{ key: 'speed', label: 'Speed' },
	{ key: 'accuracy', label: 'Accuracy' },
	{ key: 'cost', label: 'Cost' },
	{ key: 'scale', label: 'Scale' }
];

const data = [
	{ label: 'Ours', values: { speed: 90, accuracy: 80, cost: 40, scale: 70 } },
	{ label: 'Baseline', values: { speed: 50, accuracy: 60, cost: 90, scale: 30 } }
];

function areas(container: HTMLElement): SVGPolygonElement[] {
	return [...container.querySelectorAll<SVGPolygonElement>('.radar-area')];
}

function pointCount(polygon: SVGPolygonElement): number {
	const points = polygon.getAttribute('points')?.trim() ?? '';
	return points === '' ? 0 : points.split(/\s+/).length;
}

function parsePoints(polygon: SVGPolygonElement): { x: number; y: number }[] {
	return (polygon.getAttribute('points')?.trim() ?? '')
		.split(/\s+/)
		.filter(Boolean)
		.map((pair) => {
			const [x, y] = pair.split(',').map(Number);
			return { x, y };
		});
}

beforeEach(() => {
	mocks.reducedMotion.mockReturnValue(false);
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe('RadarChart structure', () => {
	it('renders one polygon per series, each with a point per metric', () => {
		const { container } = render(RadarChart, { props: { metrics, data } });
		const polygons = areas(container);
		expect(polygons).toHaveLength(data.length);
		for (const polygon of polygons) expect(pointCount(polygon)).toBe(metrics.length);
	});

	it('renders the requested number of grid rings', () => {
		const { container } = render(RadarChart, { props: { metrics, data, levels: 3 } });
		expect(container.querySelectorAll('.radar-grid-ring')).toHaveLength(3);
	});

	it('defaults to five grid rings', () => {
		const { container } = render(RadarChart, { props: { metrics, data } });
		expect(container.querySelectorAll('.radar-grid-ring')).toHaveLength(5);
	});

	it('renders one axis spoke and one label per metric', () => {
		const { container } = render(RadarChart, { props: { metrics, data } });
		expect(container.querySelectorAll('.radar-axis')).toHaveLength(metrics.length);
		const labels = [...container.querySelectorAll('.radar-label')].map((n) =>
			n.textContent?.trim()
		);
		expect(labels).toEqual(['Speed', 'Accuracy', 'Cost', 'Scale']);
	});

	it('sizes the viewBox from the size prop', () => {
		const { container } = render(RadarChart, { props: { metrics, data, size: 400 } });
		expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 400 400');
	});

	it('renders no grid rings for a non-positive level count', () => {
		const { container } = render(RadarChart, { props: { metrics, data, levels: 0 } });
		expect(container.querySelectorAll('.radar-grid-ring')).toHaveLength(0);
		expect(areas(container)).toHaveLength(data.length);
	});

	it('renders an empty chart without throwing', () => {
		const { container } = render(RadarChart, { props: { metrics: [], data: [] } });
		expect(areas(container)).toHaveLength(0);
		expect(container.querySelector('svg')).not.toBeNull();
	});

	it('renders the grid with no series', () => {
		const { container } = render(RadarChart, { props: { metrics, data: [] } });
		expect(areas(container)).toHaveLength(0);
		expect(container.querySelectorAll('.radar-axis')).toHaveLength(metrics.length);
	});
});

describe('RadarChart geometry', () => {
	it('places the first vertex at 12 o’clock, scaled by its value', () => {
		const size = 320;
		const { container } = render(RadarChart, {
			props: {
				metrics: [{ key: 'speed', label: 'Speed' }],
				data: [{ label: 'Full', values: { speed: 100 } }],
				size
			}
		});
		const [vertex] = parsePoints(areas(container)[0]);
		const centre = size / 2;
		expect(vertex.x).toBeCloseTo(centre, 3);
		expect(vertex.y).toBeLessThan(centre);
	});

	it('scales a half value to half the radius from the centre', () => {
		const size = 320;
		const centre = size / 2;
		const { container } = render(RadarChart, {
			props: {
				metrics: [{ key: 'speed', label: 'Speed' }],
				data: [
					{ label: 'Full', values: { speed: 100 } },
					{ label: 'Half', values: { speed: 50 } }
				],
				size
			}
		});
		const [full] = parsePoints(areas(container)[0]);
		const [half] = parsePoints(areas(container)[1]);
		expect(centre - half.y).toBeCloseTo((centre - full.y) / 2, 3);
	});

	it('treats a missing, negative or NaN metric as zero', () => {
		const size = 320;
		const centre = size / 2;
		const { container } = render(RadarChart, {
			props: {
				metrics,
				data: [{ label: 'Sparse', values: { speed: -10, accuracy: Number.NaN } }],
				size
			}
		});
		const points = parsePoints(areas(container)[0]);
		expect(points).toHaveLength(metrics.length);
		for (const point of points) {
			expect(point.x).toBeCloseTo(centre, 3);
			expect(point.y).toBeCloseTo(centre, 3);
		}
	});

	it('clamps values above 100 to the outer rim', () => {
		const size = 320;
		const { container } = render(RadarChart, {
			props: {
				metrics: [{ key: 'speed', label: 'Speed' }],
				data: [
					{ label: 'Over', values: { speed: 500 } },
					{ label: 'Full', values: { speed: 100 } }
				],
				size
			}
		});
		expect(parsePoints(areas(container)[0])[0]).toEqual(parsePoints(areas(container)[1])[0]);
	});

	it('emits no NaN coordinates', () => {
		const { container } = render(RadarChart, { props: { metrics, data } });
		for (const polygon of areas(container)) {
			expect(polygon.getAttribute('points')).not.toContain('NaN');
		}
	});

	it('keeps the outer grid ring inside the viewBox', () => {
		const size = 320;
		const { container } = render(RadarChart, { props: { metrics, data, size } });
		const outer = [...container.querySelectorAll<SVGPolygonElement>('.radar-grid-ring')].at(-1)!;
		for (const point of parsePoints(outer)) {
			expect(point.x).toBeGreaterThanOrEqual(0);
			expect(point.x).toBeLessThanOrEqual(size);
			expect(point.y).toBeGreaterThanOrEqual(0);
			expect(point.y).toBeLessThanOrEqual(size);
		}
	});

	it('renders a point marker per vertex when showPoints is set', () => {
		const { container } = render(RadarChart, {
			props: { metrics, data, showPoints: true }
		});
		expect(container.querySelectorAll('.radar-point')).toHaveLength(metrics.length * data.length);
	});

	it('omits point markers by default', () => {
		const { container } = render(RadarChart, { props: { metrics, data } });
		expect(container.querySelectorAll('.radar-point')).toHaveLength(0);
	});
});

describe('RadarChart hover emphasis', () => {
	it('fades the series that are not hovered', async () => {
		const { container } = render(RadarChart, { props: { metrics, data } });
		const polygons = areas(container);
		expect(polygons.every((p) => p.getAttribute('data-faded') === 'false')).toBe(true);

		await fireEvent.mouseEnter(polygons[0]);
		expect(polygons[0].getAttribute('data-faded')).toBe('false');
		expect(polygons[1].getAttribute('data-faded')).toBe('true');
		expect(polygons[0].style.filter).toContain('drop-shadow');

		await fireEvent.mouseLeave(polygons[0]);
		expect(polygons[1].getAttribute('data-faded')).toBe('false');
	});

	it('drops the hover when the hovered series disappears from the data', async () => {
		const { container, rerender } = render(RadarChart, { props: { metrics, data } });
		await fireEvent.mouseEnter(areas(container)[1]);
		expect(areas(container)[0].getAttribute('data-faded')).toBe('true');

		// Without a bounds guard the surviving series stays faded forever:
		// nothing can fire `mouseleave` on the polygon that was removed.
		await rerender({ metrics, data: [data[0]] });
		const remaining = areas(container);
		expect(remaining).toHaveLength(1);
		expect(remaining[0].getAttribute('data-faded')).toBe('false');
		expect(remaining[0].style.filter).toBe('');
	});

	it('also un-fades the vertex dots when the hovered series disappears', async () => {
		const { container, rerender } = render(RadarChart, {
			props: { metrics, data, showPoints: true }
		});
		await fireEvent.mouseEnter(areas(container)[1]);
		await rerender({ metrics, data: [data[0]], showPoints: true });

		const dots = [...container.querySelectorAll('.radar-point')];
		expect(dots).toHaveLength(metrics.length);
		expect(dots.every((dot) => dot.getAttribute('data-faded') === 'false')).toBe(true);
	});
});

describe('RadarChart colours', () => {
	it('falls back to the chart tokens in order', () => {
		const { container } = render(RadarChart, { props: { metrics, data } });
		const polygons = areas(container);
		expect(polygons[0].getAttribute('stroke')).toBe('var(--chart-1)');
		expect(polygons[0].getAttribute('fill')).toBe('var(--chart-1)');
		expect(polygons[1].getAttribute('stroke')).toBe('var(--chart-2)');
	});

	it('fills the area translucently so overlapping series stay readable', () => {
		const { container } = render(RadarChart, { props: { metrics, data } });
		expect(Number(areas(container)[0].getAttribute('fill-opacity'))).toBeCloseTo(0.2, 5);
	});

	it('honours an explicit colour', () => {
		const { container } = render(RadarChart, {
			props: { metrics, data: [{ label: 'Custom', color: '#abcdef', values: {} }] }
		});
		expect(areas(container)[0].getAttribute('stroke')).toBe('#abcdef');
	});

	it('draws the grid and axes with the border token', () => {
		const { container } = render(RadarChart, { props: { metrics, data } });
		for (const node of container.querySelectorAll('.radar-grid-ring, .radar-axis')) {
			expect(node.getAttribute('stroke')).toBe('var(--border)');
		}
	});
});

describe('RadarChart animation', () => {
	it('animates the scale-out from the centre on mount', () => {
		render(RadarChart, { props: { metrics, data } });
		expect(mocks.animate).toHaveBeenCalledTimes(1);
	});

	it('draws the final polygons immediately when motion is reduced', () => {
		mocks.reducedMotion.mockReturnValue(true);
		const size = 320;
		const { container } = render(RadarChart, { props: { metrics, data, size } });
		expect(mocks.animate).not.toHaveBeenCalled();
		const [vertex] = parsePoints(areas(container)[0]);
		expect(vertex.y).toBeLessThan(size / 2);
	});

	it('skips the animation when animate is false', () => {
		render(RadarChart, { props: { metrics, data, animate: false } });
		expect(mocks.animate).not.toHaveBeenCalled();
	});

	it('stops the animation when the chart unmounts', () => {
		const { unmount } = render(RadarChart, { props: { metrics, data } });
		unmount();
		expect(mocks.stop).toHaveBeenCalled();
	});
});

describe('RadarChart accessibility', () => {
	it('describes itself with a derived summary', () => {
		const { container } = render(RadarChart, { props: { metrics, data } });
		const svg = container.querySelector('svg');
		expect(svg?.getAttribute('role')).toBe('img');
		expect(svg?.getAttribute('aria-label')).toContain('Ours');
		expect(svg?.getAttribute('aria-label')).toContain('Speed');
		expect(svg?.querySelector('title')?.textContent).toBe(svg?.getAttribute('aria-label'));
	});

	it('prefers an explicit aria-label', () => {
		const { container } = render(RadarChart, {
			props: { metrics, data, ariaLabel: 'Model comparison' }
		});
		expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Model comparison');
	});
});
