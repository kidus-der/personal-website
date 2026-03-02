import type { gsap } from 'gsap';

export type EasingToken =
	| 'ease-out-expo'
	| 'ease-out-quart'
	| 'ease-in-out-expo'
	| 'ease-in-out-quart'
	| 'elastic-out'
	| 'back-out'
	| 'none';

export interface GSAPFromConfig {
	vars: gsap.TweenVars;
	duration?: number;
	ease?: EasingToken;
	delay?: number;
}

export interface RevealConfig {
	y?: number;
	opacity?: number;
	duration?: number;
	ease?: string;
	delay?: number;
	threshold?: number;
	once?: boolean;
}

export type CursorVariant = 'default' | 'hover' | 'drag' | 'text' | 'hidden';

export interface MagneticConfig {
	strength?: number;
	ease?: number;
}
