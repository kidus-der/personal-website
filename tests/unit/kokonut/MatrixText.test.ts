import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import MatrixText from '$lib/components/kokonut/MatrixText.svelte';
import { preferReducedMotion, resetMotionMocks } from '../mocks/motion';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());

const TEXT = 'Not found';
const INITIAL_DELAY = 200;
const LETTER_INTERVAL = 100;
const LETTER_DURATION = 500;
/** Long enough for the last letter to start scrambling and settle again. */
const TOTAL = INITIAL_DELAY + TEXT.length * LETTER_INTERVAL + LETTER_DURATION;

function setup(props: Record<string, unknown> = {}) {
	const result = render(MatrixText, {
		props: {
			text: TEXT,
			initialDelay: INITIAL_DELAY,
			letterInterval: LETTER_INTERVAL,
			letterAnimationDuration: LETTER_DURATION,
			...props
		}
	});
	const wrapper = () => result.container.querySelector('.matrix-text') as HTMLElement;
	// Spaces render as non-breaking spaces so the inline-block glyphs keep width.
	const read = () => (wrapper().textContent ?? '').replace(/\u00a0/g, ' ');
	const scrambling = () => result.container.querySelectorAll('.matrix-text__char--scrambling');
	return { ...result, wrapper, read, scrambling };
}

describe('MatrixText', () => {
	beforeEach(() => {
		resetMotionMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('renders one span per character, spaces included', () => {
		const { container, read } = setup();
		expect(container.querySelectorAll('.matrix-text__char')).toHaveLength(TEXT.length);
		expect(read()).toBe(TEXT);
	});

	it('scrambles letters through binary digits once the initial delay elapses', async () => {
		const { scrambling } = setup();
		expect(scrambling()).toHaveLength(0);
		await vi.advanceTimersByTimeAsync(INITIAL_DELAY + 1);
		expect(scrambling().length).toBeGreaterThan(0);
		for (const span of scrambling()) expect(span.textContent).toMatch(/^[01]$/);
	});

	it('never scrambles whitespace', async () => {
		const { container } = setup();
		await vi.advanceTimersByTimeAsync(INITIAL_DELAY + 3 * LETTER_INTERVAL + 1);
		const spaceSpan = container.querySelectorAll('.matrix-text__char')[3];
		expect(spaceSpan).not.toHaveClass('matrix-text__char--scrambling');
		expect(spaceSpan.textContent).toBe('\u00a0');
	});

	it('settles back to the original text', async () => {
		const { read, scrambling } = setup();
		await vi.advanceTimersByTimeAsync(TOTAL);
		expect(read()).toBe(TEXT);
		expect(scrambling()).toHaveLength(0);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('exposes the real string to assistive tech', () => {
		const { wrapper, container, getByRole } = setup();
		// `role="img"` is what makes the label authoritative: without a role, a
		// label on a span whose glyphs are all hidden can be announced as nothing.
		expect(wrapper()).toHaveAttribute('role', 'img');
		expect(wrapper()).toHaveAttribute('aria-label', TEXT);
		expect(getByRole('img', { name: TEXT })).toBe(wrapper());
		expect(container.querySelector('.matrix-text__char')).toHaveAttribute('aria-hidden', 'true');
	});

	it('renders statically under reduced motion', async () => {
		preferReducedMotion();
		const { read, scrambling } = setup();
		expect(read()).toBe(TEXT);
		expect(vi.getTimerCount()).toBe(0);
		await vi.advanceTimersByTimeAsync(TOTAL);
		expect(scrambling()).toHaveLength(0);
	});

	it('handles an empty string without scheduling work', () => {
		const { container } = setup({ text: '' });
		expect(container.querySelectorAll('.matrix-text__char')).toHaveLength(0);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('clears its timers when destroyed mid-scramble', async () => {
		const { unmount } = setup();
		await vi.advanceTimersByTimeAsync(INITIAL_DELAY + LETTER_INTERVAL);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
