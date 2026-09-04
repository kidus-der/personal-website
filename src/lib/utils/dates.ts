export type DateStyle = 'short' | 'long';

const FORMATTERS: Record<DateStyle, Intl.DateTimeFormat> = {
	// UTC throughout: content dates are authored as plain `YYYY-MM-DD`, which
	// JS parses as UTC midnight. Formatting in local time would show the
	// previous day for anyone west of Greenwich.
	short: new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	}),
	long: new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC'
	})
};

/**
 * Format an ISO date string for display. Returns '' for anything unparseable,
 * so callers can render it directly without guarding.
 */
export function formatDate(iso: string, style: DateStyle = 'short'): string {
	if (typeof iso !== 'string' || iso.trim() === '') return '';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '';
	return FORMATTERS[style].format(date);
}
