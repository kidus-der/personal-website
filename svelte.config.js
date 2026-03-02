import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md', '.svx'],

	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.md', '.svx'],
			layout: {
				blog: 'src/lib/components/layout/BlogPostLayout.svelte'
			}
		})
	],

	kit: {
		adapter: adapter(),
		alias: {
			$content: 'src/content',
			'$content/*': 'src/content/*'
		}
	}
};

export default config;
