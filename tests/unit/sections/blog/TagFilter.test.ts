import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import TagFilter from '$lib/components/sections/blog/TagFilter.svelte';

const tags = ['Personal', 'Research'];

function setup(props: Record<string, unknown> = {}) {
	const onchange = vi.fn();
	const result = render(TagFilter, { props: { tags, active: null, onchange, ...props } });
	return { ...result, onchange };
}

describe('TagFilter', () => {
	afterEach(cleanup);

	it('renders an "All" chip followed by every tag', () => {
		const { getAllByRole } = setup();
		expect(getAllByRole('button').map((b) => b.textContent?.trim())).toEqual([
			'All',
			'Personal',
			'Research'
		]);
	});

	it('groups the chips under a labelled role', () => {
		const { getByRole } = setup();
		expect(getByRole('group', { name: 'Filter by tag' })).toBeInTheDocument();
	});

	it('marks "All" pressed when nothing is filtered', () => {
		const { getByRole } = setup();
		expect(getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
		expect(getByRole('button', { name: 'Personal' })).toHaveAttribute('aria-pressed', 'false');
	});

	it('marks the active tag pressed', () => {
		const { getByRole } = setup({ active: 'Research' });
		expect(getByRole('button', { name: 'Research' })).toHaveAttribute('aria-pressed', 'true');
		expect(getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
	});

	it('reports the clicked tag', async () => {
		const { getByRole, onchange } = setup();
		await fireEvent.click(getByRole('button', { name: 'Personal' }));
		expect(onchange).toHaveBeenCalledWith('Personal');
	});

	it('reports null when "All" is clicked', async () => {
		const { getByRole, onchange } = setup({ active: 'Personal' });
		await fireEvent.click(getByRole('button', { name: 'All' }));
		expect(onchange).toHaveBeenCalledWith(null);
	});
});
