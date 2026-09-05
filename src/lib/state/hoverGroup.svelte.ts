/**
 * Which card in a group is under the pointer — the state behind sibling dimming.
 *
 * A card cannot know that one of its neighbours is hovered, so the parent holds
 * it and hands each card a `dimmed` flag. Three grids need exactly this
 * (`ProjectGrid`, the blog listing, "From the Buna Print" on the home page), and
 * the two subtleties below are the reason it is a module rather than three
 * copies of the same eight lines.
 *
 * **Keyed, not a boolean per card.** A `pointerleave` that arrives after the
 * pointer has already entered the next card — which happens on a fast diagonal
 * drag — must not clear a hover a different card now owns, so `leave` only
 * clears a key that is still the current one.
 *
 * **The key is checked against what is on screen.** Filtering with the keyboard
 * while the pointer sits parked over a card removes that card without ever
 * firing `pointerleave`. A raw hovered key would then leave the whole grid dimmed
 * against something nobody can see, so `active` drops a key the current list no
 * longer contains.
 */
export interface HoverGroup {
	/** The hovered key, or `undefined` when nothing in the current list is. */
	readonly active: string | undefined;
	/** True when a *different* card in the group is hovered. */
	dimmed(key: string): boolean;
	enter(key: string): void;
	leave(key: string): void;
}

/**
 * @param keys The keys currently rendered, read on every access so the group
 *             tracks a filtered or reordered list.
 */
export function createHoverGroup(keys: () => readonly string[]): HoverGroup {
	/** Last key the pointer entered. May be stale — see `active`. */
	let hovered = $state<string | undefined>(undefined);

	const active = $derived.by(() => {
		const key = hovered;
		if (key === undefined) return undefined;
		return keys().includes(key) ? key : undefined;
	});

	return {
		get active() {
			return active;
		},
		dimmed(key: string) {
			return active !== undefined && active !== key;
		},
		enter(key: string) {
			hovered = key;
		},
		leave(key: string) {
			if (hovered === key) hovered = undefined;
		}
	};
}
