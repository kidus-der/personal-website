import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import MobileMenu from '$lib/components/layout/MobileMenu.svelte';
import { navItems } from '$lib/components/layout/navItems';
import { stagger } from '$lib/motion';
import { animateMock, preferReducedMotion, resetMotionMocks } from '../mocks/motion';
import { resetNavigationMocks, runAfterNavigate } from '../mocks/navigation';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());
vi.mock('$app/navigation', async () => (await import('../mocks/navigation')).navigationModule());

vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/work') } }));

/** Stands in for the page behind the modal: a body-level sibling with a control. */
let background: HTMLElement;

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
		background = document.createElement('div');
		background.innerHTML = '<button type="button">Behind the modal</button>';
		document.body.appendChild(background);
	});
	afterEach(() => {
		cleanup();
		background.remove();
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
		expect(vi.mocked(stagger)).toHaveBeenCalledWith(0.06);
	});

	it('names its landmark something other than the desktop nav', () => {
		const { dialog } = setup();
		const landmark = dialog().querySelector('nav') as HTMLElement;
		expect(landmark).toHaveAttribute('aria-label', 'Mobile');
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

	it('makes the background inert while open and gives it back on close', async () => {
		const { unmount } = setup();
		expect(background).toHaveAttribute('inert');

		unmount();
		await tick();
		expect(background).not.toHaveAttribute('inert');
	});

	it('leaves an element that was already inert alone', async () => {
		background.setAttribute('inert', '');
		const { unmount } = setup();
		unmount();
		await tick();
		expect(background).toHaveAttribute('inert');
	});

	it('pulls Tab back in when focus has escaped the dialog', async () => {
		const { dialog } = setup();
		const outside = background.querySelector('button') as HTMLButtonElement;
		outside.focus();
		expect(document.activeElement).toBe(outside);

		// Dispatched on `document`, not the dialog: the listener has to be there for
		// a keystroke from outside the dialog to reach it at all.
		await fireEvent.keyDown(document, { key: 'Tab' });

		const first = dialog().querySelector('a') as HTMLAnchorElement;
		expect(document.activeElement).toBe(first);
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
