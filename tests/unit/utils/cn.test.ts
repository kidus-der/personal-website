import { describe, it, expect } from 'vitest';
import { cn } from '$lib/utils/cn';

describe('cn', () => {
	it('joins truthy class names with a single space', () => {
		expect(cn('a', 'b', 'c')).toBe('a b c');
	});

	it('drops false, null, undefined and empty strings', () => {
		expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
	});

	it('trims and collapses whitespace inside fragments', () => {
		expect(cn('  a  b ', 'c')).toBe('a b c');
	});

	it('returns an empty string when nothing is truthy', () => {
		expect(cn(false, null, undefined)).toBe('');
	});
});
