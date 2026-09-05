import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import Hero from '$lib/components/sections/home/Hero.svelte';
import { site } from '$content/site';
import { animateMock, animations, preferReducedMotion, resetMotionMocks } from '../../mocks/motion';
import { magnetic, resetActionMocks } from '../../mocks/actions';
import { stagger } from '$lib/motion';

vi.mock('$lib/motion', async () => (await import('../../mocks/motion')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('../../mocks/actions')).tilt.module());
vi.mock('$lib/actions/reveal', async () => (await import('../../mocks/actions')).reveal.module());
vi.mock('$lib/actions/magnetic', async () =>
	(await import('../../mocks/actions')).magnetic.module()
);

/**
 * The hero's own entrance schedule, restated so the test asserts a contract
 * rather than reading it back out of the component.
 */
const SCHEDULE: Record<string, number> = {
	'.hero__greeting': 0,
	'.hero-art': 0.2,
	'.hero__sub': 0.55,
	'.hero__actions': 0.65,
	'.hero__socials': 0.75
};
const LINE_DELAY = 0.15;

/** Collapses the whitespace the split headline spans introduce. */
function text(node: Element | null): string {
	return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function setup() {
	const result = render(Hero);
	const lines = () => [...result.container.querySelectorAll<HTMLElement>('.hero__line')];
	return { ...result, lines };
}

describe('Hero', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetActionMocks();
	});

	afterEach(cleanup);

	it('renders the headline as the page h1', () => {
		const { getByRole } = setup();
		const heading = getByRole('heading', { level: 1 });
		expect(text(heading)).toBe('I build intelligent systems that reason and act.');
	});

	it('emphasises exactly one phrase, in italic display type', () => {
		const { container } = setup();
		const emphasis = container.querySelectorAll('.hero__emphasis');
		expect(emphasis).toHaveLength(1);
		expect(emphasis[0]).toHaveTextContent('reason and act');
	});

	it('splits the headline into animatable lines', () => {
		const { lines } = setup();
		expect(lines().length).toBeGreaterThanOrEqual(2);
		expect(lines().length).toBeLessThanOrEqual(3);
	});

	it('settles the multilingual greeting on the Amharic hello', () => {
		const { getByRole } = setup();
		expect(getByRole('img', { name: "ሰላም, I'm Kidus." })).toBeInTheDocument();
	});

	it('renders both calls to action with the right destinations', () => {
		const { getByRole } = setup();
		expect(getByRole('link', { name: 'See my work' })).toHaveAttribute('href', '/work');
		expect(getByRole('link', { name: 'Read the Buna Print' })).toHaveAttribute('href', '/blog');
	});

	it('links Scam AI out of the sub-headline', () => {
		const { getByRole } = setup();
		const link = getByRole('link', { name: 'Scam AI' });
		expect(link).toHaveAttribute('href', 'https://www.scam.ai/en');
		expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('states the credentials in the sub-headline', () => {
		const { container } = setup();
		expect(text(container.querySelector('.hero__sub'))).toBe(
			'Founding Engineer at Scam AI. Eight papers on deepfake and document forensics. Computing Science and Economics at the University of Alberta.'
		);
	});

	it('offers the three labelled social links from the site content', () => {
		const { getByRole } = setup();
		expect(getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', site.socials.github);
		expect(getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', site.socials.linkedin);
		expect(getByRole('link', { name: 'Google Scholar' })).toHaveAttribute(
			'href',
			site.socials.scholar
		);
	});

	it('makes each social link magnetic', () => {
		setup();
		expect(magnetic.calls).toHaveLength(3);
	});

	it('renders the hero art beside the copy', () => {
		const { container } = setup();
		expect(container.querySelector('.hero-art')).toBeInTheDocument();
	});

	it('lays no background path field behind the hero — the art is the visual', () => {
		const { container } = setup();
		expect(container.querySelector('.background-paths')).not.toBeInTheDocument();
	});

	it('marks every staged element for the stylesheet pre-hide', () => {
		const { container } = setup();
		const staged = [...container.querySelectorAll('[data-hero]')].map((el) => el.className);
		// Greeting, three headline lines, sub, actions, socials, art.
		expect(staged.length).toBeGreaterThanOrEqual(8);
	});

	it('never writes an inline opacity, which is what made the hero flash', () => {
		const { lines, container } = setup();
		// The stylesheet hid these before first paint; the hero only animates
		// them up and releases them.
		for (const line of lines()) expect(line.style.opacity).toBe('');
		expect((container.querySelector('.hero__sub') as HTMLElement).style.opacity).toBe('');
	});

	it('starts the whole sequence on mount, without waiting on the greeting', () => {
		const { container } = setup();
		const sub = container.querySelector('.hero__sub');
		// The greeting cycles concurrently now; nothing is chained off it, so a
		// greeting that never settles can no longer strand the rest of the hero.
		expect(animateMock.mock.calls.some((call) => (call[0] as Element[])?.includes?.(sub!))).toBe(
			true
		);
	});

	it.each(Object.entries(SCHEDULE))('animates %s in on its own beat', (selector, delay) => {
		const { container } = setup();
		const element = container.querySelector(selector);
		expect(element).toBeInTheDocument();

		const call = animateMock.mock.calls.find((entry) =>
			(entry[0] as Element[])?.includes?.(element!)
		);
		expect(call).toBeDefined();
		expect(call?.[1]).toEqual({ opacity: [0, 1], y: [16, 0] });
		expect(call?.[2]).toMatchObject({ duration: 0.7, delay });
	});

	it('staggers the headline lines from their own start delay', () => {
		const { lines } = setup();
		const call = animateMock.mock.calls.find((entry) =>
			(entry[0] as Element[])?.includes?.(lines()[0])
		);
		expect(call?.[0]).toEqual(lines());
		expect(call?.[1]).toEqual({ opacity: [0, 1], y: [16, 0] });
		expect(stagger).toHaveBeenCalledWith(0.08, { startDelay: LINE_DELAY });
	});

	it('releases each element from the pre-hide when its entrance lands', () => {
		const { container } = setup();
		for (const element of container.querySelectorAll('[data-hero]')) {
			expect(element).toHaveAttribute('data-revealed', '');
		}
	});

	it('stops its own entrance animations when the hero unmounts mid-flight', () => {
		const { unmount } = setup();
		// `animations` holds every animation the mock handed out, the art's and
		// the greeting's included. The hero's own are the ones aimed at a group
		// of elements, and they line up with the calls by index.
		const owned = animateMock.mock.calls
			.map((call, index) => ({ target: call[0], animation: animations[index] }))
			.filter(({ target }) => Array.isArray(target));
		expect(owned).toHaveLength(Object.keys(SCHEDULE).length + 1);

		unmount();

		for (const { animation } of owned) expect(animation.stop).toHaveBeenCalled();
	});

	it('releases everything and animates nothing under reduced motion', () => {
		preferReducedMotion();
		const { container, lines } = setup();
		expect(lines()[0].style.opacity).toBe('');
		for (const element of container.querySelectorAll('[data-hero]')) {
			expect(element).toHaveAttribute('data-revealed', '');
		}
		expect(animateMock).not.toHaveBeenCalled();
	});
});
