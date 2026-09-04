<!--
	ShimmerText — KokonutUI `texts/shimmer-text`, re-skinned with our tokens.

	A muted→text→muted gradient clipped to the glyphs, swept horizontally forever.
	The sweep is driven from `onMount` (never from markup) so the reduced-motion
	branch is a plain early return and there is no hydration mismatch: the server
	renders the static gradient and the client decides whether to move it.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, reducedMotion } from '$lib/motion';

	interface Props {
		text: string;
		class?: string;
	}

	let { text, class: className = '' }: Props = $props();

	const SWEEP_DURATION = 2.5;

	let element: HTMLSpanElement;

	onMount(() => {
		if (reducedMotion()) return;
		const animation = animate(
			element,
			{ backgroundPosition: ['100% 0', '-100% 0'] },
			{ duration: SWEEP_DURATION, repeat: Infinity, ease: 'linear' }
		);
		return () => animation.stop();
	});
</script>

<span bind:this={element} class="shimmer-text {className}">{text}</span>

<style>
	.shimmer-text {
		background-image: linear-gradient(
			90deg,
			var(--text-muted) 0%,
			var(--text) 50%,
			var(--text-muted) 100%
		);
		background-size: 200% 100%;
		background-position: 100% 0;
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
		font-weight: 500;
	}
</style>
