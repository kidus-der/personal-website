import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import Skills from '$lib/components/sections/about/Skills.svelte';
import type { RadarScore, SkillGroup } from '$lib/types/content';
import { resetMotionMocks } from '../../kokonut/motionMock';
import { tiltCalls, resetActionMocks } from '../../kokonut/actionsMock';

vi.mock('$lib/motion', async () => (await import('../../kokonut/motionMock')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('../../kokonut/actionsMock')).tiltModule());

/**
 * Fixtures rather than the real content module: these tests are about how the
 * component lays its props out, and pinning them to the live CV would turn any
 * content edit into a test failure. `tests/unit/content/skills.test.ts` is what
 * guards the real data.
 */
const groups: SkillGroup[] = [
	{ name: 'Languages', items: ['Python', 'TypeScript'] },
	{ name: 'Frameworks & tools', items: ['SvelteKit'] },
	{ name: 'ML & data', items: ['PyTorch', 'NumPy', 'Pandas'] },
	{ name: 'Databases', items: ['PostgreSQL'] },
	{ name: 'Dev & testing', items: ['Vitest', 'Playwright'] }
];

const scores: RadarScore[] = [
	{ key: 'ml-research', label: 'ML & research', value: 92 },
	{ key: 'backend-apis', label: 'Backend & APIs', value: 85 },
	{ key: 'cloud-infra', label: 'Cloud & infra', value: 72 },
	{ key: 'frontend', label: 'Frontend', value: 70 },
	{ key: 'data-engineering', label: 'Data engineering', value: 78 },
	{ key: 'security-forensics', label: 'Security & forensics', value: 80 }
];

const certifications = ['Google Cybersecurity Professional', 'UAlberta Reinforcement Learning'];

function setup(props: Partial<Record<string, unknown>> = {}) {
	return render(Skills, { props: { groups, scores, certifications, ...props } });
}

/** A group card is identified by its heading, not by a class the DOM need not have. */
function cardFor(heading: HTMLElement) {
	return heading.closest('.spotlight-card') as HTMLElement;
}

describe('Skills', () => {
	beforeEach(() => {
		resetMotionMocks();
		resetActionMocks();
	});

	afterEach(cleanup);

	it('names every group as a heading, with certifications last', () => {
		const { getAllByRole } = setup();
		expect(getAllByRole('heading', { level: 3 }).map((h) => h.textContent?.trim())).toEqual([
			'Languages',
			'Frameworks & tools',
			'ML & data',
			'Databases',
			'Dev & testing',
			'Certifications'
		]);
	});

	it('renders one card per group', () => {
		const { getByRole } = setup();
		for (const group of groups) {
			expect(cardFor(getByRole('heading', { name: group.name, level: 3 }))).toBeInTheDocument();
		}
	});

	it('lists every item of a group as a chip inside that group card', () => {
		const { getByRole } = setup();
		for (const group of groups) {
			const card = cardFor(getByRole('heading', { name: group.name, level: 3 }));
			const chips = [...card.querySelectorAll('.tag')].map((tag) => tag.textContent?.trim());
			expect(chips).toEqual(group.items);
		}
	});

	it('draws the radar chart of self-assessed strengths', () => {
		const { container } = setup();
		const radar = container.querySelector('.skills__radar svg[role="img"]') as SVGElement;
		expect(radar).toBeInTheDocument();
		expect(radar.getAttribute('aria-label')).toContain('ML & research');
	});

	it('gives the radar one axis per score', () => {
		const { container } = setup();
		const labels = [...container.querySelectorAll('.skills__radar .radar-label')].map((label) =>
			label.textContent?.trim()
		);
		expect(labels).toEqual(scores.map((score) => score.label));
	});

	it('flattens the group cards — the radar is the moving part, not these', () => {
		setup();
		expect(tiltCalls).toHaveLength(groups.length);
		expect(tiltCalls.every((call) => (call.options as { max: number }).max === 0)).toBe(true);
	});

	it('lists the certifications as plain prose', () => {
		const { container } = setup();
		const items = [...container.querySelectorAll('.skills__certifications li')].map((li) =>
			li.textContent?.trim()
		);
		expect(items).toEqual(certifications);
	});

	it('renders whatever it is handed, not the content module', () => {
		const { getAllByRole, container } = setup({
			groups: [{ name: 'Only group', items: ['One'] }],
			scores: scores.slice(0, 3),
			certifications: []
		});

		expect(getAllByRole('heading', { level: 3 }).map((h) => h.textContent?.trim())).toEqual([
			'Only group',
			'Certifications'
		]);
		expect(container.querySelectorAll('.skills__radar .radar-label')).toHaveLength(3);
		expect(container.querySelectorAll('.skills__certifications li')).toHaveLength(0);
	});
});
