import { describe, it, expect } from 'vitest';
import { education, certifications } from '$content/education';

describe('education', () => {
	it('has the expected degree, school, and graduation', () => {
		expect(education.degree).toBe('BSc Computing Science, Minor in Economics');
		expect(education.school).toBe('University of Alberta');
		expect(education.graduation).toBe('2026-06');
	});
});

describe('certifications', () => {
	it('has 4 certifications', () => {
		expect(certifications).toHaveLength(4);
		for (const cert of certifications) {
			expect(typeof cert).toBe('string');
			expect(cert.length).toBeGreaterThan(0);
		}
	});
});
