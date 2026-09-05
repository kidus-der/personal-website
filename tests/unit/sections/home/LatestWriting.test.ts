import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import LatestWriting from '$lib/components/sections/home/LatestWriting.svelte';
import type { BlogPost } from '$lib/types/content';
import { resetMotionMocks } from '../../mocks/motion';
import { resetActionMocks } from '../../mocks/actions';

vi.mock('$lib/motion', async () => (await import('../../mocks/motion')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('../../mocks/actions')).tilt.module());
vi.mock('$lib/actions/reveal', async () => (await import('../../mocks/actions')).reveal.module());
vi.mock('$lib/actions/magnetic', async () =>
	(await import('../../mocks/actions')).magnetic.module()
);

function post(n: number): BlogPost {
	return {
		slug: `post-${n}`,
		title: `Post ${n}`,
		description: `Description ${n}`,
		publishedAt: `2026-0${n}-01`,
		tags: ['notes']
	};
}

function setup(posts: BlogPost[]) {
	const result = render(LatestWriting, { props: { posts } });
	const featured = () => result.container.querySelector('.featured-post');
	const cards = () => [...result.container.querySelectorAll('.post-card')];
	return { ...result, featured, cards };
}

describe('LatestWriting', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetActionMocks();
	});

	afterEach(cleanup);

	it('heads the band and points at the blog index', () => {
		const { getByRole } = setup([post(1)]);
		expect(getByRole('heading', { name: 'From the Buna Print' })).toBeInTheDocument();
		expect(getByRole('link', { name: 'All posts' })).toHaveAttribute('href', '/blog');
	});

	it('features the newest post and lists the next two beneath it', () => {
		const { featured, cards } = setup([post(1), post(2), post(3)]);
		expect(featured()).toHaveAttribute('href', '/blog/post-1');
		expect(cards().map((card) => card.getAttribute('href'))).toEqual([
			'/blog/post-2',
			'/blog/post-3'
		]);
	});

	it('drops the grid entirely when there is only one post', () => {
		const { featured, cards, container } = setup([post(1)]);
		expect(featured()).toBeInTheDocument();
		expect(cards()).toHaveLength(0);
		expect(container.querySelector('.latest-writing__grid')).toBeNull();
	});

	it('renders nothing at all when there are no posts', () => {
		const { container } = setup([]);
		expect(container.querySelector('.latest-writing')).toBeNull();
	});

	it('dims the whole band but the hovered card, the feature included', async () => {
		const { featured, cards } = setup([post(1), post(2), post(3)]);

		await fireEvent(cards()[0], new Event('pointerenter'));
		expect(featured()).toHaveClass('spotlight-card--dimmed');
		expect(cards()[0]).not.toHaveClass('spotlight-card--dimmed');
		expect(cards()[1]).toHaveClass('spotlight-card--dimmed');

		await fireEvent(cards()[0], new Event('pointerleave'));
		expect(featured()).not.toHaveClass('spotlight-card--dimmed');
		expect(cards()[1]).not.toHaveClass('spotlight-card--dimmed');
	});

	it('dims the small cards when the feature itself is hovered', async () => {
		const { featured, cards } = setup([post(1), post(2), post(3)]);

		await fireEvent(featured() as Element, new Event('pointerenter'));
		expect(featured()).not.toHaveClass('spotlight-card--dimmed');
		expect(cards().every((card) => card.classList.contains('spotlight-card--dimmed'))).toBe(true);
	});

	it('starts with nothing dimmed', () => {
		const { featured, cards } = setup([post(1), post(2), post(3)]);
		expect(featured()).not.toHaveClass('spotlight-card--dimmed');
		expect(cards().some((card) => card.classList.contains('spotlight-card--dimmed'))).toBe(false);
	});
});
