import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import BeamsBackground from '$lib/components/kokonut/BeamsBackground.svelte';
import { theme } from '$lib/state/theme.svelte';
import { animations, preferReducedMotion, resetMotionMocks } from './motionMock';

vi.mock('$lib/motion', async () => (await import('./motionMock')).motionModule());

interface GradientRecord {
	stops: [number, string][];
}

/** Records what the component asked the 2D context to do. */
function createContextStub() {
	const gradients: GradientRecord[] = [];
	const ctx = {
		scale: vi.fn(),
		clearRect: vi.fn(),
		save: vi.fn(),
		restore: vi.fn(),
		translate: vi.fn(),
		rotate: vi.fn(),
		fillRect: vi.fn(),
		createLinearGradient: vi.fn(() => {
			const gradient = { stops: [] as [number, string][] };
			gradients.push(gradient);
			return {
				addColorStop: (offset: number, color: string) => gradient.stops.push([offset, color])
			};
		}),
		filter: '',
		fillStyle: '' as unknown
	};
	return { ctx, gradients };
}

/** Every HSL hue the component actually painted, in call order. */
function huesFrom(gradients: GradientRecord[]): number[] {
	return gradients
		.flatMap((gradient) => gradient.stops.map(([, color]) => color))
		.map((color) => Number(color.match(/hsla\((-?[\d.]+)/)?.[1]))
		.filter((hue) => Number.isFinite(hue));
}

function expectHuesWithin(gradients: GradientRecord[], min: number, max: number) {
	const hues = huesFrom(gradients);
	expect(hues.length).toBeGreaterThan(0);
	for (const hue of hues) {
		expect(hue).toBeGreaterThanOrEqual(min);
		expect(hue).toBeLessThanOrEqual(max);
	}
}

let contextStub: ReturnType<typeof createContextStub>;
let frames: FrameRequestCallback[];
let cancelled: number[];
let documentHidden: boolean;
let resizeCallbacks: ResizeObserverCallback[];

describe('BeamsBackground', () => {
	beforeEach(() => {
		resetMotionMocks();
		contextStub = createContextStub();
		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
			contextStub.ctx as unknown as CanvasRenderingContext2D
		);

		frames = [];
		cancelled = [];
		// Never invoke the callback: the real loop re-schedules itself.
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
			frames.push(callback);
			return frames.length;
		});
		vi.stubGlobal('cancelAnimationFrame', (id: number) => cancelled.push(id));

		// Captured so tests can drive container resizes by hand.
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

		documentHidden = false;
		vi.spyOn(document, 'hidden', 'get').mockImplementation(() => documentHidden);

		theme.set('dark');
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	/** The veil pulse is this component's only `animate` call. */
	const veil = () => animations[0];

	it('mounts a decorative canvas', () => {
		const { container } = render(BeamsBackground);
		const canvas = container.querySelector('canvas');
		expect(canvas).toBeInTheDocument();
		expect(container.querySelector('.beams-background')).toHaveAttribute('aria-hidden', 'true');
	});

	it('merges a caller class', () => {
		const { container } = render(BeamsBackground, { props: { class: 'h-96' } });
		expect(container.querySelector('.beams-background')).toHaveClass('h-96');
	});

	it('sizes the canvas for the device pixel ratio', () => {
		vi.stubGlobal('devicePixelRatio', 2);
		const { container } = render(BeamsBackground);
		const canvas = container.querySelector('canvas') as HTMLCanvasElement;
		expect(canvas.width).toBe(window.innerWidth * 2);
		expect(canvas.height).toBe(window.innerHeight * 2);
		expect(contextStub.ctx.scale).toHaveBeenCalledWith(2, 2);
	});

	it('sizes to its container when the container has been laid out', () => {
		vi.stubGlobal('devicePixelRatio', 1);
		vi.spyOn(HTMLDivElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
		vi.spyOn(HTMLDivElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
		const { container } = render(BeamsBackground);
		const canvas = container.querySelector('canvas') as HTMLCanvasElement;
		expect(canvas.width).toBe(400);
		expect(canvas.height).toBe(300);
		expect(canvas.style.width).toBe('400px');
	});

	it('runs a render loop and cancels it on destroy', () => {
		const { unmount } = render(BeamsBackground);
		expect(frames.length).toBeGreaterThan(0);
		unmount();
		expect(cancelled.length).toBeGreaterThan(0);
	});

	it('draws thirty blurred beams per frame', () => {
		render(BeamsBackground);
		expect(contextStub.ctx.filter).toBe('blur(35px)');
		expect(contextStub.ctx.fillRect).toHaveBeenCalledTimes(30);
		expect(contextStub.ctx.save).toHaveBeenCalledTimes(30);
		expect(contextStub.ctx.restore).toHaveBeenCalledTimes(30);
	});

	it('derives warm hues from the dark theme', () => {
		render(BeamsBackground);
		expectHuesWithin(contextStub.gradients, 10, 40);
	});

	it('derives cool hues from the light theme', () => {
		theme.set('light');
		render(BeamsBackground);
		expectHuesWithin(contextStub.gradients, 205, 230);
	});

	it('honours an explicit hueRange over the theme default', () => {
		render(BeamsBackground, { props: { hueRange: [300, 320] as [number, number] } });
		expectHuesWithin(contextStub.gradients, 300, 320);
	});

	it('draws exactly one frame under reduced motion', () => {
		preferReducedMotion();
		render(BeamsBackground);
		expect(contextStub.ctx.fillRect).toHaveBeenCalledTimes(30);
		expect(frames).toHaveLength(0);
		// No veil pulse either — nothing should be animating at all.
		expect(animations).toHaveLength(0);
	});

	it('repaints the static frame when the container resizes under reduced motion', () => {
		preferReducedMotion();
		vi.stubGlobal('devicePixelRatio', 1);
		const clientWidth = vi
			.spyOn(HTMLDivElement.prototype, 'clientWidth', 'get')
			.mockReturnValue(400);
		vi.spyOn(HTMLDivElement.prototype, 'clientHeight', 'get').mockReturnValue(300);

		const { container } = render(BeamsBackground);
		expect(resizeCallbacks).toHaveLength(1);
		expect(contextStub.ctx.fillRect).toHaveBeenCalledTimes(30);

		clientWidth.mockReturnValue(800);
		resizeCallbacks[0]([], {} as ResizeObserver);

		const canvas = container.querySelector('canvas') as HTMLCanvasElement;
		expect(canvas.width).toBe(800);
		expect(contextStub.ctx.fillRect).toHaveBeenCalledTimes(60);
	});

	it('stays idle while the document is hidden', () => {
		documentHidden = true;
		render(BeamsBackground);
		expect(frames).toHaveLength(0);
	});

	it('pauses the veil pulse when the tab is hidden and resumes with it', () => {
		render(BeamsBackground);
		expect(veil().pause).not.toHaveBeenCalled();

		documentHidden = true;
		document.dispatchEvent(new Event('visibilitychange'));
		expect(veil().pause).toHaveBeenCalled();
		expect(cancelled.length).toBeGreaterThan(0);

		documentHidden = false;
		document.dispatchEvent(new Event('visibilitychange'));
		expect(veil().play).toHaveBeenCalled();
	});

	it('stops the veil pulse on destroy', () => {
		const { unmount } = render(BeamsBackground);
		expect(animations).toHaveLength(1);
		unmount();
		expect(veil().stop).toHaveBeenCalled();
	});
});
