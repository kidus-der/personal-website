<!--
	MatrixText — KokonutUI `texts/matrix-text`.

	Each glyph flips to a random binary digit for a moment before snapping back to
	the real character, one after another from left to right. Used on the error
	page, where the scramble reads as "something got corrupted".

	No `animate` here on purpose: the effect is a character swap plus a colour
	change, which CSS handles, so the only moving parts are timers.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { reducedMotion } from '$lib/motion';
	import { cn } from '$lib/utils/cn';

	interface Props {
		text: string;
		initialDelay?: number;
		letterInterval?: number;
		letterAnimationDuration?: number;
		class?: string;
	}

	let {
		text,
		initialDelay = 200,
		letterInterval = 100,
		letterAnimationDuration = 500,
		class: className = ''
	}: Props = $props();

	const NBSP = '\u00a0';

	/** Which character indices are currently showing a binary digit. */
	let scrambled = $state<Record<number, string>>({});

	const characters = $derived([...text]);

	function isBlank(character: string): boolean {
		return character.trim() === '';
	}

	function display(character: string, index: number): string {
		if (isBlank(character)) return NBSP;
		return scrambled[index] ?? character;
	}

	onMount(() => {
		if (reducedMotion() || characters.length === 0) return;

		const timers: ReturnType<typeof setTimeout>[] = [];

		characters.forEach((character, index) => {
			if (isBlank(character)) return;
			timers.push(
				setTimeout(
					() => {
						scrambled = { ...scrambled, [index]: Math.random() < 0.5 ? '0' : '1' };
					},
					initialDelay + index * letterInterval
				)
			);
			timers.push(
				setTimeout(
					() => {
						const next = { ...scrambled };
						delete next[index];
						scrambled = next;
					},
					initialDelay + index * letterInterval + letterAnimationDuration
				)
			);
		});

		return () => {
			for (const timer of timers) clearTimeout(timer);
		};
	});
</script>

<!--
	`role="img"` makes the `aria-label` authoritative: without a role, a label on
	a bare span whose every glyph is `aria-hidden` can be announced as nothing at
	all. The role treats the scrambling string as one opaque object named `text`.
-->
<span class={cn('matrix-text', className)} role="img" aria-label={text}>
	{#each characters as character, index (index)}
		<span
			class="matrix-text__char"
			class:matrix-text__char--scrambling={scrambled[index] !== undefined}
			aria-hidden="true">{display(character, index)}</span
		>
	{/each}
</span>

<style>
	.matrix-text__char {
		display: inline-block;
		transition: color 120ms linear;
	}

	.matrix-text__char--scrambling {
		color: var(--accent);
		text-shadow: 0 0 8px var(--accent-dim);
	}
</style>
