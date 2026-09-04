<!--
	PublicationRow — one paper in the publications accordion.

	A textbook disclosure: a `<button>` header carrying `aria-expanded` and
	`aria-controls`, and a region it points at. Which row is open is the parent's
	business (only one at a time), so this component owns no open state — it
	renders `open` and reports intent through `ontoggle`.

	The header is a real button and nothing else, so Enter and Space come from the
	platform. Adding a key handler here would fire the toggle twice in a browser.

	Expanding animates `height` and therefore has to know the content's natural
	height, which only exists once the body is out of `hidden`. `hidden` is set on
	the element directly rather than through markup so it can be cleared, measured
	and animated inside one synchronous step, and so the collapsed body is really
	gone from the tab order rather than merely clipped to zero height.
-->
<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Tag from '$lib/components/ui/Tag.svelte';
	import { animate, durations, easings, reducedMotion } from '$lib/motion';
	import type { Publication } from '$lib/types/content';

	interface Props {
		pub: Publication;
		open: boolean;
		ontoggle: () => void;
	}

	let { pub, open, ontoggle }: Props = $props();

	const bodyId = $derived(`publication-${pub.id}`);

	let bodyEl = $state<HTMLElement | undefined>();
	let animation: ReturnType<typeof animate> | undefined;
	/** What the DOM currently shows. Diverges from `open` only mid-animation. */
	let shown = false;
	let mounted = false;

	const transition = { duration: durations.base, ease: easings.outExpo } as const;

	$effect(() => {
		// Read the two things this effect reacts to, then leave reactivity behind:
		// everything below writes to the DOM and to plain locals.
		const shouldOpen = open;
		const el = bodyEl;
		if (!el) return;

		if (!mounted) {
			mounted = true;
			settle(el, shouldOpen);
			return;
		}
		if (shouldOpen === shown) return;
		if (shouldOpen) expand(el);
		else collapse(el);
	});

	/**
	 * Run `done` once an animation stops running, however it stopped.
	 *
	 * Stopping a Motion animation rejects its `finished` promise, and a row
	 * toggled twice in quick succession does exactly that — so the rejection is
	 * swallowed rather than left to surface as an unhandled promise rejection.
	 * The callback still runs, and both callers re-read `open` before touching
	 * the DOM, so a superseded animation cannot undo the newer one's work.
	 */
	function onSettled(current: ReturnType<typeof animate>, done: () => void) {
		void current.finished.then(done, () => {
			if (animation !== current) return;
			done();
		});
	}

	/** Jump straight to a state, with no animation. Used on mount and reduced motion. */
	function settle(el: HTMLElement, isOpen: boolean) {
		shown = isOpen;
		el.hidden = !isOpen;
		el.style.height = isOpen ? 'auto' : '0px';
	}

	function expand(el: HTMLElement) {
		animation?.stop();
		shown = true;
		el.hidden = false;

		if (reducedMotion()) {
			el.style.height = 'auto';
			return;
		}

		el.style.height = '0px';
		const target = el.scrollHeight;
		animation = animate(el, { height: [0, target] }, transition);
		// Back to `auto` so the row keeps fitting content that reflows later.
		onSettled(animation, () => {
			if (open) el.style.height = 'auto';
		});
	}

	function collapse(el: HTMLElement) {
		animation?.stop();
		shown = false;

		if (reducedMotion()) {
			settle(el, false);
			return;
		}

		const from = el.scrollHeight;
		el.style.height = `${from}px`;
		animation = animate(el, { height: [from, 0] }, transition);
		onSettled(animation, () => {
			// Only retire the body if it is still meant to be closed; a fast
			// re-open would otherwise be hidden again the moment this resolves.
			if (!open) el.hidden = true;
		});
	}
</script>

<div class="pub-row" class:pub-row--open={open}>
	<button
		type="button"
		class="pub-row__header"
		aria-expanded={open}
		aria-controls={bodyId}
		onclick={ontoggle}
	>
		<span class="pub-row__year">{pub.year}</span>
		<span class="pub-row__venue"><Tag>{pub.venue}</Tag></span>
		<span class="pub-row__title">{pub.title}</span>
		<svg
			class="pub-row__chevron"
			viewBox="0 0 16 16"
			width="16"
			height="16"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M4 6l4 4 4-4"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>

	<div class="pub-row__body" id={bodyId} bind:this={bodyEl} hidden>
		<div class="pub-row__body-inner">
			<ul class="pub-row__bullets">
				{#each pub.bullets as bullet (bullet)}
					<li>{bullet}</li>
				{/each}
			</ul>

			<div class="pub-row__links">
				<Button variant="link" href={pub.url} target="_blank" rel="noopener noreferrer">
					Read on arXiv
				</Button>
				{#if pub.officialUrl}
					<Button variant="link" href={pub.officialUrl} target="_blank" rel="noopener noreferrer">
						ACM version
					</Button>
				{/if}
			</div>

			<div class="pub-row__topics">
				{#each pub.topics as topic (topic)}
					<Tag>{topic}</Tag>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.pub-row {
		border-bottom: 1px solid var(--border);
	}

	.pub-row__header {
		display: grid;
		grid-template-columns: 3.5rem auto 1fr auto;
		align-items: center;
		gap: 1rem;
		width: 100%;
		padding: 1.125rem 0;
		border: 0;
		background: none;
		text-align: left;
		cursor: pointer;
		color: var(--text);
	}

	.pub-row__header:hover .pub-row__title,
	.pub-row__header:focus-visible .pub-row__title {
		color: var(--accent);
	}

	.pub-row__header:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.pub-row__year {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	.pub-row__venue {
		display: inline-flex;
	}

	.pub-row__title {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 500;
		letter-spacing: -0.01em;
		line-height: 1.3;
		transition: color 200ms var(--ease-out-expo);
	}

	.pub-row__chevron {
		color: var(--text-muted);
		transition: transform 300ms var(--ease-out-expo);
	}

	.pub-row--open .pub-row__chevron {
		transform: rotate(180deg);
	}

	/* The animated box: its height is scripted, so it must clip its content. */
	.pub-row__body {
		overflow: hidden;
	}

	.pub-row__body-inner {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 68ch;
		padding: 0 0 1.5rem;
	}

	.pub-row__bullets {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: var(--text-base);
		line-height: 1.6;
		color: var(--text-muted);
	}

	.pub-row__bullets li {
		position: relative;
		padding-left: 1.125rem;
	}

	.pub-row__bullets li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.6em;
		width: 4px;
		height: 4px;
		border-radius: var(--radius-full);
		background-color: var(--border-strong);
	}

	.pub-row__links {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		font-size: var(--text-sm);
	}

	.pub-row__topics {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	@media (max-width: 640px) {
		.pub-row__header {
			grid-template-columns: auto auto 1fr;
			gap: 0.5rem 0.75rem;
		}

		.pub-row__title {
			grid-column: 1 / -1;
			font-size: var(--text-base);
		}

		.pub-row__chevron {
			justify-self: end;
		}
	}
</style>
