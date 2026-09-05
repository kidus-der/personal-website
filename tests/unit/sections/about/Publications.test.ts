import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import Publications from '$lib/components/sections/about/Publications.svelte';
import { publications } from '$content/publications';
import { resetMotionMocks } from '../../mocks/motion';

vi.mock('$lib/motion', async () => (await import('../../mocks/motion')).motionModule());

function setup(items = publications) {
	const result = render(Publications, { props: { items } });
	const headers = () =>
		[...result.container.querySelectorAll('.pub-row__header')] as HTMLButtonElement[];
	const expanded = () => headers().map((h) => h.getAttribute('aria-expanded'));
	return { ...result, headers, expanded };
}

describe('Publications', () => {
	beforeEach(resetMotionMocks);
	afterEach(cleanup);

	it('anchors the section so the bio can link down to it', () => {
		const { container } = setup();
		expect(container.querySelector('section#publications')).toBeInTheDocument();
	});

	it('renders one row per paper', () => {
		const { headers } = setup();
		expect(headers()).toHaveLength(8);
		expect(headers()).toHaveLength(publications.length);
	});

	it('starts with every row collapsed', () => {
		const { expanded } = setup();
		expect(expanded()).toEqual(Array(8).fill('false'));
	});

	it('expands the row that was clicked', async () => {
		const { headers, expanded } = setup();
		await fireEvent.click(headers()[0]);
		expect(expanded()[0]).toBe('true');
		expect(expanded().slice(1)).toEqual(Array(7).fill('false'));
	});

	it('closes the open row when another one is opened', async () => {
		const { headers, expanded } = setup();

		await fireEvent.click(headers()[0]);
		await fireEvent.click(headers()[2]);

		expect(expanded()[0]).toBe('false');
		expect(expanded()[2]).toBe('true');
		expect(expanded().filter((value) => value === 'true')).toHaveLength(1);
	});

	it('collapses a row when its own header is clicked again', async () => {
		const { headers, expanded } = setup();

		await fireEvent.click(headers()[1]);
		expect(expanded()[1]).toBe('true');

		await fireEvent.click(headers()[1]);
		expect(expanded()).toEqual(Array(8).fill('false'));
	});

	it('charts the papers per year beside the intro line', () => {
		const { container, getByText } = setup();
		const chart = container.querySelector('.publications__chart svg[role="img"]');
		expect(chart).toBeInTheDocument();
		expect(getByText('Eight papers on synthetic-media forensics, 2025 to today.')).toBeVisible();
	});

	it('renders nothing but the intro when there are no papers', () => {
		const { headers } = setup([]);
		expect(headers()).toHaveLength(0);
	});
});
