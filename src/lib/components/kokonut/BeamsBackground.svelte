<!--
	BeamsBackground — KokonutUI `backgrounds/beams-background`.

	Thirty tall, heavily blurred gradient bars drifting upward behind a section.
	The original hard-codes cyan hues; here the hue band comes from `hueRange`,
	defaulting to the theme's accent family (warm ember in dark, blue in light).

	The loop is deliberately frugal:
	  - it stops when the section scrolls off-screen (IntersectionObserver);
	  - it stops when the tab is hidden (`visibilitychange`);
	  - under reduced motion it paints one static frame and never schedules again.
	Every beam's hue is stored as a 0..1 offset and resolved at paint time, so a
	theme switch re-tints the field on the next frame without rebuilding it.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, reducedMotion } from '$lib/motion';
	import { theme } from '$lib/state/theme.svelte';

	interface Props {
		intensity?: 'subtle' | 'medium' | 'strong';
		/** `[min, max]` HSL hue band. Defaults to the current theme's accent. */
		hueRange?: [number, number];
		class?: string;
	}

	let { intensity = 'medium', hueRange, class: className = '' }: Props = $props();

	const INTENSITY = { subtle: 0.7, medium: 0.85, strong: 1 } as const;
	/** MINIMUM_BEAMS (20) × 1.5, as in the original. */
	const BEAM_COUNT = 30;
	const BLUR = 'blur(35px)';
	const COLUMNS = 3;
	const DARK_HUES: [number, number] = [10, 40];
	const LIGHT_HUES: [number, number] = [205, 230];
	/** Overlay pulse — the only part of this component Motion drives. */
	const OVERLAY_PULSE_DURATION = 10;

	interface Beam {
		x: number;
		y: number;
		width: number;
		length: number;
		/** Degrees; negative so beams lean left as they rise. */
		angle: number;
		speed: number;
		opacity: number;
		/** Phase of the per-beam brightness pulse, in radians. */
		pulse: number;
		pulseSpeed: number;
		/** 0..1 position within `hues`, resolved to a real hue at paint time. */
		hueOffset: number;
	}

	let wrapper = $state<HTMLDivElement | undefined>();
	let canvas = $state<HTMLCanvasElement | undefined>();
	let overlay = $state<HTMLDivElement | undefined>();

	const hues = $derived(hueRange ?? (theme.current === 'light' ? LIGHT_HUES : DARK_HUES));
	// Light mode needs a duller, darker beam to stay legible on white.
	const saturation = $derived(theme.current === 'light' ? 75 : 85);
	const lightness = $derived(theme.current === 'light' ? 45 : 65);

	let context: CanvasRenderingContext2D | null = null;
	let beams: Beam[] = [];
	let frameId: number | undefined;
	let onScreen = true;
	let size = { width: 0, height: 0 };

	function createBeam(width: number, height: number): Beam {
		return {
			x: Math.random() * width * 1.5 - width * 0.25,
			y: Math.random() * height * 1.5 - height * 0.25,
			width: 30 + Math.random() * 60,
			length: height * 2.5,
			angle: -35 + Math.random() * 10,
			speed: 0.6 + Math.random() * 1.2,
			opacity: 0.12 + Math.random() * 0.16,
			pulse: Math.random() * Math.PI * 2,
			pulseSpeed: 0.02 + Math.random() * 0.03,
			hueOffset: Math.random()
		};
	}

	/** Sends a beam that has left the top back below the bottom edge. */
	function resetBeam(beam: Beam, index: number, total: number, width: number, height: number) {
		const spacing = width / COLUMNS;
		const column = index % COLUMNS;
		beam.y = height + 100;
		beam.x = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5;
		beam.width = 100 + Math.random() * 100;
		beam.speed = 0.5 + Math.random() * 0.4;
		beam.opacity = 0.2 + Math.random() * 0.1;
		// Spread hues evenly across the band so a reset field stays varied.
		beam.hueOffset = total > 1 ? index / (total - 1) : 0;
	}

	function drawBeam(ctx: CanvasRenderingContext2D, beam: Beam) {
		ctx.save();
		ctx.translate(beam.x, beam.y);
		ctx.rotate((beam.angle * Math.PI) / 180);

		const pulsing = beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.2) * INTENSITY[intensity];
		const [min, max] = hues;
		const hue = min + beam.hueOffset * (max - min);
		const color = (alpha: number) => `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;

		const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);
		gradient.addColorStop(0, color(0));
		gradient.addColorStop(0.1, color(pulsing * 0.5));
		gradient.addColorStop(0.4, color(pulsing));
		gradient.addColorStop(0.6, color(pulsing));
		gradient.addColorStop(0.9, color(pulsing * 0.5));
		gradient.addColorStop(1, color(0));

		ctx.fillStyle = gradient;
		ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
		ctx.restore();
	}

	/**
	 * CSS-pixel size of the canvas — the coordinate space the beams live in.
	 *
	 * Measured from the wrapper, not the window: this component sits behind
	 * ordinary page sections, not just full-bleed heroes, and sizing to the
	 * window would stretch the bitmap into its `width: 100%` box. Falls back to
	 * the viewport before first layout (and under jsdom, where clients are 0).
	 */
	function measure(): { width: number; height: number } {
		return {
			width: wrapper?.clientWidth || window.innerWidth,
			height: wrapper?.clientHeight || window.innerHeight
		};
	}

	function resize() {
		if (!canvas || !context) return;
		const next = measure();
		if (next.width === size.width && next.height === size.height) return;
		size = next;

		const dpr = window.devicePixelRatio || 1;
		// Assigning width/height resets the context (transform included), so the
		// `scale` below is applied to a clean identity matrix every time.
		canvas.width = size.width * dpr;
		canvas.height = size.height * dpr;
		canvas.style.width = `${size.width}px`;
		canvas.style.height = `${size.height}px`;
		context.scale(dpr, dpr);
		beams = Array.from({ length: BEAM_COUNT }, () => createBeam(size.width, size.height));
	}

	function advance() {
		beams.forEach((beam, index) => {
			beam.y -= beam.speed;
			beam.pulse += beam.pulseSpeed;
			if (beam.y + beam.length < -100) {
				resetBeam(beam, index, beams.length, size.width, size.height);
			}
		});
	}

	function paint() {
		if (!context) return;
		// CSS pixels, not the device-pixel bitmap size: the context is scaled.
		context.clearRect(0, 0, size.width, size.height);
		context.filter = BLUR;
		for (const beam of beams) drawBeam(context, beam);
	}

	function loop() {
		advance();
		paint();
		frameId = requestAnimationFrame(loop);
	}

	function stop() {
		if (frameId !== undefined) cancelAnimationFrame(frameId);
		frameId = undefined;
	}

	function canPlay(): boolean {
		return onScreen && !document.hidden;
	}

	function sync() {
		if (canPlay()) {
			if (frameId === undefined) loop();
		} else {
			stop();
		}
	}

	onMount(() => {
		if (!canvas) return;
		context = canvas.getContext('2d');
		if (!context) return;
		resize();

		if (reducedMotion()) {
			// One static frame: the texture is part of the design, the drift is not.
			paint();
			return;
		}

		if (overlay) {
			animate(
				overlay,
				{ opacity: [0.05, 0.15, 0.05] },
				{ duration: OVERLAY_PULSE_DURATION, repeat: Infinity, ease: 'easeInOut' }
			);
		}

		const visibility = new IntersectionObserver((entries) => {
			onScreen = entries.some((entry) => entry.isIntersecting);
			sync();
		});
		visibility.observe(canvas);

		// Tracks the wrapper rather than the window: the canvas is sized to its
		// container, which can change without the viewport changing.
		const resizes = new ResizeObserver(() => {
			resize();
			// A paused canvas still needs the new size drawn into it.
			if (frameId === undefined) paint();
		});
		if (wrapper) resizes.observe(wrapper);

		document.addEventListener('visibilitychange', sync);

		if (canPlay()) loop();
		else paint();

		return () => {
			stop();
			visibility.disconnect();
			resizes.disconnect();
			document.removeEventListener('visibilitychange', sync);
		};
	});
</script>

<div bind:this={wrapper} class="beams-background {className}" aria-hidden="true">
	<canvas bind:this={canvas} class="beams-background__canvas"></canvas>
	<div bind:this={overlay} class="beams-background__veil"></div>
</div>

<style>
	.beams-background {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.beams-background__canvas,
	.beams-background__veil {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	/* Softens the beams into the page and keeps text above them readable. */
	.beams-background__veil {
		backdrop-filter: blur(50px);
		background-color: var(--bg);
		opacity: 0.05;
	}
</style>
