import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import RingChart from '$lib/components/charts/RingChart.svelte';

/**
 * `animate` is replaced with a synchronous stub that jumps straight to the end
 * value, so the rendered attributes are the animation's final state. jsdom has
 * no layout or rAF worth waiting on, so this is the only way to assert geometry.
 */
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
	{ label: 'Papers', value: 8, maxValue: 10 },
	{ label: 'Talks', value: 3, maxValue: 12 }
];

function progressArcs(container: HTMLElement): SVGCircleElement[] {
	return [...container.querySelectorAll<SVGCircleElement>('.ring-progress')];
}

/** The drawn fraction of a ring, read back out of its dash attributes. */
function drawnFraction(arc: SVGCircleElement): number {
	const dashArray = Number(arc.getAttribute('stroke-dasharray'));
	const dashOffset = Number(arc.getAttribute('stroke-dashoffset'));
	return 1 - dashOffset / dashArray;
}

beforeEach(() => {
	mocks.reducedMotion.mockReturnValue(false);
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe('RingChart structure', () => {
	it('renders a track and a progress arc for every datum', () => {
		const { container } = render(RingChart, { props: { data } });
		expect(container.querySelectorAll('.ring-track')).toHaveLength(data.length);
		expect(progressArcs(container)).toHaveLength(data.length);
	});

	it('renders nothing but the empty state for an empty dataset', () => {
		const { container } = render(RingChart, { props: { data: [] } });
		expect(progressArcs(container)).toHaveLength(0);
		expect(container.querySelector('svg')).not.toBeNull();
	});

	it('sizes the viewBox from the size prop', () => {
		const { container } = render(RingChart, { props: { data, size: 240 } });
		expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 240 240');
	});

	it('keeps the outermost ring inside the viewBox', () => {
		const size = 200;
		const strokeWidth = 12;
		const { container } = render(RingChart, {
			props: { data: [...data, { label: 'Third', value: 1, maxValue: 2 }], size, strokeWidth }
		});
		const radii = [...container.querySelectorAll<SVGCircleElement>('.ring-track')].map((c) =>
			Number(c.getAttribute('r'))
		);
		expect(Math.max(...radii) + strokeWidth / 2).toBeLessThanOrEqual(size / 2);
		expect(Math.min(...radii)).toBeGreaterThan(0);
	});
});

describe('RingChart geometry', () => {
	it('draws each arc in proportion to value over maxValue', () => {
		const { container } = render(RingChart, { props: { data } });
		const [papers, talks] = progressArcs(container);
		expect(drawnFraction(papers)).toBeCloseTo(0.8, 5);
		expect(drawnFraction(talks)).toBeCloseTo(0.25, 5);
	});

	it('sets the dash array to the ring circumference', () => {
		const { container } = render(RingChart, { props: { data } });
		const [arc] = progressArcs(container);
		const radius = Number(arc.getAttribute('r'));
		expect(Number(arc.getAttribute('stroke-dasharray'))).toBeCloseTo(2 * Math.PI * radius, 2);
	});

	it('draws nothing for a zero value and a full ring at the maximum', () => {
		const { container } = render(RingChart, {
			props: {
				data: [
					{ label: 'None', value: 0, maxValue: 10 },
					{ label: 'All', value: 10, maxValue: 10 }
				]
			}
		});
		const [none, all] = progressArcs(container);
		expect(drawnFraction(none)).toBeCloseTo(0, 5);
		expect(Number(all.getAttribute('stroke-dashoffset'))).toBeCloseTo(0, 5);
	});

	it('clamps values above the maximum instead of overdrawing', () => {
		const { container } = render(RingChart, {
			props: { data: [{ label: 'Over', value: 30, maxValue: 10 }] }
		});
		expect(drawnFraction(progressArcs(container)[0])).toBeCloseTo(1, 5);
	});

	it('draws nothing for a non-positive or missing maximum rather than emitting NaN', () => {
		const { container } = render(RingChart, {
			props: {
				data: [
					{ label: 'Zero max', value: 5, maxValue: 0 },
					{ label: 'Negative max', value: 5, maxValue: -2 }
				]
			}
		});
		for (const arc of progressArcs(container)) {
			expect(drawnFraction(arc)).toBeCloseTo(0, 5);
			expect(arc.getAttribute('stroke-dashoffset')).not.toContain('NaN');
		}
	});

	it('starts every arc at 12 o’clock', () => {
		const { container } = render(RingChart, { props: { data, size: 200 } });
		for (const arc of progressArcs(container)) {
			expect(arc.getAttribute('transform')).toBe('rotate(-90 100 100)');
		}
	});
});

describe('RingChart centre', () => {
	it('shows the summed value under the centre label', () => {
		const { getByTestId } = render(RingChart, { props: { data, centerLabel: 'Output' } });
		expect(getByTestId('ring-center-value')).toHaveTextContent('11');
		expect(getByTestId('ring-center-label')).toHaveTextContent('Output');
	});

	it('defaults the centre label to Total', () => {
		const { getByTestId } = render(RingChart, { props: { data } });
		expect(getByTestId('ring-center-label')).toHaveTextContent('Total');
	});

	it('swaps the centre to the hovered ring and restores it on leave', async () => {
		const { container, getByTestId } = render(RingChart, { props: { data } });
		const [, talks] = progressArcs(container);

		await fireEvent.mouseEnter(talks);
		expect(getByTestId('ring-center-value')).toHaveTextContent('3');
		expect(getByTestId('ring-center-label')).toHaveTextContent('Talks');

		await fireEvent.mouseLeave(talks);
		expect(getByTestId('ring-center-value')).toHaveTextContent('11');
		expect(getByTestId('ring-center-label')).toHaveTextContent('Total');
	});

	it('formats values with formatValue', () => {
		const { getByTestId } = render(RingChart, {
			props: { data, formatValue: (n: number) => `${n}%` }
		});
		expect(getByTestId('ring-center-value')).toHaveTextContent('11%');
	});
});

describe('RingChart hover emphasis', () => {
	it('fades the rings that are not hovered', async () => {
		const { container } = render(RingChart, { props: { data } });
		const arcs = progressArcs(container);

		expect(arcs.every((arc) => arc.getAttribute('data-faded') === 'false')).toBe(true);

		await fireEvent.mouseEnter(arcs[0]);
		expect(arcs[0].getAttribute('data-faded')).toBe('false');
		expect(arcs[1].getAttribute('data-faded')).toBe('true');
		expect(arcs[0].style.filter).toContain('drop-shadow');
		expect(arcs[1].style.filter).toBe('');
	});
});

describe('RingChart colours', () => {
	it('falls back to the chart tokens in order', () => {
		const { container } = render(RingChart, { props: { data } });
		const arcs = progressArcs(container);
		expect(arcs[0].getAttribute('stroke')).toBe('var(--chart-1)');
		expect(arcs[1].getAttribute('stroke')).toBe('var(--chart-2)');
	});

	it('honours an explicit colour', () => {
		const { container } = render(RingChart, {
			props: { data: [{ label: 'Custom', value: 1, maxValue: 2, color: '#ff0000' }] }
		});
		expect(progressArcs(container)[0].getAttribute('stroke')).toBe('#ff0000');
	});

	it('draws tracks with the border token', () => {
		const { container } = render(RingChart, { props: { data } });
		for (const track of container.querySelectorAll('.ring-track')) {
			expect(track.getAttribute('stroke')).toBe('var(--border)');
		}
	});
});

describe('RingChart animation', () => {
	it('animates the draw-in on mount', () => {
		render(RingChart, { props: { data } });
		expect(mocks.animate).toHaveBeenCalledTimes(1);
		expect(mocks.animate.mock.calls[0][0]).toBe(0);
		expect(mocks.animate.mock.calls[0][1]).toBe(1);
	});

	it('skips the animation and draws the final state when motion is reduced', () => {
		mocks.reducedMotion.mockReturnValue(true);
		const { container } = render(RingChart, { props: { data } });
		expect(mocks.animate).not.toHaveBeenCalled();
		expect(drawnFraction(progressArcs(container)[0])).toBeCloseTo(0.8, 5);
	});

	it('skips the animation when animate is false', () => {
		const { container } = render(RingChart, { props: { data, animate: false } });
		expect(mocks.animate).not.toHaveBeenCalled();
		expect(drawnFraction(progressArcs(container)[0])).toBeCloseTo(0.8, 5);
	});

	it('stops the animation when the chart unmounts', () => {
		const { unmount } = render(RingChart, { props: { data } });
		unmount();
		expect(mocks.stop).toHaveBeenCalled();
	});
});

describe('RingChart accessibility', () => {
	it('describes itself with a derived summary', () => {
		const { container } = render(RingChart, { props: { data } });
		const svg = container.querySelector('svg');
		expect(svg?.getAttribute('role')).toBe('img');
		expect(svg?.getAttribute('aria-label')).toContain('Papers');
		expect(svg?.getAttribute('aria-label')).toContain('8');
		expect(svg?.querySelector('title')?.textContent).toBe(svg?.getAttribute('aria-label'));
	});

	it('prefers an explicit aria-label', () => {
		const { container } = render(RingChart, {
			props: { data, ariaLabel: 'Research output rings' }
		});
		expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe(
			'Research output rings'
		);
	});
});
