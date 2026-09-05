<!--
	Hero — the one orchestrated entrance on the site.

	Everything else reveals on scroll with `use:reveal`; this is the exception the
	motion brief allows. The greeting, the three headline lines, the sub, the
	buttons and the social row each rise into place on a fixed beat.

	The hero is one full-width block of copy over a full-bleed `FlowField`. It used
	to be a 7/12 column of text beside a 5/12 picture; the picture is the whole
	hero now, and `FlowField` runs its own entrance rather than being staged from
	here — it is the background, not one of the staged lines.

	**One deterministic sequence, started on mount.** The entrance used to be
	chained off `DynamicText`'s `onDone`, with a fallback timer in case that never
	arrived — which meant the headline waited nearly two seconds on a greeting it
	has nothing to do with. The greeting now cycles alongside it and the sequence
	is a plain schedule: no handover, no timer, nothing that can strand the hero
	if one part of it misbehaves.

	**Nothing is hidden from here.** The staged elements carry `data-hero` and the
	stylesheet hides them before first paint while `<html>` has the `js` class —
	see CLAUDE.md, "Animation system". Writing `opacity: 0` from `onMount`, as
	this used to, is what made the server-rendered hero paint, vanish and fade
	back in. Each element is released with `data-revealed` as its animation lands.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, easings, markRevealed, reducedMotion, stagger } from '$lib/motion';
	import { magnetic } from '$lib/actions/magnetic';
	import DynamicText from '$lib/components/kokonut/DynamicText.svelte';
	import SlideTextButton from '$lib/components/kokonut/SlideTextButton.svelte';
	import FlowField from '$lib/components/kokonut/FlowField.svelte';
	import { site } from '$content/site';
	import { cn } from '$lib/utils/cn';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	const GREETING_WORDS = [
		{ text: 'ሰላም', lang: 'am' },
		{ text: 'Hello' },
		{ text: 'Bonjour', lang: 'fr' },
		{ text: 'Hola', lang: 'es' },
		{ text: 'Ciao', lang: 'it' }
	];
	const GREETING_FINAL = "ሰላም, I'm Kidus.";
	/**
	 * Fast enough that the whole cycle is over well inside the entrance it now
	 * runs alongside, rather than being something the rest of the hero waits on.
	 */
	const GREETING_INTERVAL = 260;

	const SOCIALS = [
		{ label: 'GitHub', href: site.socials.github, icon: 'github' },
		{ label: 'LinkedIn', href: site.socials.linkedin, icon: 'linkedin' },
		{ label: 'Google Scholar', href: site.socials.scholar, icon: 'scholar' }
	] as const;

	/** How far each element rises, and how long it takes. */
	const LIFT = 16;
	const DURATION = 0.7;
	const LINE_STAGGER = 0.08;

	/**
	 * The schedule, in seconds from mount. Selectors rather than bindings: the
	 * order a reader sees is the order this list is written in, which is the part
	 * worth being able to take in at a glance.
	 */
	const ENTRANCE: { selector: string; delay: number; stagger?: number }[] = [
		{ selector: '.hero__greeting', delay: 0 },
		{ selector: '.hero__line', delay: 0.15, stagger: LINE_STAGGER },
		{ selector: '.hero__sub', delay: 0.55 },
		{ selector: '.hero__actions', delay: 0.65 },
		{ selector: '.hero__socials', delay: 0.75 }
	];

	type Animation = ReturnType<typeof animate>;

	let sectionEl = $state<HTMLElement | undefined>();
	/** Everything in flight, so unmounting mid-entrance stops it dead. */
	let running: Animation[] = [];

	function find(selector: string): HTMLElement[] {
		return [...(sectionEl?.querySelectorAll<HTMLElement>(selector) ?? [])];
	}

	onMount(() => {
		// Resolved once, from the schedule rather than from `[data-hero]`: the
		// field behind the copy carries that attribute too and runs its own
		// entrance, and claiming it from here would re-mark an element that has
		// already released itself, leaving it claimed forever.
		const staged = ENTRANCE.map((step) => ({ step, elements: find(step.selector) })).filter(
			({ elements }) => elements.length > 0
		);

		// Reduced motion: the markup is already the finished hero, so the only
		// thing left to do is lift the pre-hide.
		if (reducedMotion()) {
			markRevealed(staged.flatMap(({ elements }) => elements));
			return;
		}

		// This component owns the entrance of everything it staged, so the
		// stylesheet's safety net can stand down for all of it — a net that fired
		// at three seconds would override the inline opacity mid-animation.
		for (const { elements } of staged) {
			for (const element of elements) element.setAttribute('data-motion-ready', '');
		}

		// The tuple annotation is what makes the shared token a cubic bezier
		// rather than a widened `number[]`, which Motion's `Easing` union rejects.
		const ease = [...easings.outExpo] as [number, number, number, number];
		const rise = { opacity: [0, 1], y: [LIFT, 0] };

		for (const { step, elements } of staged) {
			const delay =
				step.stagger === undefined ? step.delay : stagger(step.stagger, { startDelay: step.delay });
			running.push(
				animate(elements, rise, {
					duration: DURATION,
					ease,
					delay,
					onComplete: () => markRevealed(elements)
				})
			);
		}

		return () => {
			for (const animation of running) animation.stop();
			running = [];
		};
	});
