<!--
	FlowField — the site's one background signature.

	Two mirrored fans of long, flowing curves that cross the whole width of the
	band they sit behind. Descended from KokonutUI's `backgrounds/background-paths`
	(MIT, @dorianbaffier), but drawn to be seen: the strokes carry the accent
	rather than a hairline of it, they ramp from thin and quiet at the back of the
	set to thick and bright at the front, and the primary group carries a soft
	glow. It replaced three separate treatments — a slab composition on the home
	hero, a beams canvas on the About bio and the blog masthead, and a 44-path
	field on the 404 — with one thing the site can be recognised by.

	**The vignette is what keeps it a background.** A radial mask fades the field
	out towards every edge, so the lines never run into the page's own edges or
	compete with the nav, and the caller lays a soft wash of `--bg` behind its
	text so the headline keeps its contrast over the busiest part of the weave.

	**Geometry is pure and testable.** `./flowField.ts` builds the paths; nothing
	here computes a curve. The opacity ramp is a CSS variable rather than a baked
	number so the light and dark ramps are one declaration each, and so the field
	re-tints with the theme switch without rebuilding anything.

	**Motion, in three beats.** The lines draw themselves in on mount, then drift
	forever at two speeds — the sparse primary curves slower than the secondary
	ones — under one gentle breath of opacity across the whole field. The loops
	are paused whenever the field is off screen or the tab is in the background;
	a page nobody is looking at should not be animating 36 paths.

	Under `prefers-reduced-motion` the markup is already the finished picture, so
	the only thing left to do is lift the pre-hide.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, easings, inView, markRevealed, reducedMotion, stagger } from '$lib/motion';
	import { cn } from '$lib/utils/cn';
	import { buildFlowField, FLOW_VIEW_BOX, type FlowIntensity } from './flowField';

	interface Props {
		/** `bold` behind the home headline; `soft` behind reading copy. */
		intensity?: FlowIntensity;
		class?: string;
	}

	let { intensity = 'bold', class: className = '' }: Props = $props();

	/** Draw-in: how long one line takes, and the gap between consecutive ones. */
	const DRAW_DURATION = 2.2;
	const DRAW_STAGGER = 0.04;
	/** Phase offset between neighbouring lines in the endless drift. */
	const DRIFT_STAGGER = 0.35;
	/** One breath of the whole field, in seconds. */
	const BREATHE_DURATION = 8;

	type Animation = ReturnType<typeof animate>;

	const sets = $derived(buildFlowField(intensity));

	let rootEl = $state<HTMLDivElement | undefined>();
	let breatheEl = $state<SVGGElement | undefined>();
	let primaryEl = $state<SVGGElement | undefined>();
	let secondaryEl = $state<SVGGElement | undefined>();

	/** The endless ones, which are what gets paused. Transients are not here. */
	let loops: Animation[] = [];
	/** Everything in flight, so unmounting mid-entrance stops it dead. */
	let running: Animation[] = [];
	let alive = true;

	/** Both have to be true for the loops to run. */
	let onScreen = false;
	let tabVisible = true;

	function track(animation: Animation): Animation {
		running.push(animation);
		return animation;
	}

	function paths(group: SVGGElement | undefined): SVGPathElement[] {
		return [...(group?.querySelectorAll('path') ?? [])];
	}

	/** Play or pause every loop to match the two visibility flags. */
	function syncLoops() {
		const shouldRun = alive && onScreen && tabVisible;
		for (const loop of loops) {
			if (shouldRun) loop.play();
			else loop.pause();
		}
	}

	function startLoops() {
		if (!alive) return;
		const ease = 'linear' as const;

		for (const group of [primaryEl, secondaryEl]) {
			const elements = paths(group);
			if (elements.length === 0) continue;
			// Every path in a layer shares its layer's period; the stagger only
			// offsets their phase, so the field never moves as one block.
			const duration = group === primaryEl ? sets.primary[0].duration : sets.secondary[0].duration;
			loops.push(
				track(
					animate(
						elements,
						{ pathOffset: [0, 1] },
						{ duration, ease, repeat: Infinity, delay: stagger(DRIFT_STAGGER) }
					)
				)
			);
		}

		if (breatheEl) {
			loops.push(
				track(
					animate(
						breatheEl,
						{ opacity: [0.7, 1, 0.7] },
						{ duration: BREATHE_DURATION, repeat: Infinity, ease: 'easeInOut' }
					)
				)
			);
		}

		syncLoops();
	}

	function handleVisibility() {
		tabVisible = document.visibilityState !== 'hidden';
		syncLoops();
	}

	onMount(() => {
		const root = rootEl;
		if (!root) return;

		if (reducedMotion()) {
			// The markup renders the finished field; nothing to animate.
			markRevealed([root]);
			return;
		}

		// This component owns its own entrance, so the stylesheet's 3s safety net
		// can stand down — firing it mid-fade would override the inline opacity.
		root.setAttribute('data-motion-ready', '');

		const ease = [...easings.outExpo] as [number, number, number, number];

		track(
			animate(
				root,
				{ opacity: [0, 1] },
				{ duration: 0.9, ease, onComplete: () => markRevealed([root]) }
			)
		);

		const all = [...paths(primaryEl), ...paths(secondaryEl)];
		const draw = track(
			animate(
				all,
				{ pathLength: [0, 1] },
				{ duration: DRAW_DURATION, ease, delay: stagger(DRAW_STAGGER) }
			)
		);

		void draw.finished.then(startLoops);

		const stopWatching = inView(root, () => {
			onScreen = true;
			syncLoops();
			return () => {
				onScreen = false;
				syncLoops();
			};
		});
		document.addEventListener('visibilitychange', handleVisibility);

		return () => {
			alive = false;
			stopWatching();
			document.removeEventListener('visibilitychange', handleVisibility);
			for (const animation of running) animation.stop();
			running = [];
			loops = [];
		};
	});
