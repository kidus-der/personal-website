import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import DynamicText from '$lib/components/kokonut/DynamicText.svelte';
import { animateMock, preferReducedMotion, resetMotionMocks } from '../mocks/motion';
import source from '$lib/components/kokonut/DynamicText.svelte?raw';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());

const WORDS = [{ text: 'ሰላም', lang: 'am' }, { text: 'hello' }, { text: 'bonjour' }];
const INTERVAL = 320;

function setup(props: Record<string, unknown> = {}) {
	const onDone = vi.fn();
	const result = render(DynamicText, {
		props: { words: WORDS, final: 'hello', interval: INTERVAL, onDone, ...props }
	});
	// The label element carries the live word; read its text without the
	// non-breaking space the layout uses to keep the box from collapsing.
	const read = () => result.container.querySelector('.dynamic-text__current')?.textContent ?? '';
	return { ...result, onDone, read };
}

describe('DynamicText', () => {
	beforeEach(() => {
		resetMotionMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('shows the first word immediately', () => {
		const { read } = setup();
		expect(read()).toBe('ሰላም');
	});

	it('cycles the words in order, one per interval', async () => {
		const { read } = setup();
		await vi.advanceTimersByTimeAsync(INTERVAL);
		expect(read()).toBe('hello');
		await vi.advanceTimersByTimeAsync(INTERVAL);
		expect(read()).toBe('bonjour');
	});

	it('settles on the final string and calls onDone exactly once', async () => {
		const { read, onDone } = setup({ final: 'Kidus' });
		await vi.advanceTimersByTimeAsync(INTERVAL * WORDS.length);
		expect(read()).toBe('Kidus');
		expect(onDone).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(INTERVAL * 10);
		expect(read()).toBe('Kidus');
		expect(onDone).toHaveBeenCalledTimes(1);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('tags the current word with its language when one is given', async () => {
		const { container } = setup();
		expect(container.querySelector('.dynamic-text__current')).toHaveAttribute('lang', 'am');
		await vi.advanceTimersByTimeAsync(INTERVAL);
		expect(container.querySelector('.dynamic-text__current')).not.toHaveAttribute('lang');
	});

	it('exposes the final string to assistive tech while cycling', () => {
		const { container, getByRole } = setup({ final: 'Kidus' });
		const wrapper = container.querySelector('.dynamic-text');
		// `role="img"` is what makes the label authoritative: without a role, a
		// label on a span whose children are all hidden can be announced as nothing.
		expect(wrapper).toHaveAttribute('role', 'img');
		expect(wrapper).toHaveAttribute('aria-label', 'Kidus');
		expect(getByRole('img', { name: 'Kidus' })).toBe(wrapper);
		expect(container.querySelector('.dynamic-text__current')).toHaveAttribute(
			'aria-hidden',
			'true'
		);
	});

	it('animates each word in', async () => {
		setup();
		animateMock.mockClear();
		await vi.advanceTimersByTimeAsync(INTERVAL);
		const enter = animateMock.mock.calls.at(-1);
		expect(enter?.[1]).toMatchObject({ y: [20, 0], opacity: [0, 1] });
	});

	it('renders the final string immediately under reduced motion', () => {
		preferReducedMotion();
		const { read, onDone } = setup({ final: 'Kidus' });
		expect(read()).toBe('Kidus');
		expect(onDone).toHaveBeenCalledTimes(1);
		expect(vi.getTimerCount()).toBe(0);
		expect(animateMock).not.toHaveBeenCalled();
	});

	it('settles immediately when there are no words', () => {
		const { read, onDone } = setup({ words: [], final: 'Kidus' });
		expect(read()).toBe('Kidus');
		expect(onDone).toHaveBeenCalledTimes(1);
		expect(vi.getTimerCount()).toBe(0);
	});

	describe('layout while two words cross over', () => {
		it('keeps exactly one word in normal flow at every step of the cycle', async () => {
			const { container } = setup();

			// A leaving word is `.dynamic-text__outgoing`, which the stylesheet
			// takes out of flow; the one word still in flow is the current one.
			// Two words in flow is what rendered "Bonjour Hola" side by side.
			for (let step = 0; step <= WORDS.length; step += 1) {
				expect(container.querySelectorAll('.dynamic-text__current')).toHaveLength(1);
				await vi.advanceTimersByTimeAsync(INTERVAL);
			}
		});

		it('lifts the exiting word out of flow, filling the box', () => {
			// jsdom does not apply Svelte's scoped stylesheet, so the source is
			// where this can be checked at all.
			// `.dynamic-text__outgoing` appears in two rules; join their bodies.
			const rules = [...source.matchAll(/\.dynamic-text__outgoing \{([^}]*)\}/g)]
				.map((match) => match[1])
				.join('');
			expect(rules).toContain('position: absolute;');
			expect(rules).toContain('inset: 0;');
		});

		it('reserves a fixed line box so the words never shift the layout', () => {
			const rule = source.match(/\.dynamic-text \{([^}]*)\}/)?.[1] ?? '';
			expect(rule).toContain('position: relative;');
			expect(rule).toContain('height: 1.2em;');
		});
	});

	it('clears its interval when destroyed mid-cycle', async () => {
		const { unmount, onDone } = setup();
		await vi.advanceTimersByTimeAsync(INTERVAL);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
		await vi.advanceTimersByTimeAsync(INTERVAL * 10);
		expect(onDone).not.toHaveBeenCalled();
	});
});
