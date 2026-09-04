import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import ShimmerText from '$lib/components/kokonut/ShimmerText.svelte';
import { animateMock, animations, preferReducedMotion, resetMotionMocks } from './motionMock';

vi.mock('$lib/motion', async () => (await import('./motionMock')).motionModule());

describe('ShimmerText', () => {
	beforeEach(resetMotionMocks);
	afterEach(cleanup);

	it('renders the text', () => {
		const { getByText } = render(ShimmerText, { props: { text: 'Founding Engineer' } });
		expect(getByText('Founding Engineer')).toBeInTheDocument();
	});

	it('merges a caller-supplied class', () => {
		const { getByText } = render(ShimmerText, { props: { text: 'hi', class: 'text-lg' } });
		expect(getByText('hi')).toHaveClass('shimmer-text', 'text-lg');
	});

	it('sweeps the background position on a linear infinite loop', () => {
		render(ShimmerText, { props: { text: 'hi' } });
		expect(animateMock).toHaveBeenCalledTimes(1);
		const [element, keyframes, options] = animateMock.mock.calls[0];
		expect(element).toBeInstanceOf(HTMLElement);
		expect(keyframes).toEqual({ backgroundPosition: ['100% 0', '-100% 0'] });
		expect(options).toMatchObject({ repeat: Infinity, ease: 'linear' });
	});

	it('skips the shimmer under reduced motion and paints flat text instead', () => {
		preferReducedMotion();
		const { getByText } = render(ShimmerText, { props: { text: 'hi' } });
		expect(animateMock).not.toHaveBeenCalled();
		expect(getByText('hi')).toBeInTheDocument();
		// A frozen gradient would leave the word permanently half-faded; the still
		// state drops the gradient and paints solid `--text`.
		expect(getByText('hi')).toHaveClass('shimmer-text--still');
	});

	it('does not mark the still state while animating', () => {
		const { getByText } = render(ShimmerText, { props: { text: 'hi' } });
		expect(getByText('hi')).not.toHaveClass('shimmer-text--still');
	});

	it('stops the animation when destroyed', () => {
		const { unmount } = render(ShimmerText, { props: { text: 'hi' } });
		unmount();
		expect(animations[0].stop).toHaveBeenCalled();
	});
});
