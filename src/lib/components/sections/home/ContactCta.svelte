<!--
	ContactCta — the closing band, and the home of the page's single
	`ContactModal`.

	Both openers on the page (this button and the "Get in touch" link in the
	bento) flip the same module rune, so the dialog is mounted once, here, and
	bound to it. Rendering it in the contact band rather than at the top of the
	page keeps the ownership obvious: the section that invites the message is the
	section that carries the form.
-->
<script lang="ts">
	import ParticleButton from '$lib/components/kokonut/ParticleButton.svelte';
	import MouseEffectCard from '$lib/components/kokonut/MouseEffectCard.svelte';
	import ContactModal from '$lib/components/ui/ContactModal.svelte';
	import { contactModal } from '$lib/state/contact.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<section class={cn('contact-cta', className)}>
	<div class="container">
		<MouseEffectCard class="contact-cta__card">
			<div class="contact-cta__body">
				<h2 class="contact-cta__title">Let's build something.</h2>
				<p class="contact-cta__lede">
					Open to interesting research collaborations and any other opportunities.
				</p>
				<ParticleButton onclick={contactModal.show}>Say hello</ParticleButton>
			</div>
		</MouseEffectCard>
	</div>
</section>

<ContactModal bind:open={contactModal.open} />

<style>
	.contact-cta {
		padding-block: var(--spacing-section);
	}

	.contact-cta__body {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
		padding: clamp(1.5rem, 5vw, 3.5rem);
	}

	.contact-cta__title {
		font-family: var(--font-display);
		font-size: var(--text-3xl);
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.05;
		color: var(--text);
	}

	.contact-cta__lede {
		max-width: 44ch;
		font-size: var(--text-lg);
		color: var(--text-muted);
	}

	/*
		`:global` because a `class` handed to a component is not touched by
		Svelte's style scoping. The body supplies its own padding so the dot field
		runs to the card's edges.
	*/
	.contact-cta :global(.contact-cta__card .mouse-effect-card__content) {
		padding: 0;
	}
</style>
