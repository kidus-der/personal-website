import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	try {
		const post = await import(`../../../content/posts/${params.slug}.md`);
		return {
			content: post.default,
			metadata: post.metadata
		};
	} catch {
		error(404, `Post "${params.slug}" not found`);
	}
};
