import { writable, derived } from 'svelte/store';
import type { CursorVariant } from '$lib/types/animation';

function createCursorStore() {
	const mouseX = writable(0);
	const mouseY = writable(0);
	const variant = writable<CursorVariant>('default');
	const isVisible = writable(false);

	return {
		mouseX: { subscribe: mouseX.subscribe },
		mouseY: { subscribe: mouseY.subscribe },
		variant: { subscribe: variant.subscribe },
		isVisible: { subscribe: isVisible.subscribe },

		setPosition(x: number, y: number) {
			mouseX.set(x);
			mouseY.set(y);
		},
		setVariant(v: CursorVariant) {
			variant.set(v);
		},
		show() {
			isVisible.set(true);
		},
		hide() {
			isVisible.set(false);
		}
	};
}

export const cursorStore = createCursorStore();

// Derived: combined position for convenience
export const cursorPosition = derived(
	[cursorStore.mouseX, cursorStore.mouseY],
	([$x, $y]) => ({ x: $x, y: $y })
);
