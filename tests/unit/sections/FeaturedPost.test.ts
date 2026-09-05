import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import FeaturedPost from '$lib/components/sections/blog/FeaturedPost.svelte';
import type { BlogPost } from '$lib/types/content';
import { formatDate } from '$lib/utils/dates';
import { resetMotionMocks } from '../mocks/motion';
import { tilt, resetActionMocks } from '../mocks/actions';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('../mocks/actions')).tilt.module());

const base: BlogPost = {
	slug: 'why-deepfakes-are-hard',
	title: 'Why deepfakes are hard',
	description: 'What three years of forensic model training taught me about generalisation.',
	publishedAt: '2026-03-01',
	tags: ['forensics', 'research'],
	readingTime: 7
};

function setup(post: Partial<BlogPost> = {}, props: Record<string, unknown> = {}) {
	const result = render(FeaturedPost, { props: { post: { ...base, ...post }, ...props } });
	const card = () => result.container.querySelector('.featured-post') as HTMLAnchorElement;
	return { ...result, card };
}

describe('FeaturedPost', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetActionMocks();
	});

	afterEach(cleanup);

	it('links the whole card to the post', () => {
		const { card } = setup();
		expect(card().tagName).toBe('A');
		expect(card()).toHaveAttribute('href', '/blog/why-deepfakes-are-hard');
	});

	it('titles the card at level 2 by default, for a card that follows an h1', () => {
		const { getByRole } = setup();
		expect(getByRole('heading', { level: 2, name: 'Why deepfakes are hard' })).toBeInTheDocument();
	});

	it('drops to level 3 when a section heading already introduces it', () => {
		const { getByRole } = setup({}, { level: 3 });
		expect(getByRole('heading', { level: 3, name: 'Why deepfakes are hard' })).toBeInTheDocument();
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

	it('is a spotlight card, like every other card on the site', () => {
		const { card, container } = setup();
		expect(card()).toHaveClass('spotlight-card');
		expect(card().style.getPropertyValue('--card-color')).toBe('var(--accent)');
		expect(tilt.calls).toHaveLength(1);
		expect(container.querySelector('.spotlight-card__glow')).toBeInTheDocument();
		expect(container.querySelector('.spotlight-card__shimmer')).toBeInTheDocument();
		expect(container.querySelector('.spotlight-card__line')).toBeInTheDocument();
	});

	it('recedes when another card in its group is hovered', () => {
		const { card } = setup({}, { dimmed: true });
		expect(card()).toHaveClass('spotlight-card--dimmed');
	});

	it('reports hover to the parent, so the grid below it can dim', () => {
		const onhoverstart = vi.fn();
		const onhoverend = vi.fn();
		const { card } = setup({}, { onhoverstart, onhoverend });

		card().dispatchEvent(new Event('pointerenter'));
		expect(onhoverstart).toHaveBeenCalledTimes(1);
		card().dispatchEvent(new Event('pointerleave'));
		expect(onhoverend).toHaveBeenCalledTimes(1);
	});

	it('keeps the two-column split inside the card, not on it', () => {
		// The visual has to run to the card's clipped edge while the body is
		// padded, so the grid lives on a child rather than on the card itself.
		const { card, container } = setup();
		const layout = container.querySelector('.featured-post__layout') as HTMLElement;
		expect(layout).toBeInTheDocument();
		expect(card().contains(layout)).toBe(true);
	});
});
