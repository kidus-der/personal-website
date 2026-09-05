import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Guards the shared class utilities in `app.css`.
 *
 * jsdom does not apply Svelte's scoped stylesheets, so a rendered component
 * cannot be asked what it computes to. What can be checked, and is what actually
 * went wrong before, is the source: that each utility still carries the
 * declarations its consumers stopped writing for themselves, and that nobody has
 * quietly grown a private copy of one again.
 */

const APP_CSS = readFileSync('src/styles/app.css', 'utf8');

/** The declarations inside a top-level `.name { … }` rule, trimmed. */
function declarations(css: string, selector: string): string[] {
	const match = css.match(new RegExp(`\\n\\.${selector} \\{\\n([^}]*)\\n\\}`));
	if (!match) throw new Error(`No \`.${selector}\` rule in app.css`);
	return match[1]
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line !== '' && !line.startsWith('/*'));
}

describe('.visually-hidden', () => {
	it('clips the element instead of removing it from the a11y tree', () => {
		const rules = declarations(APP_CSS, 'visually-hidden');
		expect(rules).toEqual([
			'position: absolute;',
			'width: 1px;',
			'height: 1px;',
			'margin: -1px;',
			'padding: 0;',
			'overflow: hidden;',
			'white-space: nowrap;',
			'clip-path: inset(50%);',
			'border: 0;'
		]);
		expect(rules).not.toContain('display: none;');
	});

	it('is the only copy of the clip trick in the source', () => {
		const copies = sourceFiles().filter((file) =>
			readFileSync(file, 'utf8').includes('clip-path: inset(50%)')
		);
		expect(copies).toEqual(['src/styles/app.css']);
	});
});

describe('.display-heading', () => {
	it('carries the display face, weight and tracking the headings share', () => {
		expect(declarations(APP_CSS, 'display-heading')).toEqual([
			'font-family: var(--font-display);',
			'font-weight: 600;',
			'letter-spacing: -0.02em;',
			'line-height: 1.1;',
			'color: var(--text);'
		]);
	});

	it('leaves size to the component, which is what actually varies', () => {
		expect(declarations(APP_CSS, 'display-heading').join('')).not.toContain('font-size');
	});

	it.each([
		['src/routes/(portfolio)/work/+page.svelte', 'work-page__title'],
		['src/routes/(portfolio)/work/[slug]/+page.svelte', 'project-page__title'],
		['src/routes/(portfolio)/work/[slug]/+page.svelte', 'project-page__section-title'],
		['src/routes/blog/+page.svelte', 'blog__title'],
		['src/lib/components/sections/about/Bio.svelte', 'bio__heading'],
		['src/lib/components/sections/about/ExperienceTimeline.svelte', 'timeline__role'],
		['src/lib/components/sections/about/Education.svelte', 'education__degree'],
		['src/lib/components/sections/about/Skills.svelte', 'skills__group-name']
	])('%s applies it to .%s rather than restating it', (file, hook) => {
		const source = readFileSync(file, 'utf8');
		expect(source).toContain(`class="display-heading ${hook}"`);

		const rule = source.match(new RegExp(`\\n\\t\\.${hook} \\{\\n([^}]*)\\n\\t\\}`));
		expect(rule).not.toBeNull();
		const body = rule![1];
		expect(body).not.toContain('font-family: var(--font-display)');
		expect(body).not.toContain('font-weight: 600');
		expect(body).not.toContain('color: var(--text);');
	});
});

/** Every `.svelte` and `.css` file under `src`. */
function sourceFiles(): string[] {
	const modules = import.meta.glob('/src/**/*.{svelte,css}', {
		eager: true,
		query: '?raw',
		import: 'default'
	});
	return Object.keys(modules).map((path) => path.replace(/^\//, ''));
}
