/**
 * Named easing constants for GSAP.
 * Use these throughout the codebase instead of raw strings.
 */

export const EASE_OUT_EXPO = 'power4.out' as const;
export const EASE_OUT_QUART = 'power3.out' as const;
export const EASE_OUT_CUBIC = 'power2.out' as const;
export const EASE_IN_OUT_EXPO = 'expo.inOut' as const;
export const EASE_IN_OUT_QUART = 'power3.inOut' as const;
export const EASE_IN_OUT_CUBIC = 'power2.inOut' as const;
export const EASE_ELASTIC_OUT = 'elastic.out(1, 0.5)' as const;
export const EASE_BACK_OUT = 'back.out(1.7)' as const;
export const EASE_NONE = 'none' as const;

/** Default durations in seconds */
export const DUR_XS = 0.25;
export const DUR_SM = 0.4;
export const DUR_MD = 0.6;
export const DUR_LG = 0.9;
export const DUR_XL = 1.2;

/** Stagger amounts in seconds */
export const STAGGER_XS = 0.04;
export const STAGGER_SM = 0.07;
export const STAGGER_MD = 0.1;
export const STAGGER_LG = 0.15;
