import { describe, it, expect } from 'vitest';
import { orderProjectsForGrid } from '$lib/components/sections/work/order';
import { featuredProjects, projects, projectsByCategory } from '$content/projects';
import type { Project } from '$lib/types/content';

const slugsOf = (list: Project[]) => list.map((project) => project.slug);

/** The slug the grid always shows last, however the rest of the list sorts. */
const PINNED_LAST = 'personal-website';

describe('orderProjectsForGrid', () => {
	it('returns exactly the projects it was given, each once', () => {
		const ordered = orderProjectsForGrid(projects);
		expect(ordered).toHaveLength(projects.length);
		expect(new Set(slugsOf(ordered))).toEqual(new Set(slugsOf(projects)));
	});

	it('leads with the featured projects, in featuredProjects() order', () => {
		const featured = slugsOf(featuredProjects());
		const ordered = slugsOf(orderProjectsForGrid(projects));
		expect(ordered.slice(0, featured.length)).toEqual(featured);
	});

	it('pins this website last even though it is the newest project', () => {
		const ordered = slugsOf(orderProjectsForGrid(projects));
		expect(ordered.at(-1)).toBe(PINNED_LAST);
	});

	it('orders everything after the featured block by year, newest first', () => {
		const ordered = orderProjectsForGrid(projects);
		const rest = ordered.slice(featuredProjects().length, -1);
		expect(rest.length).toBeGreaterThan(1);
		const years = rest.map((project) => project.year);
		expect(years).toEqual([...years].sort((a, b) => b - a));
	});

	it('keeps the same rules inside a filtered category', () => {
		const ordered = slugsOf(orderProjectsForGrid(projectsByCategory('ai-ml')));
		expect(ordered).toEqual([
			'prime-radiant',
			'coeus-ai',
			'poseidon-wildfire',
			'svm-stock-predictor'
		]);
	});

	it('drops the featured block cleanly when the category has none', () => {
		const ordered = slugsOf(orderProjectsForGrid(projectsByCategory('systems')));
		expect(ordered).toEqual(['port-scanner']);
	});

	it('puts the pinned project last in its own category too', () => {
		const ordered = slugsOf(orderProjectsForGrid(projectsByCategory('full-stack')));
		expect(ordered.at(-1)).toBe(PINNED_LAST);
	});

	it('breaks ties within a year by keeping the input order', () => {
		const ordered = slugsOf(orderProjectsForGrid(projects));
		const source = slugsOf(projects).filter((slug) => ['elevent', 'flairglow'].includes(slug));
		const placed = ordered.filter((slug) => ['elevent', 'flairglow'].includes(slug));
		expect(placed).toEqual(source);
	});

	it('does not mutate the array it was given', () => {
		const input = [...projects];
		const snapshot = slugsOf(input);
		orderProjectsForGrid(input);
		expect(slugsOf(input)).toEqual(snapshot);
	});

	it('handles an empty list', () => {
		expect(orderProjectsForGrid([])).toEqual([]);
	});
});
