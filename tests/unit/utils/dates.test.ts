import { describe, it, expect } from 'vitest';
import { formatDate } from '$lib/utils/dates';

describe('formatDate', () => {
	it('formats a date-only ISO string in short style by default', () => {
		expect(formatDate('2026-03-06')).toBe('Mar 6, 2026');
	});

	it('formats in long style when asked', () => {
		expect(formatDate('2026-03-06', 'long')).toBe('March 6, 2026');
	});

	it('does not shift the day across time zones', () => {
		expect(formatDate('2026-01-01')).toBe('Jan 1, 2026');
		expect(formatDate('2026-12-31')).toBe('Dec 31, 2026');
	});

	it('handles a full ISO timestamp', () => {
		expect(formatDate('2026-03-06T12:30:00.000Z', 'long')).toBe('March 6, 2026');
	});

	it('returns an empty string for an invalid date', () => {
		expect(formatDate('not-a-date')).toBe('');
		expect(formatDate('')).toBe('');
	});
});
