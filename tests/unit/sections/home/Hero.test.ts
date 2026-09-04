import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import Hero from '$lib/components/sections/home/Hero.svelte';
import { site } from '$content/site';
import { animateMock, preferReducedMotion, resetMotionMocks } from '../../kokonut/motionMock';
import { resetActionMocks } from '../../kokonut/actionsMock';
import { magneticCalls, resetHomeActionMocks } from './homeMocks';

vi.mock('$lib/motion', async () => (await import('../../kokonut/motionMock')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('../../kokonut/actionsMock')).tiltModule());
vi.mock('$lib/actions/reveal', async () => (await import('./homeMocks')).revealModule());
vi.mock('$lib/actions/magnetic', async () => (await import('./homeMocks')).magneticModule());

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
		resetHomeActionMocks();
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
		expect(magneticCalls).toHaveLength(3);
	});

	it('renders the verification card beside the copy', () => {
		const { container } = setup();
		expect(container.querySelector('.verification-card')).toBeInTheDocument();
	});

	it('lays a background path field behind the hero', () => {
		const { container } = setup();
		expect(container.querySelector('.background-paths')).toBeInTheDocument();
	});

	it('hides the staged elements and animates them in when motion is allowed', () => {
		const { lines, container } = setup();
		// The pre-hide happens on mount only, so the server-rendered markup is
		// visible for anyone who never runs the script.
		expect(lines()[0].style.opacity).toBe('0');
		expect(animateMock).toHaveBeenCalled();
		const targets = animateMock.mock.calls.map((call) => call[0]);
		expect(targets).toContain(container.querySelector('.hero__sub'));
	});

	it('leaves everything visible and animates nothing under reduced motion', () => {
		preferReducedMotion();
		const { lines } = setup();
		expect(lines()[0].style.opacity).toBe('');
		expect(animateMock).not.toHaveBeenCalled();
	});
});
