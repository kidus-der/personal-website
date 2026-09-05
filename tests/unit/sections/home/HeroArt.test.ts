import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import HeroArt from '$lib/components/sections/home/HeroArt.svelte';
import {
	ENTRANCE_DROP,
	ENTRANCE_ROTATE_OFFSET,
	HERO_SHAPES
} from '$lib/components/sections/home/heroArt';
import { animateMock, animations, preferReducedMotion, resetMotionMocks } from '../../mocks/motion';

vi.mock('$lib/motion', async () => (await import('../../mocks/motion')).motionModule());

function setup(props: Record<string, unknown> = {}) {
	const result = render(HeroArt, { props });
	const root = () => result.container.querySelector('.hero-art') as HTMLElement;
	const shapes = () => [...result.container.querySelectorAll<HTMLElement>('.hero-art__shape')];
	const auroras = () => [...result.container.querySelectorAll<HTMLElement>('.hero-art__aurora')];
	return { ...result, root, shapes, auroras };
}

/** Every element the mock was asked to animate, in call order. */
function targets() {
	return animateMock.mock.calls.map((call) => call[0]);
}

/** The keyframes aimed at one element, in call order. */
function keyframesFor(element: Element) {
	return animateMock.mock.calls
		.filter((call) => call[0] === element)
		.map((call) => call[1] as Record<string, unknown>);
}

describe('HeroArt', () => {
	beforeEach(resetMotionMocks);
	afterEach(cleanup);

	it('renders one slab per composed shape', () => {
		const { shapes } = setup();
		expect(shapes()).toHaveLength(HERO_SHAPES.length);
	});

	it('is decorative: the whole art is hidden from assistive tech', () => {
		const { root } = setup();
		expect(root()).toHaveAttribute('aria-hidden', 'true');
	});

	it('carries the hero pre-hide hook so the entrance cannot flash', () => {
		const { root } = setup();
		expect(root()).toHaveAttribute('data-hero');
	});

	it('merges a caller class onto the root', () => {
		const { root } = setup({ class: 'hero__art' });
		expect(root()).toHaveClass('hero-art', 'hero__art');
	});

	it('places each slab at its composed size, position and tilt', () => {
		const { shapes } = setup();
		shapes().forEach((element, index) => {
			const shape = HERO_SHAPES[index];
			expect(element.style.width).toBe(`${shape.width}%`);
			expect(element.style.height).toBe(`${shape.height}%`);
			expect(element.style.left).toBe(`${shape.x}%`);
			expect(element.style.top).toBe(`${shape.y}%`);
			expect(element.style.transform).toContain(`rotate(${shape.rotate}deg)`);
		});
	});

	it('tags each slab with its colour token so the theme can re-tint it', () => {
		const { shapes } = setup();
		shapes().forEach((element, index) => {
			expect(element).toHaveClass(`hero-art__shape--${HERO_SHAPES[index].color}`);
		});
	});

	it('renders two aurora layers behind the slabs', () => {
		const { auroras } = setup();
		expect(auroras()).toHaveLength(2);
	});

	it('drops each slab in from above, unwinding its tilt, on its own delay', () => {
		const { shapes } = setup();
		const rendered = shapes();

		rendered.forEach((element, index) => {
			const shape = HERO_SHAPES[index];
			const entrance = animateMock.mock.calls.find((call) => call[0] === element);
			expect(entrance).toBeDefined();
			expect(entrance?.[1]).toMatchObject({
				y: [ENTRANCE_DROP, 0],
				opacity: [0, 1],
				rotate: [shape.rotate + ENTRANCE_ROTATE_OFFSET, shape.rotate]
			});
			expect(entrance?.[2]).toMatchObject({ delay: shape.delay });
		});
	});

	it('floats each slab forever once its entrance has landed', async () => {
		const { shapes } = setup();
		// The mock resolves `finished` immediately; the float is chained off it.
		await Promise.resolve();
		await Promise.resolve();

		for (const element of shapes()) {
			const float = keyframesFor(element).at(-1);
			expect(float).toMatchObject({ y: [0, 15, 0] });
			const options = animateMock.mock.calls.filter((call) => call[0] === element).at(-1)?.[2];
			expect(options).toMatchObject({ repeat: Infinity });
		}
	});

	it('drifts both aurora layers on a mirrored loop', () => {
		const { auroras } = setup();
		for (const layer of auroras()) {
			const call = animateMock.mock.calls.find((entry) => entry[0] === layer);
			expect(call).toBeDefined();
			expect(call?.[2]).toMatchObject({ repeat: Infinity, repeatType: 'mirror' });
		}
	});

	it('renders the composition at rest and animates nothing under reduced motion', () => {
		preferReducedMotion();
		const { shapes } = setup();
		expect(shapes()).toHaveLength(HERO_SHAPES.length);
		for (const element of shapes()) expect(element.style.opacity).toBe('');
		expect(animateMock).not.toHaveBeenCalled();
	});

	it('stops every animation it started when it unmounts', async () => {
		const { unmount } = setup();
		await Promise.resolve();
		await Promise.resolve();
		expect(targets().length).toBeGreaterThan(0);

		unmount();

		for (const animation of animations) expect(animation.stop).toHaveBeenCalled();
	});
});
