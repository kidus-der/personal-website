import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Button from '$lib/components/ui/Button.svelte';
import { resetMotionMocks } from '../mocks/motion';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());

const label = createRawSnippet(() => ({ render: () => '<span>Send</span>' }));

function setup(props: Record<string, unknown> = {}) {
	const onclick = vi.fn();
	const result = render(Button, { props: { children: label, onclick, ...props } });
	const root = () => result.container.querySelector('.button') as HTMLElement;
	return { ...result, onclick, root };
}

describe('Button', () => {
	beforeEach(resetMotionMocks);
	afterEach(cleanup);

	it('renders a real button by default', () => {
		const { root, getByText } = setup();
		expect(root().tagName).toBe('BUTTON');
		expect(root()).toHaveAttribute('type', 'button');
		expect(getByText('Send')).toBeInTheDocument();
	});

	it('renders an anchor when href is given', () => {
		const { root } = setup({ href: '/work' });
		expect(root().tagName).toBe('A');
		expect(root()).toHaveAttribute('href', '/work');
	});

	it('defaults to the primary variant at medium size', () => {
		const { root } = setup();
		expect(root()).toHaveClass('button--primary');
		expect(root()).toHaveClass('button--md');
	});

	it.each(['primary', 'ghost', 'link'])('applies the %s variant class', (variant) => {
		const { root } = setup({ variant });
		expect(root()).toHaveClass(`button--${variant}`);
	});

	it.each(['sm', 'md', 'lg'])('applies the %s size class', (size) => {
		const { root } = setup({ size });
		expect(root()).toHaveClass(`button--${size}`);
	});

	it('honours type=submit', () => {
		const { root } = setup({ type: 'submit' });
		expect(root()).toHaveAttribute('type', 'submit');
	});

	it('disables the button element', () => {
		const { root, onclick } = setup({ disabled: true });
		expect(root()).toBeDisabled();
		(root() as HTMLButtonElement).click();
		expect(onclick).not.toHaveBeenCalled();
	});

	it('expresses a disabled link the way the platform allows', () => {
		const { root } = setup({ href: '/work', disabled: true });
		expect(root()).toHaveAttribute('aria-disabled', 'true');
		expect(root()).toHaveAttribute('tabindex', '-1');
	});

	it('forwards the click', () => {
		const { root, onclick } = setup();
		(root() as HTMLButtonElement).click();
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('merges a caller-supplied class', () => {
		const { root } = setup({ class: 'w-full' });
		expect(root()).toHaveClass('button');
		expect(root()).toHaveClass('w-full');
	});
});
