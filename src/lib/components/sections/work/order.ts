import { featuredProjects } from '$content/projects';
import type { Project } from '$lib/types/content';

/**
 * The grid's display order, which is deliberately not the content file's order.
 *
 * Three tiers, in this order:
 *   1. the featured projects, in `featuredProjects()` order (year, newest first)
 *   2. everything else by year, newest first
 *   3. this website, always last
 *
 * The site is pinned last because it is the page you are already looking at:
 * being the newest project it would otherwise open the grid, which reads as
 * padding rather than as work. Ties inside a tier keep the content file's order,
 * which is what `Array.prototype.sort`'s stability gives us for free.
 *
 * Pure and total: it copies before sorting, so a filtered list from
 * `projectsByCategory()` can be passed straight in, and a tier that the filter
 * emptied simply contributes nothing.
 */

/** The one slug that always sorts last. */
const PINNED_LAST = 'personal-website';

const TIER_FEATURED = 0;
const TIER_REST = 1;
const TIER_PINNED = 2;

export function orderProjectsForGrid(projects: Project[]): Project[] {
	// Read once per call rather than per comparison: `featuredProjects()` filters
	// and sorts the whole content array every time it is called.
	const featuredOrder = featuredProjects().map((project) => project.slug);

	const tierOf = (project: Project) => {
		if (project.slug === PINNED_LAST) return TIER_PINNED;
		return featuredOrder.includes(project.slug) ? TIER_FEATURED : TIER_REST;
	};

	return [...projects].sort((a, b) => {
		const tier = tierOf(a);
		const tierDelta = tier - tierOf(b);
		if (tierDelta !== 0) return tierDelta;
		if (tier === TIER_FEATURED) {
			return featuredOrder.indexOf(a.slug) - featuredOrder.indexOf(b.slug);
		}
		if (tier === TIER_REST) return b.year - a.year;
		// Only one project is ever pinned, so this branch never breaks a real tie.
		return 0;
	});
}
