/**
 * Which nav destination owns the route the visitor is on.
 *
 * Home matches only itself; every other destination owns its whole subtree, so
 * `/work/prime-radiant` keeps "Work" marked as the current page. The match is
 * on whole path segments, not a plain `startsWith`, so a future `/workshop`
 * never lights up `/work`.
 *
 * One rule, three callers: the desktop pill in `MorphicNav`, the mobile menu
 * and the footer. Keeping it here stops them drifting apart.
 */
export function isActivePath(current: string, href: string): boolean {
	const path = normalise(current);
	const target = normalise(href);
	if (target === '/') return path === '/';
	return path === target || path.startsWith(`${target}/`);
}

/** Strip a trailing slash so `/work/` and `/work` compare equal. Root stays `/`. */
function normalise(path: string): string {
	if (typeof path !== 'string' || path === '') return '/';
	return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}
