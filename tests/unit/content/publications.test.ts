import { describe, it, expect } from 'vitest';
import { publications, publicationsByYear } from '$content/publications';

describe('publications', () => {
	it('has exactly 8 entries', () => {
		expect(publications).toHaveLength(9);
	});

	it('has unique ids', () => {
		const ids = publications.map((p) => p.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('is sorted year desc, then in the given (spec) order within a year', () => {
		const years = publications.map((p) => p.year);
		const sortedYears = [...years].sort((a, b) => b - a);
		expect(years).toEqual(sortedYears);

		expect(publications.map((p) => p.id)).toEqual([
			'2608.24127',
			'2608.01033',
			'2604.25370',
			'2604.25213',
			'2604.05475',
			'2602.07814',
			'2508.11021',
			'2503.20084',
			'2502.10920'
		]);
	});

	it('every url is an arXiv abstract link', () => {
		for (const pub of publications) {
			expect(pub.url).toMatch(/^https:\/\/arxiv\.org\/abs\//);
		}
	});

	it('every entry has 2-3 bullets and at least one topic', () => {
		for (const pub of publications) {
			expect(pub.bullets.length).toBeGreaterThanOrEqual(2);
			expect(pub.bullets.length).toBeLessThanOrEqual(3);
			expect(pub.topics.length).toBeGreaterThan(0);
		}
	});

	it('the ACM entry carries an officialUrl', () => {
		const acm = publications.find((p) => p.venue === 'ACM');
		expect(acm?.officialUrl).toBe('https://dl.acm.org/doi/10.1145/3709022.3736545');
	});
});

describe('publicationsByYear', () => {
	it('returns ascending-year counts', () => {
		expect(publicationsByYear()).toEqual([
			{ year: 2025, count: 3 },
			{ year: 2026, count: 6 }
		]);
	});
});
