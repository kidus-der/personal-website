import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import PostCard from '$lib/components/sections/blog/PostCard.svelte';
import type { BlogPost } from '$lib/types/content';
import { resetMotionMocks } from '../mocks/motion';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());

const base: BlogPost = {
	slug: 'shipping-halo',
	title: 'Shipping Halo',
	description: 'On-device deepfake detection for live video calls.',
	publishedAt: '2026-01-14',
	tags: ['engineering'],
	readingTime: 4
};

function setup(post: Partial<BlogPost> = {}, props: Record<string, unknown> = {}) {
	const result = render(PostCard, { props: { post: { ...base, ...post }, ...props } });
	const card = () => result.container.querySelector('.post-card') as HTMLAnchorElement;
	const thumb = () => result.container.querySelector('.post-card__thumb') as HTMLElement;
	return { ...result, card, thumb };
}

describe('PostCard', () => {
	beforeEach(resetMotionMocks);
	afterEach(cleanup);

	it('links the whole card to the post', () => {
		const { card } = setup();
		expect(card().tagName).toBe('A');
		expect(card()).toHaveAttribute('href', '/blog/shipping-halo');
	});

	it('renders the tag, title and description', () => {
		const { container, getByRole, getByText } = setup();
		expect(container.querySelector('.tag')).toHaveTextContent('engineering');
		expect(getByRole('heading', { name: 'Shipping Halo' })).toBeInTheDocument();
		expect(getByText('On-device deepfake detection for live video calls.')).toBeInTheDocument();
	});

	it('omits the tag chip when the post has no tags', () => {
		const { container } = setup({ tags: [] });
		expect(container.querySelector('.tag')).toBeNull();
	});

	it('shows the date and reading time as separate spans', () => {
		const { container, getByText } = setup();
		expect(getByText('Jan 14, 2026')).toBeInTheDocument();
		expect(getByText('4 min read')).toBeInTheDocument();
		const meta = container.querySelector('.post-card__meta') as HTMLElement;
		expect(meta.querySelectorAll('span')).toHaveLength(2);
		expect(meta.textContent).not.toContain('·');
	});

	it('renders the cover image when the post has one', () => {
		const { container } = setup({ coverImage: '/images/halo.png' });
		const image = container.querySelector('.post-card__image') as HTMLImageElement;
		expect(image).toHaveAttribute('src', '/images/halo.png');
	});

	it('marks the cover decorative so the card link is not named twice', () => {
		const { container } = setup({ coverImage: '/images/halo.png' });
		expect(container.querySelector('.post-card__image')).toHaveAttribute('alt', '');
	});

	it('picks a gradient from the palette by index', () => {
		const shades = [0, 1, 2, 3, 4, 5].map((index) => {
			cleanup();
			return setup({}, { index }).thumb().style.getPropertyValue('--thumb-color');
		});

		expect(new Set(shades.slice(0, 5)).size).toBe(5);
		// The palette has five entries, so index 5 repeats index 0.
		expect(shades[5]).toBe(shades[0]);
	});

	it('defaults to the first gradient when no index is given', () => {
		const { thumb } = setup();
		expect(thumb().style.getPropertyValue('--thumb-color')).toBe('var(--chart-1)');
	});

	it('hides the placeholder thumb from assistive tech', () => {
		const { container } = setup();
		expect(container.querySelector('.post-card__placeholder')).toHaveAttribute(
			'aria-hidden',
			'true'
		);
	});
});
