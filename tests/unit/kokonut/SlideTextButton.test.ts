import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import SlideTextButton from '$lib/components/kokonut/SlideTextButton.svelte';

describe('SlideTextButton', () => {
	afterEach(cleanup);

	it('renders a real link when given an href', () => {
		const { container } = render(SlideTextButton, {
			props: { href: '/work', text: 'See the work' }
		});
		const link = container.querySelector('a');
		expect(link).toHaveAttribute('href', '/work');
		expect(container.querySelector('button')).toBeNull();
	});

	it('renders a real button when there is no href', () => {
		const { container } = render(SlideTextButton, { props: { text: 'Send' } });
		const button = container.querySelector('button');
		expect(button).toHaveAttribute('type', 'button');
		expect(container.querySelector('a')).toBeNull();
	});

	it('honours the type prop', () => {
		const { container } = render(SlideTextButton, { props: { text: 'Send', type: 'submit' } });
		expect(container.querySelector('button')).toHaveAttribute('type', 'submit');
	});

	it('stacks the resting and hover labels', () => {
		const { container } = render(SlideTextButton, {
			props: { text: 'Read more', hoverText: 'Let us go' }
		});
		const labels = [...container.querySelectorAll('.slide-button__label')].map(
			(node) => node.textContent
		);
		expect(labels).toEqual(['Read more', 'Let us go']);
	});

	it('repeats the resting label when no hover label is given', () => {
		const { container } = render(SlideTextButton, { props: { text: 'Read more' } });
		const labels = [...container.querySelectorAll('.slide-button__label')].map(
			(node) => node.textContent
		);
		expect(labels).toEqual(['Read more', 'Read more']);
	});

	it('names the control once for assistive tech', () => {
		const { getAllByRole, getByRole } = render(SlideTextButton, {
			props: { text: 'Read more', hoverText: 'Let us go' }
		});
		// Only the resting label is exposed; the hover copy is decorative.
		expect(getByRole('button', { name: 'Read more' })).toBeInTheDocument();
		expect(getAllByRole('button')).toHaveLength(1);
	});

	it('calls onclick', async () => {
		const onclick = vi.fn();
		const { getByRole } = render(SlideTextButton, { props: { text: 'Send', onclick } });
		getByRole('button').click();
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('marks a disabled link as disabled the only way a link can be', () => {
		const { container } = render(SlideTextButton, {
			props: { href: '/work', text: 'See the work', disabled: true }
		});
		const link = container.querySelector('a') as HTMLAnchorElement;
		// `<a>` has no `disabled`; announce it, take it out of the tab order, and
		// let `pointer-events: none` (keyed off aria-disabled) block the click.
		expect(link).toHaveAttribute('aria-disabled', 'true');
		expect(link).toHaveAttribute('tabindex', '-1');
	});

	it('leaves an enabled link untouched', () => {
		const { container } = render(SlideTextButton, {
			props: { href: '/work', text: 'See the work' }
		});
		const link = container.querySelector('a') as HTMLAnchorElement;
		expect(link).not.toHaveAttribute('aria-disabled');
		expect(link).not.toHaveAttribute('tabindex');
	});

	it('disables the button form natively', () => {
		const { container } = render(SlideTextButton, {
			props: { text: 'Send', disabled: true }
		});
		expect(container.querySelector('button')).toBeDisabled();
	});

	it('applies the variant and caller classes', () => {
		const { container } = render(SlideTextButton, {
			props: { text: 'Send', variant: 'ghost', class: 'w-full' }
		});
		const button = container.querySelector('button');
		expect(button).toHaveClass('slide-button', 'slide-button--ghost', 'w-full');
	});

	it('defaults to the accent-filled variant', () => {
		const { container } = render(SlideTextButton, { props: { text: 'Send' } });
		expect(container.querySelector('button')).toHaveClass('slide-button--default');
	});
});
