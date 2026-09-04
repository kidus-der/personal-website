/**
 * Turning an `Experience['period']` into the line the timeline prints.
 *
 * Deliberately hand-rolled rather than `Intl.DateTimeFormat`: the design asks
 * for "June" and "Sept" (not "Jun"/"Sep"), and building a `Date` from a
 * `YYYY-MM` string would drag the runtime's timezone into a value that has no
 * time in it — `new Date('2026-01')` is UTC midnight, which is December in
 * Edmonton. Pure string work has neither problem.
 */
import type { Experience } from '$lib/types/content';

/** Month abbreviations exactly as the spec spells them. */
export const MONTH_NAMES = [
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
] as const;

/** An en dash with hair spaces around it reads better than a hyphen here. */
const RANGE_SEPARATOR = ' – ';

const MONTH_STAMP = /^(\d{4})-(\d{2})$/;

/**
 * `'2026-06'` → `'June 2026'`.
 *
 * Anything that is not a `YYYY-MM` stamp — `'Present'`, a bare year, an
 * out-of-range month — is returned unchanged, so a content typo shows up as
 * itself rather than as a silently wrong date.
 */
export function formatMonth(value: string): string {
	const match = MONTH_STAMP.exec(value);
	if (!match) return value;

	const month = MONTH_NAMES[Number(match[2]) - 1];
	if (!month) return value;

	return `${month} ${match[1]}`;
}

/** `{ start: '2025-01', end: '2026-06' }` → `'Jan 2025 – June 2026'`. */
export function formatPeriod(period: Experience['period']): string {
	return `${formatMonth(period.start)}${RANGE_SEPARATOR}${formatMonth(period.end)}`;
}
