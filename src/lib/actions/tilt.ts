/**
 * use:tilt — pointer-driven 3D tilt and glow position for card surfaces.
 *
 * The action owns no styling: it springs four CSS variables and lets the card's
 * own CSS decide what to do with them.
 *
 *   --rx / --ry  rotation in degrees (rotateX / rotateY)
 *   --gx / --gy  glow origin as a percentage of the card box
 *
 *   <div use:tilt style="transform: rotateX(var(--rx)) rotateY(var(--ry))">
 */
import type { Action } from 'svelte/action';
import { animate, reducedMotion, springs } from '$lib/motion';
import type { TiltOptions } from '$lib/types/motion';
import { finePointer } from './pointer';

type Animation = ReturnType<typeof animate>;

const DEFAULTS = { max: 9, spring: 'snappy' } as const satisfies Required<TiltOptions>;

/**
 * The animated values. A type alias rather than an interface: only aliases get
 * the implicit index signature Motion's `ObjectTarget` keyframes ask for.
 */
type TiltState = {
	/** rotateX in degrees. */
	rx: number;
	/** rotateY in degrees. */
	ry: number;
	/** Glow origin as a percentage of the box. */
	gx: number;
	gy: number;
};

/** Resting state: flat, glow centred. */
const REST: TiltState = { rx: 0, ry: 0, gx: 50, gy: 50 };

export const tilt: Action<HTMLElement, TiltOptions | undefined> = (node, options) => {
	// A tilt needs a hovering pointer; on touch it would stick after the tap.
	if (reducedMotion() || !finePointer()) return { destroy() {} };

	let opts = { ...DEFAULTS, ...options };
	// Animating a plain object rather than the element keeps the card's own
	// transform under CSS control — Motion writes numbers, CSS composes them.
	const state: TiltState = { ...REST };
	let animation: Animation | undefined;

	function write() {
		node.style.setProperty('--rx', `${state.rx}deg`);
		node.style.setProperty('--ry', `${state.ry}deg`);
		node.style.setProperty('--gx', `${state.gx}%`);
		node.style.setProperty('--gy', `${state.gy}%`);
	}

	function springTo(target: TiltState) {
		animation?.stop();
		animation = animate(state, target, {
			...springs[opts.spring],
			onUpdate: write,
			// The spring settles asymptotically; make sure the exact resting
			// values land even if the last frame is skipped.
			onComplete: write
		});
	}

	function handlePointerMove(event: PointerEvent) {
		const rect = node.getBoundingClientRect();
		// jsdom, `display: none`, and not-yet-laid-out nodes all report 0.
		if (rect.width === 0 || rect.height === 0) return;

		const px = (event.clientX - rect.left) / rect.width;
		const py = (event.clientY - rect.top) / rect.height;

		springTo({
			rx: (0.5 - py) * 2 * opts.max,
			ry: (px - 0.5) * 2 * opts.max,
			gx: px * 100,
			gy: py * 100
		});
	}

	function handlePointerLeave() {
		springTo(REST);
	}

	node.addEventListener('pointermove', handlePointerMove);
	node.addEventListener('pointerleave', handlePointerLeave);

	return {
		update(next) {
			opts = { ...DEFAULTS, ...next };
		},
		destroy() {
			node.removeEventListener('pointermove', handlePointerMove);
			node.removeEventListener('pointerleave', handlePointerLeave);
			animation?.stop();
		}
	};
};
