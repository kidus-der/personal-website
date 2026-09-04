import { error } from '@sveltejs/kit';
import { projects } from '$content/projects';
import { orderProjectsForGrid } from '$lib/components/sections/work/order';
import type { PageLoad } from './$types';

/**
 * The footer's prev/next walk the grid's display order, not the content file's,
 * so stepping through projects from a detail page matches the order the visitor
 * just scrolled past on `/work`.
 *
 * The walk wraps: the first project's "previous" is the last one. With no
 * dead ends there is no disabled state to design, and the footer reads the same
 * on every project. (Wrapping is only degenerate for a single-project site,
 * where both neighbours would be the project itself.)
 */
export const load = (({ params }) => {
	const ordered = orderProjectsForGrid(projects);
	const index = ordered.findIndex((project) => project.slug === params.slug);
	if (index === -1) error(404, 'Project not found');

	return {
		project: ordered[index],
		prev: ordered[(index - 1 + ordered.length) % ordered.length],
		next: ordered[(index + 1) % ordered.length]
	};
}) satisfies PageLoad;
