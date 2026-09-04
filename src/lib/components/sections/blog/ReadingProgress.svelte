<!--
	ReadingProgress — the hairline accent bar pinned to the top of a post.

	The bar is a single element whose `scaleX` reads `--progress`, which
	`use:scrollProgress` writes as the target travels through the viewport. It
	stays active under reduced motion: nothing moves that the reader did not move
	themselves, it is scroll position made visible.

	Decorative by design — the same information is already in the scrollbar — so
	it is hidden from assistive tech rather than exposed as a progressbar.
-->
<script lang="ts">
	import { scrollProgress } from '$lib/actions/scrollProgress';
	import { cn } from '$lib/utils/cn';

	interface Props {
		/** The element to measure. Defaults to the bar itself, which is never useful — pass the article. */
		target?: HTMLElement;
		class?: string;
	}

	let { target, class: className = '' }: Props = $props();
</script>

<div
	class={cn('reading-progress', className)}
	use:scrollProgress={{ target }}
	aria-hidden="true"
></div>

<style>
	.reading-progress {
		position: fixed;
		top: 0;
		left: 0;
		/* Above the fixed nav (z-index 100), which would otherwise cover the bar
		   the moment it grows past a hairline. `pointer-events: none` keeps it
		   from stealing clicks from the nav it sits on top of. */
		z-index: 110;
		width: 100%;
		height: 2px;
		background-color: var(--accent);
		transform: scaleX(var(--progress, 0));
		transform-origin: left center;
		pointer-events: none;
	}
</style>
