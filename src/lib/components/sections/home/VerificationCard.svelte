<!--
	VerificationCard — the one bold element on the site.

	A scan receipt for Eva V1.6: the headline detection rate as a ring, the
	per-modality rates as a mini bar chart, and a verdict line, with a light bar
	sweeping the card the way a document scanner does. It is the visual claim
	behind the headline — "I build the systems that tell real from fake" — so it
	sits beside the copy rather than under it.

	`animate` is the hero's cue, flipped ~0.6s into the entrance. The charts draw
	from empty when it goes true, so the chart block is hidden on mount and faded
	in with them: the charts' own `animate={false}` state is *full*, not empty, and
	without the gate the ring would show complete, blank itself, and redraw.
	The hide happens in `onMount`, so the server-rendered card is complete for
	anyone who never runs the script.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, durations, easings, reducedMotion } from '$lib/motion';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import RingChart from '$lib/components/charts/RingChart.svelte';
	import { cn } from '$lib/utils/cn';

	/**
	 * A type alias rather than an interface on purpose: `BarChart` takes
	 * `Record<string, unknown>[]`, and only anonymous object types get the
	 * implicit index signature that makes them assignable to it.
	 */
	export type Modality = { label: string; value: number };

	interface Props {
		/** Headline detection rate, as a percentage. */
		score?: number;
		modalities?: Modality[];
		/** The hero's cue to draw the charts in. */
		animate?: boolean;
		class?: string;
	}

	// Renamed so `animate` keeps referring to the Motion helper.
	let {
		score = 98.2,
		modalities = [
			{ label: 'image', value: 99.1 },
			{ label: 'video', value: 97.8 },
			{ label: 'audio', value: 98.5 },
			{ label: 'document', value: 96.4 }
		],
		animate: animateOnMount = true,
		class: className = ''
	}: Props = $props();

	const RING_SIZE = 168;
	const MODEL = 'Eva V1.6';

	const ring = $derived([{ label: 'Deepfakes caught', value: score, maxValue: 100 }]);
	const percent = (value: number) => `${value.toFixed(1)}%`;

	let chartsEl = $state<HTMLDivElement | undefined>();
	/** Whether the charts have been handed back to the stylesheet. */
	let revealed = false;

	onMount(() => {
		// Nothing to hide: either the card was told to draw straight away, or the
		// user has asked for no motion and the charts are already at full.
		if (animateOnMount || reducedMotion()) return;
		chartsEl?.style.setProperty('opacity', '0');
	});

	$effect(() => {
		if (!animateOnMount || revealed || !chartsEl) return;
		revealed = true;
		const element = chartsEl;
		if (reducedMotion()) {
			element.style.removeProperty('opacity');
			return;
		}
		animate(
			element,
			{ opacity: [0, 1] },
			// Spread: Motion normalises the array, and the token is shared.
			{ duration: durations.base, ease: [...easings.outQuart] }
		).finished.then(() => element.style.removeProperty('opacity'));
	});
</script>

<div class={cn('verification-card', className)}>
	<span class="verification-card__scan" aria-hidden="true"></span>

	<!-- Two spans with a gap, never joined by an interpunct — see the copy rules. -->
	<div class="verification-card__header">
		<span class="verification-card__model">{MODEL}</span>
		<span class="verification-card__sample">live sample</span>
	</div>

	<div class="verification-card__charts" bind:this={chartsEl}>
		<div class="verification-card__ring">
			<RingChart
				data={ring}
				size={RING_SIZE}
				centerLabel="deepfakes caught"
				formatValue={percent}
				animate={animateOnMount}
				ariaLabel="{percent(score)} of deepfakes caught"
			/>
		</div>

		<BarChart
			data={modalities}
			xKey="label"
			series={[{ key: 'value', label: 'Detection rate' }]}
			aspectRatio="3 / 1"
			showGrid={false}
			showXAxis
			formatValue={percent}
			animate={animateOnMount}
			ariaLabel="Detection rate by modality"
		/>
	</div>

	<!-- Three spans with a gap, not one interpunct-joined string. -->
	<div class="verification-card__verdict">
		<span class="verification-card__verdict-label">Verdict</span>
		<span class="verification-card__verdict-value">Authentic</span>
		<span class="verification-card__verdict-score">0.98</span>
	</div>
</div>

<style>
	.verification-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		overflow: hidden;
		padding: clamp(1.25rem, 3vw, 1.75rem);
		border: 1px solid var(--border);
		border-radius: var(--radius-card);
		background-color: var(--surface);
		/* The faint instrument grid the scan line sweeps over. */
		background-image:
			linear-gradient(to right, var(--border) 1px, transparent 1px),
			linear-gradient(to bottom, var(--border) 1px, transparent 1px);
		background-size: 32px 32px;
	}

	/*
		A 1px bar of accent light travelling top to bottom, forever.

		The element is the full size of the card with the line painted along its
		top edge, rather than a 1px element: `translateY(100%)` of a 1px box is a
		1px journey, whereas 100% of the card's own height is exactly the sweep.
		The card's `overflow: hidden` clips the run-off.
	*/
	.verification-card__scan {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image: linear-gradient(
			to right,
			transparent,
			color-mix(in srgb, var(--accent) 85%, transparent),
			transparent
		);
		background-size: 100% 1px;
		background-repeat: no-repeat;
		background-position: top;
		animation: scan 3s linear infinite;
	}

	@keyframes scan {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(100%);
		}
	}

	.verification-card__header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}

	.verification-card__model {
		color: var(--text);
		letter-spacing: 0.01em;
	}

	.verification-card__sample {
		color: var(--text-muted);
	}

	.verification-card__charts {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.verification-card__ring {
		display: flex;
		justify-content: center;
	}

	.verification-card__verdict {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		padding-top: 0.875rem;
		border-top: 1px solid var(--border);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}

	.verification-card__verdict-label {
		color: var(--text-muted);
	}

	.verification-card__verdict-value {
		margin-inline-end: auto;
		color: var(--accent);
	}

	.verification-card__verdict-score {
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	@media (prefers-reduced-motion: reduce) {
		.verification-card__scan {
			/* Kept at rest rather than removed: the line is part of the card's face. */
			animation-play-state: paused;
		}
	}
</style>
