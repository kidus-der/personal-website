import { describe, it, expect } from 'vitest';
import { firstClause, CLAUSE_MAX_LENGTH } from '$lib/utils/text';
import { experience } from '$content/experience';

describe('firstClause', () => {
	it('keeps everything before the enumeration colon', () => {
		expect(firstClause('Built the thing: one, two, three.')).toBe('Built the thing.');
	});

	it('strips the punctuation the cut leaves dangling, not punctuation inside the clause', () => {
		expect(firstClause('Built the thing, and more : detail')).toBe('Built the thing, and more.');
		expect(firstClause('Built the thing.: detail')).toBe('Built the thing.');
	});

	it('leaves a short sentence alone but makes sure it ends', () => {
		expect(firstClause('Built the thing')).toBe('Built the thing.');
		expect(firstClause('Built the thing.')).toBe('Built the thing.');
	});

	it('truncates at a word boundary when there is no colon', () => {
		const sentence = `${'word '.repeat(40)}end`;
		const result = firstClause(sentence);
		expect(result.length).toBeLessThanOrEqual(CLAUSE_MAX_LENGTH + 1);
		expect(result.endsWith('…')).toBe(true);
		expect(result).not.toContain('  ');
		// Cut on a boundary: no half word before the ellipsis.
		expect(result.slice(0, -1).endsWith('word')).toBe(true);
	});

	it('respects a caller-supplied limit', () => {
		expect(firstClause('one two three four five', 9)).toBe('one two…');
	});

	it('cuts mid-word only when a single word overflows on its own', () => {
		expect(firstClause('a'.repeat(30), 10)).toBe(`${'a'.repeat(10)}…`);
	});

	it('handles empty and whitespace-only input', () => {
		expect(firstClause('')).toBe('');
		expect(firstClause('   ')).toBe('');
	});

	it('ignores a colon at position zero rather than returning a bare full stop', () => {
		expect(firstClause(': detail only')).toBe(': detail only.');
	});

	it('summarises the real role bullet the home page uses', () => {
		expect(firstClause(experience[0].bullets[0])).toBe(
			"Built core detection pipelines for Eva V1.6, Scam AI's multi-modal deepfake and forgery engine."
		);
	});
});
