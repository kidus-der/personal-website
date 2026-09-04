import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import MobileMenu from '$lib/components/layout/MobileMenu.svelte';
import { navItems } from '$lib/components/layout/navItems';
import { animateMock, preferReducedMotion, resetMotionMocks } from '../kokonut/motionMock';
import { resetNavigationMocks, runAfterNavigate } from './navigationMock';

vi.mock('$lib/motion', async () => (await import('../kokonut/motionMock')).motionModule());
vi.mock('$app/navigation', async () => (await import('./navigationMock')).navigationModule());

vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/work') } }));

function setup(props: Record<string, unknown> = {}) {
	const onclose = vi.fn();
	const result = render(MobileMenu, { props: { onclose, ...props } });
	const dialog = () => result.getByRole('dialog');
	const links = () => [...dialog().querySelectorAll('a')] as HTMLAnchorElement[];
	return { ...result, onclose, dialog, links };
}

describe('MobileMenu', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetNavigationMocks();
	});
	afterEach(() => {
		cleanup();
		document.body.style.removeProperty('overflow');
	});

	it('is a modal dialog with an accessible name', () => {
		const { dialog } = setup();
		expect(dialog()).toHaveAttribute('aria-modal', 'true');
		expect(dialog()).toHaveAccessibleName('Navigation');
	});

	it('renders every primary link', () => {
		const { links } = setup();
		expect(links().map((link) => link.getAttribute('href'))).toEqual(
			navItems.map((item) => item.href)
		);
	});

	it('staggers the links in', () => {
		setup();
		const call = animateMock.mock.calls.find((call) => Array.isArray(call[0]));
		expect(call).toBeDefined();
		expect((call?.[0] as HTMLElement[]).length).toBe(navItems.length);
		expect(call?.[1]).toMatchObject({ opacity: [0, 1] });
	});

	it('skips the entrance under reduced motion and leaves links visible', () => {
		preferReducedMotion();
		const { links } = setup();
		expect(animateMock).not.toHaveBeenCalled();
		expect(links()[0].style.opacity).toBe('');
	});

	it('closes on Escape', async () => {
		const { dialog, onclose } = setup();
		await fireEvent.keyDown(dialog(), { key: 'Escape' });
		expect(onclose).toHaveBeenCalledTimes(1);
	});

	it('closes after a navigation', () => {
		const { onclose } = setup();
		runAfterNavigate();
		expect(onclose).toHaveBeenCalledTimes(1);
	});

	it('locks body scroll while open and restores it on close', async () => {
		document.body.style.overflow = 'auto';
		const { unmount } = setup();
		expect(document.body.style.overflow).toBe('hidden');
		unmount();
		await tick();
		expect(document.body.style.overflow).toBe('auto');
	});

	it('traps Tab inside the dialog', async () => {
		const { dialog } = setup();
		const focusable = [
			...dialog().querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
		].filter((element) => element.tabIndex !== -1);
		expect(focusable.length).toBeGreaterThan(navItems.length);
		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		last.focus();
		await fireEvent.keyDown(dialog(), { key: 'Tab' });
		expect(document.activeElement).toBe(first);

		first.focus();
		await fireEvent.keyDown(dialog(), { key: 'Tab', shiftKey: true });
		expect(document.activeElement).toBe(last);
	});

	it('moves focus into the dialog on open', () => {
		const { dialog } = setup();
		expect(dialog().contains(document.activeElement)).toBe(true);
	});
});
