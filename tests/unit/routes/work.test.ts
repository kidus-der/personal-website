import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import { load as loadIndex } from '../../../src/routes/(portfolio)/work/+page';
import { load as loadDetail } from '../../../src/routes/(portfolio)/work/[slug]/+page';
import WorkPage from '../../../src/routes/(portfolio)/work/+page.svelte';
import { orderProjectsForGrid } from '$lib/components/sections/work/order';
import { projects, projectsByCategory } from '$content/projects';

vi.mock('$lib/motion', async () => (await import('../kokonut/motionMock')).motionModule());
vi.mock('$lib/actions/tilt', async () => (await import('../kokonut/actionsMock')).tiltModule());
vi.mock('$lib/actions/reveal', async () =>
	(await import('../sections/work/revealMock')).revealModule()
);
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
// `SEO` reads the page store for its canonical URL.
vi.mock('$app/stores', () => ({
	page: readable({ url: new URL('http://localhost/work'), params: {} })
}));

/**
 * The `load` functions are exercised directly, so each is handed the one field
 * of the event it actually reads. The cast is the price of not standing up a
 * whole SvelteKit `LoadEvent` for two property accesses.
 */
type IndexEvent = Parameters<typeof loadIndex>[0];
type DetailEvent = Parameters<typeof loadDetail>[0];

function runIndex(search = '') {
	const url = new URL(`http://localhost/work${search}`);
	return loadIndex({ url } as unknown as IndexEvent);
}

function runDetail(slug: string) {
	return loadDetail({ params: { slug } } as unknown as DetailEvent);
}

/** Returns whatever `fn` threw, or `undefined` if it returned normally. */
function captureThrow(fn: () => unknown): unknown {
	try {
		fn();
	} catch (thrown) {
		return thrown;
	}
	return undefined;
}

const gridOrder = orderProjectsForGrid(projects).map((project) => project.slug);

describe('/work load', () => {
	it('shows every project when no category is asked for', () => {
		const data = runIndex();
		expect(data.category).toBe('all');
		expect(data.projects).toHaveLength(8);
	});

	it('filters down to a real category', () => {
		const data = runIndex('?category=ai-ml');
		expect(data.category).toBe('ai-ml');
		expect(data.projects).toHaveLength(4);
		expect(data.projects.every((project) => project.category === 'ai-ml')).toBe(true);
	});

	it('falls back to all for a category that does not exist', () => {
		const data = runIndex('?category=not-a-category');
		expect(data.category).toBe('all');
		expect(data.projects).toHaveLength(8);
	});

	it('falls back to all for an empty category parameter', () => {
		const data = runIndex('?category=');
		expect(data.category).toBe('all');
		expect(data.projects).toHaveLength(8);
	});

	it('accepts "all" spelled out', () => {
		const data = runIndex('?category=all');
		expect(data.category).toBe('all');
		expect(data.projects).toHaveLength(8);
	});

	it('is case sensitive — a near miss is still a miss', () => {
		const data = runIndex('?category=AI-ML');
		expect(data.category).toBe('all');
		expect(data.projects).toHaveLength(8);
	});

	it('ignores unrelated query parameters', () => {
		const data = runIndex('?ref=newsletter');
		expect(data.category).toBe('all');
		expect(data.projects).toHaveLength(8);
	});

	it('hands the grid its projects already ordered', () => {
		expect(runIndex().projects.map((project) => project.slug)).toEqual(gridOrder);
	});
});

describe('/work/[slug] load', () => {
	it('finds the project named by the slug', () => {
		const data = runDetail('coeus-ai');
		expect(data.project.slug).toBe('coeus-ai');
		expect(data.project.title).toBe('Coeus AI');
	});

	it('walks the grid order for prev and next', () => {
		const data = runDetail(gridOrder[1]);
		expect(data.prev.slug).toBe(gridOrder[0]);
		expect(data.next.slug).toBe(gridOrder[2]);
	});

	it('wraps backwards from the first project to the last', () => {
		const data = runDetail(gridOrder[0]);
		expect(data.prev.slug).toBe(gridOrder.at(-1));
		expect(data.next.slug).toBe(gridOrder[1]);
	});

	it('wraps forwards from the last project to the first', () => {
		const data = runDetail(gridOrder.at(-1) as string);
		expect(data.next.slug).toBe(gridOrder[0]);
		expect(data.prev.slug).toBe(gridOrder.at(-2));
	});

	it('never offers the current project as its own neighbour', () => {
		for (const slug of gridOrder) {
			const data = runDetail(slug);
			expect(data.prev.slug).not.toBe(slug);
			expect(data.next.slug).not.toBe(slug);
		}
	});

	it('throws a 404 for a slug that matches nothing', () => {
		expect(() => runDetail('no-such-project')).toThrow();
		const thrown = captureThrow(() => runDetail('no-such-project')) as {
			status?: number;
			body?: { message?: string };
		};
		expect(thrown.status).toBe(404);
		expect(thrown.body?.message).toBe('Project not found');
	});

	it('throws a 404 for an empty slug', () => {
		expect(() => runDetail('')).toThrow();
	});
});

describe('/work page status line', () => {
	afterEach(cleanup);

	const status = (container: HTMLElement) =>
		container.querySelector('[aria-live="polite"]')?.textContent?.trim();

	function renderPage(category: 'all' | 'ai-ml' | 'systems' = 'all') {
		return render(WorkPage, {
			props: { data: { category, projects: orderProjectsForGrid(projectsByCategory(category)) } }
		});
	}

	it('counts every project when nothing is filtered out', () => {
		expect(status(renderPage().container)).toBe('8 projects');
	});

	it('says "1 project", not "1 projects"', () => {
		expect(status(renderPage('systems').container)).toBe('1 project');
	});

	it('is announced politely rather than shown', () => {
		const { container } = renderPage();
		const line = container.querySelector('[aria-live="polite"]') as HTMLElement;
		expect(line).toHaveClass('work-page__status');
		expect(line).toBeInTheDocument();
	});
});
