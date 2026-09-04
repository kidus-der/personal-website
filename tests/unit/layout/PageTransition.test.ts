import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import PageTransition from '$lib/components/layout/PageTransition.svelte';
import { durations, easings } from '$lib/motion/config';
import { animateMock, preferReducedMotion, resetMotionMocks } from '../kokonut/motionMock';
import { resetNavigationMocks, runAfterNavigate } from './navigationMock';

vi.mock('$lib/motion', async () => (await import('../kokonut/motionMock')).motionModule());
vi.mock('$app/navigation', async () => (await import('./navigationMock')).navigationModule());

const body = createRawSnippet(() => ({ render: () => '<p>Page body</p>' }));

function setup() {
	const result = render(PageTransition, { props: { children: body } });
	const wrapper = () => result.container.querySelector('.page-transition') as HTMLElement;
	return { ...result, wrapper };
}

describe('PageTransition', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetNavigationMocks();
	});
	afterEach(cleanup);

	it('renders its children', () => {
		const { getByText } = setup();
		expect(getByText('Page body')).toBeInTheDocument();
	});

	it('animates the wrapper after a navigation', () => {
		const { wrapper } = setup();
		expect(animateMock).not.toHaveBeenCalled();

		runAfterNavigate({ type: 'link' });

		expect(animateMock).toHaveBeenCalledTimes(1);
		const [element, keyframes, options] = animateMock.mock.calls[0];
		expect(element).toBe(wrapper());
		expect(keyframes).toMatchObject({ opacity: [0, 1], y: [8, 0] });
		expect(options).toMatchObject({ duration: durations.base, ease: easings.outExpo });
	});

	it('does not animate the first server-rendered paint', () => {
		setup();
		runAfterNavigate({ type: 'enter' });
		expect(animateMock).not.toHaveBeenCalled();
	});

	it('skips the transition under reduced motion', () => {
		preferReducedMotion();
		setup();
		runAfterNavigate({ type: 'link' });
		expect(animateMock).not.toHaveBeenCalled();
	});
});
