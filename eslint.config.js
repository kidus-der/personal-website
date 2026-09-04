import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import svelteConfig from './svelte.config.js';

export default ts.config(
	{
		ignores: [
			'build/',
			'dist/',
			'.svelte-kit/',
			'.vercel/',
			'static/',
			'src/content/posts/**/*.md',
			'.superpowers/'
		]
	},
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		},
		rules: {
			// The app is served from the domain root — no `base` path to resolve
			// against, so plain hrefs are correct.
			'svelte/no-navigation-without-resolve': 'off',
			// Warnings, not errors: these flag legacy markup that the design
			// revamp replaces page by page. Keep them visible without blocking.
			'svelte/require-each-key': 'warn',
			'svelte/no-unused-svelte-ignore': 'warn',
			'svelte/prefer-svelte-reactivity': 'warn',
			// `{@html}` is used only for values we construct ourselves
			// (JSON-LD, the blocking theme script, mdsvex output).
			'svelte/no-at-html-tags': 'warn'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		// Remark/rehype plugins work against loosely typed unist trees.
		files: ['src/lib/remark/**/*.js'],
		rules: { '@typescript-eslint/ban-ts-comment': 'off' }
	}
);
