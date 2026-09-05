import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Guards the contract between `SpotlightCard` and the sections that render one.
 *
 * The card is a surface, not a container: its inner box clips (`overflow:
 * hidden`, so the shimmer and the tint stay inside the border radius) and it
 * holds no padding of its own, which leaves every consumer responsible for
 * padding the content it hands over. `Skills` did not, so its group headings sat
 * on the border line and the clip shaved the ascenders and left stems off
 * "Languages", "ML & data" and "Dev & testing".
 *
 * jsdom computes neither Svelte's scoped stylesheets nor a text run's ink
 * extents, so the source is what gets checked — the same approach
 * `utilities.test.ts` and `prehide.test.ts` take.
 */

const SPOTLIGHT_CARD = 'src/lib/components/kokonut/SpotlightCard.svelte';
const SKILLS = 'src/lib/components/sections/about/Skills.svelte';

/** The declarations inside a `\t.name { … }` rule in a component's `<style>`. */
function rule(source: string, selector: string): string {
	const match = source.match(new RegExp(`\\n\\t${selector} \\{\\n([^}]*)\\n\\t\\}`));
	if (match === null) throw new Error(`No \`${selector}\` rule in the file`);
	return match[1];
}

describe('SpotlightCard', () => {
	const source = readFileSync(SPOTLIGHT_CARD, 'utf8');

	it('clips its content, which is why consumers have to pad theirs', () => {
		expect(rule(source, '\\.spotlight-card__inner')).toContain('overflow: hidden;');
	});

	it('stays generic: no padding of its own to fight a consumer over', () => {
		expect(rule(source, '\\.spotlight-card__content')).not.toContain('padding');
	});
});

describe.each([
	['src/lib/components/sections/work/ProjectCard.svelte', '\\.project-card__body'],
	[SKILLS, '\\.skills__group']
])('%s', (file, contentSelector) => {
	const source = readFileSync(file, 'utf8');

	it('renders a SpotlightCard, so this guard is about something real', () => {
		expect(source).toContain('<SpotlightCard');
	});

	it(`pads the content it puts inside the card (${contentSelector})`, () => {
		expect(rule(source, contentSelector)).toMatch(/^\s*padding: /m);
	});
});

describe('the skills group cards', () => {
	const source = readFileSync(SKILLS, 'utf8');

	it('puts the heading inside the padded box rather than against the border', () => {
		expect(source).toMatch(
			/<div class="skills__group">\s*\n\s*<h3 class="display-heading skills__group-name">/
		);
	});

	it('lets a card grow to its own content instead of pinning a height', () => {
		// A fixed height plus the card's clip is the other way this heading gets
		// cut, so no rule here may set one. `height: auto` is the release of the
		// card's own `height: 100%`, not an imposed size.
		const heights = [...source.matchAll(/\n\t+height: ([^;]+);/g)].map((match) => match[1]);
		expect(heights).toEqual(['auto']);
	});

	it('sizes each card to its content rather than stretching it to the row', () => {
		expect(rule(source, '\\.skills__groups')).toContain('align-items: start;');
	});

	it('never clips inside the section itself', () => {
		// Comments stripped first: the rules here explain the clip they exist to
		// stay clear of, and a sentence about it is not a declaration.
		const styles = source.slice(source.indexOf('<style>')).replace(/\/\*[\s\S]*?\*\//g, '');
		expect(styles).not.toContain('overflow: hidden');
	});
});
