<!--
	Bio — the About page's opening band: a beams wash, the bilingual greeting, and
	two paragraphs of prose.

	The ሰላም tooltip is a real disclosure, not a `title` attribute: it carries three
	sentences of context that has to be reachable by keyboard and readable at a
	comfortable size. That makes the greeting a `<button>` — the only element that
	is focusable, activatable and announced without inventing ARIA — described by a
	`role="tooltip"` span it points at with `aria-describedby`.

	Show/hide is driven straight onto the element's `hidden` property rather than
	through a `$state` binding. A tooltip has to be measurable and animatable the
	instant it appears, and `hidden` is what actually removes it from the
	accessibility tree and the tab order; doing it imperatively means the element
	is genuinely visible before Motion is handed it, with no `tick()` in between.
-->
<script lang="ts">
	import BeamsBackground from '$lib/components/kokonut/BeamsBackground.svelte';
	import { animate, reducedMotion, springs } from '$lib/motion';

	const TOOLTIP_ID = 'selam-tip';

	let tooltipEl = $state<HTMLSpanElement | undefined>();
	let animation: ReturnType<typeof animate> | undefined;
	/** Mirrors `tooltipEl.hidden`, so repeated hovers do not restart the spring. */
	let shown = false;

	function show() {
		const el = tooltipEl;
		if (!el || shown) return;
		shown = true;
		el.hidden = false;

		if (reducedMotion()) return;
		animation?.stop();
		animation = animate(el, { opacity: [0, 1], scale: [0.93, 1] }, springs.bouncy);
	}

	function hide() {
		const el = tooltipEl;
		if (!el || !shown) return;
		shown = false;
		animation?.stop();
		animation = undefined;
		el.hidden = true;
	}

	function onWindowKeydown(event: KeyboardEvent) {
		// Hover can raise the tooltip without ever moving focus, so Escape is
		// listened for on the window rather than on the trigger.
		if (event.key === 'Escape') hide();
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<section class="bio">
	<BeamsBackground intensity="subtle" />

	<div class="bio__content">
		<div class="bio__greeting">
			<h1 class="bio__heading">
				<button
					type="button"
					class="selam"
					aria-describedby={TOOLTIP_ID}
					onpointerenter={show}
					onpointerleave={hide}
					onfocus={show}
					onblur={hide}
				>
					ሰላም
				</button>
				<span>and hello.</span>
			</h1>

			<!--
				A sibling of the heading rather than a child of the button: a tooltip
				nested in its own trigger is read as part of the button's own name. It
				is taken out of flow so raising it never pushes the prose down the page.
			-->
			<span bind:this={tooltipEl} id={TOOLTIP_ID} class="bio__tooltip" role="tooltip" hidden>
				In Amharic, ሰላም (sälam) means peace. It's how you greet someone in Ethiopia and Eritrea.
			</span>
		</div>

		<div class="bio__body">
			<p>
				I'm Kidus Dereje Zewde, a Computing Science and Economics student at the University of
				Alberta, graduating June 2026, and a Founding Engineer at
				<a href="https://www.scam.ai/en" target="_blank" rel="noopener noreferrer">Scam AI</a>. My
				work sits where research meets production:
				<a href="#publications">eight papers</a> on deepfake and document forensics, and the detection
				systems that put them to use.
			</p>
			<p>
				I care about the whole stack, from model architecture to the interface people touch, and I'm
				drawn to problems where rigorous engineering and creative thinking both matter. Off the
				clock: film photography and good coffee.
			</p>
		</div>
	</div>
</section>

<style>
	/* The beams canvas is `position: absolute; inset: 0` — this is what clips it. */
	.bio {
		position: relative;
		overflow: hidden;
		isolation: isolate;
		padding-block: clamp(3rem, 8vw, 6rem);
	}

	.bio__content {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: flex-start;
	}

	.bio__heading {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25em;
		font-family: var(--font-display);
		font-size: var(--text-3xl);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.05;
		color: var(--text);
	}

	/* A button that has to read as a word inside a headline: every scrap of
	   control chrome removed, and the display face swapped for the Ethiopic one. */
	.selam {
		appearance: none;
		margin: 0;
		padding: 0;
		border: 0;
		background: none;
		font-family: var(--font-ethiopic);
		font-size: inherit;
		font-weight: inherit;
		line-height: inherit;
		letter-spacing: normal;
		color: var(--accent);
		cursor: help;
	}

	.selam:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 4px;
		border-radius: var(--radius-sm);
	}

	.bio__greeting {
		position: relative;
	}

	.bio__tooltip {
		position: absolute;
		top: calc(100% + 0.75rem);
		left: 0;
		z-index: 1;
		max-width: 34ch;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		background-color: var(--surface-raised);
		color: var(--text-muted);
		font-size: var(--text-sm);
		line-height: 1.5;
		/* Motion springs `scale`; the origin keeps the growth anchored to the word. */
		transform-origin: top left;
	}

	.bio__body {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-width: 640px;
		font-size: var(--text-lg);
		line-height: 1.6;
		color: var(--text-muted);
	}

	.bio__body a {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 0.2em;
		text-decoration-thickness: 1px;
		text-decoration-color: color-mix(in srgb, var(--accent) 45%, transparent);
	}

	.bio__body a:hover {
		text-decoration-color: var(--accent);
	}
</style>
