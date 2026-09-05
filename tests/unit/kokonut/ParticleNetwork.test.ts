import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import ParticleNetwork from '$lib/components/kokonut/ParticleNetwork.svelte';
import { PARTICLE_COUNTS, TRAIL_ALPHA } from '$lib/components/kokonut/particleNetwork';
import { inViewMock, preferReducedMotion, resetMotionMocks } from '../mocks/motion';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());

/** The box every element in these tests reports. Mutable, so a resize can move it. */
const BOX = { width: 800, height: 400 };

/** Frames the component simulates for its still, reduced-motion composition. */
const STATIC_FRAMES = 60;

/** The dark theme's fallbacks, which is what jsdom's empty tokens resolve to. */
const FALLBACK_BG = 'rgba(0,0,0,';
const FALLBACK_ACCENT = 'rgba(239,88,36,';

type Counter = (() => void) & { count: number };

/**
 * A call counter for the hot canvas methods.
 *
 * `vi.fn` keeps every call's arguments, and a reduced-motion mount draws sixty
 * frames of a 2400-node field — well over a million calls. Counting is all any
 * assertion here needs, and it keeps the suite from spending its time (and a
 * few hundred megabytes) recording arguments nothing reads.
 */
function counter(): Counter {
	const fn = (() => {
		fn.count += 1;
	}) as Counter;
	fn.count = 0;
	return fn;
}

/**
 * A recording 2D context.
 *
 * jsdom has no canvas implementation, so `getContext` returns `null` and the
 * component would draw nothing at all. This stands in for it: one `arc` per
 * node, a `lineTo` per link, and every `fillStyle`/`strokeStyle` assignment
 * kept so the colours can be asserted.
 */
function createRecordingContext() {
	const fillStyles: string[] = [];
	const strokeStyles: string[] = [];
	let fillStyle = '';
	let strokeStyle = '';
	const gradient = { addColorStop: vi.fn() };

	return {
		fillStyles,
		strokeStyles,
		get fillStyle() {
			return fillStyle;
		},
		set fillStyle(value: string) {
			fillStyle = value;
			fillStyles.push(value);
		},
		get strokeStyle() {
			return strokeStyle;
		},
		set strokeStyle(value: string) {
			strokeStyle = value;
			strokeStyles.push(value);
		},
		lineWidth: 0,
		setTransform: vi.fn(),
		fillRect: vi.fn(),
		beginPath: vi.fn(),
		stroke: vi.fn(),
		fill: vi.fn(),
		createRadialGradient: vi.fn(() => gradient),
		moveTo: counter(),
		lineTo: counter(),
		arc: counter(),
		drawImage: counter()
	};
}

type RecordingContext = ReturnType<typeof createRecordingContext>;

/** A stubbed observer, so a test can drive it and see it disconnected. */
interface RecordedObserver {
	callback: () => void;
	observe: Mock;
	disconnect: Mock;
}

let contexts: RecordingContext[] = [];
let resizeObservers: RecordedObserver[] = [];
let mutationObservers: RecordedObserver[] = [];
let rafCallbacks: FrameRequestCallback[] = [];
let rafMock: Mock;
let cancelRafMock: Mock;
let innerWidth = 1024;

function recordObserver(into: RecordedObserver[]) {
	return class {
		observe = vi.fn();
		unobserve = vi.fn();
		disconnect = vi.fn();
		takeRecords = vi.fn(() => []);
		constructor(callback: () => void) {
			into.push({ callback, observe: this.observe, disconnect: this.disconnect });
		}
	};
}

beforeEach(() => {
	resetMotionMocks();
	contexts = [];
	resizeObservers = [];
	mutationObservers = [];
	rafCallbacks = [];
	innerWidth = 1024;
	BOX.width = 800;
	BOX.height = 400;

	vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
		const context = createRecordingContext();
		contexts.push(context);
		return context as unknown as CanvasRenderingContext2D;
	});
	// Read from `BOX` on every call, so a test can move the box and re-run the
	// ResizeObserver.
	vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
		() =>
			({
				width: BOX.width,
				height: BOX.height,
				x: 0,
				y: 0,
				top: 0,
				left: 0,
				right: BOX.width,
				bottom: BOX.height,
				toJSON: () => ({})
			}) as DOMRect
	);

	rafMock = vi.fn((callback: FrameRequestCallback) => {
		rafCallbacks.push(callback);
		return rafCallbacks.length;
	});
	cancelRafMock = vi.fn();
	vi.stubGlobal('requestAnimationFrame', rafMock);
	vi.stubGlobal('cancelAnimationFrame', cancelRafMock);
	vi.stubGlobal('ResizeObserver', recordObserver(resizeObservers));
	vi.stubGlobal('MutationObserver', recordObserver(mutationObservers));
	vi.stubGlobal('devicePixelRatio', 2);
	Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => innerWidth });
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

