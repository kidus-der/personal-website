import { describe, it, expect } from 'vitest';
import { formatPeriod, formatMonth, MONTH_NAMES } from '$lib/utils/period';
import { experience } from '$content/experience';

describe('formatMonth', () => {
	it('renders every month with the abbreviations the design calls for', () => {
		expect(MONTH_NAMES).toEqual([
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'June',
			'July',
			'Aug',
			'Sept',
			'Oct',
			'Nov',
			'Dec'
		]);
	});

	it('formats a YYYY-MM stamp as month and year', () => {
		expect(formatMonth('2025-01')).toBe('Jan 2025');
		expect(formatMonth('2026-06')).toBe('June 2026');
		expect(formatMonth('2023-10')).toBe('Oct 2023');
		expect(formatMonth('2024-09')).toBe('Sept 2024');
	});

	it('passes non-month values through untouched', () => {
		expect(formatMonth('Present')).toBe('Present');
		expect(formatMonth('2026')).toBe('2026');
		expect(formatMonth('')).toBe('');
	});

	it('leaves an out-of-range month alone rather than inventing one', () => {
		expect(formatMonth('2026-00')).toBe('2026-00');
		expect(formatMonth('2026-13')).toBe('2026-13');
	});
});

describe('formatPeriod', () => {
	it('joins start and end with an en dash', () => {
		expect(formatPeriod({ start: '2025-01', end: '2026-06' })).toBe('Jan 2025 – June 2026');
	});

	it('keeps an open-ended role as "Present"', () => {
		expect(formatPeriod({ start: '2026-06', end: 'Present' })).toBe('June 2026 – Present');
	});

	it('formats every role in the content module', () => {
		expect(experience.map((role) => formatPeriod(role.period))).toEqual([
			'June 2026 – Present',
			'Jan 2025 – June 2026',
			'Oct 2023 – Jan 2024'
		]);
	});
});
