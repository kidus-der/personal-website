/**
 * KokonutUI ports (MIT, @dorianbaffier) — Svelte 5, re-skinned with our tokens.
 *
 * Wave A: text, button and background primitives.
 * Wave B: the card, nav and tab components.
 */

export { default as ShimmerText } from './ShimmerText.svelte';
export { default as DynamicText } from './DynamicText.svelte';
export { default as MatrixText } from './MatrixText.svelte';
export { default as SlideTextButton } from './SlideTextButton.svelte';
export { default as ParticleButton } from './ParticleButton.svelte';
export { default as BackgroundPaths } from './BackgroundPaths.svelte';
export { default as BeamsBackground } from './BeamsBackground.svelte';
export { default as SpotlightCard } from './SpotlightCard.svelte';
export { default as BentoCard } from './BentoCard.svelte';
export { default as MouseEffectCard } from './MouseEffectCard.svelte';
export { default as MorphicNav } from './MorphicNav.svelte';
export { default as ThemeSwitch } from './ThemeSwitch.svelte';
export { default as SmoothTabs } from './SmoothTabs.svelte';

export {
	generateAestheticPath,
	buildPathSets,
	type AestheticPath,
	type PathSets,
	type PathType
} from './backgroundPaths';

export {
	generateDots,
	capDots,
	respondToPointer,
	MAX_DOTS,
	type Dot,
	type DotResponse
} from './mouseEffectDots';

export {
	createIndicator,
	measureIndicator,
	moveIndicator,
	type IndicatorTarget
} from './indicator.svelte';
