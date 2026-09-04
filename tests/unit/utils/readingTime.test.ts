import { describe, it, expect } from 'vitest';
import { readingTime } from '$lib/utils/readingTime';

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

describe('readingTime', () => {
	it('rounds 400 words at 200 wpm up to 2 minutes', () => {
		expect(readingTime(words(400))).toBe(2);
	});

	it('never returns less than 1 minute', () => {
		expect(readingTime('a few words')).toBe(1);
		expect(readingTime('')).toBe(1);
	});

	it('strips YAML frontmatter before counting', () => {
		const frontmatter = `---\ntitle: ${words(400)}\n---\n\n${words(200)}`;
		expect(readingTime(frontmatter)).toBe(1);
	});

	it('honours a custom words-per-minute rate', () => {
		expect(readingTime(words(400), 100)).toBe(4);
	});
});
