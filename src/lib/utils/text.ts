/** Default cut-off for {@link firstClause}, in characters. */
export const CLAUSE_MAX_LENGTH = 120;

const ELLIPSIS = '…';
const TRAILING_PUNCTUATION = /[.,;:\s]+$/;

/**
 * The opening clause of a long sentence, for use as a card summary.
 *
 * Content bullets are written for the CV — one sentence that states the thing
 * and then enumerates it after a colon. The clause before the colon is the
 * summary; everything after is detail a tile has no room for.
 *
 * A sentence with no colon is truncated at the last word boundary that fits in
 * `maxLength` and given an ellipsis, so a bullet written in a different shape
 * still yields something readable rather than a wall of text. A single word
 * longer than `maxLength` is cut mid-word — there is no boundary to prefer.
 */
export function firstClause(sentence: string, maxLength: number = CLAUSE_MAX_LENGTH): string {
	const trimmed = sentence.trim();
	if (trimmed === '') return '';

	const colon = trimmed.indexOf(':');
	if (colon > 0) return `${trimmed.slice(0, colon).replace(TRAILING_PUNCTUATION, '')}.`;

	if (trimmed.length <= maxLength) {
		return TRAILING_PUNCTUATION.test(trimmed) ? trimmed : `${trimmed}.`;
	}

	const window = trimmed.slice(0, maxLength);
	const lastSpace = window.lastIndexOf(' ');
	const head = lastSpace > 0 ? window.slice(0, lastSpace) : window;
	return `${head.replace(TRAILING_PUNCTUATION, '')}${ELLIPSIS}`;
}
