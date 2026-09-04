import { PROJECT_CATEGORIES, projectsByCategory } from '$content/projects';
import { orderProjectsForGrid } from '$lib/components/sections/work/order';
import type { ProjectCategory } from '$lib/types/content';
import type { PageLoad } from './$types';

type CategoryId = ProjectCategory | 'all';

/**
 * `?category=` is user input: anything that is not one of the tab ids — a typo,
 * a stale bookmark, an empty value — falls back to "all" rather than rendering
 * an empty grid the visitor cannot explain. It is deliberately not a 404: the
 * page is real, only the filter was nonsense.
 *
 * `satisfies` rather than a `PageLoad` annotation so the page still sees the
 * concrete return type, and so a test can hand `load` a bare `{ url }`.
 */
export const load = (({ url }) => {
	const requested = url.searchParams.get('category');
	// Taking the id off the matched tab rather than casting the raw string keeps
	// the narrowing the type system's job instead of an assertion's.
	const category: CategoryId = PROJECT_CATEGORIES.find((tab) => tab.id === requested)?.id ?? 'all';

	return { category, projects: orderProjectsForGrid(projectsByCategory(category)) };
}) satisfies PageLoad;
