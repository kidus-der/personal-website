import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import ProjectCard from '$lib/components/sections/work/ProjectCard.svelte';
import type { Project } from '$lib/types/content';
import { resetMotionMocks } from '../kokonut/motionMock';
import { resetActionMocks } from '../kokonut/actionsMock';

vi.mock('$lib/motion', async () => (await import('../kokonut/motionMock')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('../kokonut/actionsMock')).tiltModule());

const base: Project = {
	slug: 'prime-radiant',
	title: 'Prime Radiant',
	description: 'A Seldon-inspired macro-stability engine.',
	highlights: [],
	tags: ['Temporal GNN', 'GDELT', 'ACLED', 'Next.js', 'Three.js', 'ZenML'],
	year: 2026,
	category: 'ai-ml',
	githubUrl: 'https://github.com/kidus-der/prime-radiant',
	images: [],
	featured: true,
	accent: '#F59E0B'
};

function setup(project: Partial<Project> = {}, props: Record<string, unknown> = {}) {
	const result = render(ProjectCard, { props: { project: { ...base, ...project }, ...props } });
	const card = () => result.container.querySelector('.spotlight-card') as HTMLAnchorElement;
	const source = () => result.container.querySelector('.project-card__source') as HTMLAnchorElement;
	return { ...result, card, source };
}

describe('ProjectCard', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetActionMocks();
	});

	afterEach(cleanup);

	it('links the whole card to the project detail page', () => {
		const { card } = setup();
		expect(card().tagName).toBe('A');
		expect(card()).toHaveAttribute('href', '/work/prime-radiant');
	});

	it('carries the project accent through to the spotlight', () => {
		const { card } = setup();
		expect(card().style.getPropertyValue('--card-color')).toBe('#F59E0B');
	});

	it('renders the title, year and description', () => {
		const { getByRole, getByText } = setup();
		expect(getByRole('heading', { name: 'Prime Radiant' })).toBeInTheDocument();
		expect(getByText('2026')).toBeInTheDocument();
		expect(getByText('A Seldon-inspired macro-stability engine.')).toBeInTheDocument();
	});

	it('renders the cover image when the project has one', () => {
		const { container } = setup({ images: ['/images/prime-radiant.png'] });
		const image = container.querySelector('.project-card__image') as HTMLImageElement;
		expect(image).toBeInTheDocument();
		expect(image).toHaveAttribute('src', '/images/prime-radiant.png');
		expect(image).toHaveAttribute('alt', 'Prime Radiant');
		expect(container.querySelector('.project-card__monogram')).toBeNull();
	});

	it('falls back to a gradient monogram when there is no image', () => {
		const { container } = setup();
		const monogram = container.querySelector('.project-card__monogram') as HTMLElement;
		expect(monogram).toBeInTheDocument();
		expect(monogram).toHaveTextContent('P');
		expect(monogram).toHaveAttribute('aria-hidden', 'true');
		expect(container.querySelector('.project-card__image')).toBeNull();
	});

	it('shows at most the first four tags', () => {
		const { container } = setup();
		const tags = [...container.querySelectorAll('.tag')].map((t) => t.textContent?.trim());
		expect(tags).toEqual(['Temporal GNN', 'GDELT', 'ACLED', 'Next.js']);
	});

	it('offers a labelled source link when the project has a repo', () => {
		const { source } = setup();
		expect(source()).toHaveAttribute('href', 'https://github.com/kidus-der/prime-radiant');
		expect(source()).toHaveAttribute('aria-label', 'Source on GitHub');
		expect(source()).toHaveAttribute('rel', 'noopener noreferrer');
		expect(source()).toHaveAttribute('target', '_blank');
	});

	it('omits the source link when there is no repo', () => {
		const { source } = setup({ githubUrl: undefined });
		expect(source()).toBeNull();
	});

	it('keeps the source click off the card link', () => {
		const { source } = setup();
		const click = new MouseEvent('click', { bubbles: true, cancelable: true });
		const stop = vi.spyOn(click, 'stopPropagation');
		source().dispatchEvent(click);
		expect(stop).toHaveBeenCalled();
	});

	it('never nests the source link inside the card link', () => {
		const { card, source } = setup();
		expect(card().contains(source())).toBe(false);
	});

	it('passes the dimmed flag down to the spotlight card', () => {
		const { card } = setup({}, { dimmed: true });
		expect(card()).toHaveClass('spotlight-card--dimmed');
	});

	it('reports hover to the parent grid', () => {
		const onhoverstart = vi.fn();
		const onhoverend = vi.fn();
		const { container } = setup({}, { onhoverstart, onhoverend });
		const wrapper = container.querySelector('.project-card') as HTMLElement;

		wrapper.dispatchEvent(new Event('pointerenter'));
		expect(onhoverstart).toHaveBeenCalledTimes(1);
		wrapper.dispatchEvent(new Event('pointerleave'));
		expect(onhoverend).toHaveBeenCalledTimes(1);
	});
});
