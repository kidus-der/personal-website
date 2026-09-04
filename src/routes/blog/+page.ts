import type { PageLoad } from './$types';
import { loadPosts } from '$lib/utils/posts';

// The glob literal has to sit at the call site for Vite to see it.
const postModules = import.meta.glob('/src/content/posts/*.md', { eager: true });

export const load: PageLoad = async () => {
	return { posts: loadPosts(postModules) };
};
