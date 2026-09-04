/**
 * KokonutUI ports (MIT, @dorianbaffier) — Svelte 5, re-skinned with our tokens.
 *
 * Wave A: text, button and background primitives. Later waves add the card,
 * nav and tab components alongside these.
 */

export { default as ShimmerText } from './ShimmerText.svelte';
export { default as DynamicText } from './DynamicText.svelte';
export { default as MatrixText } from './MatrixText.svelte';
export { default as SlideTextButton } from './SlideTextButton.svelte';
export { default as ParticleButton } from './ParticleButton.svelte';
export { default as BackgroundPaths } from './BackgroundPaths.svelte';
export { default as BeamsBackground } from './BeamsBackground.svelte';

export {
	generateAestheticPath,
	buildPathSets,
	type AestheticPath,
	type PathSets,
	type PathType
} from './backgroundPaths';
