import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import ParticleButton from '$lib/components/kokonut/ParticleButton.svelte';
import { animateMock, preferReducedMotion, resetMotionMocks } from '../mocks/motion';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());

const label = createRawSnippet(() => ({ render: () => '<span>Subscribe</span>' }));

function setup(props: Record<string, unknown> = {}) {
	const onclick = vi.fn();
	const result = render(ParticleButton, { props: { children: label, onclick, ...props } });
	const particles = () => result.container.querySelectorAll('.particle');
	const button = () => result.container.querySelector('button') as HTMLButtonElement;
	return { ...result, onclick, particles, button };
}

describe('ParticleButton', () => {
	beforeEach(() => {
		resetMotionMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('renders its children inside a real button', () => {
		const { button, getByText } = setup();
		expect(button()).toHaveAttribute('type', 'button');
		expect(getByText('Subscribe')).toBeInTheDocument();
	});

	it('honours type and disabled', () => {
		const { button } = setup({ type: 'submit', disabled: true });
		expect(button()).toHaveAttribute('type', 'submit');
		expect(button()).toBeDisabled();
	});

	it('bursts six particles on click and clears them after successDuration', async () => {
		const { button, particles } = setup();
		expect(particles()).toHaveLength(0);

		button().click();
		await vi.advanceTimersByTimeAsync(0);
		expect(particles()).toHaveLength(6);

		await vi.advanceTimersByTimeAsync(999);
		expect(particles()).toHaveLength(6);
		await vi.advanceTimersByTimeAsync(1);
		expect(particles()).toHaveLength(0);
	});

	it('respects particleCount and successDuration', async () => {
		const { button, particles } = setup({ particleCount: 3, successDuration: 200 });
		button().click();
		await vi.advanceTimersByTimeAsync(0);
		expect(particles()).toHaveLength(3);
		await vi.advanceTimersByTimeAsync(200);
		expect(particles()).toHaveLength(0);
	});

	it('animates every particle outward with a staggered delay', async () => {
		const { button } = setup();
		button().click();
		await vi.advanceTimersByTimeAsync(0);

		expect(animateMock).toHaveBeenCalledTimes(6);
		animateMock.mock.calls.forEach((call, i) => {
			const [element, keyframes, options] = call as [
				HTMLElement,
				Record<string, unknown>,
				Record<string, unknown>
			];
			expect(element).toHaveClass('particle');
			expect(keyframes).toMatchObject({ scale: [0, 1, 0], opacity: [1, 1, 0] });
			expect((keyframes.x as number[])[0]).toBe(0);
			expect((keyframes.y as number[])[0]).toBe(0);
			expect((keyframes.y as number[])[1]).toBeLessThan(0);
			expect(options).toMatchObject({ duration: 0.6, delay: i * 0.05, ease: 'easeOut' });
		});
	});

	it('hides the particle layer from assistive tech', async () => {
		const { button, container } = setup();
		button().click();
		await vi.advanceTimersByTimeAsync(0);
		expect(container.querySelector('.particle-layer')).toHaveAttribute('aria-hidden', 'true');
		for (const particle of container.querySelectorAll('.particle')) {
			expect(particle).toHaveAttribute('aria-hidden', 'true');
		}
	});

	it('forwards the click to the caller', () => {
		const { button, onclick } = setup();
		button().click();
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('does nothing when disabled', async () => {
		const { button, onclick, particles } = setup({ disabled: true });
		button().click();
		await vi.advanceTimersByTimeAsync(0);
		expect(onclick).not.toHaveBeenCalled();
		expect(particles()).toHaveLength(0);
	});

	it('skips the burst but still fires onclick under reduced motion', async () => {
		preferReducedMotion();
		const { button, onclick, particles } = setup();
		button().click();
		await vi.advanceTimersByTimeAsync(0);
		expect(onclick).toHaveBeenCalledTimes(1);
		expect(particles()).toHaveLength(0);
		expect(animateMock).not.toHaveBeenCalled();
	});

	it('restarts the clear timer when clicked again mid-burst', async () => {
		const { button, particles } = setup({ successDuration: 500 });
		button().click();
		await vi.advanceTimersByTimeAsync(400);
		button().click();
		await vi.advanceTimersByTimeAsync(200);
		expect(particles()).toHaveLength(6);
		await vi.advanceTimersByTimeAsync(300);
		expect(particles()).toHaveLength(0);
	});

	it('clears its timer when destroyed mid-burst', async () => {
		const { button, unmount } = setup();
		button().click();
		await vi.advanceTimersByTimeAsync(0);
		unmount();
		expect(vi.getTimerCount()).toBe(0);
	});
});
