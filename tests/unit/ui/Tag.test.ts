import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Tag from '$lib/components/ui/Tag.svelte';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());

const label = createRawSnippet(() => ({ render: () => '<span>SvelteKit</span>' }));

function setup(props: Record<string, unknown> = {}) {
	const result = render(Tag, { props: { children: label, ...props } });
	const chip = () => result.container.querySelector('.tag') as HTMLElement;
	return { ...result, chip };
}

describe('Tag', () => {
	afterEach(cleanup);

	it('renders its children inside a chip', () => {
		const { chip, getByText } = setup();
		expect(chip()).toBeInTheDocument();
		expect(getByText('SvelteKit')).toBeInTheDocument();
	});

	it('defaults to the neutral tone', () => {
		const { chip } = setup();
		expect(chip()).toHaveClass('tag--neutral');
		expect(chip()).not.toHaveClass('tag--accent');
	});

	it('applies the accent tone', () => {
		const { chip } = setup({ tone: 'accent' });
		expect(chip()).toHaveClass('tag--accent');
	});

	it('merges a caller-supplied class', () => {
		const { chip } = setup({ class: 'mt-2' });
		expect(chip()).toHaveClass('tag');
		expect(chip()).toHaveClass('mt-2');
	});
});
