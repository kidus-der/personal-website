export type ClassValue = string | false | null | undefined;

/**
 * Join class names, dropping falsy entries and collapsing stray whitespace.
 *
 * Deliberately not `clsx`/`tailwind-merge`: we never generate conflicting
 * utilities programmatically, so the extra dependency would not earn its keep.
 */
export function cn(...classes: ClassValue[]): string {
	return classes
		.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
		.join(' ')
		.trim()
		.replace(/\s+/g, ' ');
}