function setup(props: Record<string, unknown> = {}) {
	const result = render(ParticleNetwork, { props });
	const root = () => result.container.querySelector('.particle-network') as HTMLElement;
	const canvas = () => result.container.querySelector('canvas') as HTMLCanvasElement;
	/** The field's own context; the ones after it are the glow sprites. */
	const context = () => contexts[0];
	return { ...result, root, canvas, context };
}

/** Run the callback `inView` recorded, as if the field had scrolled in. */
function scrollIntoView(): () => void {
	const [, onStart] = inViewMock.mock.calls[0];
	return (onStart() ?? (() => {})) as () => void;
}

/** Run the one frame the loop has scheduled. */
function runFrame(time = 16) {
	const next = rafCallbacks.shift();
	expect(next).toBeDefined();
	next?.(time);
}

describe('ParticleNetwork', () => {
	it('is one canvas, decorative, and staged by the pre-hide', () => {
		const { root, canvas } = setup();
		expect(root()).toHaveAttribute('aria-hidden', 'true');
		expect(root()).toHaveAttribute('data-hero');
		expect(canvas()).toBeInTheDocument();
		// The mock's `animate` runs `onComplete` synchronously, which is the release.
		expect(root()).toHaveAttribute('data-revealed', '');
	});

	it('backs the canvas at the device ratio and draws in CSS pixels', () => {
		const { canvas, context } = setup();
		expect(canvas().width).toBe(BOX.width * 2);
		expect(canvas().height).toBe(BOX.height * 2);
		expect(context().setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
	});

	it('draws one node per particle at its bold intensity', () => {
		const { context } = setup();
		scrollIntoView();
		runFrame();
		expect(context().arc.count).toBe(PARTICLE_COUNTS.bold);
	});

	it('draws half as many at soft, and says so on the root', () => {
		const { context, root } = setup({ intensity: 'soft' });
		scrollIntoView();
		runFrame();
		expect(context().arc.count).toBe(PARTICLE_COUNTS.soft);
		expect(root()).toHaveClass('particle-network--soft');
	});

	it('is bold unless told otherwise', () => {
		expect(setup().root()).toHaveClass('particle-network--bold');
	});

	it('halves the count on a narrow viewport', () => {
		innerWidth = 390;
		const { context } = setup();
		scrollIntoView();
		runFrame();
		expect(context().arc.count).toBe(PARTICLE_COUNTS.bold / 2);
	});

	it('links neighbouring nodes — the thing that makes it a network', () => {
		const { context } = setup();
		scrollIntoView();
		runFrame();
		expect(context().lineTo.count).toBeGreaterThan(0);
		expect(context().stroke).toHaveBeenCalled();
	});

	it('batches the paint rather than stroking and filling per particle', () => {
		const { context } = setup();
		scrollIntoView();
		runFrame();
		// Five link bands plus the hub band, and six node batches: three orders of
		// magnitude fewer draw calls than there are particles, which is what lets a
		// 2400-node field sit inside the page's budget.
		expect(context().stroke.mock.calls.length).toBeLessThanOrEqual(6);
		expect(context().fill.mock.calls.length).toBeLessThanOrEqual(6);
	});

	it('fades the previous frame towards the page background rather than clearing it', () => {
		const { context } = setup();
		scrollIntoView();
		runFrame();
		expect(context().fillStyles).toContain(`${FALLBACK_BG}${TRAIL_ALPHA})`);
		expect(context().fillRect).toHaveBeenCalledWith(0, 0, BOX.width, BOX.height);
	});

	it('paints the nodes and the links from the tokens', () => {
		const { context } = setup();
		scrollIntoView();
		runFrame();
		expect(context().fillStyles.some((style) => style.startsWith(FALLBACK_ACCENT))).toBe(true);
		// Links are the text colour at a low alpha; nodes are not.
		expect(context().strokeStyles.some((style) => style.startsWith('rgba(244,244,245,'))).toBe(
			true
		);
	});

	it('glows a subset of the nodes from a pre-rendered sprite', () => {
		const { context } = setup();
		scrollIntoView();
		runFrame();
		expect(context().drawImage.count).toBeGreaterThan(0);
		expect(context().drawImage.count).toBeLessThan(PARTICLE_COUNTS.bold);
		// The sprites are baked once, on their own canvases; the frame loop never
		// builds a gradient.
		expect(context().createRadialGradient).not.toHaveBeenCalled();
		expect(contexts.length).toBe(3);
	});

	it('keeps the loop running frame after frame while it is on screen', () => {
		setup();
		scrollIntoView();
		runFrame(16);
		runFrame(32);
		expect(rafCallbacks).toHaveLength(1);
	});

	it('holds the loop until the field is actually on screen', () => {
		setup();
		expect(rafMock).not.toHaveBeenCalled();
		scrollIntoView();
		expect(rafMock).toHaveBeenCalled();
	});

	it('stops the loop again when the field scrolls out of view', () => {
		setup();
		const leave = scrollIntoView();
		leave();
		expect(cancelRafMock).toHaveBeenCalled();
	});

	it('stops the loop while the tab is in the background', () => {
		setup();
		scrollIntoView();
		const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
		document.dispatchEvent(new Event('visibilitychange'));
		expect(cancelRafMock).toHaveBeenCalled();

		cancelRafMock.mockClear();
		rafMock.mockClear();
		visibility.mockReturnValue('visible');
		document.dispatchEvent(new Event('visibilitychange'));
		expect(rafMock).toHaveBeenCalled();
	});

	it('re-reads the tokens and repaints the ground when the theme changes', () => {
		const { context } = setup();
		const spritesBefore = contexts.length;
		context().fillRect.mockClear();

		mutationObservers[0].callback();

		expect(context().fillRect).toHaveBeenCalledWith(0, 0, BOX.width, BOX.height);
		// New sprites, baked in the new theme's colours.
		expect(contexts.length).toBeGreaterThan(spritesBefore);
	});

	it('watches `data-theme` on the document element, not the whole tree', () => {
		setup();
		expect(mutationObservers[0].observe).toHaveBeenCalledWith(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});
	});

	it('re-backs the canvas when the wrapper is resized', () => {
		const { canvas, context } = setup();
		scrollIntoView();
		runFrame();
		context().setTransform.mockClear();

		BOX.width = 1200;
		resizeObservers[0].callback();

		expect(canvas().width).toBe(1200 * 2);
		expect(context().setTransform).toHaveBeenCalled();
	});

	it('seeds nothing while the wrapper has no size yet', () => {
		BOX.width = 0;
		BOX.height = 0;
		const { context } = setup();
		scrollIntoView();
		expect(rafMock).not.toHaveBeenCalled();
		expect(context().arc.count).toBe(0);
	});

	it('draws a still composition and never schedules a frame under reduced motion', () => {
		preferReducedMotion();
		const { context, root } = setup();

		expect(context().arc.count).toBe(PARTICLE_COUNTS.bold * STATIC_FRAMES);
		expect(rafMock).not.toHaveBeenCalled();
		expect(inViewMock).not.toHaveBeenCalled();
		expect(root()).toHaveAttribute('data-revealed', '');
	});

	it('cancels the frame and disconnects every observer when it unmounts', () => {
		const stopWatching = vi.fn();
		inViewMock.mockReturnValueOnce(stopWatching);
		const { unmount } = setup();
		scrollIntoView();

		unmount();

		expect(cancelRafMock).toHaveBeenCalled();
		expect(resizeObservers[0].disconnect).toHaveBeenCalled();
		expect(mutationObservers[0].disconnect).toHaveBeenCalled();
		expect(stopWatching).toHaveBeenCalled();
	});

	it('takes a class from its caller', () => {
		expect(setup({ class: 'error-page__field' }).root()).toHaveClass('error-page__field');
	});
});
