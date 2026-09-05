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
