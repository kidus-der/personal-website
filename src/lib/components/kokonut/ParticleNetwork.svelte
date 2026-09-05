<!--
	ParticleNetwork — the site's one background signature.

	A few thousand nodes ride an invisible noise current across the whole band
	they sit behind, and every frame the ones that drift within 26px of each
	other are joined by a hairline. Nothing is choreographed: the links are a
	consequence of where the particles happen to be, so the field is constantly
	assembling and dissolving little constellations. It reads as a system
	thinking rather than as decoration moving.

	It descends from the "particle streams" option, with the two changes the
	owner asked for. The streams were slowed from 1.6px a frame to 0.55, so a
	particle reads as a thing sitting in space rather than as a smear; and the
	particles became nodes — a sized dot with a glow and links to its neighbours
	— rather than the bare 1.6px stroke the reference drew. The density is
	unchanged at 2400.

	**One canvas, not two thousand elements.** The whole field is a single
	element and a single `requestAnimationFrame` loop, which is why a background
	this dense costs less than the 36-path SVG it replaced: `document.getAnimations()`
	on a settled `/` counts it as zero.

	**Where the cost actually is, and what pays for it.** The naive version of
	this is 2.9M pairwise distance checks and 7000 `stroke()` calls a frame.
	Three things keep it under budget:

	- neighbours come from `SpatialHash` (`./particleNetwork.ts`), so the search
	  is linear in the particle count rather than quadratic;
	- particle state lives in `Float32Array`s, not an array of objects, so a
	  frame is a walk over flat memory with nothing for the GC to collect;
	- every link and every node is batched by the colour it is drawn in. Links
	  are bucketed into five alpha bands and each band is one path and one
	  `stroke()`; nodes are six `fill()`s for the whole field. The glow is a
	  pre-rendered sprite `drawImage`d for one particle in four, because 2400
	  `createRadialGradient` calls a frame is on its own more expensive than
	  everything else here put together.

	**Colour comes from the tokens, not from constants.** The accent, the warm
	minority, the link colour and the trail wash are all read off `<html>` on
	mount and re-read when `data-theme` changes, so the field re-tints with the
	theme switch — and the trail fades towards `--bg`, which is what makes light
	mode fade to white instead of to black.

	**It stops when nobody is looking.** The loop is torn down whenever the band
	is off screen or the tab is in the background. Under `prefers-reduced-motion`
	it simulates sixty frames once and stops, which gives the same composition
	with no motion at all.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, easings, inView, markRevealed, reducedMotion } from '$lib/motion';
	import { cn } from '$lib/utils/cn';
	import {
		CELL_SIZE,
		GLOW_EVERY,
		HUB_EVERY,
		HUB_LINK_RADIUS,
		HUB_RADIUS,
		LIFESPAN,
		LINK_RADIUS,
		NODE_RADIUS,
		NOISE_DRIFT,
		NOISE_SCALE,
		SpatialHash,
		STEP,
		TRAIL_ALPHA,
		WARM_SCALE,
		WARM_THRESHOLD,
		createNoise,
		isLightBackground,
		parseColor,
		particleCount,
		rgba,
		type NetworkIntensity,
		type RGB
	} from './particleNetwork';

	interface Props {
		/** `bold` behind the home headline; `soft` behind reading copy. */
		intensity?: NetworkIntensity;
		class?: string;
	}

	let { intensity = 'bold', class: className = '' }: Props = $props();

	const TAU = Math.PI * 2;

	/** Bits packed into `flags`, one byte per particle. */
	const WARM = 1;
	const HUB = 2;
	const GLOW = 4;
	const BRIGHT = 8;

	/** Radius, in CSS pixels, of the pre-rendered glow sprite. */
	const GLOW_RADIUS = 6;

	/** Alpha bands the links are bucketed into. Five reads as a continuous ramp
	 * while costing five `stroke()` calls a frame instead of seven thousand. */
	const LINK_BANDS = 5;

	/** Frames simulated for the still composition under reduced motion. */
	const STATIC_FRAMES = 60;

	/** Nominal milliseconds per frame, for the reduced-motion simulation. */
	const FRAME_MS = 16.7;

	/**
	 * Alphas, per surface.
	 *
	 * The same hairline that is a whisper on black is a scratch on white, so the
	 * two surfaces get their own numbers rather than one set and an opacity.
	 * `linkMin`/`linkMax` are the ends of the distance falloff: a link at the far
	 * edge of the radius sits near `linkMin`, which is the 6–10% "far background"
	 * the design calls for.
	 */
	const ALPHAS = {
		dark: { node: 0.9, nodeDim: 0.5, hub: 1, linkMin: 0.05, linkMax: 0.22, hubLink: 0.22 },
		light: { node: 0.64, nodeDim: 0.32, hub: 0.8, linkMin: 0.05, linkMax: 0.15, hubLink: 0.15 }
	} as const;

	/** Used when a token cannot be read — the dark theme's own values. */
	const FALLBACK = {
		accent: [239, 88, 36] as RGB,
		warm: [245, 158, 11] as RGB,
		text: [244, 244, 245] as RGB,
		bg: [0, 0, 0] as RGB
	};

	let rootEl = $state<HTMLDivElement | undefined>();
	let canvasEl = $state<HTMLCanvasElement | undefined>();

	let ctx: CanvasRenderingContext2D | null = null;
	const noise = createNoise(1);
	const hash = new SpatialHash(CELL_SIZE);

	/** Particle state, as parallel typed arrays rather than objects. */
	let xs = new Float32Array(0);
	let ys = new Float32Array(0);
	let life = new Float32Array(0);
	let radii = new Float32Array(0);
	let flags = new Uint8Array(0);
	let count = 0;

	/** Link segments for the current frame, four floats each, one buffer per band. */
	const linkSegments: Float32Array[] = Array.from(
		{ length: LINK_BANDS },
		() => new Float32Array(4096)
	);
	const linkCounts = new Int32Array(LINK_BANDS);
	let hubSegments = new Float32Array(2048);
	let hubCount = 0;
	/** Scratch for one `SpatialHash.query`. Reused, never reallocated per frame. */
	const neighbours = new Int32Array(512);

	/** CSS pixel size of the canvas, and the device ratio it is backed at. */
	let width = 0;
	let height = 0;
	let dpr = 1;

	/** Everything the paint reads, recomputed only when the theme changes. */
	let trailStyle = '';
	let bgStyle = '';
	let linkStyles: string[] = [];
	let hubLinkStyle = '';
	let nodeStyles = { accent: '', accentDim: '', warm: '', warmDim: '', hub: '', hubWarm: '' };
	let glowAccent: HTMLCanvasElement | null = null;
	let glowWarm: HTMLCanvasElement | null = null;

	let rafId = 0;
	let alive = true;
	let onScreen = false;
	let tabVisible = true;

	/**
	 * A radial-gradient dot baked into its own canvas once.
	 *
	 * Rendered at device resolution and drawn back at its CSS size, so it stays
	 * crisp on a retina screen without the frame loop ever touching a gradient.
	 * Returns `null` where no 2D context is available (jsdom), and the glow pass
	 * simply does not run.
	 */
	function createGlowSprite(color: RGB): HTMLCanvasElement | null {
		const size = Math.max(1, Math.ceil(GLOW_RADIUS * 2 * dpr));
		const sprite = document.createElement('canvas');
		sprite.width = size;
		sprite.height = size;
		const spriteCtx = sprite.getContext('2d');
		if (!spriteCtx) return null;

		const mid = size / 2;
		const gradient = spriteCtx.createRadialGradient(mid, mid, 0, mid, mid, mid);
		gradient.addColorStop(0, rgba(color, 0.34));
		gradient.addColorStop(0.45, rgba(color, 0.1));
		gradient.addColorStop(1, rgba(color, 0));
		spriteCtx.fillStyle = gradient;
		spriteCtx.fillRect(0, 0, size, size);
		return sprite;
	}

	/** Read the tokens off `<html>` and precompute every style string the paint uses. */
	function readTheme() {
		const styles = getComputedStyle(document.documentElement);
		const accent = parseColor(styles.getPropertyValue('--accent'), FALLBACK.accent);
		const warm = parseColor(styles.getPropertyValue('--chart-2'), FALLBACK.warm);
		const text = parseColor(styles.getPropertyValue('--text'), FALLBACK.text);
		const bg = parseColor(styles.getPropertyValue('--bg'), FALLBACK.bg);
		const a = isLightBackground(bg) ? ALPHAS.light : ALPHAS.dark;

		trailStyle = rgba(bg, TRAIL_ALPHA);
		bgStyle = rgba(bg, 1);
		linkStyles = Array.from({ length: LINK_BANDS }, (_, band) =>
			rgba(text, a.linkMin + ((a.linkMax - a.linkMin) * (band + 0.5)) / LINK_BANDS)
		);
		hubLinkStyle = rgba(accent, a.hubLink);
		nodeStyles = {
			accent: rgba(accent, a.node),
			accentDim: rgba(accent, a.nodeDim),
			warm: rgba(warm, a.node),
			warmDim: rgba(warm, a.nodeDim),
			hub: rgba(accent, a.hub),
			hubWarm: rgba(warm, a.hub)
		};
		glowAccent = createGlowSprite(accent);
		glowWarm = createGlowSprite(warm);
	}

	/** Place particle `i` somewhere new, and roll its per-particle character. */
	function spawn(index: number) {
		const x = Math.random() * width;
		const y = Math.random() * height;
		xs[index] = x;
		ys[index] = y;
		life[index] = LIFESPAN.min + Math.random() * (LIFESPAN.max - LIFESPAN.min);

		const isHub = index % HUB_EVERY === 0;
		const radius = isHub
			? HUB_RADIUS
			: NODE_RADIUS.min + Math.random() * (NODE_RADIUS.max - NODE_RADIUS.min);
		radii[index] = radius;

		let bits = 0;
		// The warm minority is picked by a second, coarser noise field — the same
		// way the reference did it, so warmth arrives in drifts rather than as
		// evenly-scattered confetti.
		if (noise(x * WARM_SCALE, y * WARM_SCALE) > WARM_THRESHOLD) bits |= WARM;
		if (isHub) bits |= HUB | GLOW;
		else if (index % GLOW_EVERY === 0) bits |= GLOW;
		if (!isHub && radius >= (NODE_RADIUS.min + NODE_RADIUS.max) / 2) bits |= BRIGHT;
		flags[index] = bits;
	}

	/** Allocate (if needed) and fill the particle arrays for the current box. */
	function seed() {
		count = particleCount(intensity, window.innerWidth);
		if (xs.length < count) {
			xs = new Float32Array(count);
			ys = new Float32Array(count);
			life = new Float32Array(count);
			radii = new Float32Array(count);
			flags = new Uint8Array(count);
		}
		for (let i = 0; i < count; i += 1) spawn(i);
	}

	/** Grow a segment buffer to hold one more segment, doubling as it goes. */
	function ensureRoom(
		buffer: Float32Array<ArrayBuffer>,
		segments: number
	): Float32Array<ArrayBuffer> {
		if ((segments + 1) * 4 <= buffer.length) return buffer;
		const grown = new Float32Array(buffer.length * 2);
		grown.set(buffer);
		return grown;
	}

	/** Advance every particle one step along the flow field. */
	function advance(time: number) {
		const drift = time * NOISE_DRIFT;
		for (let i = 0; i < count; i += 1) {
			const angle = noise(xs[i] * NOISE_SCALE, ys[i] * NOISE_SCALE + drift) * Math.PI * 4;
			const x = xs[i] + Math.cos(angle) * STEP;
			const y = ys[i] + Math.sin(angle) * STEP;
			xs[i] = x;
			ys[i] = y;
			life[i] -= 1;
			if (life[i] < 0 || x < 0 || x > width || y < 0 || y > height) spawn(i);
		}
	}

	/**
	 * Collect this frame's links into the per-band buffers.
	 *
	 * Ordinary particles only look at pairs where `j > i`, so each link is
	 * collected once. Hubs look at everything inside the wider radius — a hub
	 * pair being drawn twice is 80 particles' worth of double-draw and reads as
	 * the hub being a hub.
	 */
	function collectLinks() {
		linkCounts.fill(0);
		hubCount = 0;
		const linkRadiusSq = LINK_RADIUS * LINK_RADIUS;
		const hubRadiusSq = HUB_LINK_RADIUS * HUB_LINK_RADIUS;

		for (let i = 0; i < count; i += 1) {
			const x = xs[i];
			const y = ys[i];
			const isHub = (flags[i] & HUB) !== 0;
			// A hub reaches 42px, which is under two cells of the 26px grid.
			const found = hash.query(x, y, isHub ? 2 : 1, neighbours);

			for (let k = 0; k < found; k += 1) {
				const j = neighbours[k];
				const dx = xs[j] - x;
				const dy = ys[j] - y;
				const distanceSq = dx * dx + dy * dy;

				if (j > i && distanceSq < linkRadiusSq) {
					const nearness = 1 - Math.sqrt(distanceSq) / LINK_RADIUS;
					const band = Math.min(LINK_BANDS - 1, Math.max(0, Math.floor(nearness * LINK_BANDS)));
					const offset = linkCounts[band] * 4;
					const buffer = linkSegments[band];
					if (offset + 4 <= buffer.length) {
						buffer[offset] = x;
						buffer[offset + 1] = y;
						buffer[offset + 2] = xs[j];
						buffer[offset + 3] = ys[j];
						linkCounts[band] += 1;
					}
				}

				if (isHub && j !== i && distanceSq < hubRadiusSq) {
					hubSegments = ensureRoom(hubSegments, hubCount);
					const offset = hubCount * 4;
					hubSegments[offset] = x;
					hubSegments[offset + 1] = y;
					hubSegments[offset + 2] = xs[j];
					hubSegments[offset + 3] = ys[j];
					hubCount += 1;
				}
			}
		}
	}

	/** One path, one `stroke()`, for a whole band of links. */
	function strokeSegments(
		context: CanvasRenderingContext2D,
		buffer: Float32Array,
		segments: number,
		style: string
	) {
		if (segments === 0) return;
		context.strokeStyle = style;
		context.beginPath();
		for (let s = 0; s < segments; s += 1) {
			const offset = s * 4;
			context.moveTo(buffer[offset], buffer[offset + 1]);
			context.lineTo(buffer[offset + 2], buffer[offset + 3]);
		}
		context.stroke();
	}

	/** One path, one `fill()`, for every node whose flags match. */
	function fillNodes(context: CanvasRenderingContext2D, style: string, mask: number, want: number) {
		context.fillStyle = style;
		context.beginPath();
		let drawn = 0;
		for (let i = 0; i < count; i += 1) {
			if ((flags[i] & mask) !== want) continue;
			const radius = radii[i];
			// `moveTo` first, or the arc is joined to wherever the last one ended.
			context.moveTo(xs[i] + radius, ys[i]);
			context.arc(xs[i], ys[i], radius, 0, TAU);
			drawn += 1;
		}
		if (drawn > 0) context.fill();
	}

	/** Simulate and paint one frame at page time `time` (milliseconds). */
	function drawFrame(time: number) {
		const context = ctx;
		if (!context || count === 0) return;

		// The wash rather than a clear: what is left of the previous frame is the
		// short trail that makes a node read as travelling somewhere.
		context.fillStyle = trailStyle;
		context.fillRect(0, 0, width, height);

		advance(time);
		hash.build(xs, ys, count, width, height);
		collectLinks();

		context.lineWidth = 0.6;
		for (let band = 0; band < LINK_BANDS; band += 1) {
			strokeSegments(context, linkSegments[band], linkCounts[band], linkStyles[band]);
		}
		strokeSegments(context, hubSegments, hubCount, hubLinkStyle);

		if (glowAccent && glowWarm) {
			const size = GLOW_RADIUS * 2;
			for (let i = 0; i < count; i += 1) {
				if ((flags[i] & GLOW) === 0) continue;
				const sprite = (flags[i] & WARM) === 0 ? glowAccent : glowWarm;
				context.drawImage(sprite, xs[i] - GLOW_RADIUS, ys[i] - GLOW_RADIUS, size, size);
			}
		}

		const plain = WARM | HUB | BRIGHT;
		fillNodes(context, nodeStyles.accentDim, plain, 0);
		fillNodes(context, nodeStyles.accent, plain, BRIGHT);
		fillNodes(context, nodeStyles.warmDim, plain, WARM);
		fillNodes(context, nodeStyles.warm, plain, WARM | BRIGHT);
		fillNodes(context, nodeStyles.hub, WARM | HUB, HUB);
		fillNodes(context, nodeStyles.hubWarm, WARM | HUB, WARM | HUB);
	}

	/** Lay the page's own background down opaquely, so a trail starts from it. */
	function paintBackground() {
		if (!ctx || width === 0) return;
		ctx.fillStyle = bgStyle;
		ctx.fillRect(0, 0, width, height);
	}

	function loop(time: number) {
		rafId = requestAnimationFrame(loop);
		drawFrame(time);
	}

	/** Start or stop the loop to match the visibility flags. Idempotent. */
	function syncLoop() {
		const shouldRun = alive && onScreen && tabVisible && count > 0;
		if (shouldRun && rafId === 0) rafId = requestAnimationFrame(loop);
		else if (!shouldRun && rafId !== 0) {
			cancelAnimationFrame(rafId);
			rafId = 0;
		}
	}

	/** Re-measure, re-back the canvas at the current DPR, and re-seed. */
	function resize() {
		const wrapper = rootEl;
		const canvas = canvasEl;
		if (!wrapper || !canvas || !ctx) return;

		const rect = wrapper.getBoundingClientRect();
		const nextWidth = Math.round(rect.width);
		const nextHeight = Math.round(rect.height);
		if (nextWidth < 2 || nextHeight < 2) {
			count = 0;
			syncLoop();
			return;
		}
		if (nextWidth === width && nextHeight === height && count > 0) return;

		width = nextWidth;
		height = nextHeight;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		// The whole paint is written in CSS pixels; the transform is the only
		// place the device ratio appears.
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		readTheme();
		seed();
		paintBackground();
		syncLoop();
	}

	function handleVisibility() {
		tabVisible = document.visibilityState !== 'hidden';
		syncLoop();
	}

	function handleThemeChange() {
		readTheme();
		// A half-faded trail in the old theme's colours would take half a second
		// to wash out; repainting the ground makes the switch instant.
		paintBackground();
	}

	onMount(() => {
		const wrapper = rootEl;
		const canvas = canvasEl;
		if (!wrapper || !canvas) return;

		ctx = canvas.getContext('2d');
		if (!ctx) {
			markRevealed([wrapper]);
			return;
		}

		const still = reducedMotion();
		if (still) {
			resize();
			// The composition, without the motion that produced it.
			for (let frame = 0; frame < STATIC_FRAMES; frame += 1) drawFrame(frame * FRAME_MS);
			markRevealed([wrapper]);
		} else {
			// This component owns its own entrance, so the stylesheet's 3s safety
			// net can stand down — firing it mid-fade would override the inline
			// opacity the fade is writing.
			wrapper.setAttribute('data-motion-ready', '');
			resize();
			animate(
				wrapper,
				{ opacity: [0, 1] },
				{
					duration: 0.9,
					ease: [...easings.outExpo] as [number, number, number, number],
					onComplete: () => markRevealed([wrapper])
				}
			);
		}

		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(wrapper);

		const themeObserver = new MutationObserver(handleThemeChange);
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});

		const stopWatching = still
			? () => {}
			: inView(wrapper, () => {
					onScreen = true;
					syncLoop();
					return () => {
						onScreen = false;
						syncLoop();
					};
				});
		if (!still) document.addEventListener('visibilitychange', handleVisibility);

		return () => {
			alive = false;
			syncLoop();
			stopWatching();
			resizeObserver.disconnect();
			themeObserver.disconnect();
			document.removeEventListener('visibilitychange', handleVisibility);
		};
	});
</script>

<div
	bind:this={rootEl}
	class={cn('particle-network', `particle-network--${intensity}`, className)}
	data-hero
	aria-hidden="true"
>
	<canvas bind:this={canvasEl} class="particle-network__canvas"></canvas>
</div>

<style>
	.particle-network {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		/*
			The vignette is what keeps this a background. Without it the field runs
			into the nav, into the section below and into the page's own edges, and
			it stops reading as depth behind the page and starts reading as a
			texture on top of it. The radii are percentages measured from the
			gradient's centre, so they have to overshoot the box for the fade to
			finish before the edge rather than at it.
		*/
		--network-vignette: radial-gradient(120% 90% at 50% 45%, black 45%, transparent 100%);
		-webkit-mask-image: var(--network-vignette);
		mask-image: var(--network-vignette);
	}

	/* Behind reading copy rather than a headline: the same field, half as loud. */
	.particle-network--soft {
		opacity: 0.55;
	}

	.particle-network__canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
