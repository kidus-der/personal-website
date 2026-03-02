/**
 * GSAP plugin registration — import this ONCE in the root layout.
 * Never register plugins in individual components to avoid double-registration bugs.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

export function registerGSAPPlugins() {
	if (typeof window === 'undefined') return;

	gsap.registerPlugin(ScrollTrigger, Flip);

	// Global GSAP defaults
	gsap.defaults({
		ease: 'power3.out',
		duration: 0.6
	});

	// Reduce motion: respect system preference
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (reducedMotion) {
		gsap.globalTimeline.timeScale(10);
	}
}

export { gsap, ScrollTrigger, Flip };
