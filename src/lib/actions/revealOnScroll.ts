/**
 * use:revealOnScroll
 *
 * Reveals an element as it enters the viewport using GSAP + ScrollTrigger.
 * Automatically cleaned up when the element is destroyed.
 *
 * Usage:
 *   <div use:revealOnScroll>...</div>
 *   <div use:revealOnScroll={{ y: 40, duration: 0.8 }}>...</div>
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { RevealConfig } from '$lib/types/animation';
import { EASE_OUT_EXPO } from '$lib/animation/easings';
import { reducedMotion } from '$lib/motion/config';

// Registered here (idempotent) so the action works without a global
// registration step. Legacy — removed with the GSAP stack in Task 11.
gsap.registerPlugin(ScrollTrigger);

// Honour `prefers-reduced-motion` for the whole legacy GSAP timeline.
// `reducedMotion()` is SSR-safe and returns false when there is no matchMedia.
if (reducedMotion()) {
	gsap.globalTimeline.timeScale(10);
}

export function revealOnScroll(node: HTMLElement, config: RevealConfig = {}) {
	const {
		y = 40,
		opacity = 0,
		duration = 0.7,
		ease = EASE_OUT_EXPO,
		delay = 0,
		threshold = 0.15,
		once = true
	} = config;

	const ctx = gsap.context(() => {
		gsap.fromTo(
			node,
			{ opacity, y },
			{
				opacity: 1,
				y: 0,
				duration,
				ease,
				delay,
				clearProps: 'transform',
				scrollTrigger: {
					trigger: node,
					start: `top ${Math.round((1 - threshold) * 100)}%`,
					toggleActions: once ? 'play none none none' : 'play reverse play reverse'
				}
			}
		);
	});

	return {
		destroy() {
			ctx.revert();
		}
	};
}
