import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { tick, createRawSnippet } from 'svelte';
import MouseEffectCard from '$lib/components/kokonut/MouseEffectCard.svelte';
import { preferReducedMotion, resetMotionMocks } from '../mocks/motion';
import { MAX_DOTS } from '$lib/components/kokonut/mouseEffectDots';
import source from '$lib/components/kokonut/MouseEffectCard.svelte?raw';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());

const WIDTH = 400;
const HEIGHT = 300;

const body = createRawSnippet(() => ({ render: () => '<p>Based in Edmonton</p>' }));

let frames: FrameRequestCallback[];
let resizeCallbacks: ResizeObserverCallback[];

/** Runs every frame scheduled so far, once. */
function runFrame() {
	const queued = frames;
	frames = [];
	for (const frame of queued) frame(performance.now());
}

function stubLayout(width = WIDTH, height = HEIGHT) {
	vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
		x: 0,
		y: 0,
		top: 0,
		left: 0,
		right: width,
		bottom: height,
		width,
		height,
		toJSON: () => ({})
	} as DOMRect);
}

async function setup(props: Record<string, unknown> = {}) {
	const result = render(MouseEffectCard, { props: { children: body, ...props } });
	await tick();
	const card = () => result.container.querySelector('.mouse-effect-card') as HTMLElement;
	const field = () => result.container.querySelector('.mouse-effect-card__field') as HTMLElement;
	const dots = () => [...result.container.querySelectorAll('.mouse-effect-card__dot')];
	return { ...result, card, field, dots };
}

