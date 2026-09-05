const FRONTMATTER = /^\s*---\r?\n[\s\S]*?\r?\n---\r?\n?/;

/**
 * Estimated reading time in whole minutes, rounded up, never below 1.
 * YAML frontmatter is stripped so metadata does not inflate the count.
 */
export function readingTime(markdown: string, wpm = 200): number {
	if (typeof markdown !== 'string') return 1;
	const body = markdown.replace(FRONTMATTER, '');
	const words = body.trim().split(/\s+/).filter(Boolean).length;
	if (words === 0 || wpm <= 0) return 1;
	return Math.max(1, Math.ceil(words / wpm));
}
