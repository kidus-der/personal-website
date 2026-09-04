import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import ChartTooltip from '$lib/components/charts/ChartTooltip.svelte';

const rows = [
	{ label: 'Papers', value: '8', color: 'var(--chart-1)' },
	{ label: 'Talks', value: '3', color: '#ff0000' }
];

afterEach(cleanup);

describe('ChartTooltip', () => {
	it('renders the label and one row per series', () => {
		const { getByTestId, container } = render(ChartTooltip, {
			props: { label: 'March', rows, x: 0, y: 0, visible: true }
		});
		expect(getByTestId('chart-tooltip-label')).toHaveTextContent('March');
		const rendered = container.querySelectorAll('.chart-tooltip-row');
		expect(rendered).toHaveLength(2);
		expect(rendered[0]).toHaveTextContent('Papers');
		expect(rendered[0]).toHaveTextContent('8');
	});

	it('gives each row a swatch in the series colour', () => {
		const { container } = render(ChartTooltip, {
			props: { label: 'March', rows, x: 0, y: 0, visible: true }
		});
		const swatches = container.querySelectorAll<HTMLElement>('.chart-tooltip-swatch');
		expect(swatches[0].style.background).toContain('var(--chart-1)');
	});

	it('positions itself at the given coordinates', () => {
		const { getByTestId } = render(ChartTooltip, {
			props: { label: 'March', rows, x: 120, y: 40, visible: true }
		});
		const tooltip = getByTestId('chart-tooltip');
		expect(tooltip.style.left).toBe('120px');
		expect(tooltip.style.top).toBe('40px');
	});

	it('stays mounted but hidden when not visible, so it can fade out', () => {
		const { getByTestId } = render(ChartTooltip, {
			props: { label: 'March', rows, x: 0, y: 0, visible: false }
		});
		const tooltip = getByTestId('chart-tooltip');
		expect(tooltip.dataset.visible).toBe('false');
		expect(tooltip).toHaveAttribute('aria-hidden', 'true');
	});

	it('is inert to the pointer so it never steals the hover it describes', () => {
		const { getByTestId } = render(ChartTooltip, {
			props: { label: 'March', rows, x: 0, y: 0, visible: true }
		});
		expect(getByTestId('chart-tooltip').style.pointerEvents).toBe('none');
	});

	it('renders with no rows at all', () => {
		const { container, getByTestId } = render(ChartTooltip, {
			props: { label: 'Empty', rows: [], x: 0, y: 0, visible: true }
		});
		expect(container.querySelectorAll('.chart-tooltip-row')).toHaveLength(0);
		expect(getByTestId('chart-tooltip-label')).toHaveTextContent('Empty');
	});
});

/**
 * jsdom reports every box as 0×0 and every `offsetParent` as null, so the
 * clamp has nothing to measure unless the test supplies it. These stub the two
 * measurements the component actually reads.
 */
function withBox(
	el: HTMLElement,
	card: { width: number; height: number },
	wrapperWidth: number
): void {
	Object.defineProperty(el, 'offsetWidth', { value: card.width, configurable: true });
	Object.defineProperty(el, 'offsetHeight', { value: card.height, configurable: true });
	Object.defineProperty(el, 'offsetParent', {
		value: { clientWidth: wrapperWidth },
		configurable: true
	});
}

describe('ChartTooltip bounds', () => {
	const base = { label: 'March', rows, visible: true };

	it('leaves the position alone when nothing is measurable', () => {
		const { getByTestId } = render(ChartTooltip, { props: { ...base, x: 5, y: 5 } });
		// Unmeasurable (SSR, jsdom, display:none) — guessing would be worse.
		expect(getByTestId('chart-tooltip').style.left).toBe('5px');
		expect(getByTestId('chart-tooltip').dataset.below).toBe('false');
	});

	it('clamps a tooltip that would overflow the left edge', async () => {
		const { getByTestId, rerender } = render(ChartTooltip, { props: { ...base, x: 300, y: 300 } });
		const tooltip = getByTestId('chart-tooltip');
		withBox(tooltip, { width: 120, height: 60 }, 600);

		await rerender({ ...base, x: 4, y: 300 });
		// Centred on x, so the left edge is x - 60; the minimum centre is 60.
		expect(tooltip.style.left).toBe('60px');
	});

	it('clamps a tooltip that would overflow the right edge', async () => {
		const { getByTestId, rerender } = render(ChartTooltip, { props: { ...base, x: 300, y: 300 } });
		const tooltip = getByTestId('chart-tooltip');
		withBox(tooltip, { width: 120, height: 60 }, 600);

		await rerender({ ...base, x: 596, y: 300 });
		expect(tooltip.style.left).toBe('540px');
	});

	it('leaves a comfortably placed tooltip untouched', async () => {
		const { getByTestId, rerender } = render(ChartTooltip, { props: { ...base, x: 300, y: 300 } });
		const tooltip = getByTestId('chart-tooltip');
		withBox(tooltip, { width: 120, height: 60 }, 600);

		await rerender({ ...base, x: 250, y: 300 });
		expect(tooltip.style.left).toBe('250px');
		expect(tooltip.dataset.below).toBe('false');
	});

	it('flips below the pointer when there is no room above', async () => {
		const { getByTestId, rerender } = render(ChartTooltip, { props: { ...base, x: 300, y: 300 } });
		const tooltip = getByTestId('chart-tooltip');
		withBox(tooltip, { width: 120, height: 60 }, 600);

		await rerender({ ...base, x: 300, y: 20 });
		expect(tooltip.dataset.below).toBe('true');

		await rerender({ ...base, x: 300, y: 300 });
		expect(tooltip.dataset.below).toBe('false');
	});

	it('never clamps a card wider than its wrapper off-centre', async () => {
		const { getByTestId, rerender } = render(ChartTooltip, { props: { ...base, x: 300, y: 300 } });
		const tooltip = getByTestId('chart-tooltip');
		// Card wider than the wrapper: the min and max clamps would cross over.
		// It cannot fit either way, so it centres on the wrapper (200 / 2).
		withBox(tooltip, { width: 400, height: 60 }, 200);

		await rerender({ ...base, x: 10, y: 300 });
		expect(tooltip.style.left).toBe('100px');

		await rerender({ ...base, x: 190, y: 300 });
		expect(tooltip.style.left).toBe('100px');
	});
});
