import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import { createRawSnippet } from 'svelte';
import { scroll } from '$lib/motion';
import { pickNeighbours } from '$lib/utils/posts';
import type { BlogPost } from '$lib/types/content';
import { animateMock, resetMotionMocks } from '../kokonut/motionMock';

vi.mock('$lib/motion', async () => (await import('../kokonut/motionMock')).motionModule());
vi.mock('$app/stores', () => ({
	page: readable({ url: new URL('http://localhost/blog') })
}));
vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/blog'), params: {} }
}));

// Imported after the mocks so the components pick them up.
const BlogListing = (await import('../../../src/routes/blog/+page.svelte')).default;
const BlogPostLayout = (await import('$lib/components/layout/BlogPostLayout.svelte')).default;

const post = (over: Partial<BlogPost> = {}): BlogPost => ({
	slug: 'hello',
	title: 'Hello',
	description: 'An introduction.',
	publishedAt: '2026-03-06',
	tags: ['Personal'],
	readingTime: 4,
	...over
});

/** Newest first, exactly as `loadPosts` returns them. */
const threePosts: BlogPost[] = [
	post({ slug: 'newest', title: 'Newest post', publishedAt: '2026-03-06', tags: ['Personal'] }),
	post({ slug: 'middle', title: 'Middle post', publishedAt: '2026-02-01', tags: ['Research'] }),
	post({ slug: 'oldest', title: 'Oldest post', publishedAt: '2026-01-01', tags: ['Personal'] })
];

describe('pickNeighbours', () => {
	it('returns the newer post as prev and the older as next', () => {
		expect(pickNeighbours(threePosts, 'middle')).toEqual({
			prev: threePosts[0],
			next: threePosts[2]
		});
	});

	it('has no newer neighbour for the newest post', () => {
		expect(pickNeighbours(threePosts, 'newest')).toEqual({ prev: null, next: threePosts[1] });
	});

	it('has no older neighbour for the oldest post', () => {
		expect(pickNeighbours(threePosts, 'oldest')).toEqual({ prev: threePosts[1], next: null });
	});

	it('returns nulls for an unknown slug', () => {
		expect(pickNeighbours(threePosts, 'nope')).toEqual({ prev: null, next: null });
	});

	it('returns nulls for an empty archive', () => {
		expect(pickNeighbours([], 'hello')).toEqual({ prev: null, next: null });
	});
});

describe('blog listing page', () => {
	// The masthead's BeamsBackground reaches for a 2D context jsdom does not
	// implement; it bails out cleanly on null, this just silences the warning.
	// Scoped to this block and restored, so the prototype is left as found —
	// `vi.restoreAllMocks()` is avoided because it would also flatten the shared
	// `$lib/motion` doubles the next describe relies on.
	let getContextSpy: MockInstance;

	beforeEach(() => {
		resetMotionMocks();
		getContextSpy = vi
			.spyOn(HTMLCanvasElement.prototype, 'getContext')
			.mockReturnValue(null) as unknown as MockInstance;
	});
	afterEach(() => {
		cleanup();
		getContextSpy.mockRestore();
	});

	function setup(posts: BlogPost[] = threePosts) {
		return render(BlogListing, { props: { data: { posts } } });
	}

	it('renders the masthead in both scripts', () => {
		const { getByText, container } = setup();
		expect(getByText('The Buna Print')).toBeInTheDocument();
		const amharic = getByText('የቡና እትም');
		expect(amharic).toHaveAttribute('lang', 'am');
		expect(container.textContent).toContain(
			'A home for ideas, perspectives, thoughts, and everything else.'
		);
	});

	it('shows the newest post as the feature and the rest as cards', () => {
		const { container } = setup();
		expect(container.querySelectorAll('.featured-post')).toHaveLength(1);
		expect(container.querySelector('.featured-post')).toHaveAttribute('href', '/blog/newest');
		expect(container.querySelectorAll('.post-card')).toHaveLength(2);
	});

	it('offers one chip per distinct tag plus "All"', () => {
		const { getByRole } = setup();
		const group = getByRole('group', { name: 'Filter by tag' });
		expect([...group.querySelectorAll('button')].map((b) => b.textContent?.trim())).toEqual([
			'All',
			'Personal',
			'Research'
		]);
	});

	it('filters the list down to the clicked tag', async () => {
		const { getByRole, container } = setup();
		await fireEvent.click(getByRole('button', { name: 'Research' }));

		await waitFor(() => {
			expect(container.querySelector('.featured-post')).toHaveAttribute('href', '/blog/middle');
		});
		expect(container.querySelectorAll('.post-card')).toHaveLength(0);
	});

	it('restores the full list when "All" is clicked again', async () => {
		const { getByRole, container } = setup();
		await fireEvent.click(getByRole('button', { name: 'Research' }));
		await fireEvent.click(getByRole('button', { name: 'All' }));
		await waitFor(() => expect(container.querySelectorAll('.post-card')).toHaveLength(2));
	});

	it('says so when the active tag survives a data change that drops it', async () => {
		// Reachable on client-side navigation: the chip selection outlives the load.
		const { getByRole, rerender, findByText } = setup();
		await fireEvent.click(getByRole('button', { name: 'Research' }));
		await rerender({ data: { posts: [post({ slug: 'a', title: 'A', tags: ['Personal'] })] } });
		expect(await findByText('No posts with that tag yet.')).toBeInTheDocument();
	});

	it('shows the empty state when the archive itself is empty', () => {
		const { getByText } = setup([]);
		expect(getByText('No posts yet. Check back soon.')).toBeInTheDocument();
	});

	it('never joins meta with an interpunct', () => {
		const { container } = setup();
		expect(container.textContent).not.toContain('·');
	});
});

