<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { cursorStore } from '$lib/stores/cursor';

	let cursorEl: HTMLDivElement;
	let isDesktop = false;

	const { isVisible, variant } = cursorStore;

	onMount(() => {
		isDesktop = window.matchMedia('(pointer: fine)').matches;
		if (!isDesktop) return;

		cursorStore.show();

		const handleMove = (e: MouseEvent) => {
			cursorStore.setPosition(e.clientX, e.clientY);
			gsap.to(cursorEl, {
				x: e.clientX,
				y: e.clientY,
				duration: 0.06,
				ease: 'none'
			});
		};

		window.addEventListener('mousemove', handleMove, { passive: true });
		return () => {
			window.removeEventListener('mousemove', handleMove);
		};
	});
</script>

{#if $isVisible}
	<div
		bind:this={cursorEl}
		class="cursor cursor--{$variant}"
		aria-hidden="true"
	></div>
{/if}

<style>
	.cursor {
		position: fixed;
		top: 0;
		left: 0;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--accent);
		pointer-events: none;
		z-index: 9999;
		transform: translate(-50%, -50%);
		will-change: transform;
		transition:
			width 0.3s var(--ease-out-expo),
			height 0.3s var(--ease-out-expo),
			background 0.3s var(--ease-out-expo),
			border 0.3s var(--ease-out-expo),
			opacity 0.3s;
	}

	.cursor--hover {
		width: 40px;
		height: 40px;
		background: transparent;
		border: 1.5px solid var(--accent);
	}

	.cursor--text {
		width: 4px;
		height: 32px;
		border-radius: 2px;
		background: var(--accent);
	}

	.cursor--drag {
		width: 60px;
		height: 60px;
		background: var(--accent-dim);
		border: 1.5px solid var(--accent);
	}

	.cursor--hidden {
		opacity: 0;
	}
</style>
