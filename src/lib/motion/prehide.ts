/**
 * The release half of the entrance pre-hide — see CLAUDE.md, "Animation system".
 *
 * `app.css` hides anything marked `data-reveal`, `data-reveal-group` or
 * `data-hero` while the document is scripted and the element is not yet
 * revealed. This is the one function that lifts that hold, and it lives here
 * rather than inside `use:reveal` because the hero runs its own sequence and
 * has to release its elements exactly the same way.
 */

/**
 * Mark elements as fully arrived: release the stylesheet's hold, stand the
 * safety net down, and hand styling back to the stylesheet.
 *
 * The inline `opacity` and `transform` are dropped because Motion leaves
 * `transform: none` behind, which would beat any stylesheet transform on the
 * element — a tilt, a hover lift, anything.
 */
export function markRevealed(elements: Iterable<HTMLElement>): void {
	for (const element of elements) {
		element.setAttribute('data-revealed', '');
		element.removeAttribute('data-motion-ready');
		element.style.removeProperty('opacity');
		element.style.removeProperty('transform');
	}
}
