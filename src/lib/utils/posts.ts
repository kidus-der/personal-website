import type { BlogPost } from '$lib/types/content';

type PostModule = { metadata?: Partial<BlogPost> };

/** Epoch millis for sorting; a missing or unparseable date sorts oldest. */
function publishedAtMs(post: BlogPost): number {
	const ms = new Date(post.publishedAt).getTime();
	return Number.isNaN(ms) ? -Infinity : ms;
}

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
		.sort((a, b) => publishedAtMs(b) - publishedAtMs(a));
}

/** The posts either side of `slug` in a newest-first archive. */
export interface PostNeighbours {
	/** The next post up the list — newer than `slug`. */
	prev: BlogPost | null;
	/** The next post down the list — older than `slug`. */
	next: BlogPost | null;
}

/**
 * Neighbours of `slug` within `posts`, which must already be sorted newest
 * first (as `loadPosts` returns them).
 *
 * "prev" is the newer post and "next" the older one: reading order down the
 * archive, which is how the post footer labels them ("Newer" / "Older").
 * An unknown slug yields two nulls rather than throwing — the caller has
 * already 404'd on a missing post, so there is nothing left to signal.
 */
export function pickNeighbours(posts: BlogPost[], slug: string): PostNeighbours {
	const index = posts.findIndex((post) => post.slug === slug);
	if (index === -1) return { prev: null, next: null };
	return {
		prev: posts[index - 1] ?? null,
		next: posts[index + 1] ?? null
	};
}
