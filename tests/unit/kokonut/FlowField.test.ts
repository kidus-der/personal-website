import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import FlowField from '$lib/components/kokonut/FlowField.svelte';
import { FLOW_VIEW_BOX, flowPathCount } from '$lib/components/kokonut/flowField';
import {
	animateMock,
	animations,
	inViewMock,
	preferReducedMotion,
	resetMotionMocks
} from '../mocks/motion';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());

function setup(props: Record<string, unknown> = {}) {
	const result = render(FlowField, { props });
	const root = () => result.container.querySelector('.flow-field') as HTMLElement;
	const svg = () => result.container.querySelector('.flow-field__svg') as SVGSVGElement;
	const paths = () => [...result.container.querySelectorAll('path')];
	return { ...result, root, svg, paths };
}

/** The keyframes of every `animate` call, in order. */
function keyframes() {
	return animateMock.mock.calls.map((call) => call[1] as Record<string, unknown>);
}

/** Run the callback `inView` recorded, as if the field had scrolled in. */
function scrollIntoView(): () => void {
	const [, onStart] = inViewMock.mock.calls[0];
	return (onStart() ?? (() => {})) as () => void;
}

/**
 * The draw-in hands the loops off through `animation.finished`, which the mock
 * resolves immediately — so the loops exist one microtask after mount.
 */
async function settle() {
	await tick();
	await Promise.resolve();
	await Promise.resolve();
}

