<script lang="ts">
	import { onMount } from 'svelte';
	import { themeStore } from '$lib/stores/theme';
	import type { Theme } from '$lib/stores/theme';

	interface Props {
		effect: 'GLOBE' | 'NET';
		opacity?: number;
		interactive?: boolean;
		/** NET only: point size (default ~1.0, smaller = less prominent) */
		size?: number;
		/** NET only: max connection distance in px (default ~150) */
		maxDistance?: number;
	}

	let { effect, opacity = effect === 'GLOBE' ? 1 : 0.35, interactive = effect === 'GLOBE', size, maxDistance }: Props = $props();

	let containerEl: HTMLDivElement;

	function getColors(theme: Theme, fx: 'GLOBE' | 'NET') {
		if (fx === 'GLOBE') {
			return theme === 'dark'
				? { backgroundColor: 0x0a0a0a, color: 0xf05924, color2: 0xffffff }
				: { backgroundColor: 0xffffff, color: 0x2b5ce6, color2: 0xf05924 };
		} else {
			return theme === 'dark'
				? { backgroundColor: 0x0a0a0a, color: 0xf05924 }
				: { backgroundColor: 0xffffff, color: 0x2b5ce6 };
		}
	}

	onMount(() => {
		let vantaEffect: { destroy: () => void } | null = null;
		let callId = 0;

		const unsubscribe = themeStore.subscribe(async (theme) => {
			// Cancel any in-flight initialization from a previous subscriber call
			const myId = ++callId;
			vantaEffect?.destroy();
			vantaEffect = null;

			const THREE = await import('three');
			if (myId !== callId) return;

			const colors = getColors(theme, effect);

			if (effect === 'GLOBE') {
				const { default: GLOBE } = await import('vanta/dist/vanta.globe.min');
				if (myId !== callId) return;
				vantaEffect = GLOBE({
					el: containerEl,
					THREE,
					...colors,
					mouseControls: interactive,
					touchControls: interactive,
					gyroControls: false
				});
			} else {
				const { default: NET } = await import('vanta/dist/vanta.net.min');
				if (myId !== callId) return;
				vantaEffect = NET({
					el: containerEl,
					THREE,
					...colors,
					mouseControls: false,
					touchControls: false,
					gyroControls: false,
					...(size !== undefined && { size }),
					...(maxDistance !== undefined && { maxDistance })
				});
			}
		});

		return () => {
			unsubscribe();
			vantaEffect?.destroy();
		};
	});
</script>

<div
	bind:this={containerEl}
	class="vanta-container vanta-container--{effect.toLowerCase()}"
	style:opacity
	aria-hidden="true"
></div>

<style>
	.vanta-container {
		pointer-events: none;
	}

	.vanta-container--globe {
		width: 100%;
		height: 100%;
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.vanta-container--net {
		position: fixed;
		inset: 0;
		z-index: -1;
		pointer-events: none;
	}
</style>