</script>

<section class={cn('hero', className)} bind:this={sectionEl}>
	<FlowField intensity="bold" />

	<div class="container hero__inner">
		<div class="hero__copy">
			<!--
				The wrapper exists so the greeting can be styled from here: a `class`
				handed to a component is not touched by Svelte's style scoping.
			-->
			<div class="hero__greeting" data-hero>
				<DynamicText words={GREETING_WORDS} final={GREETING_FINAL} interval={GREETING_INTERVAL} />
			</div>

			<h1 class="hero__headline">
				<span class="hero__line" data-hero>I build intelligent</span>
				<span class="hero__line" data-hero>systems that</span>
				<span class="hero__line" data-hero><em class="hero__emphasis">reason and act</em>.</span>
			</h1>

			<p class="hero__sub" data-hero>
				Founding Engineer at <a
					class="accent-link"
					href="https://www.scam.ai/en"
					target="_blank"
					rel="noopener noreferrer">Scam AI</a
				>. Nine papers on deepfake and document forensics. Computing Science and Economics at the
				University of Alberta.
			</p>

			<div class="hero__actions" data-hero>
				<SlideTextButton text="See my work" href="/work" />
				<SlideTextButton variant="ghost" text="Read the Buna Print" href="/blog" />
			</div>

			<ul class="hero__socials" data-hero>
				{#each SOCIALS as social (social.label)}
					<li>
						<a
							class="hero__social"
							href={social.href}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={social.label}
							use:magnetic
						>
							{#if social.icon === 'github'}
								<!-- GitHub octicon (MIT, GitHub Inc.) -->
								<svg
									viewBox="0 0 16 16"
									width="18"
									height="18"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
									/>
								</svg>
							{:else if social.icon === 'linkedin'}
								<!-- LinkedIn glyph (Simple Icons, CC0) -->
								<svg
									viewBox="0 0 24 24"
									width="18"
									height="18"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z"
									/>
								</svg>
							{:else}
								<!-- Google Scholar glyph (Simple Icons, CC0) -->
								<svg
									viewBox="0 0 24 24"
									width="18"
									height="18"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										d="M12 19.26 0 9.5 12 0l12 9.5-12 9.76Zm0 4.74a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z"
									/>
								</svg>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>

<style>
	.hero {
		position: relative;
		overflow: hidden;
		color: var(--accent);
		padding-block: clamp(3.5rem, 9vw, 7rem) var(--spacing-section);
	}

	/*
		A soft wash of the page's own background behind the copy. The field runs
		the full width of the hero now, so the headline sits over the busiest part
		of the weave; this is what keeps it at AA in both themes without dimming
		the field everywhere else.
	*/
	.hero::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(
			60% 80% at 25% 50%,
			color-mix(in srgb, var(--bg) 80%, transparent),
			transparent
		);
	}

	/*
		One full-width text block over the field, rather than the old 7/12 column
		beside a 5/12 picture. The picture is the whole hero now.
	*/
	.hero__inner {
		position: relative;
		z-index: 1;
		color: var(--text);
	}

	.hero__copy {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1.5rem;
	}

	/*
		The cycling words carry a `lang`, so the Ethiopic face can be scoped to
		exactly the Amharic ones. The settled string mixes scripts inside a single
		text node and falls back to the browser's own per-glyph substitution — the
		alternative would be hard-coding font names next to the tokens.
	*/
	.hero__greeting {
		font-family: var(--font-body);
		font-size: var(--text-lg);
		color: var(--text-muted);
	}

	.hero__greeting :global([lang='am']) {
		font-family: var(--font-ethiopic);
	}

	.hero__headline {
		display: flex;
		flex-direction: column;
		/* Three short lines at display size: the measure, not the column, is what
		   decides where the headline breaks. */
		max-width: 12ch;
		font-family: var(--font-display);
		font-size: var(--text-display);
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.02;
		color: var(--text);
	}

	/*
		The balance belongs on the spans, not the flex container above: the
		container holds no text of its own, and each span is the block that can
		actually wrap on a narrow screen.
	*/
	.hero__line {
		text-wrap: balance;
	}

	/* The single permitted emphasis on the page. */
	.hero__emphasis {
		font-style: italic;
		color: var(--accent);
	}

	.hero__sub {
		max-width: 560px;
		font-size: var(--text-lg);
		color: var(--text-muted);
	}

	.hero__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.hero__socials {
		display: flex;
		gap: 0.5rem;
		list-style: none;
	}

	.hero__social {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-full);
		color: var(--text-muted);
		transition:
			color 200ms var(--ease-out-expo),
			border-color 200ms var(--ease-out-expo);
	}

	.hero__social:hover,
	.hero__social:focus-visible {
		color: var(--accent);
		border-color: var(--border-strong);
	}

	@media (prefers-reduced-motion: reduce) {
		.hero__social {
			transition: none;
		}
	}
</style>
