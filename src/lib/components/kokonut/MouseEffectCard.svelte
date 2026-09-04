<!--
	MouseEffectCard — KokonutUI `cards/mouse-effect-card`.

	A card over a field of dots that scatter away from the cursor and brighten as
	it approaches. Used once, for the "Based in Edmonton" tile.

	Two decisions keep it cheap enough to justify:

	  - `pointermove` only records a coordinate. All the work happens in one
	    `requestAnimationFrame` loop shared by every dot, which stops as soon as
	    the field has settled and restarts when the pointer moves again. Handing
	    each dot its own `animate()` call per move would allocate hundreds of
	    animations a second.
	  - The loop integrates a fixed-timestep spring and writes `transform`
	    directly. The ambient opacity pulse is a CSS animation with a staggered
	    delay, so it costs nothing and keeps running while the loop is asleep.

	The field is focusable: arrow keys drive a virtual pointer, which is the only
	way a keyboard user gets the effect at all. Pointer tracking lives on the card
	rather than the field, so the field can stay inert to the pointer and the card's
	own content keeps its links and text selection.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { reducedMotion } from '$lib/motion';
	import { generateDots, respondToPointer, type Dot } from './mouseEffectDots';
	import { cn } from '$lib/utils/cn';

	interface Props {
		/** Dot diameter in px. */
		dotSize?: number;
		/** Grid pitch in px. */
		dotSpacing?: number;
		/** How far the pointer's push reaches, in px. */
		repulsionRadius?: number;
		/** Maximum displacement in px, at the pointer itself. */
		repulsionStrength?: number;
		class?: string;
		children: Snippet;
	}

	let {
		dotSize = 2,
		dotSpacing = 16,
		repulsionRadius = 80,
		repulsionStrength = 20,
		class: className = '',
		children
	}: Props = $props();

	/** Matches the original's SPRING: stiffness 300, damping 30, mass 0.5. */
	const STIFFNESS = 300;
	const DAMPING = 30;
	const MASS = 0.5;
	/**
	 * A fixed step rather than the measured frame delta: the field is decorative,
	 * a dropped frame should slow it rather than teleport it, and a fixed step
	 * makes the settle test deterministic.
	 */
	const TIMESTEP = 1 / 60;
	/** Below this, in px and px/s, a dot is treated as parked. */
	const SETTLED = 0.01;
	/** Arrow keys move the virtual pointer by this fraction of the short side. */
	const KEY_STEP = 0.2;

	interface Offset {
		x: number;
		y: number;
		vx: number;
		vy: number;
	}

	let fieldEl = $state<HTMLDivElement | undefined>();
	let dots = $state<Dot[]>([]);

	/** Live DOM handles and physics state, deliberately outside the rune graph. */
	let dotEls: HTMLElement[] = [];
	let offsets: Offset[] = [];
	let pointer: { x: number; y: number } | null = null;
	let size = { width: 0, height: 0 };
	let frame: number | undefined;

	function measure() {
		if (!fieldEl) return;
		const rect = fieldEl.getBoundingClientRect();
		size = { width: rect.width, height: rect.height };
		dots = generateDots(size.width, size.height, dotSpacing);
	}

	// Collect the rendered dots once per regeneration instead of binding each
	// one: `$effect` runs after the DOM is flushed, so the query is accurate and
	// no stale handles survive a resize.
	$effect(() => {
		void dots;
		dotEls = fieldEl
			? Array.from(fieldEl.querySelectorAll<HTMLElement>('.mouse-effect-card__dot'))
			: [];
		offsets = dots.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }));
	});

	/** Semi-implicit Euler on one axis. Overdamped, so it never overshoots. */
	function integrate(position: number, velocity: number, target: number): [number, number] {
		const acceleration = (-STIFFNESS * (position - target) - DAMPING * velocity) / MASS;
		const nextVelocity = velocity + acceleration * TIMESTEP;
		return [position + nextVelocity * TIMESTEP, nextVelocity];
	}

	function round(value: number): number {
		return Math.round(value * 100) / 100;
	}

	function step() {
		frame = undefined;
		let moving = false;

		for (let i = 0; i < dots.length; i += 1) {
			const dot = dots[i];
			const offset = offsets[i];
			const element = dotEls[i];
			if (!dot || !offset || !element) continue;

			const target = pointer
				? respondToPointer(dot, pointer.x, pointer.y, repulsionRadius, repulsionStrength)
				: { x: 0, y: 0, boost: 0 };

			const settledX = Math.abs(offset.x - target.x) < SETTLED && Math.abs(offset.vx) < SETTLED;
			const settledY = Math.abs(offset.y - target.y) < SETTLED && Math.abs(offset.vy) < SETTLED;

			if (settledX) {
				offset.x = target.x;
				offset.vx = 0;
			} else {
				[offset.x, offset.vx] = integrate(offset.x, offset.vx, target.x);
				moving = true;
			}

			if (settledY) {
				offset.y = target.y;
				offset.vy = 0;
			} else {
				[offset.y, offset.vy] = integrate(offset.y, offset.vy, target.y);
				moving = true;
			}

			element.style.transform = `translate(${round(offset.x)}px, ${round(offset.y)}px)`;
			// The pulse keyframes multiply this, so raising it brightens the dot
			// without fighting the running CSS animation.
			element.style.setProperty('--dot-opacity', String(round(dot.opacity + target.boost)));
		}

		if (moving) frame = requestAnimationFrame(step);
	}

	function wake() {
		if (reducedMotion() || frame !== undefined) return;
		frame = requestAnimationFrame(step);
	}

	function setPointer(next: { x: number; y: number } | null) {
		pointer = next;
		wake();
	}

	function handlePointerMove(event: PointerEvent) {
		if (!fieldEl) return;
		const rect = fieldEl.getBoundingClientRect();
		setPointer({ x: event.clientX - rect.left, y: event.clientY - rect.top });
	}

	function handleFocus() {
		setPointer({ x: size.width / 2, y: size.height / 2 });
	}

	function handleKeydown(event: KeyboardEvent) {
		const distance = Math.min(size.width, size.height) * KEY_STEP;
		const from = pointer ?? { x: size.width / 2, y: size.height / 2 };
		let { x, y } = from;
		switch (event.key) {
			case 'ArrowLeft':
				x -= distance;
				break;
			case 'ArrowRight':
				x += distance;
				break;
			case 'ArrowUp':
				y -= distance;
				break;
			case 'ArrowDown':
				y += distance;
				break;
			default:
				return;
		}
		event.preventDefault();
		setPointer({
			x: Math.min(Math.max(x, 0), size.width),
			y: Math.min(Math.max(y, 0), size.height)
		});
	}

	onMount(() => {
		measure();
		const observer = new ResizeObserver(() => measure());
		observer.observe(fieldEl as Element);
		return () => {
			observer.disconnect();
			if (frame !== undefined) cancelAnimationFrame(frame);
			frame = undefined;
		};
	});
