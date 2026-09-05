import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import Hero from '$lib/components/sections/home/Hero.svelte';
import { site } from '$content/site';
import { animateMock, animations, preferReducedMotion, resetMotionMocks } from '../../mocks/motion';
import { magnetic, resetActionMocks } from '../../mocks/actions';

vi.mock('$lib/motion', async () => (await import('../../mocks/motion')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('../../mocks/actions')).tilt.module());
vi.mock('$lib/actions/reveal', async () => (await import('../../mocks/actions')).reveal.module());
vi.mock('$lib/actions/magnetic', async () =>
	(await import('../../mocks/actions')).magnetic.module()
);

/** Mirrors the hero's own greeting timings; see `GREETING_INTERVAL` there. */
const GREETING_WORDS = 6;
const GREETING_INTERVAL = 320;
const GREETING_CYCLE_MS = GREETING_WORDS * GREETING_INTERVAL;
const FALLBACK_MS = GREETING_CYCLE_MS + 200;

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
		expect(text(heading)).toBe('I build the systems that tell real from fake.');
	});

	it('emphasises exactly one phrase, in italic display type', () => {
		const { container } = setup();
		const emphasis = container.querySelectorAll('.hero__emphasis');
		expect(emphasis).toHaveLength(1);
		expect(emphasis[0]).toHaveTextContent('real from fake');
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

	it('renders the verification card beside the copy', () => {
		const { container } = setup();
		expect(container.querySelector('.verification-card')).toBeInTheDocument();
	});

	it('lays a background path field behind the hero', () => {
		const { container } = setup();
		expect(container.querySelector('.background-paths')).toBeInTheDocument();
	});

	it('hides the staged elements on mount, before anything has moved', () => {
		const { lines } = setup();
		// The pre-hide happens on mount only, so the server-rendered markup is
		// visible for anyone who never runs the script.
		expect(lines()[0].style.opacity).toBe('0');
	});

	it('holds the headline back until the greeting has settled', async () => {
		vi.useFakeTimers();
		try {
			const { container } = setup();
			const sub = container.querySelector('.hero__sub');
			const animated = () => animateMock.mock.calls.some((call) => call[0] === sub);

			// The greeting is still cycling: nothing else has been touched.
			expect(animated()).toBe(false);
			await vi.advanceTimersByTimeAsync(GREETING_CYCLE_MS / 2);
			expect(animated()).toBe(false);

			// `DynamicText` settles and fires `onDone`.
			await vi.advanceTimersByTimeAsync(GREETING_CYCLE_MS);
			expect(animated()).toBe(true);
		} finally {
			vi.useRealTimers();
		}
	});

	it('runs the entrance exactly once, even after the fallback deadline passes', async () => {
		vi.useFakeTimers();
		try {
			const { container } = setup();
			const sub = container.querySelector('.hero__sub');
			await vi.advanceTimersByTimeAsync(GREETING_CYCLE_MS + FALLBACK_MS + 1000);
			const runs = animateMock.mock.calls.filter((call) => call[0] === sub);
			expect(runs).toHaveLength(1);
		} finally {
			vi.useRealTimers();
		}
	});

	it('stops its own entrance animations when the hero unmounts mid-flight', async () => {
		vi.useFakeTimers();
		try {
			const { container, unmount } = setup();
			const staged = ['.hero__sub', '.hero__actions', '.hero__socials'].map((selector) =>
				container.querySelector(selector)
			);
			await vi.advanceTimersByTimeAsync(GREETING_CYCLE_MS);

			// `animations` is every animation the mock handed out, including
			// `DynamicText`'s; only the ones aimed at the hero's own staged
			// elements are the hero's to stop, and they line up by call index.
			const owned = animateMock.mock.calls
				.map((call, index) => ({ target: call[0], animation: animations[index] }))
				.filter(({ target }) => staged.includes(target as Element));
			expect(owned).toHaveLength(staged.length);

			unmount();

			for (const { animation } of owned) expect(animation.stop).toHaveBeenCalled();
		} finally {
			vi.useRealTimers();
		}
	});

	it('leaves everything visible and animates nothing under reduced motion', () => {
		preferReducedMotion();
		const { lines } = setup();
		expect(lines()[0].style.opacity).toBe('');
		expect(animateMock).not.toHaveBeenCalled();
	});
});
