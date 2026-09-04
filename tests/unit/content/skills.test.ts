import { describe, it, expect } from 'vitest';
import { skillGroups, radarScores } from '$content/skills';

describe('skillGroups', () => {
	it('has the 5 CV-derived groups', () => {
		expect(skillGroups.map((g) => g.name)).toEqual([
			'Languages',
			'Frameworks & tools',
			'ML & data',
			'Databases',
			'Dev & testing'
		]);
	});

	it('every group has items', () => {
		for (const group of skillGroups) {
			expect(group.items.length).toBeGreaterThan(0);
		}
	});
});

describe('radarScores', () => {
	it('has exactly 6 scores, each within 0-100', () => {
		expect(radarScores).toHaveLength(6);
		for (const score of radarScores) {
			expect(score.value).toBeGreaterThanOrEqual(0);
			expect(score.value).toBeLessThanOrEqual(100);
		}
	});

	it('matches the spec values', () => {
		const byLabel = Object.fromEntries(radarScores.map((s) => [s.label, s.value]));
		expect(byLabel).toEqual({
			'ML & research': 92,
			'Backend & APIs': 85,
			'Cloud & infra': 72,
			Frontend: 70,
			'Data engineering': 78,
			'Security & forensics': 80
		});
	});
});
