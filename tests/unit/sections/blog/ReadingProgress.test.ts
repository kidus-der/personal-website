import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import ReadingProgress from '$lib/components/sections/blog/ReadingProgress.svelte';
import { scroll } from '$lib/motion';
import { resetMotionMocks } from '../../kokonut/motionMock';

vi.mock('$lib/motion', async () => (await import('../../kokonut/motionMock')).motionModule());

describe('ReadingProgress', () => {
	beforeEach(resetMotionMocks);
	afterEach(cleanup);

	it('renders a decorative progress bar seeded at zero', () => {
		const { container } = render(ReadingProgress);
		const bar = container.querySelector('.reading-progress') as HTMLElement;
		expect(bar).toBeInTheDocument();
		expect(bar).toHaveAttribute('aria-hidden', 'true');
		expect(bar.style.getPropertyValue('--progress')).toBe('0');
	});

	it('scrubs against the article it is given', () => {
		const target = document.createElement('article');
		render(ReadingProgress, { props: { target } });
		expect(vi.mocked(scroll)).toHaveBeenCalledWith(
			expect.any(Function),
			expect.objectContaining({ target })
		);
	});

	it('falls back to itself when no target is given', () => {
		const { container } = render(ReadingProgress);
		const bar = container.querySelector('.reading-progress') as HTMLElement;
		expect(vi.mocked(scroll)).toHaveBeenCalledWith(
			expect.any(Function),
			expect.objectContaining({ target: bar })
		);
	});
});
