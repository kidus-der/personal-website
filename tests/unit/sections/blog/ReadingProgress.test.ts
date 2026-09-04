import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import ReadingProgress from '$lib/components/sections/blog/ReadingProgress.svelte';
import { scroll } from '$lib/motion';
import { resetMotionMocks } from '../../kokonut/motionMock';

vi.mock('$lib/motion', async () => (await import('../../kokonut/motionMock')).motionModule());

describe('ReadingProgress', () => {
	beforeEach(() => {
		resetMotionMocks();
		// `scroll` is one shared double for the whole module mock and
		// `resetMotionMocks` does not touch it, so call counts need clearing here.
		vi.mocked(scroll).mockClear();
	});
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

	it('re-subscribes when the target arrives after the first render', async () => {
		// `bind:this` is undefined on the first render, so the action has to be
		// able to move its subscription when the element finally shows up.
		const { container, rerender } = render(ReadingProgress, { props: { target: undefined } });
		const bar = container.querySelector('.reading-progress') as HTMLElement;
		expect(vi.mocked(scroll)).toHaveBeenCalledTimes(1);
		expect(vi.mocked(scroll).mock.calls[0][1]).toMatchObject({ target: bar });

		const article = document.createElement('article');
		await rerender({ target: article });

		expect(vi.mocked(scroll)).toHaveBeenCalledTimes(2);
		expect(vi.mocked(scroll).mock.calls[1][1]).toMatchObject({ target: article });
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
