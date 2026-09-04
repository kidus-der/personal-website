import type { PageLoad } from './$types';
import { loadPosts } from '$lib/utils/posts';

/** The home page shows one featured post and two beside it. */
const HOME_POST_COUNT = 3;

/**
 * The glob has to stay at the call site — Vite matches on the literal — so the
 * sorting and draft filtering live in `loadPosts`, shared with the blog index.
 */
export const load: PageLoad = () => ({
	posts: loadPosts(import.meta.glob('/src/content/posts/*.md', { eager: true })).slice(
		0,
		HOME_POST_COUNT
	)
});
