import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import BackgroundPaths from '$lib/components/kokonut/BackgroundPaths.svelte';
import { animateMock, animations, preferReducedMotion, resetMotionMocks } from '../mocks/motion';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());

/** 12 primary + 15 secondary + 10 accent, mirrored. */
const PATHS_PER_SIDE = 37;
const TOTAL_PATHS = PATHS_PER_SIDE * 2;

describe('BackgroundPaths', () => {
	beforeEach(resetMotionMocks);
	afterEach(cleanup);

	it('renders both mirrored path sets', () => {
		const { container } = render(BackgroundPaths);
		expect(container.querySelectorAll('svg path')).toHaveLength(TOTAL_PATHS);
		expect(container.querySelectorAll('svg')).toHaveLength(2);
	});

	it('is decorative and inert', () => {
		const { container } = render(BackgroundPaths);
		const wrapper = container.querySelector('.background-paths') as HTMLElement;
		expect(wrapper).toHaveAttribute('aria-hidden', 'true');
		for (const svg of container.querySelectorAll('svg')) {
			expect(svg).toHaveAttribute('viewBox', '0 0 696 316');
			expect(svg).toHaveAttribute('fill', 'none');
		}
	});

	it('applies the opacity prop to the wrapper', () => {
		const { container } = render(BackgroundPaths, { props: { opacity: 0.25 } });
		expect((container.querySelector('.background-paths') as HTMLElement).style.opacity).toBe(
			'0.25'
		);
	});

	it('defaults to 0.6 opacity and merges a caller class', () => {
		const { container } = render(BackgroundPaths, { props: { class: 'inset-0' } });
		const wrapper = container.querySelector('.background-paths') as HTMLElement;
		expect(wrapper.style.opacity).toBe('0.6');
		expect(wrapper).toHaveClass('inset-0');
	});

	it('gives every path stroke geometry from the generator', () => {
		const { container } = render(BackgroundPaths);
		const paths = [...container.querySelectorAll('svg path')];
		for (const path of paths) {
			expect(path.getAttribute('d')?.startsWith('M ')).toBe(true);
			expect(path).toHaveAttribute('stroke', 'currentColor');
			expect(Number(path.getAttribute('stroke-width'))).toBeGreaterThan(0);
		}
		// Mirrored halves start at opposite x coordinates.
		expect(paths[0].getAttribute('d')?.split(' ')[1]).toBe('2400');
		expect(paths[PATHS_PER_SIDE].getAttribute('d')?.split(' ')[1]).toBe('-2400');
	});

	it('loops a draw-in animation on every path', () => {
		render(BackgroundPaths);
		expect(animateMock).toHaveBeenCalledTimes(TOTAL_PATHS);
		const [element, keyframes, options] = animateMock.mock.calls[0];
		expect((element as Element).tagName).toBe('path');
		expect(keyframes).toEqual({
			pathLength: [0.3, 1],
			pathOffset: [0, 1],
			opacity: [0.3, 0.6, 0.3]
		});
		expect(options).toMatchObject({ repeat: Infinity, ease: 'linear', duration: 25 });
	});

	it('renders statically at reduced opacity under reduced motion', () => {
		preferReducedMotion();
		const { container } = render(BackgroundPaths);
		expect(animateMock).not.toHaveBeenCalled();
		expect(container.querySelectorAll('svg path')).toHaveLength(TOTAL_PATHS);
		expect((container.querySelector('.background-paths') as HTMLElement).style.opacity).toBe('0.4');
	});

	it('stops every animation when destroyed', () => {
		const { unmount } = render(BackgroundPaths);
		unmount();
		expect(animations).toHaveLength(TOTAL_PATHS);
		for (const animation of animations) expect(animation.stop).toHaveBeenCalled();
	});
});
