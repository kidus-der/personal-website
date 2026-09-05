import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import FeaturedPost from '$lib/components/sections/blog/FeaturedPost.svelte';
import type { BlogPost } from '$lib/types/content';
import { formatDate } from '$lib/utils/dates';
import { resetMotionMocks } from '../mocks/motion';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());

const base: BlogPost = {
	slug: 'why-deepfakes-are-hard',
	title: 'Why deepfakes are hard',
	description: 'What three years of forensic model training taught me about generalisation.',
	publishedAt: '2026-03-01',
	tags: ['forensics', 'research'],
	readingTime: 7
};

function setup(post: Partial<BlogPost> = {}) {
	const result = render(FeaturedPost, { props: { post: { ...base, ...post } } });
	const card = () => result.container.querySelector('.featured-post') as HTMLAnchorElement;
	return { ...result, card };
}

describe('FeaturedPost', () => {
	beforeEach(resetMotionMocks);
	afterEach(cleanup);

	it('links the whole card to the post', () => {
		const { card } = setup();
		expect(card().tagName).toBe('A');
		expect(card()).toHaveAttribute('href', '/blog/why-deepfakes-are-hard');
	});

	it('renders the title and description', () => {
		const { getByRole, getByText } = setup();
		expect(getByRole('heading', { name: 'Why deepfakes are hard' })).toBeInTheDocument();
		expect(
			getByText('What three years of forensic model training taught me about generalisation.')
		).toBeInTheDocument();
	});

	it('renders the first tag as a chip', () => {
		const { container } = setup();
		const tags = [...container.querySelectorAll('.tag')].map((t) => t.textContent?.trim());
		expect(tags).toEqual(['forensics']);
	});

	it('omits the tag chip when the post has no tags', () => {
		const { container } = setup({ tags: [] });
		expect(container.querySelector('.tag')).toBeNull();
	});

	it('formats the published date in the short style', () => {
		const { getByText } = setup();
		expect(getByText(formatDate('2026-03-01', 'short'))).toBeInTheDocument();
		expect(getByText('Mar 1, 2026')).toBeInTheDocument();
	});

	it('shows the reading time as its own span, with no interpunct', () => {
		const { container, getByText } = setup();
		expect(getByText('7 min read')).toBeInTheDocument();
		const meta = container.querySelector('.featured-post__meta') as HTMLElement;
		expect(meta.querySelectorAll('span')).toHaveLength(2);
		expect(meta.textContent).not.toContain('·');
	});

	it('omits the reading time when the post has none', () => {
		const { container } = setup({ readingTime: undefined });
		const meta = container.querySelector('.featured-post__meta') as HTMLElement;
		expect(meta.querySelectorAll('span')).toHaveLength(1);
	});

	it('renders the cover image when the post has one', () => {
		const { container } = setup({ coverImage: '/images/cover.png' });
		const image = container.querySelector('.featured-post__image') as HTMLImageElement;
		expect(image).toHaveAttribute('src', '/images/cover.png');
		expect(container.querySelector('.featured-post__placeholder')).toBeNull();
	});

	it('marks the cover decorative so the card link is not named twice', () => {
		const { container } = setup({ coverImage: '/images/cover.png' });
		expect(container.querySelector('.featured-post__image')).toHaveAttribute('alt', '');
	});

	it('falls back to a warm placeholder when there is no cover', () => {
		const { container } = setup();
		const placeholder = container.querySelector('.featured-post__placeholder') as HTMLElement;
		expect(placeholder).toBeInTheDocument();
		expect(placeholder).toHaveAttribute('aria-hidden', 'true');
		expect(container.querySelector('.featured-post__image')).toBeNull();
	});
});
