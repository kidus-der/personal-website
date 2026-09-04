import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import SectionHeading from '$lib/components/ui/SectionHeading.svelte';

vi.mock('$lib/motion', async () => (await import('../kokonut/motionMock')).motionModule());

const action = createRawSnippet(() => ({ render: () => '<a href="/work">All work</a>' }));

function setup(props: Record<string, unknown> = {}) {
	return render(SectionHeading, { props: { title: 'Selected work', ...props } });
}

describe('SectionHeading', () => {
	afterEach(cleanup);

	it('renders the title as a level-2 heading by default', () => {
		const { getByRole } = setup();
		expect(getByRole('heading', { level: 2, name: 'Selected work' })).toBeInTheDocument();
	});

	it('honours the level prop', () => {
		const { getByRole } = setup({ level: 3 });
		expect(getByRole('heading', { level: 3, name: 'Selected work' })).toBeInTheDocument();
	});

	it('renders the lede when given and omits it otherwise', () => {
		const { container, getByText } = setup({ lede: 'Three projects I keep coming back to.' });
		expect(getByText('Three projects I keep coming back to.')).toBeInTheDocument();

		cleanup();
		const bare = setup();
		expect(bare.container.querySelector('.section-heading__lede')).toBeNull();
		expect(container).toBeTruthy();
	});

	it('renders the action snippet when given', () => {
		const { getByRole, container } = setup({ action });
		expect(getByRole('link', { name: 'All work' })).toBeInTheDocument();
		expect(container.querySelector('.section-heading__action')).toBeInTheDocument();
	});

	it('omits the action slot when no snippet is passed', () => {
		const { container } = setup();
		expect(container.querySelector('.section-heading__action')).toBeNull();
	});

	it('uses sentence case copy verbatim, with no eyebrow label', () => {
		const { container } = setup();
		expect(container.querySelector('.section-heading__eyebrow')).toBeNull();
		expect(container.textContent?.trim()).toBe('Selected work');
	});
});
