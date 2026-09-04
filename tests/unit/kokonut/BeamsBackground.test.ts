import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import BeamsBackground from '$lib/components/kokonut/BeamsBackground.svelte';
import { theme } from '$lib/state/theme.svelte';
import { preferReducedMotion, resetMotionMocks } from './motionMock';

vi.mock('$lib/motion', async () => (await import('./motionMock')).motionModule());

/** Records what the component asked the 2D context to do. */
function createContextStub() {
	const gradients: { stops: [number, string][] }[] = [];
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

let contextStub: ReturnType<typeof createContextStub>;
let frames: FrameRequestCallback[];
let cancelled: number[];

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

		theme.set('dark');
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

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
		const hues = contextStub.gradients
			.flatMap((gradient) => gradient.stops.map(([, color]) => color))
			.map((color) => Number(color.match(/hsla\((-?[\d.]+)/)?.[1]))
			.filter((hue) => Number.isFinite(hue));
		expect(hues.length).toBeGreaterThan(0);
		for (const hue of hues) {
			expect(hue).toBeGreaterThanOrEqual(10);
			expect(hue).toBeLessThanOrEqual(40);
		}
	});

	it('derives cool hues from the light theme', () => {
		theme.set('light');
		render(BeamsBackground);
		const hues = contextStub.gradients
			.flatMap((gradient) => gradient.stops.map(([, color]) => color))
			.map((color) => Number(color.match(/hsla\((-?[\d.]+)/)?.[1]))
			.filter((hue) => Number.isFinite(hue));
		expect(hues.length).toBeGreaterThan(0);
		for (const hue of hues) {
			expect(hue).toBeGreaterThanOrEqual(205);
			expect(hue).toBeLessThanOrEqual(230);
		}
	});

	it('honours an explicit hueRange over the theme default', () => {
		render(BeamsBackground, { props: { hueRange: [300, 320] as [number, number] } });
		const hues = contextStub.gradients
			.flatMap((gradient) => gradient.stops.map(([, color]) => color))
			.map((color) => Number(color.match(/hsla\((-?[\d.]+)/)?.[1]))
			.filter((hue) => Number.isFinite(hue));
		expect(hues.length).toBeGreaterThan(0);
		for (const hue of hues) {
			expect(hue).toBeGreaterThanOrEqual(300);
			expect(hue).toBeLessThanOrEqual(320);
		}
	});

	it('draws exactly one frame under reduced motion', () => {
		preferReducedMotion();
		render(BeamsBackground);
		expect(contextStub.ctx.fillRect).toHaveBeenCalledTimes(30);
		expect(frames).toHaveLength(0);
	});

	it('stays idle while the document is hidden', () => {
		vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
		render(BeamsBackground);
		expect(frames).toHaveLength(0);
	});
});
