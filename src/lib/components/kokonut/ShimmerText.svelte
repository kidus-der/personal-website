<!--
	ShimmerText — KokonutUI `texts/shimmer-text`, re-skinned with our tokens.

	A muted→text→muted gradient clipped to the glyphs, swept horizontally forever.
	The sweep is driven from `onMount` (never from markup) so the reduced-motion
	branch is a plain early return and there is no hydration mismatch: the server
	renders the static gradient and the client decides whether to move it.

	A gradient that never moves would leave the word permanently half-faded, so
	the still state drops the gradient entirely and paints flat `--text`. That is
	expressed twice on purpose: as a `prefers-reduced-motion` media query (which
	covers the no-JS render) and as a class this component sets once it has asked
	`reducedMotion()` (which is what the tests assert).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, reducedMotion } from '$lib/motion';
	import { cn } from '$lib/utils/cn';

	interface Props {
		text: string;
		class?: string;
	}

	let { text, class: className = '' }: Props = $props();

	const SWEEP_DURATION = 2.5;

	let element: HTMLSpanElement;
	let still = $state(false);

	onMount(() => {
		if (reducedMotion()) {
			still = true;
			return;
		}
		const animation = animate(
			element,
			{ backgroundPosition: ['100% 0', '-100% 0'] },
			{ duration: SWEEP_DURATION, repeat: Infinity, ease: 'linear' }
		);
		return () => animation.stop();
	});
</script>

<span bind:this={element} class={cn('shimmer-text', still && 'shimmer-text--still', className)}
	>{text}</span
>

<style>
	.shimmer-text {
		background-image: linear-gradient(
			90deg,
			var(--text-muted) 0%,
			var(--text) 50%,
			var(--text-muted) 100%
		);
		background-size: 200% 100%;
		/* Rests on the bright middle of the gradient, so the word reads at full
		   strength before the sweep starts (or if it never does). */
		background-position: 50% 0;
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
		font-weight: 500;
	}

	.shimmer-text--still {
		background-image: none;
		background-clip: border-box;
		-webkit-background-clip: border-box;
		color: var(--text);
	}

	@media (prefers-reduced-motion: reduce) {
		.shimmer-text {
			background-image: none;
			background-clip: border-box;
			-webkit-background-clip: border-box;
			color: var(--text);
		}
	}
</style>
