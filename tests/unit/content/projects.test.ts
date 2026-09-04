import { describe, it, expect } from 'vitest';
import {
	projects,
	PROJECT_CATEGORIES,
	featuredProjects,
	projectsByCategory
} from '$content/projects';

describe('projects', () => {
	it('has exactly 8 entries', () => {
		expect(projects).toHaveLength(8);
	});

	it('has unique slugs', () => {
		const slugs = projects.map((p) => p.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it('is sorted by year desc', () => {
		const years = projects.map((p) => p.year);
		const sortedYears = [...years].sort((a, b) => b - a);
		expect(years).toEqual(sortedYears);
	});

	it('every image path is absolute (starts with /)', () => {
		for (const project of projects) {
			for (const image of project.images) {
				expect(image.startsWith('/')).toBe(true);
			}
		}
	});

	it('every project has 2-4 highlights', () => {
		for (const project of projects) {
			expect(project.highlights.length).toBeGreaterThanOrEqual(2);
			expect(project.highlights.length).toBeLessThanOrEqual(4);
		}
	});
});

describe('PROJECT_CATEGORIES', () => {
	it('lists all with the 4 categories', () => {
		expect(PROJECT_CATEGORIES).toEqual([
			{ id: 'all', label: 'All' },
			{ id: 'ai-ml', label: 'AI & ML' },
			{ id: 'full-stack', label: 'Full-stack' },
			{ id: 'systems', label: 'Systems' },
			{ id: 'mobile', label: 'Mobile' }
		]);
	});
});

describe('featuredProjects', () => {
	it('returns prime-radiant, coeus-ai, poseidon-wildfire in that order', () => {
		expect(featuredProjects().map((p) => p.slug)).toEqual([
			'prime-radiant',
			'coeus-ai',
			'poseidon-wildfire'
		]);
	});

	it('returns at most 3 projects', () => {
		expect(featuredProjects().length).toBeLessThanOrEqual(3);
	});
});

describe('projectsByCategory', () => {
	it("'all' returns every project", () => {
		expect(projectsByCategory('all')).toHaveLength(8);
	});

	it('filters by category', () => {
		const aiMl = projectsByCategory('ai-ml');
		expect(aiMl.length).toBeGreaterThan(0);
		for (const project of aiMl) {
			expect(project.category).toBe('ai-ml');
		}
	});
});
