/**
 * Svelte actions for inline GSAP animations tied to mount/unmount lifecycle.
 *
 * use:gsapFrom  — animate FROM these vars to the element's current state
 * use:gsapTo    — animate TO these vars from the element's current state
 */
import { gsap } from 'gsap';

export function gsapFrom(node: HTMLElement, vars: gsap.TweenVars) {
	const tween = gsap.from(node, vars);

	return {
		update(newVars: gsap.TweenVars) {
			tween.vars = { ...tween.vars, ...newVars };
		},
		destroy() {
			tween.kill();
		}
	};
}

export function gsapTo(node: HTMLElement, vars: gsap.TweenVars) {
	const tween = gsap.to(node, vars);

	return {
		update(newVars: gsap.TweenVars) {
			gsap.to(node, newVars);
		},
		destroy() {
			tween.kill();
		}
	};
}