describe('FlowField', () => {
	beforeEach(resetMotionMocks);
	afterEach(cleanup);

	it('draws 36 paths at its bold intensity', () => {
		const { paths } = setup();
		expect(paths()).toHaveLength(flowPathCount('bold'));
	});

	it('draws 24 at soft, and says so on the root', () => {
		const { paths, root } = setup({ intensity: 'soft' });
		expect(paths()).toHaveLength(flowPathCount('soft'));
		expect(root()).toHaveClass('flow-field--soft');
	});

	it('is bold unless told otherwise', () => {
		expect(setup().root()).toHaveClass('flow-field--bold');
	});

	it('splits the paths into a primary and a secondary group', () => {
		const { container } = setup();
		const primary = container.querySelectorAll('.flow-field__layer--primary path');
		const secondary = container.querySelectorAll('.flow-field__layer--secondary path');
		expect(primary).toHaveLength(20);
		expect(secondary).toHaveLength(16);
	});

	it('stretches the field over whatever box it is given', () => {
		const { svg } = setup();
		expect(svg()).toHaveAttribute('viewBox', FLOW_VIEW_BOX);
		expect(svg()).toHaveAttribute('preserveAspectRatio', 'none');
	});

	it('is decorative and out of the tab order', () => {
		const { root, svg } = setup();
		expect(root()).toHaveAttribute('aria-hidden', 'true');
		expect(svg()).toHaveAttribute('focusable', 'false');
	});

	it('ramps the stroke width and hands the opacity ramp to CSS', () => {
		const { paths } = setup();
		const widths = paths().map((path) => Number(path.getAttribute('stroke-width')));
		expect(Math.min(...widths)).toBeCloseTo(1.5, 6);
		expect(Math.max(...widths)).toBeCloseTo(4.5, 6);
		// `--t` is what the stylesheet interpolates the theme's ramp along.
		for (const path of paths()) expect(path.style.getPropertyValue('--t')).not.toBe('');
	});

	it('keeps the stroke at its CSS width however the box is stretched', () => {
		for (const path of setup().paths()) {
			expect(path).toHaveAttribute('vector-effect', 'non-scaling-stroke');
		}
	});

	it('marks itself for the pre-hide and releases itself as it fades in', () => {
		const { root } = setup();
		expect(root()).toHaveAttribute('data-hero');
		// The mock runs `onComplete` synchronously, which is the release.
		expect(root()).toHaveAttribute('data-revealed', '');
		expect(root().hasAttribute('data-motion-ready')).toBe(false);
		expect(keyframes()[0]).toMatchObject({ opacity: [0, 1] });
	});

	it('draws every line in from nothing, staggered', () => {
		const { paths } = setup();
		const draw = animateMock.mock.calls.find(
			(call) => (call[1] as Record<string, unknown>).pathLength !== undefined
		);
		expect(draw).toBeDefined();
		expect(draw?.[0]).toHaveLength(paths().length);
		expect(draw?.[1]).toMatchObject({ pathLength: [0, 1] });
		expect((draw?.[2] as { duration: number }).duration).toBe(2.2);
	});

	it('drifts the two layers forever, at their own speeds, after the draw-in', async () => {
		setup();
		await settle();

		const drifts = animateMock.mock.calls.filter(
			(call) => (call[1] as Record<string, unknown>).pathOffset !== undefined
		);
		expect(drifts).toHaveLength(2);
		const durations = drifts.map((call) => (call[2] as { duration: number }).duration);
		expect(new Set(durations).size).toBe(2);
		for (const call of drifts) {
			expect(call[2]).toMatchObject({ repeat: Infinity, ease: 'linear' });
		}
	});

	it('breathes the whole field with one animation, not one per path', async () => {
		const { container } = setup();
		await settle();

		const breathes = animateMock.mock.calls.filter(
			(call) => call[0] === container.querySelector('.flow-field__breathe')
		);
		expect(breathes).toHaveLength(1);
		expect(breathes[0][1]).toMatchObject({ opacity: [0.7, 1, 0.7] });
	});

	it('holds the loops until the field is actually on screen', async () => {
		setup();
		await settle();
		const loops = animations.slice(2);
		expect(loops.length).toBeGreaterThan(0);
		for (const loop of loops) expect(loop.pause).toHaveBeenCalled();
		for (const loop of loops) expect(loop.play).not.toHaveBeenCalled();

		scrollIntoView();
		for (const loop of loops) expect(loop.play).toHaveBeenCalled();
	});

	it('pauses the loops again when the field scrolls out of view', async () => {
		setup();
		await settle();
		const leave = scrollIntoView();
		const loops = animations.slice(2);
		for (const loop of loops) loop.pause.mockClear();

		leave();
		for (const loop of loops) expect(loop.pause).toHaveBeenCalled();
	});

	it('pauses the loops while the tab is in the background', async () => {
		setup();
		await settle();
		scrollIntoView();
		const loops = animations.slice(2);
		for (const loop of loops) loop.pause.mockClear();

		const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
		document.dispatchEvent(new Event('visibilitychange'));
		for (const loop of loops) expect(loop.pause).toHaveBeenCalled();

		visibility.mockReturnValue('visible');
		for (const loop of loops) loop.play.mockClear();
		document.dispatchEvent(new Event('visibilitychange'));
		for (const loop of loops) expect(loop.play).toHaveBeenCalled();
		visibility.mockRestore();
	});

	it('animates nothing under reduced motion, and shows the finished field', () => {
		preferReducedMotion();
		const { root, paths } = setup();
		expect(animateMock).not.toHaveBeenCalled();
		expect(inViewMock).not.toHaveBeenCalled();
		expect(paths()).toHaveLength(flowPathCount('bold'));
		expect(root()).toHaveAttribute('data-revealed', '');
	});

	it('stops everything and stops watching when it unmounts', async () => {
		const { unmount } = setup();
		await settle();
		const stopWatching = inViewMock.mock.results[0].value as ReturnType<typeof vi.fn>;
		const started = [...animations];
		expect(started.length).toBeGreaterThan(0);

		unmount();

		for (const animation of started) expect(animation.stop).toHaveBeenCalled();
		expect(stopWatching).toBeDefined();
	});

	it('takes a class from its caller', () => {
		expect(setup({ class: 'error-page__field' }).root()).toHaveClass('error-page__field');
	});
});
