export interface NavItem {
	href: string;
	label: string;
}

/**
 * The site's primary destinations, in reading order.
 *
 * One list shared by the desktop nav, the mobile menu and the footer, so a new
 * section can never reach two of the three and go missing from the last.
 */
export const navItems: NavItem[] = [
	{ href: '/', label: 'Home' },
	{ href: '/work', label: 'Work' },
	{ href: '/about', label: 'About' },
	{ href: '/blog', label: 'The Buna Print' }
];

/**
 * Which item owns a pathname. Home matches only itself; every other item owns
 * its whole subtree, so `/blog/hello` keeps "The Buna Print" current.
 *
 * `MorphicNav` applies the same rule internally for the desktop pill; the mobile
 * menu and footer call this directly.
 */
export function isCurrent(href: string, pathname: string): boolean {
	return href === '/' ? pathname === '/' : pathname.startsWith(href);
}
