import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import SelectedWork from '$lib/components/sections/home/SelectedWork.svelte';
import { featuredProjects } from '$content/projects';
import { resetMotionMocks } from '../../mocks/motion';
import { reveal, resetActionMocks } from '../../mocks/actions';

vi.mock('$lib/motion', async () => (await import('../../mocks/motion')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('../../mocks/actions')).tilt.module());
vi.mock('$lib/actions/reveal', async () => (await import('../../mocks/actions')).reveal.module());
vi.mock('$lib/actions/magnetic', async () =>
	(await import('../../mocks/actions')).magnetic.module()
);

function setup() {
	const result = render(SelectedWork);
	const cards = () => [...result.container.querySelectorAll('.spotlight-card')];
	const wrappers = () => [...result.container.querySelectorAll('.project-card')];
	return { ...result, cards, wrappers };
}

describe('SelectedWork', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetActionMocks();
	});

	afterEach(cleanup);

	it('heads the band and points at the full index', () => {
		const { getByRole } = setup();
		expect(getByRole('heading', { name: 'Selected work' })).toBeInTheDocument();
		expect(getByRole('link', { name: 'All projects' })).toHaveAttribute('href', '/work');
	});

	it('renders one card per featured project, each linking to its detail page', () => {
		const { cards } = setup();
		const featured = featuredProjects();
		expect(featured).toHaveLength(3);
		expect(cards().map((card) => card.getAttribute('href'))).toEqual(
			featured.map((project) => `/work/${project.slug}`)
		);
	});

	it('staggers the grid into view', () => {
		setup();
		expect(reveal.calls).toHaveLength(1);
		expect(reveal.calls[0].options).toEqual({ stagger: 0.06 });
	});

	it('dims the siblings of the hovered card, and undims them again', async () => {
		const { cards, wrappers } = setup();
		await fireEvent.pointerEnter(wrappers()[0]);
		expect(cards()[0]).not.toHaveClass('spotlight-card--dimmed');
		expect(cards()[1]).toHaveClass('spotlight-card--dimmed');
		expect(cards()[2]).toHaveClass('spotlight-card--dimmed');

		await fireEvent.pointerLeave(wrappers()[0]);
		expect(cards().every((card) => !card.classList.contains('spotlight-card--dimmed'))).toBe(true);
	});
});
