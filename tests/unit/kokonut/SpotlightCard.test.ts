import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import SpotlightCard from '$lib/components/kokonut/SpotlightCard.svelte';
import { animateMock, preferReducedMotion, resetMotionMocks } from './motionMock';
import { resetActionMocks, tiltCalls } from './actionsMock';

vi.mock('$lib/motion', async () => (await import('./motionMock')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('./actionsMock')).tiltModule());

const body = createRawSnippet(() => ({ render: () => '<p>Prime Radiant</p>' }));

function setup(props: Record<string, unknown> = {}) {
	const onhoverstart = vi.fn();
	const onhoverend = vi.fn();
	const result = render(SpotlightCard, {
		props: { children: body, onhoverstart, onhoverend, ...props }
	});
	const card = () => result.container.querySelector('.spotlight-card') as HTMLElement;
	const glow = () => result.container.querySelector('.spotlight-card__glow') as HTMLElement;
	return { ...result, card, glow, onhoverstart, onhoverend };
}

function hover(card: HTMLElement) {
	card.dispatchEvent(new Event('pointerenter'));
}

function unhover(card: HTMLElement) {
	card.dispatchEvent(new Event('pointerleave'));
}

function focusIn(card: HTMLElement) {
	card.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
}

/** `relatedTarget` is where focus is going — null means it left the document. */
function focusOut(card: HTMLElement, relatedTarget: EventTarget | null = null) {
	card.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget }));
}

describe('SpotlightCard', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetActionMocks();
	});

	afterEach(cleanup);

	it('renders its children inside an article by default', () => {
		const { card, getByText } = setup();
		expect(card().tagName).toBe('ARTICLE');
		expect(getByText('Prime Radiant')).toBeInTheDocument();
	});

	it('renders an anchor when href is given', () => {
		const { card } = setup({ href: '/work/prime-radiant' });
		expect(card().tagName).toBe('A');
		expect(card()).toHaveAttribute('href', '/work/prime-radiant');
	});

	it('applies the dimmed class only when dimmed', () => {
		const { card } = setup();
		expect(card()).not.toHaveClass('spotlight-card--dimmed');

		cleanup();
		const dim = setup({ dimmed: true });
		expect(dim.card()).toHaveClass('spotlight-card--dimmed');
	});

	it('merges a caller-supplied class', () => {
		const { card } = setup({ class: 'col-span-2' });
		expect(card()).toHaveClass('spotlight-card');
		expect(card()).toHaveClass('col-span-2');
	});

	it('exposes the card colour as a custom property', () => {
		const { card } = setup({ color: '#F59E0B' });
		expect(card().style.getPropertyValue('--card-color')).toBe('#F59E0B');
	});

	it('falls back to the accent token when no colour is given', () => {
		const { card } = setup();
		expect(card().style.getPropertyValue('--card-color')).toBe('var(--accent)');
	});

	it('wires the tilt action with the spotlight tilt maximum', () => {
		setup();
		expect(tiltCalls).toHaveLength(1);
		expect(tiltCalls[0].options).toEqual({ max: 9 });
	});

	it('flattens the tilt to zero degrees when tilt is false', () => {
		setup({ tilt: false });
		expect(tiltCalls[0].options).toEqual({ max: 0 });
	});

	it('reports hover start and end to the parent', () => {
		const { card, onhoverstart, onhoverend } = setup();
		hover(card());
		expect(onhoverstart).toHaveBeenCalledTimes(1);
		unhover(card());
		expect(onhoverend).toHaveBeenCalledTimes(1);
	});

	it('does not report the same hover twice', () => {
		const { card, onhoverstart, onhoverend } = setup();
		hover(card());
		hover(card());
		expect(onhoverstart).toHaveBeenCalledTimes(1);
		unhover(card());
		unhover(card());
		expect(onhoverend).toHaveBeenCalledTimes(1);
	});

	it('treats keyboard focus as a hover', () => {
		const { card, onhoverstart, onhoverend } = setup({ href: '/work/prime-radiant' });
		focusIn(card());
		expect(onhoverstart).toHaveBeenCalledTimes(1);
		focusOut(card());
		expect(onhoverend).toHaveBeenCalledTimes(1);
	});

	it('keeps the card engaged when the pointer leaves but focus stays', () => {
		const { card, glow, onhoverstart, onhoverend } = setup({ href: '/work/prime-radiant' });
		hover(card());
		focusIn(card());
		expect(onhoverstart).toHaveBeenCalledTimes(1);

		animateMock.mockClear();
		unhover(card());
		expect(onhoverend).not.toHaveBeenCalled();
		expect(animateMock).not.toHaveBeenCalledWith(glow(), { opacity: 0 }, expect.anything());

		focusOut(card());
		expect(onhoverend).toHaveBeenCalledTimes(1);
	});

	it('keeps the card engaged when focus leaves but the pointer stays', () => {
		const { card, onhoverstart, onhoverend } = setup({ href: '/work/prime-radiant' });
		focusIn(card());
		hover(card());
		expect(onhoverstart).toHaveBeenCalledTimes(1);

		focusOut(card());
		expect(onhoverend).not.toHaveBeenCalled();

		unhover(card());
		expect(onhoverend).toHaveBeenCalledTimes(1);
	});

	it('ignores focus moving between its own descendants', () => {
		const { card, onhoverstart, onhoverend } = setup({ href: '/work/prime-radiant' });
		focusIn(card());
		expect(onhoverstart).toHaveBeenCalledTimes(1);

		// Focus stepping from one focusable child to the next fires focusout on
		// the card, but it never actually left.
		const inside = card().querySelector('.spotlight-card__content') as HTMLElement;
		focusOut(card(), inside);
		focusIn(card());

		expect(onhoverend).not.toHaveBeenCalled();
		expect(onhoverstart).toHaveBeenCalledTimes(1);
	});

	it('ends the hover when focus leaves the card entirely', () => {
		const outside = document.createElement('button');
		document.body.appendChild(outside);
		try {
			const { card, onhoverend } = setup({ href: '/work/prime-radiant' });
			focusIn(card());
			focusOut(card(), outside);
			expect(onhoverend).toHaveBeenCalledTimes(1);
		} finally {
			outside.remove();
		}
	});

	it('springs the glow in on hover and out on leave', () => {
		const { card, glow } = setup();
		hover(card());
		expect(animateMock).toHaveBeenCalledWith(glow(), { opacity: 1 }, expect.anything());

		animateMock.mockClear();
		unhover(card());
		expect(animateMock).toHaveBeenCalledWith(glow(), { opacity: 0 }, expect.anything());
	});

	it('sets the glow instantly under reduced motion', () => {
		preferReducedMotion();
		const { card, glow } = setup();
		hover(card());
		expect(animateMock).not.toHaveBeenCalled();
		expect(glow().style.opacity).toBe('1');
		unhover(card());
		expect(glow().style.opacity).toBe('0');
	});
});
