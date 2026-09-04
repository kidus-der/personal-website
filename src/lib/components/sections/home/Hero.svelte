<!--
	Hero — the one orchestrated entrance on the site.

	The greeting cycles through six languages and settles on the Amharic hello,
	then the headline arrives line by line, then the sub, the buttons and the
	social row, and finally the verification card draws its ring. Everything else
	on the site reveals on scroll with `use:reveal`; this is the exception the
	motion brief allows.

	The staged elements are hidden in `onMount`, not in the stylesheet, and only
	when the animation is actually going to run. Server-rendered markup is
	therefore complete and visible: a reader with no JavaScript, or with reduced
	motion asked for, sees the finished hero rather than a blank column.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, durations, easings, reducedMotion, stagger } from '$lib/motion';
	import { magnetic } from '$lib/actions/magnetic';
	import BackgroundPaths from '$lib/components/kokonut/BackgroundPaths.svelte';
	import DynamicText from '$lib/components/kokonut/DynamicText.svelte';
	import SlideTextButton from '$lib/components/kokonut/SlideTextButton.svelte';
	import { site } from '$content/site';
	import { cn } from '$lib/utils/cn';
	import VerificationCard from './VerificationCard.svelte';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	const GREETING_WORDS = [
		{ text: 'ሰላም', lang: 'am' },
		{ text: 'Hello' },
		{ text: 'Bonjour', lang: 'fr' },
		{ text: 'Hola', lang: 'es' },
		{ text: 'こんにちは', lang: 'ja' },
		{ text: 'Ciao', lang: 'it' }
	];
	const GREETING_FINAL = "ሰላም, I'm Kidus.";

	const SOCIALS = [
		{ label: 'GitHub', href: site.socials.github, icon: 'github' },
		{ label: 'LinkedIn', href: site.socials.linkedin, icon: 'linkedin' },
		{ label: 'Google Scholar', href: site.socials.scholar, icon: 'scholar' }
	] as const;

	/** Seconds. The greeting has settled into its first word by here. */
	const HEADLINE_DELAY = 0.25;
	const LINE_STAGGER = 0.08;
	/** Gap between the sub, the buttons and the social row. */
	const STEP = 0.1;
	const SUB_DELAY = 0.55;
	/** Milliseconds; the card starts drawing while the buttons are still arriving. */
	const CARD_DELAY = 600;
	const LIFT = 24;

	let headlineEl = $state<HTMLHeadingElement | undefined>();
	let subEl = $state<HTMLParagraphElement | undefined>();
	let buttonsEl = $state<HTMLDivElement | undefined>();
	let socialsEl = $state<HTMLUListElement | undefined>();

	/** The verification card's cue. True from the start when nothing animates. */
	let cardStarted = $state(false);

	onMount(() => {
		if (reducedMotion()) {
			cardStarted = true;
			return;
		}

		const lines = [...(headlineEl?.querySelectorAll<HTMLElement>('.hero__line') ?? [])];
		const staged = [...lines, subEl, buttonsEl, socialsEl].filter(
			(element): element is HTMLElement => element !== undefined
		);
		for (const element of staged) element.style.opacity = '0';

		// Spread: Motion normalises the easing array, and the token is shared.
		// The tuple annotation is what makes it a cubic bezier rather than a
		// widened `number[]`, which Motion's `Easing` union does not accept.
		const timing = {
			duration: durations.slow,
			ease: [...easings.outExpo] as [number, number, number, number]
		};
		const rise = { y: [LIFT, 0], opacity: [0, 1] };

		if (lines.length > 0) {
			animate(lines, rise, {
				...timing,
				delay: stagger(LINE_STAGGER, { startDelay: HEADLINE_DELAY })
			});
		}
		if (subEl) animate(subEl, rise, { ...timing, delay: SUB_DELAY });
		if (buttonsEl) animate(buttonsEl, rise, { ...timing, delay: SUB_DELAY + STEP });
		if (socialsEl) animate(socialsEl, rise, { ...timing, delay: SUB_DELAY + STEP * 2 });

		const timer = setTimeout(() => (cardStarted = true), CARD_DELAY);
		return () => clearTimeout(timer);
	});
</script>

<section class={cn('hero', className)}>
	<BackgroundPaths opacity={0.5} />

	<div class="container hero__inner">
		<div class="hero__copy">
			<!--
				The wrapper exists so the greeting can be styled from here: a `class`
				handed to a component is not touched by Svelte's style scoping.
			-->
			<div class="hero__greeting">
				<DynamicText words={GREETING_WORDS} final={GREETING_FINAL} />
			</div>

			<h1 class="hero__headline" bind:this={headlineEl}>
				<span class="hero__line">I build the systems</span>
				<span class="hero__line">that tell <em class="hero__emphasis">real from fake</em>.</span>
			</h1>

			<p class="hero__sub" bind:this={subEl}>
				Founding Engineer at <a
					class="accent-link"
					href="https://www.scam.ai/en"
					target="_blank"
					rel="noopener noreferrer">Scam AI</a
				>. Eight papers on deepfake and document forensics. Computing Science and Economics at the
				University of Alberta.
			</p>

			<div class="hero__actions" bind:this={buttonsEl}>
				<SlideTextButton text="See my work" href="/work" />
				<SlideTextButton variant="ghost" text="Read the Buna Print" href="/blog" />
			</div>

			<ul class="hero__socials" bind:this={socialsEl}>
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

		<div class="hero__card">
			<VerificationCard animate={cardStarted} />
		</div>
	</div>
</section>

<style>
	.hero {
		/* The background paths are absolutely positioned into this box, and
		   `color` is what tints their strokes. */
		position: relative;
		overflow: hidden;
		color: var(--accent);
		padding-block: clamp(3.5rem, 9vw, 7rem) var(--spacing-section);
	}

	.hero__inner {
		position: relative;
		display: grid;
		gap: clamp(2.5rem, 6vw, 4rem);
		align-items: center;
		color: var(--text);
	}

	@media (min-width: 960px) {
		.hero__inner {
			/* 7/12 text, 5/12 card — the asymmetry the layout brief asks for. */
			grid-template-columns: 7fr 5fr;
		}
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
		font-family: var(--font-display);
		font-size: var(--text-display);
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.02;
		text-wrap: balance;
		color: var(--text);
	}

	/* The single permitted emphasis on the page. */
	.hero__emphasis {
		font-style: italic;
		color: var(--accent);
	}

	.hero__sub {
		max-width: 46ch;
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

	.hero__card {
		width: 100%;
		max-width: 30rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.hero__social {
			transition: none;
		}
	}
</style>