describe('MouseEffectCard', () => {
	beforeEach(() => {
		resetMotionMocks();
		stubLayout();
		// Deterministic dot field: `random() > edgeFactor` is then never true,
		// so every grid position survives and only the hard cap trims the field.
		vi.spyOn(Math, 'random').mockReturnValue(0);

		frames = [];
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
			frames.push(callback);
			return frames.length;
		});
		vi.stubGlobal('cancelAnimationFrame', () => {});

		resizeCallbacks = [];
		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(callback: ResizeObserverCallback) {
					resizeCallbacks.push(callback);
				}
				observe() {}
				unobserve() {}
				disconnect() {}
			}
		);
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('renders its children above the dot field', async () => {
		const { getByText, field } = await setup();
		expect(getByText('Based in Edmonton')).toBeInTheDocument();
		expect(field()).toBeInTheDocument();
	});

	it('fills a 400x300 container without exceeding the dot cap', async () => {
		const { dots } = await setup();
		// At the default 24px pitch: 16 columns x 12 rows = 192 candidates,
		// trimmed to the cap.
		expect(dots().length).toBeGreaterThan(0);
		expect(dots()).toHaveLength(MAX_DOTS);
	});

	it('spaces the dots at the wider default pitch', async () => {
		const { dots } = await setup({ dotSpacing: 24 });
		// The same field the default produces: the default is 24.
		expect(dots()).toHaveLength(MAX_DOTS);
	});

	it('gives the dots no perpetual animation of their own', () => {
		// 400 dots each running a CSS pulse was, with the path field, most of
		// what `document.getAnimations()` reported on the home page. The dots now
		// sit at a static opacity and only brighten near the pointer.
		const rule = source.match(/\.mouse-effect-card__dot \{([^}]*)\}/)?.[1] ?? '';
		expect(rule).not.toContain('animation:');
		expect(source).not.toContain('@keyframes dot-pulse');
		expect(source).not.toContain('animation-delay');
	});

	it('lays every dot out inside the container', async () => {
		const { dots } = await setup();
		for (const dot of dots()) {
			const left = Number.parseFloat((dot as HTMLElement).style.left);
			const top = Number.parseFloat((dot as HTMLElement).style.top);
			expect(left).toBeGreaterThanOrEqual(0);
			expect(left).toBeLessThanOrEqual(WIDTH);
			expect(top).toBeGreaterThanOrEqual(0);
			expect(top).toBeLessThanOrEqual(HEIGHT);
		}
	});

	it('honours a wider dot spacing', async () => {
		const { dots } = await setup({ dotSpacing: 40 });
		// 10 columns x 7 rows.
		expect(dots()).toHaveLength(70);
	});

	it('regenerates the field when the container resizes', async () => {
		const { dots } = await setup({ dotSpacing: 40 });
		expect(dots()).toHaveLength(70);

		stubLayout(200, 200);
		for (const callback of resizeCallbacks) {
			callback([], {} as ResizeObserver);
		}
		await tick();
		// 5 columns x 5 rows.
		expect(dots()).toHaveLength(25);
	});

	it('pushes nearby dots away from the pointer', async () => {
		const { card, dots } = await setup();
		expect(dots().every((dot) => (dot as HTMLElement).style.transform === '')).toBe(true);

		card().dispatchEvent(
			new PointerEvent('pointermove', { bubbles: true, clientX: WIDTH / 2, clientY: HEIGHT / 2 })
		);
		runFrame();

		const moved = dots().filter((dot) => {
			const transform = (dot as HTMLElement).style.transform;
			return transform !== '' && transform !== 'translate(0px, 0px)';
		});
		expect(moved.length).toBeGreaterThan(0);
	});

	it('settles the dots back when the pointer leaves', async () => {
		const { card, dots } = await setup();
		card().dispatchEvent(
			new PointerEvent('pointermove', { bubbles: true, clientX: WIDTH / 2, clientY: HEIGHT / 2 })
		);
		runFrame();
		card().dispatchEvent(new PointerEvent('pointerleave'));

		// The spring needs a few frames to unwind; it must end at the origin.
		for (let i = 0; i < 400 && frames.length > 0; i += 1) runFrame();

		for (const dot of dots()) {
			expect((dot as HTMLElement).style.transform).toBe('translate(0px, 0px)');
		}
	});

	it('moves a virtual pointer with the arrow keys', async () => {
		const { field, dots } = await setup({ keyboardInteractive: true });
		const settle = () => {
			for (let i = 0; i < 400 && frames.length > 0; i += 1) runFrame();
			return dots().map((dot) => (dot as HTMLElement).style.transform);
		};

		// Focus parks the virtual pointer in the middle of the card.
		field().dispatchEvent(new FocusEvent('focus'));
		const centred = settle();
		expect(centred.some((transform) => transform !== 'translate(0px, 0px)')).toBe(true);

		field().dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
		);
		const nudged = settle();
		expect(nudged).not.toEqual(centred);
	});

	it('drops the virtual pointer on blur', async () => {
		const { field, dots } = await setup({ keyboardInteractive: true });
		field().dispatchEvent(new FocusEvent('focus'));
		for (let i = 0; i < 400 && frames.length > 0; i += 1) runFrame();

		field().dispatchEvent(new FocusEvent('blur'));
		for (let i = 0; i < 400 && frames.length > 0; i += 1) runFrame();

		for (const dot of dots()) {
			expect((dot as HTMLElement).style.transform).toBe('translate(0px, 0px)');
		}
	});

	it('stays out of the tab order by default', async () => {
		const { field } = await setup();
		expect(field()).toHaveAttribute('tabindex', '-1');
	});

	it('joins the tab order only when asked, and is named for assistive tech', async () => {
		const { field } = await setup({ keyboardInteractive: true });
		expect(field()).toHaveAttribute('tabindex', '0');
		expect(field()).toHaveAttribute('role', 'img');
		expect(field()).toHaveAccessibleName();
	});

	it('leaves arrow keys alone when they did not start on the field', async () => {
		const { field, container } = await setup({ keyboardInteractive: true });
		const dot = container.querySelector('.mouse-effect-card__dot') as HTMLElement;
		const event = new KeyboardEvent('keydown', {
			key: 'ArrowRight',
			bubbles: true,
			cancelable: true
		});

		dot.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
		expect(frames).toHaveLength(0);
		expect(field()).toBeInTheDocument();
	});

	it('claims the arrow keys it does handle', async () => {
		const { field } = await setup({ keyboardInteractive: true });
		const event = new KeyboardEvent('keydown', {
			key: 'ArrowRight',
			bubbles: true,
			cancelable: true
		});

		field().dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
	});

	it('rewrites a dot opacity only when the rounded value actually changes', async () => {
		const { card, dots } = await setup();
		const dot = dots()[0] as HTMLElement;
		const setProperty = vi.spyOn(dot.style, 'setProperty');

		card().dispatchEvent(
			new PointerEvent('pointermove', { bubbles: true, clientX: 0, clientY: 0 })
		);
		// Settle fully, then count how often this one dot's opacity was rewritten.
		for (let i = 0; i < 400 && frames.length > 0; i += 1) runFrame();
		const writes = setProperty.mock.calls.filter(([name]) => name === '--dot-opacity').length;

		// Many frames ran; the boost only moves through a handful of rounded steps.
		expect(writes).toBeGreaterThan(0);
		expect(writes).toBeLessThan(40);
	});

	it('renders a still field and schedules no frames under reduced motion', async () => {
		preferReducedMotion();
		const { card, dots } = await setup();
		expect(dots().length).toBeGreaterThan(0);

		card().dispatchEvent(
			new PointerEvent('pointermove', { bubbles: true, clientX: WIDTH / 2, clientY: HEIGHT / 2 })
		);
		expect(frames).toHaveLength(0);
		expect(dots().every((dot) => (dot as HTMLElement).style.transform === '')).toBe(true);
	});

	it('merges a caller-supplied class', async () => {
		const { card } = await setup({ class: 'md:col-span-2' });
		expect(card()).toHaveClass('md:col-span-2');
	});
});
