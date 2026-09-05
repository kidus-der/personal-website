/**
 * Build a `<script type="application/ld+json">` tag for `{@html …}`.
 *
 * `<` is escaped so no value can close the script tag early, and keeping the
 * literal tag out of component markup avoids three copies of the same string
 * (and a svelte-eslint-parser parse failure on inline `<script>` templates).
 */
export function jsonLd(data: Record<string, unknown>): string {
	const json = JSON.stringify(data).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${json}</script>`;
}
