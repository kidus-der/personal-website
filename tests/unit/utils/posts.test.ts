import { describe, it, expect } from 'vitest';
import { loadPosts } from '$lib/utils/posts';

const post = (over: Record<string, unknown> = {}) => ({
	metadata: {
		title: 'A post',
		description: 'Something',
		publishedAt: '2026-01-01',
		tags: ['Personal'],
		draft: false,
		...over
	}
});

describe('loadPosts', () => {
	it('derives the slug from the module path', () => {
		const posts = loadPosts({ '/src/content/posts/hello.md': post() });
		expect(posts).toHaveLength(1);
		expect(posts[0].slug).toBe('hello');
		expect(posts[0].title).toBe('A post');
	});

	it('drops drafts', () => {
		const posts = loadPosts({
			'/src/content/posts/live.md': post(),
			'/src/content/posts/wip.md': post({ draft: true })
		});
		expect(posts.map((p) => p.slug)).toEqual(['live']);
	});

	it('sorts by publishedAt descending', () => {
		const posts = loadPosts({
			'/src/content/posts/old.md': post({ publishedAt: '2024-05-01' }),
			'/src/content/posts/new.md': post({ publishedAt: '2026-03-06' }),
			'/src/content/posts/mid.md': post({ publishedAt: '2025-07-14' })
		});
		expect(posts.map((p) => p.slug)).toEqual(['new', 'mid', 'old']);
	});

	it('ignores modules without metadata', () => {
		const posts = loadPosts({
			'/src/content/posts/good.md': post(),
			'/src/content/posts/broken.md': {},
			'/src/content/posts/null.md': null
		});
		expect(posts.map((p) => p.slug)).toEqual(['good']);
	});

	it('returns an empty array for no modules', () => {
		expect(loadPosts({})).toEqual([]);
	});
});