</script>

<div
	bind:this={rootEl}
	class={cn('flow-field', `flow-field--${intensity}`, className)}
	data-hero
	aria-hidden="true"
>
	<svg
		class="flow-field__svg"
		viewBox={FLOW_VIEW_BOX}
		preserveAspectRatio="none"
		fill="none"
		focusable="false"
	>
		<!-- One group for the breath, so it is one animation and not thirty-six. -->
		<g bind:this={breatheEl} class="flow-field__breathe">
			<!-- The glow lives on the group; a drop-shadow per path is 20 filters. -->
			<g bind:this={primaryEl} class="flow-field__layer flow-field__layer--primary">
				{#each sets.primary as path (path.id)}
					<path
						d={path.d}
						stroke-width={path.width}
						vector-effect="non-scaling-stroke"
						style="--t: {path.t}"
					/>
				{/each}
			</g>
			<g bind:this={secondaryEl} class="flow-field__layer flow-field__layer--secondary">
				{#each sets.secondary as path (path.id)}
					<path
						d={path.d}
						stroke-width={path.width}
						vector-effect="non-scaling-stroke"
						style="--t: {path.t}"
					/>
				{/each}
			</g>
		</g>
	</svg>
</div>

<style>
	.flow-field {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		/*
			The opacity ramp, as the two ends of a range the paths interpolate along
			with their own `--t`. Light mode runs quieter: the same stroke reads far
			louder over white than it does over black.
		*/
		--flow-from: 0.25;
		--flow-to: 0.75;
		/*
			The vignette. Without it the lines run into the nav, into the section
			below and into the page's own edges, and the field stops reading as
			depth behind the page and starts reading as a texture on top of it.

			The radii are percentages of the box, and a radial gradient measures them
			from its centre — so anything at or above 100% never reaches an edge and
			the lines get cut off square instead of fading out. 85%/95% puts the
			left and right edges around 60% of the way down the ramp, which is the
			point at which a line leaves the frame rather than stopping at it.
		*/
		--flow-vignette: radial-gradient(85% 95% at 50% 45%, black 30%, transparent 100%);
		-webkit-mask-image: var(--flow-vignette);
		mask-image: var(--flow-vignette);
	}

	:global([data-theme='light']) .flow-field {
		--flow-from: 0.2;
		--flow-to: 0.6;
	}

	/* Behind reading copy rather than a headline: the same field, half as loud. */
	.flow-field--soft {
		opacity: 0.5;
	}

	.flow-field__svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.flow-field__layer path {
		fill: none;
		/* `--t` is 0 at the back of the set and 1 at the front. */
		stroke-opacity: calc(var(--flow-from) + (var(--flow-to) - var(--flow-from)) * var(--t));
	}

	/*
		The primary curves carry the accent pushed towards the text colour, so the
		field reads as light rather than as a second brand colour; the secondary
		ones are the accent itself, which is what puts the warmth back in.
	*/
	.flow-field__layer--primary path {
		stroke: color-mix(in srgb, var(--accent) 85%, var(--text));
	}

	.flow-field__layer--primary {
		filter: drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 60%, transparent));
	}

	.flow-field__layer--secondary path {
		stroke: var(--accent);
	}
</style>
