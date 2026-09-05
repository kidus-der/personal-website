<!--
	HeroArt — the hero's right column.

	Five translucent slabs strung along a loose diagonal over two slow aurora
	washes. It is a picture, not a diagram: it says nothing about the work, has
	no labels, numbers or readings, and exists to give the headline something
	quiet to sit beside. KokonutUI's Shapes Hero (MIT, @dorianbaffier) is the
	ancestor; the composition, palette and timing are ours.

	Two things keep it honest:

	  - The composition lives in `heroArt.ts` as percentages, so the same five
	    shapes hold at the tall desktop column and the short mobile band, and the
	    layout can be tested without a browser.
	  - The markup renders the shapes *at rest*. A reader with no JavaScript sees
	    the finished picture; the entrance is applied on mount, from the start
	    state, which is safe because the root is pre-hidden by the `data-hero`
	    rule until the hero's own sequence fades it in.

	Cost: two aurora drifts plus five floats, seven looping animations in all,
	against the 400 pulsing dots and 74 sweeping paths this replaced.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, reducedMotion } from '$lib/motion';
	import { cn } from '$lib/utils/cn';
	import { ENTRANCE_DROP, ENTRANCE_ROTATE_OFFSET, HERO_SHAPES } from './heroArt';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	/** The original's entrance curve — a long, soft settle rather than a bounce. */
	const ENTRANCE_EASE = [0.23, 0.86, 0.39, 0.96] as [number, number, number, number];
	const ENTRANCE_DURATION = 2.4;
	/** The resting breath, in px and seconds. */
	const FLOAT_TRAVEL = 15;
	const FLOAT_DURATION = 12;
	/** Aurora drift: percent of the container, and the period of one sweep. */
	const AURORA_DRIFT = 6;
	const AURORA_DURATION = 18;

	type Animation = ReturnType<typeof animate>;

	let shapeEls = $state<HTMLElement[]>([]);
	let auroraEls = $state<HTMLElement[]>([]);

	/** Everything in flight, so unmounting mid-entrance stops it dead. */
	let running: Animation[] = [];
	let alive = true;

	function track(animation: Animation): Animation {
		running.push(animation);
		return animation;
	}

	function driftAurora() {
		auroraEls.forEach((element, index) => {
			// The two layers drift in opposite directions, so the wash breathes
			// rather than sliding as one block.
			const direction = index === 0 ? 1 : -1;
			track(
				animate(
					element,
					{ x: [0, AURORA_DRIFT * direction], y: [0, AURORA_DRIFT * -direction] },
					{
						duration: AURORA_DURATION,
						repeat: Infinity,
						repeatType: 'mirror',
						ease: 'easeInOut'
					}
				)
			);
		});
	}

	async function enterShapes() {
		const entrances = shapeEls.map((element, index) => {
			const shape = HERO_SHAPES[index];
			return track(
				animate(
					element,
					{
						y: [ENTRANCE_DROP, 0],
						opacity: [0, 1],
						rotate: [shape.rotate + ENTRANCE_ROTATE_OFFSET, shape.rotate]
					},
					{ duration: ENTRANCE_DURATION, delay: shape.delay, ease: ENTRANCE_EASE }
				)
			);
		});

		// Each slab starts breathing as it lands, not when the last one does:
		// the composition is never all moving in step.
		await Promise.all(
			entrances.map(async (entrance, index) => {
				await entrance.finished;
				const element = shapeEls[index];
				if (!alive || !element) return;
				track(
					animate(
						element,
						{ y: [0, FLOAT_TRAVEL, 0] },
						{ duration: FLOAT_DURATION, repeat: Infinity, ease: 'easeInOut' }
					)
				);
			})
		);
	}

	onMount(() => {
		// Reduced motion keeps the picture exactly as the markup renders it.
		if (!reducedMotion()) {
			driftAurora();
			void enterShapes();
		}

		return () => {
			alive = false;
			for (const animation of running) animation.stop();
			running = [];
		};
	});
</script>

