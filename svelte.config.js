import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'url';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { createHighlighter } from 'shiki';
import rehypeCallouts from './src/lib/remark/callouts.js';

const shikiHighlighter = await createHighlighter({
	themes: ['github-dark-dimmed'],
	langs: [
		'javascript',
		'typescript',
		'python',
		'bash',
		'html',
		'css',
		'json',
		'svelte',
		'markdown',
		'yaml',
		'rust',
		'go'
	]
});

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md', '.svx'],

	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.md', '.svx'],
			layout: {
				_: fileURLToPath(new URL('./src/lib/components/layout/BlogPostLayout.svelte', import.meta.url))
			},
			rehypePlugins: [
				rehypeSlug,
				[rehypeAutolinkHeadings, { behavior: 'wrap' }],
				rehypeCallouts
			],
			highlight: {
				highlighter: (code, lang) => {
					const safeCode = code ?? '';
					const loadedLangs = shikiHighlighter.getLoadedLanguages();
					const safeLang =
						lang && loadedLangs.includes(lang) ? lang : 'text';
					const html = shikiHighlighter.codeToHtml(safeCode, {
						lang: safeLang,
						theme: 'github-dark-dimmed'
					});
					// Escape curly braces so Svelte doesn't parse them as
					// template expressions when mdsvex inserts raw HTML
					return html.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
				}
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
