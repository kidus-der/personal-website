import type { BlogPost } from '$lib/types/content';

type PostModule = { metadata?: Partial<BlogPost> };

/**
 * Map the modules returned by
 * `import.meta.glob('/src/content/posts/*.md', { eager: true })` into sorted,
 * published `BlogPost`s.
 *
 * The glob deliberately stays at the call site: Vite must see the literal, and
 * keeping it out of here makes this function pure and unit-testable.
 */
export function loadPosts(modules: Record<string, unknown>): BlogPost[] {
	return Object.entries(modules)
		.map(([path, module]) => {
			const metadata = (module as PostModule | null)?.metadata;
			if (!metadata) return null;
			const slug = path.split('/').pop()?.replace(/\.md$/, '') ?? '';
			return { ...metadata, slug } as BlogPost;
		})
		.filter((post): post is BlogPost => post !== null && !post.draft)
		.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
