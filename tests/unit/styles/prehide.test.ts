import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guards the "pre-hide with CSS, reveal with Motion" mechanism.
 *
 * The three parts have to agree or the page flickers: `app.html` marks the
 * document as scripted, `app.css` hides anything marked for an entrance while
 * it is scripted, and every `use:reveal` call site carries the attribute that
 * rule keys off. jsdom will not compute a Svelte-scoped stylesheet, and the
 * failure is a visual flash rather than a thrown error, so the source is what
 * gets checked — the same approach `utilities.test.ts` takes.
 */

const APP_HTML = readFileSync('src/app.html', 'utf8');
const APP_CSS = readFileSync('src/styles/app.css', 'utf8');

/** Every file under `src/`, recursively. */
function sourceFiles(dir = 'src'): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		return entry.isDirectory() ? sourceFiles(path) : [path];
	});
}

describe('the blocking script', () => {
	it('marks the document as scripted before first paint', () => {
		expect(APP_HTML).toContain("document.documentElement.classList.add('js')");
	});

	it('marks it before anything that can throw', () => {
		// The theme read is inside a `try`; the class must not be able to be
		// skipped by a `localStorage` that throws, or the page never hides —
		// which is safe — nor, worse, hides and never un-hides.
		expect(APP_HTML.indexOf("classList.add('js')")).toBeLessThan(
			APP_HTML.indexOf('localStorage.getItem')
		);
	});
});

describe('the pre-hide rules', () => {
	it('hides marked elements only while the document is scripted', () => {
		expect(APP_CSS).toContain('html.js [data-reveal]:not([data-revealed])');
		expect(APP_CSS).toContain('html.js [data-hero]:not([data-revealed])');
		// Without `html.js` a reader with no JavaScript would get a blank page.
		expect(APP_CSS).not.toMatch(/\n\t*\[data-reveal\]:not\(\[data-revealed\]\)/);
	});

	it('hides the children of a staggered group too', () => {
		expect(APP_CSS).toContain(
			'html.js [data-reveal-group]:not([data-revealed]) > *:not([data-revealed])'
		);
	});

	it('applies only when the reader has not asked for less motion', () => {
		const block = APP_CSS.slice(APP_CSS.indexOf('html.js [data-reveal]'));
		const opened = APP_CSS.slice(0, APP_CSS.indexOf('html.js [data-reveal]'));
		expect(opened).toContain('@media (prefers-reduced-motion: no-preference)');
		expect(block).toContain('opacity: 0;');
	});

	it('carries a safety net that reveals the page if a script stalls', () => {
		expect(APP_CSS).toContain('animation: reveal-safety');
		expect(APP_CSS).toMatch(/@keyframes reveal-safety \{[^}]*to \{[^}]*opacity: 1;/s);
	});
});

describe('every use:reveal call site', () => {
	const callSites = sourceFiles()
		.filter((path) => path.endsWith('.svelte'))
		// Strip HTML comments first: several files explain the mechanism in prose
		// above the markup, and a sentence is not a call site.
		.map((path) => ({ path, source: readFileSync(path, 'utf8').replace(/<!--[\s\S]*?-->/g, '') }))
		.flatMap(({ path, source }) =>
			source
				.split('\n')
				.map((line, index) => ({ path, line, number: index + 1 }))
				.filter(({ line }) => line.includes('use:reveal'))
		);

	it('finds the call sites at all, so a passing suite means something', () => {
		expect(callSites.length).toBeGreaterThan(0);
	});

	it.each(callSites.map((site) => [`${site.path}:${site.number}`, site.line]))(
		'%s is marked for the pre-hide',
		(_where, line) => {
			// A staggered grid marks itself as a group and the stylesheet hides its
			// children; anything else marks itself.
			const marked = line.includes('data-reveal-group') || /data-reveal(?![-\w])/.test(line);
			expect(marked).toBe(true);
		}
	);

	it('marks a staggered call site as a group rather than as a single element', () => {
		for (const { line } of callSites) {
			if (!line.includes('stagger')) continue;
			expect(line).toContain('data-reveal-group');
		}
	});
});
