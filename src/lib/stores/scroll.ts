import { writable, readonly } from 'svelte/store';
import type Lenis from 'lenis';

const _scrollY = writable(0);
const _lenis = writable<Lenis | null>(null);
const _direction = writable<1 | -1>(1);

export const scrollStore = {
	scrollY: readonly(_scrollY),
	lenis: readonly(_lenis),
	direction: readonly(_direction),

	setScrollY(y: number) {
		_scrollY.update((prev) => {
			_direction.set(y > prev ? 1 : -1);
			return y;
		});
	},
	setLenis(instance: Lenis | null) {
		_lenis.set(instance);
	}
};
