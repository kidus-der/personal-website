/**
 * The sliding pill shared by `MorphicNav` and `SmoothTabs`.
 *
 * Both components are a row of controls with one absolutely positioned element
 * that morphs onto whichever control is active. The measuring, the "place it
 * without animating the first time" rule and the reduced-motion path are
 * identical, so they live here rather than being written twice.
 *
 * `offsetLeft` / `offsetWidth` are used rather than `getBoundingClientRect()`:
 * both are relative to the positioned row, which is exactly the coordinate space
 * the indicator is absolutely positioned in, and neither is affected by a
 * transform the row itself may be under.
 */
import { animate, reducedMotion, springs } from '$lib/motion';

export interface IndicatorTarget {
	x: number;
	width: string;
	opacity: number;
}

/** Where the indicator should sit for `element`, or hidden when there is none. */
export function measureIndicator(element: HTMLElement | undefined | null): IndicatorTarget {
	if (!element) return { x: 0, width: '0px', opacity: 0 };
	return { x: element.offsetLeft, width: `${element.offsetWidth}px`, opacity: 1 };
}

/**
 * Move `indicator` onto `target`.
 *
 * The first placement — and every placement under reduced motion — is instant:
 * springing in from the left edge on mount would read as an entrance animation,
 * and the design brief allows exactly one of those, on the hero.
 */
export function moveIndicator(
	indicator: HTMLElement,
	target: IndicatorTarget,
	instant: boolean
): ReturnType<typeof animate> {
	return animate(
		indicator,
		{ ...target },
		instant || reducedMotion() ? { duration: 0 } : springs.snappy
	);
}
