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
