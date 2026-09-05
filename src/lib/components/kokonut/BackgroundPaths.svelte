<!--
	BackgroundPaths — KokonutUI `backgrounds/background-paths`.

	Two mirrored fans of 22 hairline curves that sweep through the viewport. The
	geometry sweeps far outside the 696×316 viewBox on purpose: only the middle of
	each curve is ever visible, which is what makes the motion read as a current
	rather than a loop.

	Geometry comes from `./backgroundPaths.ts` (pure, tested, deterministic). The
	`pathOffset` sweep is started from an action so each `<path>` animates exactly
	once, as it mounts. `pathLength` used to animate alongside it; it was dropped
	with the path count, because re-deriving a dash array every frame is not worth
	a difference nobody can see behind a page of content.
-->
<script lang="ts">
	import type { Action } from 'svelte/action';
	import { animate, reducedMotion } from '$lib/motion';
	import { cn } from '$lib/utils/cn';
	import { buildPathSets, type AestheticPath } from './backgroundPaths';

	interface Props {
		/** Wrapper opacity; the reduced-motion render forces a calmer value. */
		opacity?: number;
		class?: string;
	}

	let { opacity = 0.6, class: className = '' }: Props = $props();

	const STATIC_OPACITY = 0.4;
	const MIRRORS = [1, -1] as const;

	// `reducedMotion()` is read once per mount rather than per path: the answer
	// cannot change between two paths of the same render, and reading it once
	// keeps the 44 path animations consistent with each other.
	const reduce = reducedMotion();

	const sets = MIRRORS.map((position) => {
		const { primary, secondary, accent } = buildPathSets(position);
		return { position, paths: [...primary, ...secondary, ...accent] };
	});

	const draw: Action<SVGPathElement, AestheticPath> = (node, path) => {
		if (reduce) return;
		const animation = animate(
			node,
			{ pathOffset: [0, 1], opacity: [0.3, 0.6, 0.3] },
			{ duration: path.duration, repeat: Infinity, ease: 'linear' }
		);
		return { destroy: () => animation.stop() };
	};
</script>

<div
	class={cn('background-paths', className)}
	aria-hidden="true"
	style:opacity={reduce ? STATIC_OPACITY : opacity}
>
	{#each sets as set (set.position)}
		<svg
			class="background-paths__layer"
			viewBox="0 0 696 316"
			fill="none"
			preserveAspectRatio="none"
		>
			{#each set.paths as path (path.id)}
				<path
					d={path.d}
					stroke="currentColor"
					stroke-width={path.width}
					stroke-opacity={path.opacity}
					use:draw={path}
				/>
			{/each}
		</svg>
	{/each}
</div>

<style>
	.background-paths {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		/* `stroke="currentColor"` on every path reads from here. */
		color: var(--accent);
	}

	.background-paths__layer {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
</style>