<div class={cn('hero-art', className)} data-hero aria-hidden="true">
	<div class="hero-art__aurora hero-art__aurora--warm" bind:this={auroraEls[0]}></div>
	<div class="hero-art__aurora hero-art__aurora--cool" bind:this={auroraEls[1]}></div>

	{#each HERO_SHAPES as shape, index (index)}
		<div
			class={cn('hero-art__shape', `hero-art__shape--${shape.color}`)}
			bind:this={shapeEls[index]}
			style:width="{shape.width}%"
			style:height="{shape.height}%"
			style:left="{shape.x}%"
			style:top="{shape.y}%"
			style:transform="rotate({shape.rotate}deg)"
		></div>
	{/each}
</div>

<style>
	.hero-art {
		position: relative;
		width: 100%;
		/*
			The cap and the centring belong here, not on the caller: a class handed
			to a component is not touched by the caller's style scoping, so a
			`.hero__art` rule over in `Hero.svelte` would compile to a selector that
			matches nothing. Below the 960px breakpoint the art is a full-width band
			under the copy, and without the cap a tablet gets a very wide, very short
			one.
		*/
		max-width: 30rem;
		margin-inline: auto;
		height: 260px;
		overflow: hidden;
		border-radius: var(--radius-card);
		/*
			No border, no surface — and the clip is dissolved rather than drawn. The
			aurora fills the box, so a hard `overflow: hidden` edge put a visible
			rectangle around the art and it read as a card. The vignette fades the
			whole composition out towards the edges instead, which is what lets it
			float over the page.
		*/
		--art-vignette: radial-gradient(ellipse 66% 68% at 50% 48%, #000 34%, transparent 100%);
		-webkit-mask-image: var(--art-vignette);
		mask-image: var(--art-vignette);
	}

	@media (min-width: 960px) {
		.hero-art {
			height: auto;
			aspect-ratio: 4 / 5;
			max-height: 560px;
		}
	}

	/* ---- Layer 1: the aurora wash ------------------------------------- */

	.hero-art__aurora {
		position: absolute;
		/* Oversized so the drift never pulls an edge into view. */
		inset: -30%;
		filter: blur(60px);
		pointer-events: none;
		will-change: transform;
	}

	.hero-art__aurora--warm {
		background: radial-gradient(
			circle at 32% 26%,
			color-mix(in srgb, var(--accent) 22%, transparent),
			transparent 62%
		);
	}

	.hero-art__aurora--cool {
		background: radial-gradient(
			circle at 68% 76%,
			color-mix(in srgb, var(--ember) 40%, transparent),
			transparent 62%
		);
	}

	/*
		Light mode's `--ember` is a pale sky tint that all but vanishes over white,
		so the cool wash borrows the chart blue instead. The warm wash needs no
		override: `--accent` is already the blue the light theme uses.
	*/
	:global([data-theme='light']) .hero-art__aurora--cool {
		background: radial-gradient(
			circle at 68% 76%,
			color-mix(in srgb, var(--chart-2) 18%, transparent),
			transparent 62%
		);
	}

	/* ---- Layer 2: the glass slabs ------------------------------------- */

	.hero-art__shape {
		position: absolute;
		border-radius: var(--radius-full);
		background: linear-gradient(
			to right,
			color-mix(in srgb, var(--shape-color) 28%, transparent),
			transparent
		);
		border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		box-shadow: 0 8px 32px color-mix(in srgb, var(--accent) 12%, transparent);
		will-change: transform;
	}

	/* The light catching the top-left curve of the glass. */
	.hero-art__shape::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: radial-gradient(circle at 22% 18%, rgb(255 255 255 / 0.1), transparent 55%);
	}

	.hero-art__shape--accent {
		--shape-color: var(--accent);
	}
	.hero-art__shape--accent-strong {
		--shape-color: var(--accent-strong);
	}
	.hero-art__shape--chart-2 {
		--shape-color: var(--chart-2);
	}
	.hero-art__shape--chart-3 {
		--shape-color: var(--chart-3);
	}
	/*
		The neutral slab. Dark mode's `--ember` is a near-black brown, which reads
		as smoked glass over the black page; light mode swaps in the raised surface
		for the same effect the other way up.
	*/
	.hero-art__shape--ember {
		--shape-color: var(--ember);
	}
	:global([data-theme='light']) .hero-art__shape--ember {
		--shape-color: var(--surface-raised);
	}
</style>
