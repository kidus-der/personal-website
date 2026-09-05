import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { loadPosts, pickNeighbours } from '$lib/utils/posts';
import { readingTime } from '$lib/utils/readingTime';

// Two globs over the same directory: the raw source feeds the word count, the
// eager modules feed the archive ordering that prev/next is read off. Both
// literals have to sit at the call site for Vite to see them.
const rawPosts = import.meta.glob('/src/content/posts/*.md', { query: '?raw', import: 'default' });
const postModules = import.meta.glob('/src/content/posts/*.md', { eager: true });

export const load: PageLoad = async ({ params }) => {
	// `.catch` rather than a `try` around the whole body, so a fault anywhere
	// else in this load surfaces as itself instead of a misleading 404.
	const post = await import(`../../../content/posts/${params.slug}.md`).catch(() => null);
	if (!post) error(404, `Post "${params.slug}" not found`);

	const rawLoader = rawPosts[`/src/content/posts/${params.slug}.md`];
	const raw = rawLoader ? ((await rawLoader()) as string) : '';

	const { prev, next } = pickNeighbours(loadPosts(postModules), params.slug);

	return {
		content: post.default,
		metadata: post.metadata,
		readingTime: readingTime(raw),
		prev,
		next
	};
};
