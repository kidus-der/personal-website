import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import ExperienceTimeline from '$lib/components/sections/about/ExperienceTimeline.svelte';
import { experience } from '$content/experience';
import type { Experience } from '$lib/types/content';
import { resetMotionMocks } from '../../kokonut/motionMock';

vi.mock('$lib/motion', async () => (await import('../../kokonut/motionMock')).motionModule());

function setup(roles: Experience[] = experience) {
	const result = render(ExperienceTimeline, { props: { roles } });
	const items = () => [...result.container.querySelectorAll('.timeline__item')];
	return { ...result, items };
}

describe('ExperienceTimeline', () => {
	beforeEach(resetMotionMocks);
	afterEach(cleanup);

	it('renders the roles as an ordered list, newest first', () => {
		const { container, items } = setup();
		expect(container.querySelector('ol.timeline__list')).toBeInTheDocument();
		expect(items()).toHaveLength(3);
		expect(items().every((item) => item.tagName === 'LI')).toBe(true);
		expect(items()[0]).toHaveTextContent('Founding Engineer');
	});

	it('names every role in content order', () => {
		const { getAllByRole } = setup();
		expect(getAllByRole('heading', { level: 3 }).map((h) => h.textContent?.trim())).toEqual([
			'Founding Engineer',
			'Machine Learning Engineer',
			'Machine Learning Intern'
		]);
	});

	it('formats each period the way the design spells months', () => {
		const { container } = setup();
		const periods = [...container.querySelectorAll('.timeline__period')].map((el) =>
			el.textContent?.trim()
		);
		expect(periods).toEqual(['June 2026 – Present', 'Jan 2025 – June 2026', 'Oct 2023 – Jan 2024']);
	});

	it('links a company out when the role carries a url', () => {
		const { getAllByRole } = setup();
		const links = getAllByRole('link', { name: 'Scam AI' });
		expect(links).toHaveLength(2);
		for (const link of links) {
			expect(link).toHaveAttribute('href', 'https://www.scam.ai/en');
			expect(link).toHaveAttribute('target', '_blank');
			expect(link).toHaveAttribute('rel', 'noopener noreferrer');
		}
	});

	it('leaves a company without a url as plain text', () => {
		const { queryByRole, getByText } = setup();
		expect(queryByRole('link', { name: 'Avolta Inc.' })).toBeNull();
		expect(getByText('Avolta Inc.')).toBeInTheDocument();
	});

	it('lists every bullet for every role', () => {
		const { items } = setup();
		const counts = items().map((item) => item.querySelectorAll('.timeline__bullets li').length);
		expect(counts).toEqual(experience.map((role) => role.bullets.length));
	});

	it('marks only the current role with the accent marker', () => {
		const { items } = setup();
		const marked = items().map((item) =>
			item.querySelector('.timeline__marker')?.classList.contains('timeline__marker--current')
		);
		expect(marked).toEqual([true, false, false]);
	});

	it('drives the rail fill from scroll progress', () => {
		const { container } = setup();
		const rail = container.querySelector('.timeline__rail') as HTMLElement;
		const fill = container.querySelector('.timeline__rail-fill') as HTMLElement;

		expect(rail).toBeInTheDocument();
		expect(fill).toBeInTheDocument();
		expect(rail.contains(fill)).toBe(true);
		// `use:scrollProgress` seeds the variable on mount, before any scroll frame.
		expect(rail.style.getPropertyValue('--progress')).toBe('0');
	});

	it('renders nothing but an empty list when given no roles', () => {
		const { container, items } = setup([]);
		expect(items()).toHaveLength(0);
		expect(container.querySelector('ol.timeline__list')).toBeInTheDocument();
	});
});
