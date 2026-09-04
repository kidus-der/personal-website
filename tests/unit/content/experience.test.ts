import { describe, it, expect } from 'vitest';
import { experience } from '$content/experience';

describe('experience', () => {
	it('has exactly 3 roles', () => {
		expect(experience).toHaveLength(3);
	});

	it('lists roles in the expected order', () => {
		expect(experience.map((e) => e.role)).toEqual([
			'Founding Engineer',
			'Machine Learning Engineer',
			'Machine Learning Intern'
		]);
	});

	it('every role has non-empty bullets and a valid period', () => {
		for (const role of experience) {
			expect(role.bullets.length).toBeGreaterThan(0);
			expect(role.period.start).toMatch(/^\d{4}-\d{2}$/);
			expect(role.period.end === 'Present' || /^\d{4}-\d{2}$/.test(role.period.end)).toBe(true);
		}
	});

	it('sets the controller-mandated dates for Scam AI roles', () => {
		const founding = experience.find((e) => e.role === 'Founding Engineer');
		const mle = experience.find((e) => e.role === 'Machine Learning Engineer');
		const intern = experience.find((e) => e.role === 'Machine Learning Intern');

		expect(founding?.period).toEqual({ start: '2026-06', end: 'Present' });
		expect(mle?.period).toEqual({ start: '2025-01', end: '2026-06' });
		expect(intern?.period).toEqual({ start: '2023-10', end: '2024-01' });
		expect(founding?.url).toBe('https://www.scam.ai/en');
	});
});
