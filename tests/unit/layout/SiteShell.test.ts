import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import SiteShell from '$lib/components/layout/SiteShell.svelte';
import { resetMotionMocks } from '../mocks/motion';
import { resetNavigationMocks } from '../mocks/navigation';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());
vi.mock('$app/navigation', async () => (await import('../mocks/navigation')).navigationModule());
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/work') } }));

const body = createRawSnippet(() => ({ render: () => '<p>Page body</p>' }));

function stubMatchMedia() {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	}));
}

function setup(variant: 'portfolio' | 'blog' | 'error') {
	const result = render(SiteShell, { props: { variant, children: body } });
	const shell = () => result.container.querySelector('.site-shell') as HTMLElement;
	return { ...result, shell };
}

describe('SiteShell', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetNavigationMocks();
		stubMatchMedia();
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	it.each(['portfolio', 'blog', 'error'] as const)(
		'frames the %s variant with the nav, the content and the footer',
		(variant) => {
			const { shell, getByRole, getByText } = setup(variant);

			expect(shell()).toBeInTheDocument();
			expect(getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
			expect(getByText('Page body')).toBeInTheDocument();
			expect(getByRole('contentinfo')).toBeInTheDocument();
		}
	);

	it.each(['portfolio', 'blog', 'error'] as const)(
		'gives the %s variant its own class hook alongside the shared one',
		(variant) => {
			const { shell } = setup(variant);
			expect(shell().classList.contains('site-shell')).toBe(true);
			expect(shell().classList.contains(`site-shell--${variant}`)).toBe(true);
		}
	);

	it('keeps the nav ahead of the content and the footer behind it', () => {
		const { shell, getByText } = setup('portfolio');
		const order = [...shell().children];
		const content = order.find((child) => child.contains(getByText('Page body')));

		expect(order[0].tagName).toBe('HEADER');
		expect(order.indexOf(content as Element)).toBe(1);
		expect(order[order.length - 1].tagName).toBe('FOOTER');
	});

	it('wraps the two route-group variants in the page transition', () => {
		for (const variant of ['portfolio', 'blog'] as const) {
			const { shell } = setup(variant);
			expect(shell().querySelector('.page-transition')).not.toBeNull();
			cleanup();
		}
	});

	it('renders the error variant without a page transition', () => {
		// `+error.svelte` is rendered outside both route groups, so there is no
		// route change to animate between.
		const { shell, getByText } = setup('error');
		expect(shell().querySelector('.page-transition')).toBeNull();
		expect(getByText('Page body')).toBeInTheDocument();
	});
});
