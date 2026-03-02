import { gsap } from 'gsap';
import { EASE_OUT_EXPO, EASE_OUT_QUART, DUR_LG, DUR_MD, STAGGER_SM } from '../easings';

export interface HeroElements {
	eyebrow?: HTMLElement | null;
	headline: HTMLElement | null;
	subheadline?: HTMLElement | null;
	cta?: HTMLElement | null;
	visual?: HTMLElement | null;
}

/**
 * Orchestrated hero reveal timeline.
 * Elements fade/slide in sequence for a cinematic entrance.
 */
export function createHeroRevealTimeline(elements: HeroElements): gsap.core.Timeline {
	const tl = gsap.timeline({ paused: true });
	const offset = '-=0.35';

	if (elements.eyebrow) {
		tl.fromTo(
			elements.eyebrow,
			{ opacity: 0, y: 16, clipPath: 'inset(0 0 100% 0)' },
			{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: DUR_MD, ease: EASE_OUT_QUART }
		);
	}

	if (elements.headline) {
		// Split headline into lines — assumes SplitText or manual spans
		const lines = elements.headline.querySelectorAll('.line');
		const target = lines.length > 0 ? lines : elements.headline;

		tl.fromTo(
			target,
			{ opacity: 0, y: 60 },
			{
				opacity: 1,
				y: 0,
				duration: DUR_LG,
				ease: EASE_OUT_EXPO,
				stagger: STAGGER_SM
			},
			elements.eyebrow ? offset : 0
		);
	}

	if (elements.subheadline) {
		tl.fromTo(
			elements.subheadline,
			{ opacity: 0, y: 20 },
			{ opacity: 1, y: 0, duration: DUR_MD, ease: EASE_OUT_QUART },
			offset
		);
	}

	if (elements.cta) {
		tl.fromTo(
			elements.cta,
			{ opacity: 0, y: 12, scale: 0.97 },
			{ opacity: 1, y: 0, scale: 1, duration: DUR_MD, ease: EASE_OUT_QUART },
			offset
		);
	}

	if (elements.visual) {
		tl.fromTo(
			elements.visual,
			{ opacity: 0, scale: 1.04 },
			{ opacity: 1, scale: 1, duration: DUR_LG * 1.2, ease: EASE_OUT_EXPO },
			'<0.2'
		);
	}

	return tl;
}
