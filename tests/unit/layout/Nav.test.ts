import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import Nav from '$lib/components/layout/Nav.svelte';
import { navItems } from '$lib/components/layout/navItems';
import { resetMotionMocks } from '../kokonut/motionMock';
import { resetNavigationMocks, runAfterNavigate } from './navigationMock';

vi.mock('$lib/motion', async () => (await import('../kokonut/motionMock')).motionModule());
vi.mock('$app/navigation', async () => (await import('./navigationMock')).navigationModule());

const pageState = vi.hoisted(() => ({ url: new URL('http://localhost/work') }));
vi.mock('$app/state', () => ({ page: pageState }));

function setup() {
	const result = render(Nav);
	const hamburger = () => result.getByRole('button', { name: /menu/i });
	const primaryNav = () => result.getByRole('navigation', { name: 'Primary' });
	return { ...result, hamburger, primaryNav };
}

describe('Nav', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetNavigationMocks();
		pageState.url = new URL('http://localhost/work');
	});
	afterEach(cleanup);

	it('renders every primary link', async () => {
		const { primaryNav } = setup();
		await tick();
		const links = [...primaryNav().querySelectorAll('a')];
		expect(links).toHaveLength(4);
		expect(links.map((link) => link.textContent?.trim())).toEqual([
			'Home',
			'Work',
			'About',
			'The Buna Print'
		]);
		expect(links.map((link) => link.getAttribute('href'))).toEqual(
			navItems.map((item) => item.href)
		);
	});

	it('marks the current route as the current page', async () => {
		const { primaryNav } = setup();
		await tick();
		const current = primaryNav().querySelectorAll('[aria-current="page"]');
		expect(current).toHaveLength(1);
		expect(current[0]).toHaveTextContent('Work');
	});

	it('keeps a nested route under its section', async () => {
		pageState.url = new URL('http://localhost/blog/hello-world');
		const { primaryNav } = setup();
		await tick();
		expect(primaryNav().querySelector('[aria-current="page"]')).toHaveTextContent('The Buna Print');
	});

	it('links the logo home with a descriptive alt', () => {
		const { getByAltText } = setup();
		const logo = getByAltText('Kidus Dereje home');
		expect(logo.closest('a')).toHaveAttribute('href', '/');
	});

	it('opens the mobile menu from the hamburger', async () => {
		const { hamburger, queryByRole, getByRole } = setup();
		expect(queryByRole('dialog')).toBeNull();
		expect(hamburger()).toHaveAttribute('aria-expanded', 'false');
		expect(hamburger()).toHaveAttribute('aria-controls', 'mobile-menu');

		await fireEvent.click(hamburger());

		const dialog = getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		expect(dialog).toHaveAttribute('id', 'mobile-menu');
		expect(hamburger()).toHaveAttribute('aria-expanded', 'true');
	});

	it('closes the mobile menu on Escape and returns focus to the hamburger', async () => {
		const { hamburger, getByRole, queryByRole } = setup();
		await fireEvent.click(hamburger());
		expect(getByRole('dialog')).toBeInTheDocument();

		await fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });
		await tick();

		expect(queryByRole('dialog')).toBeNull();
		expect(hamburger()).toHaveAttribute('aria-expanded', 'false');
		expect(document.activeElement).toBe(hamburger());
	});

	it('locks and restores body scroll around the mobile menu', async () => {
		const { hamburger, getByRole } = setup();
		await fireEvent.click(hamburger());
		expect(document.body.style.overflow).toBe('hidden');

		await fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });
		await tick();
		expect(document.body.style.overflow).toBe('');
	});

	it('closes the mobile menu when a navigation happens', async () => {
		const { hamburger, queryByRole } = setup();
		await fireEvent.click(hamburger());
		expect(queryByRole('dialog')).not.toBeNull();

		runAfterNavigate();
		await tick();

		expect(queryByRole('dialog')).toBeNull();
	});

	it('turns the bar to glass once the page is scrolled past the threshold', async () => {
		const { container } = setup();
		const bar = container.querySelector('.nav') as HTMLElement;
		expect(bar).not.toHaveClass('nav--scrolled');

		Object.defineProperty(window, 'scrollY', { value: 80, writable: true, configurable: true });
		await fireEvent.scroll(window);
		await tick();

		expect(bar).toHaveClass('nav--scrolled');

		Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
		await fireEvent.scroll(window);
		await tick();
		expect(bar).not.toHaveClass('nav--scrolled');
	});
});
