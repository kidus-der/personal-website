<!--
	PageTransition — the fade-and-lift between routes.

	Only client navigations are animated. SvelteKit fires `afterNavigate` once
	with `type: 'enter'` for the first, server-rendered paint; animating that
	would blank content the browser has already painted, so it is skipped.

	No scroll handling here — SvelteKit already restores or resets scroll itself.
-->
<script lang="ts">
	import { onDestroy, type Snippet } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { animate, durations, easings, reducedMotion } from '$lib/motion';
	import { cn } from '$lib/utils/cn';

	interface Props {
		children: Snippet;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();

	/** Pixels the incoming page rises through. */
	const LIFT = 8;

	let wrapperEl = $state<HTMLDivElement | undefined>();
	let animation: ReturnType<typeof animate> | undefined;

	afterNavigate((navigation) => {
		if (navigation?.type === 'enter') return;
		if (!wrapperEl || reducedMotion()) return;

		// A reader clicking through quickly should not stack transitions.
		animation?.stop();

		const target = wrapperEl;
		animation = animate(
			target,
			{ opacity: [0, 1], y: [LIFT, 0] },
			{ duration: durations.base, ease: easings.outExpo }
		);

		// Motion leaves the final values inline. Removing them hands the wrapper
		// back to the stylesheet, so a page's own transform or opacity rule is not
		// permanently outranked by a leftover `transform: none`.
		animation.finished
			.then(() => {
				target.style.removeProperty('opacity');
				target.style.removeProperty('transform');
			})
			.catch(() => {
				// Interrupted by the next navigation or an unmount — nothing to clean.
			});
	});

	onDestroy(() => animation?.stop());
</script>

<div bind:this={wrapperEl} class={cn('page-transition', className)}>
	{@render children()}
</div>

<style>
	.page-transition {
		flex: 1;
	}
</style>