</script>

<!--
	The card tracks the pointer only to drive the decorative field beneath it —
	there is no action here for a keyboard user to be denied, and the field below
	carries the keyboard equivalent.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class={cn('mouse-effect-card', className)}
	onpointermove={handlePointerMove}
	onpointerleave={() => setPointer(null)}
>
	<!--
		A decorative graphic that happens to respond to input. `role="img"` gives
		it a name and makes its hundreds of child spans presentational; the
		tabindex is what lets a keyboard user drive the virtual pointer, which is
		the whole point of the component.
	-->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		bind:this={fieldEl}
		class="mouse-effect-card__field"
		role="img"
		aria-label="Dot field that scatters away from the pointer"
		tabindex="0"
		style="--dot-size: {dotSize}px"
		onfocus={handleFocus}
		onblur={() => setPointer(null)}
		onkeydown={handleKeydown}
	>
		{#each dots as dot, index (index)}
			<span
				class="mouse-effect-card__dot"
				style="left: {dot.x}px; top: {dot.y}px; --dot-opacity: {dot.opacity}; animation-delay: {(
					(index % 75) *
					0.02
				).toFixed(2)}s"
			></span>
		{/each}
	</div>
	<div class="mouse-effect-card__content">{@render children()}</div>
</div>

<style>
	.mouse-effect-card {
		position: relative;
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		background-color: var(--surface);
		overflow: hidden;
	}

	.mouse-effect-card__field {
		position: absolute;
		inset: 0;
		/* The card above tracks the pointer; the field only has to be focusable,
		   which `pointer-events: none` does not prevent. */
		pointer-events: none;
	}

	.mouse-effect-card__field:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}

	.mouse-effect-card__dot {
		position: absolute;
		width: var(--dot-size, 2px);
		height: var(--dot-size, 2px);
		margin-inline-start: calc(var(--dot-size, 2px) / -2);
		margin-block-start: calc(var(--dot-size, 2px) / -2);
		border-radius: var(--radius-full);
		background-color: var(--accent);
		opacity: var(--dot-opacity, 0.3);
		will-change: transform;
		/* The staggered ambient breath. Each dot's delay is set inline. */
		animation: dot-pulse 1.6s ease-in-out infinite alternate;
	}

	@keyframes dot-pulse {
		from {
			opacity: calc(var(--dot-opacity, 0.3) * 0.5);
		}
		to {
			opacity: calc(var(--dot-opacity, 0.3) * 1.5);
		}
	}

	.mouse-effect-card__content {
		position: relative;
		padding: 1.5rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.mouse-effect-card__dot {
			animation: none;
		}
	}
</style>
