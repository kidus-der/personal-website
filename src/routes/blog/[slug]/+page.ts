import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

const rawPosts = import.meta.glob('/src/content/posts/*.md', { query: '?raw', import: 'default' });

export const load: PageLoad = async ({ params }) => {
	try {
		const post = await import(`../../../content/posts/${params.slug}.md`);

		// Calculate reading time from raw markdown source
		const rawLoader = rawPosts[`/src/content/posts/${params.slug}.md`];
		let readingTime = 1;
		if (rawLoader) {
			const raw = (await rawLoader()) as string;
			// Strip YAML frontmatter before counting words
			const content = raw.replace(/^---[\s\S]+?---\s*/, '');
			const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
			readingTime = Math.max(1, Math.ceil(wordCount / 200));
		}

		return {
			content: post.default,
			metadata: post.metadata,
			readingTime
		};
	} catch {
		error(404, `Post "${params.slug}" not found`);
	}
};
