import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/svelte';
import Bio from '$lib/components/sections/about/Bio.svelte';
import { animateMock, resetMotionMocks, preferReducedMotion } from '../../kokonut/motionMock';

vi.mock('$lib/motion', async () => (await import('../../kokonut/motionMock')).motionModule());

function setup() {
	const result = render(Bio);
	const trigger = () => result.getByRole('button', { name: /ሰላም/ });
	const tooltip = () => result.container.querySelector('#selam-tip') as HTMLElement;
	const greeting = () => result.container.querySelector('.bio__greeting') as HTMLElement;
	return { ...result, trigger, tooltip, greeting };
}

describe('Bio', () => {
	beforeEach(resetMotionMocks);
	afterEach(cleanup);

	it('heads the page with the bilingual greeting', () => {
		const { getByRole } = setup();
		expect(getByRole('heading', { level: 1 })).toHaveTextContent('ሰላም and hello.');
	});

	it('makes the Amharic greeting a real button described by the tooltip', () => {
		const { trigger, tooltip } = setup();
		expect(trigger().tagName).toBe('BUTTON');
		expect(trigger()).toHaveAttribute('type', 'button');
		expect(trigger()).toHaveAttribute('aria-describedby', 'selam-tip');
		expect(tooltip()).toHaveAttribute('role', 'tooltip');
	});

	it('keeps the tooltip hidden until it is asked for', () => {
		const { tooltip } = setup();
		expect(tooltip()).toBeInTheDocument();
		expect(tooltip()).not.toBeVisible();
	});

	it('shows the tooltip on focus and hides it again on blur', async () => {
		const { trigger, tooltip } = setup();

		await fireEvent.focus(trigger());
		expect(tooltip()).toBeVisible();
		expect(tooltip()).toHaveTextContent(/means peace/i);

		await fireEvent.blur(trigger());
		expect(tooltip()).not.toBeVisible();
	});

	it('shows the tooltip on hover and hides it when the pointer leaves the greeting', async () => {
		const { greeting, tooltip } = setup();

		await fireEvent.pointerEnter(greeting());
		expect(tooltip()).toBeVisible();

		await fireEvent.pointerLeave(greeting());
		expect(tooltip()).not.toBeVisible();
	});

	it('stays up while the pointer travels from the word into the tooltip', async () => {
		// WCAG 1.4.13: additional content raised on hover has to be hoverable. The
		// pointer handlers sit on the wrapper that holds both the word and the
		// tooltip, so leaving the trigger for the tooltip is not leaving the widget.
		const { greeting, trigger, tooltip } = setup();

		await fireEvent.pointerEnter(greeting());
		await fireEvent.pointerLeave(trigger());
		expect(tooltip()).toBeVisible();

		await fireEvent.pointerEnter(tooltip());
		expect(tooltip()).toBeVisible();
	});

	it('does not hover the tooltip away when the keyboard raised it', async () => {
		// A mouse drifting across the word and off again must not steal a tooltip
		// the keyboard is holding open — hover and focus are tracked separately.
		const { greeting, trigger, tooltip } = setup();

		await fireEvent.focus(trigger());
		await fireEvent.pointerEnter(greeting());
		await fireEvent.pointerLeave(greeting());

		expect(tooltip()).toBeVisible();

		await fireEvent.blur(trigger());
		expect(tooltip()).not.toBeVisible();
	});

	it('does not blur the tooltip away when the pointer is still on it', async () => {
		const { greeting, trigger, tooltip } = setup();

		await fireEvent.pointerEnter(greeting());
		await fireEvent.focus(trigger());
		await fireEvent.blur(trigger());

		expect(tooltip()).toBeVisible();
	});

	it('springs the tooltip in once, not again for the second request', async () => {
		const { greeting, trigger, tooltip } = setup();

		await fireEvent.pointerEnter(greeting());
		await fireEvent.focus(trigger());

		expect(animateMock).toHaveBeenCalledTimes(1);
		expect(tooltip()).toBeVisible();
	});

	it('dismisses the tooltip with Escape', async () => {
		const { trigger, tooltip } = setup();

		await fireEvent.focus(trigger());
		expect(tooltip()).toBeVisible();

		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(tooltip()).not.toBeVisible();
	});

	it('springs the tooltip in from a slight scale', async () => {
		const { trigger } = setup();
		await fireEvent.focus(trigger());

		expect(animateMock).toHaveBeenCalled();
		const [, keyframes] = animateMock.mock.calls.at(-1) ?? [];
		expect(keyframes).toMatchObject({ opacity: [0, 1], scale: [0.93, 1] });
	});

	it('skips the spring under reduced motion but still shows the tooltip', async () => {
		preferReducedMotion();
		const { trigger, tooltip } = setup();

		await fireEvent.focus(trigger());
		expect(tooltip()).toBeVisible();
		expect(animateMock).not.toHaveBeenCalled();
	});

	it('links Scam AI out and the paper count down to the publications section', () => {
		const { getByRole } = setup();

		const scamAi = getByRole('link', { name: 'Scam AI' });
		expect(scamAi).toHaveAttribute('href', 'https://www.scam.ai/en');
		expect(scamAi).toHaveAttribute('target', '_blank');
		expect(scamAi).toHaveAttribute('rel', 'noopener noreferrer');

		expect(getByRole('link', { name: 'eight papers' })).toHaveAttribute('href', '#publications');
	});

	it('renders the two bio paragraphs', () => {
		const { container } = setup();
		const paragraphs = container.querySelectorAll('.bio__body p');
		expect(paragraphs).toHaveLength(2);
		expect(paragraphs[0]).toHaveTextContent('Kidus Dereje Zewde');
		expect(paragraphs[1]).toHaveTextContent('film photography and good coffee');
	});

	it('sits over a beams canvas that is clipped by the section', () => {
		const { container } = setup();
		expect(container.querySelector('canvas')).toBeInTheDocument();
		expect(container.querySelector('.bio')).toBeInTheDocument();
	});
});
