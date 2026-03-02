/**
 * use:magnetic
 *
 * Adds GSAP-powered magnetic cursor attraction to a button/element.
 * The element subtly moves toward the cursor when hovered.
 *
 * Usage:
 *   <button use:magnetic>...</button>
 *   <button use:magnetic={{ strength: 0.4 }}>...</button>
 */
import { gsap } from 'gsap';
import type { MagneticConfig } from '$lib/types/animation';

export function magnetic(node: HTMLElement, config: MagneticConfig = {}) {
	const { strength = 0.3, ease = 0.15 } = config;

	function handleMouseMove(e: MouseEvent) {
		const rect = node.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const dx = (e.clientX - cx) * strength;
		const dy = (e.clientY - cy) * strength;

		gsap.to(node, {
			x: dx,
			y: dy,
			duration: ease * 3,
			ease: 'power2.out'
		});
	}

	function handleMouseLeave() {
		gsap.to(node, {
			x: 0,
			y: 0,
			duration: 0.5,
			ease: 'elastic.out(1, 0.5)'
		});
	}

	node.addEventListener('mousemove', handleMouseMove);
	node.addEventListener('mouseleave', handleMouseLeave);

	return {
		update(newConfig: MagneticConfig) {
			Object.assign(config, newConfig);
		},
		destroy() {
			node.removeEventListener('mousemove', handleMouseMove);
			node.removeEventListener('mouseleave', handleMouseLeave);
			gsap.killTweensOf(node);
		}
	};
}
