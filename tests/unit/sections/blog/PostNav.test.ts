import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import PostNav from '$lib/components/sections/blog/PostNav.svelte';
import type { BlogPost } from '$lib/types/content';

const post = (over: Partial<BlogPost> = {}): BlogPost => ({
	slug: 'hello',
	title: 'Hello',
	description: 'An introduction.',
	publishedAt: '2026-03-06',
	tags: ['Personal'],
	...over
});

describe('PostNav', () => {
	afterEach(cleanup);

	it('renders nothing when there is neither a newer nor an older post', () => {
		const { container } = render(PostNav, { props: { prev: null, next: null } });
		expect(container.querySelector('.post-nav')).toBeNull();
	});

	it('labels the newer post and links to it', () => {
		const { getByText, getByRole } = render(PostNav, {
			props: { prev: post({ slug: 'newer', title: 'Newer post' }), next: null }
		});
		expect(getByText('Newer')).toBeInTheDocument();
		expect(getByRole('link', { name: /Newer post/ })).toHaveAttribute('href', '/blog/newer');
	});

	it('labels the older post and links to it', () => {
		const { getByText, getByRole } = render(PostNav, {
			props: { prev: null, next: post({ slug: 'older', title: 'Older post' }) }
		});
		expect(getByText('Older')).toBeInTheDocument();
		expect(getByRole('link', { name: /Older post/ })).toHaveAttribute('href', '/blog/older');
	});

	it('renders both cards when the post sits in the middle', () => {
		const { container } = render(PostNav, {
			props: { prev: post({ slug: 'a', title: 'A' }), next: post({ slug: 'b', title: 'B' }) }
		});
		expect(container.querySelectorAll('.post-nav__card')).toHaveLength(2);
	});

	it('is labelled as post navigation and avoids arrow glyphs in link text', () => {
		const { getByRole, container } = render(PostNav, {
			props: { prev: post({ slug: 'a', title: 'A' }), next: post({ slug: 'b', title: 'B' }) }
		});
		expect(getByRole('navigation', { name: 'Post navigation' })).toBeInTheDocument();
		expect(container.textContent).not.toContain('→');
	});
});
