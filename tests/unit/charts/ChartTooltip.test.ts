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