describe('BlogPostLayout', () => {
	beforeEach(resetMotionMocks);
	afterEach(cleanup);

	const headings = createRawSnippet(() => ({
		render: () => `<div><h2 id="one">One</h2><h3 id="two">Two</h3><p>Body</p></div>`
	}));
	const single = createRawSnippet(() => ({
		render: () => `<div><h2 id="one">One</h2><p>Body</p></div>`
	}));

	function setup(props: Record<string, unknown> = {}) {
		return render(BlogPostLayout, {
			props: {
				title: 'Hello',
				description: 'An introduction.',
				publishedAt: '2026-03-06',
				tags: ['Personal'],
				readingTime: 4,
				prev: null,
				next: null,
				children: headings,
				...props
			}
		});
	}

	it('renders the title, the long date and the reading time', () => {
		const { getByRole, getByText } = setup();
		expect(getByRole('heading', { level: 1, name: 'Hello' })).toBeInTheDocument();
		expect(getByText('March 6, 2026')).toBeInTheDocument();
		expect(getByText('4 min read')).toBeInTheDocument();
	});

	it('keeps date and reading time as separate spans, not an interpunct string', () => {
		const { container } = setup();
		const meta = container.querySelector('.post-header__meta') as HTMLElement;
		expect(meta.querySelectorAll('span')).toHaveLength(2);
		expect(meta.textContent).not.toContain('·');
	});

	it('links back to the listing', () => {
		const { getByRole } = setup();
		expect(getByRole('link', { name: 'All posts' })).toHaveAttribute('href', '/blog');
	});

	it('renders the tag chips', () => {
		const { container } = setup();
		expect(container.querySelector('.tag')).toHaveTextContent('Personal');
	});

	it('builds a table of contents once there are two or more headings', async () => {
		const { getByRole } = setup();
		const toc = await waitFor(() => getByRole('navigation', { name: 'Table of contents' }));
		expect([...toc.querySelectorAll('a')].map((a) => a.textContent)).toEqual(['One', 'Two']);
		expect(toc.querySelector('a')).toHaveAttribute('href', '#one');
	});

	it('omits the table of contents for a single heading', async () => {
		const { queryByRole } = setup({ children: single });
		await waitFor(() =>
			expect(queryByRole('navigation', { name: 'Table of contents' })).toBeNull()
		);
	});

	it('renders the reading progress bar', () => {
		const { container } = setup();
		expect(container.querySelector('.reading-progress')).toBeInTheDocument();
	});

	it('renders share links for the current url', () => {
		const { getByRole } = setup();
		expect(getByRole('link', { name: /share on x/i }).getAttribute('href')).toContain(
			encodeURIComponent('http://localhost/blog')
		);
	});

	it('omits post navigation when there are no neighbours', () => {
		const { container } = setup();
		expect(container.querySelector('.post-nav')).toBeNull();
	});

	it('renders post navigation when a neighbour exists', () => {
		const { container, getByRole } = setup({ next: post({ slug: 'older', title: 'Older post' }) });
		expect(container.querySelector('.post-nav')).toBeInTheDocument();
		expect(getByRole('link', { name: /Older post/ })).toHaveAttribute('href', '/blog/older');
	});

	it('scrubs the cover image on the scroll timeline', () => {
		const { container } = setup({ coverImage: '/images/cover.jpg' });
		const cover = container.querySelector('.post-cover__image') as HTMLImageElement;
		expect(cover).toHaveAttribute('src', '/images/cover.jpg');
		// `use:parallax` hands the image to `animate` and scrubs it with `scroll`.
		expect(vi.mocked(animateMock)).toHaveBeenCalledWith(
			cover,
			expect.objectContaining({ y: expect.any(Array) }),
			expect.anything()
		);
		expect(vi.mocked(scroll)).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ target: cover })
		);
	});

	it('leaves the cover alone when there is no cover image', () => {
		const { container } = setup();
		expect(container.querySelector('.post-cover__image')).toBeNull();
		expect(container.querySelector('.post-cover__placeholder')).toBeInTheDocument();
	});
});
