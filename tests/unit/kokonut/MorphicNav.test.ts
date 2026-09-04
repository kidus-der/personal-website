import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import MorphicNav from '$lib/components/kokonut/MorphicNav.svelte';
import { springs } from '$lib/motion/config';
import { animateMock, preferReducedMotion, resetMotionMocks } from './motionMock';

vi.mock('$lib/motion', async () => (await import('./motionMock')).motionModule());

const items = [
	{ href: '/', label: 'Home' },
	{ href: '/work', label: 'Work' },
	{ href: '/about', label: 'About' },
	{ href: '/blog', label: 'Blog' }
];

/** Fake layout, keyed by link label — jsdom reports every offset as 0. */
const layout: Record<string, { left: number; width: number }> = {
	Home: { left: 4, width: 60 },
	Work: { left: 64, width: 64 },
	About: { left: 128, width: 70 },
	Blog: { left: 198, width: 58 }
};

function stubOffsets() {
	const lookup = (element: HTMLElement) => layout[element.textContent?.trim() ?? ''];
	vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (
		this: HTMLElement
	) {
		return lookup(this)?.left ?? 0;
	});
	vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
		this: HTMLElement
	) {
		return lookup(this)?.width ?? 0;
	});
}

async function setup(current = '/work') {
	const result = render(MorphicNav, { props: { items, current } });
	await tick();
	const indicator = () => result.container.querySelector('.morphic-nav__indicator') as HTMLElement;
	const links = () => [...result.container.querySelectorAll('a')] as HTMLAnchorElement[];
	return { ...result, indicator, links };
}

/** The last `animate` call made against the indicator element. */
function lastIndicatorCall() {
	const calls = animateMock.mock.calls.filter((call) =>
		(call[0] as HTMLElement)?.classList?.contains?.('morphic-nav__indicator')
	);
	return calls.at(-1);
}

describe('MorphicNav', () => {
	beforeEach(() => {
		resetMotionMocks();
		stubOffsets();
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it('renders one anchor per item inside a nav', async () => {
		const { links, container } = await setup();
		expect(container.querySelector('nav')).toBeInTheDocument();
		expect(links().map((a) => a.getAttribute('href'))).toEqual(['/', '/work', '/about', '/blog']);
	});

	it('marks the matching item as the current page', async () => {
		const { links } = await setup('/work');
		expect(links()[1]).toHaveAttribute('aria-current', 'page');
		expect(links().filter((a) => a.hasAttribute('aria-current'))).toHaveLength(1);
	});

	it('treats a nested route as being inside its section', async () => {
		const { links } = await setup('/work/prime-radiant');
		expect(links()[1]).toHaveAttribute('aria-current', 'page');
	});

	it('matches home only on an exact path', async () => {
		const { links } = await setup('/about');
		expect(links()[0]).not.toHaveAttribute('aria-current');
		expect(links()[2]).toHaveAttribute('aria-current', 'page');

		cleanup();
		const home = await setup('/');
		expect(home.links()[0]).toHaveAttribute('aria-current', 'page');
	});

	it('positions the indicator over the active anchor', async () => {
		const { indicator } = await setup('/about');
		const call = lastIndicatorCall();
		expect(call?.[0]).toBe(indicator());
		expect(call?.[1]).toMatchObject({ x: 128, width: '70px', opacity: 1 });
	});

	it('places the indicator without animating on first measure', async () => {
		await setup('/work');
		expect(lastIndicatorCall()?.[2]).toMatchObject({ duration: 0 });
	});

	it('morphs the indicator with a snappy spring when current changes', async () => {
		const { rerender, indicator } = await setup('/work');
		animateMock.mockClear();

		await rerender({ items, current: '/blog' });
		await tick();

		const call = lastIndicatorCall();
		expect(call?.[0]).toBe(indicator());
		expect(call?.[1]).toMatchObject({ x: 198, width: '58px' });
		expect(call?.[2]).toMatchObject(springs.snappy);
	});

	it('re-measures on resize', async () => {
		await setup('/work');
		animateMock.mockClear();

		layout.Work = { left: 90, width: 80 };
		window.dispatchEvent(new Event('resize'));
		await tick();

		expect(lastIndicatorCall()?.[1]).toMatchObject({ x: 90, width: '80px' });
		layout.Work = { left: 64, width: 64 };
	});

	it('hides the indicator when nothing matches', async () => {
		await setup('/unknown');
		expect(lastIndicatorCall()?.[1]).toMatchObject({ opacity: 0 });
	});

	it('never animates under reduced motion', async () => {
		preferReducedMotion();
		const { rerender } = await setup('/work');
		animateMock.mockClear();

		await rerender({ items, current: '/about' });
		await tick();

		expect(lastIndicatorCall()?.[2]).toMatchObject({ duration: 0 });
	});
});
