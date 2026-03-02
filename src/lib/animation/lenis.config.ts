/**
 * Lenis smooth scroll setup — initialized once in root layout.
 * Syncs with GSAP ticker and ScrollTrigger.
 * Destroyed/re-initialized around SvelteKit navigations.
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollStore } from '$lib/stores/scroll';

let lenis: Lenis | null = null;

export function initLenis(): Lenis {
	lenis = new Lenis({
		duration: 1.2,
		easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
		smoothWheel: true,
		wheelMultiplier: 1,
		touchMultiplier: 2
	});

	// Sync with GSAP ticker
	gsap.ticker.add((time) => {
		lenis!.raf(time * 1000);
	});
	gsap.ticker.lagSmoothing(0);

	// Keep ScrollTrigger in sync
	lenis.on('scroll', ScrollTrigger.update);

	// Update scroll store
	lenis.on('scroll', ({ scroll }: { scroll: number }) => {
		scrollStore.setScrollY(scroll);
	});

	// Expose on store for external access
	scrollStore.setLenis(lenis);

	return lenis;
}

export function destroyLenis() {
	if (!lenis) return;
	gsap.ticker.remove(lenis.raf);
	lenis.destroy();
	lenis = null;
	scrollStore.setLenis(null);
}

export function getLenis(): Lenis | null {
	return lenis;
}
