import type { PageLoad } from './$types';
import type { BlogPost } from '$lib/types/content';

export const load: PageLoad = async () => {
	// Dynamically import all .md files from content/posts
	const postModules = import.meta.glob('/src/content/posts/*.md', { eager: true });

	const posts: BlogPost[] = Object.entries(postModules)
		.map(([path, module]) => {
			const slug = path.split('/').pop()?.replace('.md', '') ?? '';
			const meta = (module as Record<string, unknown>).metadata as Omit<BlogPost, 'slug'>;
			return { slug, ...meta };
		})
		.filter((p) => !p.draft)
		.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

	return { posts };
};
