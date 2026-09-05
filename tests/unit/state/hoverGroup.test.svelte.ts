import { describe, it, expect } from 'vitest';
import { createHoverGroup } from '$lib/state/hoverGroup.svelte';

/**
 * The two behaviours worth pinning down are the ones a per-card boolean would
 * get wrong: a stale `pointerleave` from a card that is no longer the hovered
 * one, and a key that leaves the rendered list while the pointer sits on it.
 *
 * `.svelte.ts` so the runes inside `createHoverGroup` compile in the test file.
 */
describe('createHoverGroup', () => {
	function group(initial = ['a', 'b', 'c']) {
		let keys = $state(initial);
		return {
			hover: createHoverGroup(() => keys),
			render(next: string[]) {
				keys = next;
			}
		};
	}

	it('starts with nothing hovered and nothing dimmed', () => {
		const { hover } = group();
		expect(hover.active).toBeUndefined();
		expect(hover.dimmed('a')).toBe(false);
	});

	it('dims every key but the hovered one', () => {
		const { hover } = group();
		hover.enter('b');
		expect(hover.active).toBe('b');
		expect(hover.dimmed('a')).toBe(true);
		expect(hover.dimmed('b')).toBe(false);
		expect(hover.dimmed('c')).toBe(true);
	});

	it('clears on leave', () => {
		const { hover } = group();
		hover.enter('b');
		hover.leave('b');
		expect(hover.active).toBeUndefined();
		expect(hover.dimmed('a')).toBe(false);
	});

	it('ignores a leave from a key that is no longer the hovered one', () => {
		// The fast diagonal drag: `pointerleave` on the card just left arrives
		// after `pointerenter` on the card now under the pointer.
		const { hover } = group();
		hover.enter('a');
		hover.enter('b');
		hover.leave('a');
		expect(hover.active).toBe('b');
	});

	it('drops a hovered key the list no longer renders', () => {
		// Filtering with the keyboard removes the card under a parked pointer, so
		// no `pointerleave` ever arrives.
		const { hover, render } = group();
		hover.enter('c');
		render(['a', 'b']);
		expect(hover.active).toBeUndefined();
		expect(hover.dimmed('a')).toBe(false);
	});

	it('keeps dimming when the hovered key survives the change', () => {
		const { hover, render } = group();
		hover.enter('a');
		render(['a', 'b']);
		expect(hover.active).toBe('a');
		expect(hover.dimmed('b')).toBe(true);
	});

	it('picks the hover back up if the key comes back', () => {
		const { hover, render } = group();
		hover.enter('c');
		render(['a']);
		expect(hover.active).toBeUndefined();
		render(['a', 'c']);
		expect(hover.active).toBe('c');
	});
});
