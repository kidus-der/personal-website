<!--
	DynamicText — KokonutUI `texts/dynamic-text`.

	Cycles a short list of words (used for the multilingual greeting) and then
	settles on `final` forever. The outgoing word stays mounted for the length of
	its exit animation so the two words cross over, the way the original does.

	Timing lives in a plain `setInterval` rather than chained animation callbacks:
	the cadence stays exact regardless of how long the transforms take, and tests
	can drive it with fake timers.
-->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { animate, durations, easings, reducedMotion } from '$lib/motion';

	export interface DynamicWord {
		text: string;
		/** BCP-47 tag, e.g. `am` for Amharic — set so screen readers switch voice. */
		lang?: string;
	}

	interface Props {
		words: DynamicWord[];
		final: string;
		interval?: number;
		onDone?: () => void;
		class?: string;
	}

	let { words, final, interval = 320, onDone, class: className = '' }: Props = $props();

	const ENTER_FROM_Y = 20;
	const EXIT_TO_Y = -24;

	let index = $state(0);
	let done = $state(false);
	let outgoing = $state<DynamicWord | null>(null);

	let currentEl = $state<HTMLSpanElement | undefined>();
	let outgoingEl = $state<HTMLSpanElement | undefined>();

	let timer: ReturnType<typeof setInterval> | undefined;
	let doneFired = false;

	const current = $derived<DynamicWord>(done ? { text: final } : (words[index] ?? { text: final }));

	function finish() {
		if (timer !== undefined) {
			clearInterval(timer);
			timer = undefined;
		}
		done = true;
		if (doneFired) return;
		doneFired = true;
		onDone?.();
	}

	const timing = { duration: durations.fast, ease: easings.outQuart };

	function playEnter(element: HTMLSpanElement) {
		return animate(element, { y: [ENTER_FROM_Y, 0], opacity: [0, 1] }, timing);
	}

	/** Runs after the DOM has caught up with the new word. */
	function playSwap() {
		if (outgoingEl && outgoing) {
			const leaving = outgoing;
			const animation = animate(outgoingEl, { y: [0, EXIT_TO_Y], opacity: [1, 0] }, timing);
			// Unmount the leaving word once it is actually gone, so the settled
			// component holds no invisible leftovers.
			animation.finished.then(() => {
				if (outgoing === leaving) outgoing = null;
			});
		}
		if (currentEl) playEnter(currentEl);
	}

	async function step() {
		outgoing = current;
		if (index < words.length - 1) index += 1;
		else finish();
		await tick();
		playSwap();
	}

	onMount(() => {
		if (reducedMotion() || words.length === 0) {
			finish();
			return;
		}
		if (currentEl) playEnter(currentEl);
		timer = setInterval(step, interval);
		return () => {
			if (timer !== undefined) clearInterval(timer);
			timer = undefined;
		};
	});
</script>

<span class="dynamic-text {className}" aria-label={final}>
	{#if outgoing}
		<span
			bind:this={outgoingEl}
			class="dynamic-text__outgoing"
			aria-hidden="true"
			lang={outgoing.lang}>{outgoing.text}</span
		>
	{/if}
	<span bind:this={currentEl} class="dynamic-text__current" aria-hidden="true" lang={current.lang}
		>{current.text}</span
	>
</span>

<style>
	.dynamic-text {
		position: relative;
		display: inline-block;
		overflow: hidden;
		/* Keeps the line box from collapsing while a word is mid-flight. */
		vertical-align: bottom;
	}

	.dynamic-text__current,
	.dynamic-text__outgoing {
		display: inline-block;
		white-space: nowrap;
	}

	.dynamic-text__outgoing {
		position: absolute;
		inset-inline-start: 0;
		top: 0;
		pointer-events: none;
	}
</style>
