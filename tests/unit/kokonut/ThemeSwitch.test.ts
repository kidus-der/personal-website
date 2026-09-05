import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import ThemeSwitch from '$lib/components/kokonut/ThemeSwitch.svelte';
import { theme } from '$lib/state/theme.svelte';
import { resetMotionMocks } from '../mocks/motion';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());

function setup(props: Record<string, unknown> = {}) {
	const result = render(ThemeSwitch, { props });
	const button = () => result.container.querySelector('button') as HTMLButtonElement;
	const icon = () => result.container.querySelector('.theme-switch__icon') as SVGElement;
	return { ...result, button, icon };
}

describe('ThemeSwitch', () => {
	beforeEach(() => {
		resetMotionMocks();
		localStorage.clear();
		theme.set('dark');
	});

	afterEach(cleanup);

	it('offers the light theme while dark is active', () => {
		const { button } = setup();
		expect(button()).toHaveAttribute('aria-label', 'Switch to light theme');
	});

	it('toggles the document theme and flips its own label', async () => {
		const { button } = setup();

		button().click();
		await tick();
		expect(document.documentElement.dataset.theme).toBe('light');
		expect(button()).toHaveAttribute('aria-label', 'Switch to dark theme');

		button().click();
		await tick();
		expect(document.documentElement.dataset.theme).toBe('dark');
		expect(button()).toHaveAttribute('aria-label', 'Switch to light theme');
	});

	it('rotates the sun icon between the two states', async () => {
		const { button, icon } = setup();
		expect(icon()).not.toHaveClass('theme-switch__icon--flipped');

		button().click();
		await tick();
		expect(icon()).toHaveClass('theme-switch__icon--flipped');
	});

	it('hides the label by default', () => {
		const { container } = setup();
		expect(container.querySelector('.theme-switch__label')).toBeNull();
	});

	it('shows the current theme name when asked', async () => {
		const { button, container } = setup({ showLabel: true });
		expect(container.querySelector('.theme-switch__label')).toHaveTextContent('Dark');

		button().click();
		await tick();
		expect(container.querySelector('.theme-switch__label')).toHaveTextContent('Light');
	});

	it('keeps the icon out of the accessibility tree', () => {
		const { icon } = setup();
		expect(icon()).toHaveAttribute('aria-hidden', 'true');
	});

	it('merges a caller-supplied class', () => {
		const { button } = setup({ class: 'ml-auto' });
		expect(button()).toHaveClass('theme-switch');
		expect(button()).toHaveClass('ml-auto');
	});
});
