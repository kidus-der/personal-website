import { gsap } from 'gsap';
import { EASE_OUT_EXPO, DUR_MD } from '../easings';

/**
 * Page enter transition timeline.
 * Wrap your page content in a ref and pass it here.
 */
export function createPageEnterTimeline(el: HTMLElement): gsap.core.Timeline {
	const tl = gsap.timeline({ paused: true });

	tl.fromTo(
		el,
		{ opacity: 0, y: 24 },
		{ opacity: 1, y: 0, duration: DUR_MD, ease: EASE_OUT_EXPO }
	);

	return tl;
}

/**
 * Page exit timeline — call before navigation.
 */
export function createPageExitTimeline(el: HTMLElement): gsap.core.Timeline {
	const tl = gsap.timeline({ paused: true });

	tl.to(el, { opacity: 0, y: -16, duration: 0.3, ease: 'power2.in' });

	return tl;
}
