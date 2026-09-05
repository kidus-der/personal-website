import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import Glance from '$lib/components/sections/home/Glance.svelte';
import { education } from '$content/education';
import { publications } from '$content/publications';
import type { BlogPost } from '$lib/types/content';
import { contactModal } from '$lib/state/contact.svelte';
import { animateMock, preferReducedMotion, resetMotionMocks } from '../../mocks/motion';
import { resetActionMocks } from '../../mocks/actions';

vi.mock('$lib/motion', async () => (await import('../../mocks/motion')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('../../mocks/actions')).tilt.module());
vi.mock('$lib/actions/reveal', async () => (await import('../../mocks/actions')).reveal.module());
vi.mock('$lib/actions/magnetic', async () =>
	(await import('../../mocks/actions')).magnetic.module()
);

const latestPost: BlogPost = {
	slug: 'grinding-the-beans',
	title: 'Grinding the beans',
	description: 'Why the Buna Print exists.',
	publishedAt: '2026-08-14',
	tags: ['meta']
};

function setup(props: Record<string, unknown> = { latestPost }) {
	const result = render(Glance, { props });
	const cards = () => [...result.container.querySelectorAll('.bento-card')];
	return { ...result, cards };
}

describe('Glance', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetActionMocks();
		contactModal.close();
	});

	afterEach(() => {
		cleanup();
		contactModal.close();
	});

	it('lays out five tiles when there is a post to show', () => {
		const { cards } = setup();
		expect(cards()).toHaveLength(5);
	});

	it('drops the writing tile — and only that tile — when there is no post', () => {
		const { cards, queryByText } = setup({});
		expect(cards()).toHaveLength(4);
		expect(queryByText('Latest from the Buna Print')).toBeNull();
	});

	it('names the current role and links it to the about page', () => {
		const { getByRole } = setup();
		const card = getByRole('link', { name: /Founding Engineer, Scam AI/ });
		expect(card).toHaveAttribute('href', '/about');
	});

	it('calls out the two shipped systems as chips', () => {
		const { getByText } = setup();
		expect(getByText('Halo with Qualcomm')).toBeInTheDocument();
		expect(getByText('Eva V1.6')).toBeInTheDocument();
	});

	it('links the research tile at the publications list', () => {
		const { getByRole } = setup();
		expect(getByRole('link', { name: /Research/ })).toHaveAttribute('href', '/about#publications');
	});

	it('counts the papers up from zero when motion is allowed', () => {
		setup();
		expect(animateMock).toHaveBeenCalledWith(0, publications.length, expect.anything());
	});

	it('shows the final paper count without counting under reduced motion', () => {
		preferReducedMotion();
		const { container } = setup();
		expect(container.querySelector('.glance__counter')).toHaveTextContent(
			String(publications.length)
		);
		expect(animateMock).not.toHaveBeenCalled();
	});

	it('charts the papers by year', () => {
		const { container } = setup();
		const years = [...container.querySelectorAll('.bar-x-label')].map((n) => n.textContent);
		expect(years).toEqual(['2025', '2026']);
	});

	it('states the degree, school and graduation', () => {
		const { getByText } = setup();
		expect(getByText(education.degree)).toBeInTheDocument();
		expect(getByText(education.school)).toBeInTheDocument();
		expect(getByText('June 2026')).toBeInTheDocument();
	});

	it('shows the latest post with its title, date and link', () => {
		const { getByRole, getByText } = setup();
		expect(getByRole('link', { name: /Latest from the Buna Print/ })).toHaveAttribute(
			'href',
			'/blog/grinding-the-beans'
		);
		expect(getByText('Grinding the beans')).toBeInTheDocument();
		expect(getByText('Aug 14, 2026')).toBeInTheDocument();
	});

	it('opens the shared contact modal from the location tile', async () => {
		const { getByRole } = setup();
		expect(contactModal.open).toBe(false);
		await fireEvent.click(getByRole('button', { name: 'Get in touch' }));
		expect(contactModal.open).toBe(true);
	});
});
