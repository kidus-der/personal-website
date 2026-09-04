import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import Skills from '$lib/components/sections/about/Skills.svelte';
import { skillGroups, radarScores } from '$content/skills';
import { certifications } from '$content/education';
import { resetMotionMocks } from '../../kokonut/motionMock';
import { tiltCalls, resetActionMocks } from '../../kokonut/actionsMock';

vi.mock('$lib/motion', async () => (await import('../../kokonut/motionMock')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('../../kokonut/actionsMock')).tiltModule());

function setup() {
	const result = render(Skills);
	const cards = () => [...result.container.querySelectorAll('.skills__group')];
	return { ...result, cards };
}

describe('Skills', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetActionMocks();
	});

	afterEach(cleanup);

	it('renders one card per skill group', () => {
		const { cards } = setup();
		expect(cards()).toHaveLength(5);
		expect(cards()).toHaveLength(skillGroups.length);
	});

	it('names every group as a heading', () => {
		const { getAllByRole } = setup();
		const names = getAllByRole('heading', { level: 3 }).map((h) => h.textContent?.trim());
		expect(names).toEqual([...skillGroups.map((group) => group.name), 'Certifications']);
	});

	it('lists every item in every group as a chip', () => {
		const { cards } = setup();
		const counts = cards().map((card) => card.querySelectorAll('.tag').length);
		expect(counts).toEqual(skillGroups.map((group) => group.items.length));
	});

	it('draws the radar chart of self-assessed strengths', () => {
		const { container } = setup();
		const radar = container.querySelector('.skills__radar svg[role="img"]') as SVGElement;
		expect(radar).toBeInTheDocument();
		expect(radar.getAttribute('aria-label')).toContain('ML & research');
	});

	it('gives the radar one axis per score', () => {
		const { container } = setup();
		const labels = [...container.querySelectorAll('.skills__radar .radar-label')];
		expect(labels).toHaveLength(radarScores.length);
	});

	it('flattens the group cards — the radar is the moving part, not these', () => {
		setup();
		expect(tiltCalls).toHaveLength(skillGroups.length);
		expect(tiltCalls.every((call) => (call.options as { max: number }).max === 0)).toBe(true);
	});

	it('lists the certifications as plain prose', () => {
		const { container } = setup();
		const items = [...container.querySelectorAll('.skills__certifications li')].map((li) =>
			li.textContent?.trim()
		);
		expect(items).toEqual(certifications);
	});
});
