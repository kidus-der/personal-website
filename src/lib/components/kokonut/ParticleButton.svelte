<!--
	ParticleButton — KokonutUI `buttons/particle-button`.

	Clicking throws a short burst of accent dots outward from the button's centre.
	Used for the contact/subscribe submit, where the burst is the "it went" signal.

	The particles live in a `position: fixed` layer pinned to the button's viewport
	centre rather than inside the button itself, so the burst is never clipped by
	the button's `overflow` or its stacking context.

	Press feedback is CSS `:active` (see the note in the task brief: `use:press`
	does not exist yet), which also means it costs nothing under reduced motion.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Action } from 'svelte/action';
	import { onDestroy } from 'svelte';
	import { animate, reducedMotion } from '$lib/motion';

	interface Props {
		children: Snippet;
		onclick?: (event: MouseEvent) => void;
		type?: 'button' | 'submit';
		disabled?: boolean;
		particleCount?: number;
		successDuration?: number;
		class?: string;
	}

	let {
		children,
		onclick,
		type = 'button',
		disabled = false,
		particleCount = 6,
		successDuration = 1000,
		class: className = ''
	}: Props = $props();

	/** Horizontal spread between adjacent particles, in px. */
	const SPREAD = 40;
	const JITTER = 20;
	const RISE_MIN = 40;
	const RISE_RANGE = 80;
	const FLIGHT_DURATION = 0.6;
	const FLIGHT_STAGGER = 0.05;

	interface Particle {
		id: number;
		/** Horizontal travel in px; fans out from the centre. */
		x: number;
		/** Vertical travel in px; always negative so the burst rises. */
		y: number;
	}

	let particles = $state<Particle[]>([]);
	let origin = $state({ x: 0, y: 0 });

	let button: HTMLButtonElement;
	let clearTimer: ReturnType<typeof setTimeout> | undefined;
	let nextId = 0;

	function burst() {
		const rect = button.getBoundingClientRect();
		origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

		const centre = (particleCount - 1) / 2;
		particles = Array.from({ length: particleCount }, (_, i) => ({
			id: nextId++,
			x: (i - centre) * SPREAD + (Math.random() - 0.5) * JITTER,
			y: -(Math.random() * RISE_RANGE + RISE_MIN)
		}));

		// A second click mid-burst restarts the window instead of cutting it short.
		if (clearTimer !== undefined) clearTimeout(clearTimer);
		clearTimer = setTimeout(() => {
			particles = [];
			clearTimer = undefined;
		}, successDuration);
	}

	function handleClick(event: MouseEvent) {
		onclick?.(event);
		if (reducedMotion()) return;
		burst();
	}

	/**
	 * Launches one particle as it mounts. An action rather than an `$effect` over
	 * a `bind:this` array: each span animates exactly once, at the moment it
	 * exists, with no reactive re-entry.
	 */
	const launch: Action<HTMLElement, { particle: Particle; index: number }> = (node, params) => {
		const animation = animate(
			node,
			{
				x: [0, params.particle.x],
				y: [0, params.particle.y],
				scale: [0, 1, 0],
				opacity: [1, 1, 0]
			},
			{ duration: FLIGHT_DURATION, delay: params.index * FLIGHT_STAGGER, ease: 'easeOut' }
		);
		return { destroy: () => animation.stop() };
	};

	onDestroy(() => {
		if (clearTimer !== undefined) clearTimeout(clearTimer);
		clearTimer = undefined;
	});
</script>

<button
	bind:this={button}
	{type}
	{disabled}
	class="particle-button {className}"
	onclick={handleClick}
>
	{@render children()}
</button>

{#if particles.length > 0}
	<div class="particle-layer" aria-hidden="true" style="left: {origin.x}px; top: {origin.y}px">
		{#each particles as particle, i (particle.id)}
			<span class="particle" aria-hidden="true" use:launch={{ particle, index: i }}></span>
		{/each}
	</div>
{/if}

<style>
	.particle-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-family: var(--font-body);
		cursor: pointer;
		transition: transform 120ms var(--ease-out-expo);
	}

	.particle-button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.particle-button:active:not(:disabled) {
		transform: scale(0.95);
	}

	.particle-layer {
		position: fixed;
		width: 0;
		height: 0;
		pointer-events: none;
		z-index: 60;
	}

	.particle {
		position: absolute;
		width: 4px;
		height: 4px;
		border-radius: var(--radius-full);
		background-color: var(--accent);
	}

	@media (prefers-reduced-motion: reduce) {
		.particle-button {
			transition: none;
		}

		.particle-button:active:not(:disabled) {
			transform: none;
		}
	}
</style>
