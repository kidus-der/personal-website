import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import ProjectGrid from '$lib/components/sections/work/ProjectGrid.svelte';
import type { Project } from '$lib/types/content';
import { resetMotionMocks } from '../../kokonut/motionMock';
import { resetActionMocks } from '../../kokonut/actionsMock';
import { revealCalls, resetRevealMock } from './revealMock';

vi.mock('$lib/motion', async () => (await import('../../kokonut/motionMock')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('../../kokonut/actionsMock')).tiltModule());
vi.mock('$lib/actions/reveal', async () => (await import('./revealMock')).revealModule());

function project(overrides: Partial<Project> = {}): Project {
	return {
		slug: 'prime-radiant',
		title: 'Prime Radiant',
		description: 'A Seldon-inspired macro-stability engine.',
		highlights: [],
		tags: ['Temporal GNN'],
		year: 2026,
		category: 'ai-ml',
		images: [],
		featured: true,
		...overrides
	};
}

const three = [
	project(),
	project({ slug: 'coeus-ai', title: 'Coeus AI', year: 2025 }),
	project({ slug: 'elevent', title: 'ELEVENT', year: 2024, category: 'mobile' })
];

function setup(props: Record<string, unknown> = {}) {
	const result = render(ProjectGrid, { props: { projects: three, ...props } });
	const cards = () => [...result.container.querySelectorAll('.spotlight-card')];
	return { ...result, cards };
}

describe('ProjectGrid', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetActionMocks();
		resetRevealMock();
	});

	afterEach(cleanup);

	it('renders one card per project', () => {
		const { cards } = setup();
		expect(cards()).toHaveLength(3);
		expect(cards().map((card) => card.getAttribute('href'))).toEqual([
			'/work/prime-radiant',
			'/work/coeus-ai',
			'/work/elevent'
		]);
	});

	it('preserves the order it was handed', () => {
		const { container } = setup({ projects: [three[2], three[0]] });
		const titles = [...container.querySelectorAll('.project-card__title')].map((h) =>
			h.textContent?.trim()
		);
		expect(titles).toEqual(['ELEVENT', 'Prime Radiant']);
	});

	it('reveals the list with a stagger', () => {
		const { container } = setup();
		expect(revealCalls).toHaveLength(1);
		expect(revealCalls[0].node).toBe(container.querySelector('.project-grid__list'));
		expect(revealCalls[0].options).toMatchObject({ stagger: 0.06 });
	});

	it('shows the empty state instead of a list when there is nothing to show', () => {
		const { container, getByText } = setup({ projects: [] });
		expect(getByText('Nothing in this category yet.')).toBeInTheDocument();
		expect(container.querySelector('.project-grid__list')).toBeNull();
		expect(container.querySelectorAll('.spotlight-card')).toHaveLength(0);
	});

	it('never reveals a list that does not exist', () => {
		setup({ projects: [] });
		expect(revealCalls).toHaveLength(0);
	});

	it('carries the id through so the tab row can point at it', () => {
		const { container } = setup({ id: 'project-grid' });
		expect(container.querySelector('#project-grid')).toBe(container.querySelector('.project-grid'));
	});

	it('names the region with a heading, so the page does not skip from h1 to h3', () => {
		const { container, getByRole } = setup();
		const region = getByRole('region', { name: 'Projects' });
		expect(region).toBe(container.querySelector('.project-grid'));

		const heading = getByRole('heading', { level: 2, name: 'Projects' });
		expect(region).toHaveAttribute('aria-labelledby', heading.id);
		expect(heading.id).not.toBe('');
	});

	it('still names the region when there is nothing to show', () => {
		const { getByRole } = setup({ projects: [] });
		expect(getByRole('region', { name: 'Projects' })).toBeInTheDocument();
	});

	it('gives two grids on one page different heading ids', () => {
		const first = render(ProjectGrid, { props: { projects: three } });
		const second = render(ProjectGrid, { props: { projects: three } });
		const idOf = (result: typeof first) =>
			result.container.querySelector('.project-grid')?.getAttribute('aria-labelledby');
		expect(idOf(first)).not.toBe(idOf(second));
	});

	it('keeps the id on the region when the grid is empty', () => {
		const { container } = setup({ projects: [], id: 'project-grid' });
		expect(container.querySelector('#project-grid')).not.toBeNull();
	});

	it('dims every card but the hovered one', async () => {
		const { container, cards } = setup();
		const wrappers = [...container.querySelectorAll('.project-card')];

		wrappers[1].dispatchEvent(new Event('pointerenter'));
		await Promise.resolve();

		expect(cards()[0]).toHaveClass('spotlight-card--dimmed');
		expect(cards()[1]).not.toHaveClass('spotlight-card--dimmed');
		expect(cards()[2]).toHaveClass('spotlight-card--dimmed');
	});

	it('un-dims everything once the pointer leaves', async () => {
		const { container, cards } = setup();
		const wrappers = [...container.querySelectorAll('.project-card')];

		wrappers[1].dispatchEvent(new Event('pointerenter'));
		await Promise.resolve();
		wrappers[1].dispatchEvent(new Event('pointerleave'));
		await Promise.resolve();

		expect(cards().some((card) => card.classList.contains('spotlight-card--dimmed'))).toBe(false);
	});

	it('does not un-dim when a card other than the hovered one reports leaving', async () => {
		const { container, cards } = setup();
		const wrappers = [...container.querySelectorAll('.project-card')];

		wrappers[1].dispatchEvent(new Event('pointerenter'));
		await Promise.resolve();
		// A stale `pointerleave` from a card that was never the hovered one.
		wrappers[0].dispatchEvent(new Event('pointerleave'));
		await Promise.resolve();

		expect(cards()[0]).toHaveClass('spotlight-card--dimmed');
		expect(cards()[1]).not.toHaveClass('spotlight-card--dimmed');
	});

	it('starts with nothing dimmed', () => {
		const { cards } = setup();
		expect(cards().some((card) => card.classList.contains('spotlight-card--dimmed'))).toBe(false);
	});

	it('stops dimming when the hovered card is filtered out from under the pointer', async () => {
		const { container, cards, rerender } = setup();
		const wrappers = [...container.querySelectorAll('.project-card')];

		// Hover the middle card, then filter it away with the keyboard — no
		// `pointerleave` ever fires, because the pointer never moved.
		wrappers[1].dispatchEvent(new Event('pointerenter'));
		await Promise.resolve();
		expect(cards()[0]).toHaveClass('spotlight-card--dimmed');

		await rerender({ projects: [three[0], three[2]] });

		expect(cards()).toHaveLength(2);
		expect(cards().some((card) => card.classList.contains('spotlight-card--dimmed'))).toBe(false);
	});

	it('keeps dimming when a filter leaves the hovered card in place', async () => {
		const { container, cards, rerender } = setup();
		const wrappers = [...container.querySelectorAll('.project-card')];

		wrappers[1].dispatchEvent(new Event('pointerenter'));
		await Promise.resolve();

		await rerender({ projects: [three[0], three[1]] });

		expect(cards()[0]).toHaveClass('spotlight-card--dimmed');
		expect(cards()[1]).not.toHaveClass('spotlight-card--dimmed');
	});
});
