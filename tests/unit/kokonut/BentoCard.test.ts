import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import BentoCard from '$lib/components/kokonut/BentoCard.svelte';
// Component CSS is never injected into jsdom under Vitest — `getComputedStyle`
// reports `none` for everything — so these two invariants are pinned against
// the component source instead. They are load-bearing: without the perspective
// the tilt is an invisible orthographic squash, and a `transition: transform`
// would fight the spring `use:tilt` drives frame by frame.
import bentoSource from '$lib/components/kokonut/BentoCard.svelte?raw';
import { resetMotionMocks } from '../mocks/motion';
import { tilt, resetActionMocks } from '../mocks/actions';

vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('../mocks/actions')).tilt.module());

const feature = createRawSnippet(() => ({ render: () => '<p>8 papers</p>' }));

function setup(props: Record<string, unknown> = {}) {
	const result = render(BentoCard, { props: { title: 'Research', ...props } });
	const card = () => result.container.querySelector('.bento-card') as HTMLElement;
	return { ...result, card };
}

describe('BentoCard', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetActionMocks();
	});

	afterEach(cleanup);

	it('renders the title as a heading inside an article', () => {
		const { card, getByRole } = setup();
		expect(card().tagName).toBe('ARTICLE');
		expect(getByRole('heading', { name: 'Research' })).toBeInTheDocument();
	});

	it('renders the description when given and omits it otherwise', () => {
		const { getByText } = setup({ description: 'Eight peer-reviewed papers.' });
		expect(getByText('Eight peer-reviewed papers.')).toBeInTheDocument();

		cleanup();
		const bare = setup();
		expect(bare.container.querySelector('.bento-card__description')).toBeNull();
	});

	it('renders the children snippet beneath the title and description', () => {
		const { container, getByText } = setup({ children: feature });
		expect(getByText('8 papers')).toBeInTheDocument();
		const body = container.querySelector('.bento-card__feature') as HTMLElement;
		const heading = container.querySelector('.bento-card__title') as HTMLElement;
		expect(heading.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it('renders a link when href is given', () => {
		const { card } = setup({ href: '/about' });
		expect(card().tagName).toBe('A');
		expect(card()).toHaveAttribute('href', '/about');
	});

	it('shows the arrow affordance only for a link', () => {
		const { container } = setup({ href: '/about' });
		const arrow = container.querySelector('.bento-card__arrow') as SVGElement;
		expect(arrow).toBeInTheDocument();
		expect(arrow).toHaveAttribute('aria-hidden', 'true');

		cleanup();
		const bare = setup();
		expect(bare.container.querySelector('.bento-card__arrow')).toBeNull();
	});

	it('defaults to the small span', () => {
		const { card } = setup();
		expect(card()).toHaveClass('bento-card--sm');
	});

	it.each(['sm', 'md', 'lg'] as const)('maps span=%s onto a grid class', (span) => {
		const { card } = setup({ span });
		expect(card()).toHaveClass(`bento-card--${span}`);
	});

	it('tilts by at most two degrees', () => {
		setup();
		expect(tilt.calls).toHaveLength(1);
		expect(tilt.calls[0].options).toEqual({ max: 2 });
	});

	it('merges a caller-supplied class', () => {
		const { card } = setup({ class: 'row-start-2' });
		expect(card()).toHaveClass('bento-card');
		expect(card()).toHaveClass('row-start-2');
	});

	describe('the tilt surface', () => {
		/** The body of the first `.bento-card { … }` rule in the component. */
		const rule = bentoSource.match(/\.bento-card\s*\{([^}]*)\}/)?.[1] ?? '';

		it('is a real rule, so the assertions below mean something', () => {
			expect(rule).toContain('transform:');
		});

		it('establishes a perspective, or the 2 degree tilt is invisible', () => {
			expect(rule).toMatch(/transform:\s*perspective\(/);
		});

		it('never transitions transform, which use:tilt drives frame by frame', () => {
			const transition = rule.match(/transition:([^;]*);/)?.[1] ?? '';
			expect(transition).not.toMatch(/\btransform\b/);
		});

		it('eases the hover lift through the independent translate property', () => {
			expect(rule).toMatch(/translate:\s*0 var\(--lift/);
			expect(rule.match(/transition:([^;]*);/)?.[1] ?? '').toMatch(/\btranslate\b/);
		});
	});
});
