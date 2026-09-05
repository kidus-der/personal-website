<!--
	Nav — the site's fixed header.

	Three zones on one grid so the pill is optically centred regardless of how
	wide the logo or the controls get: logo, `MorphicNav`, controls. Past 24px of
	scroll the bar picks up a glass background and a hairline, which is the only
	thing that separates it from content once the page moves.

	The mobile overlay is rendered as a sibling of the bar, not inside it: the
	bar's `backdrop-filter` would otherwise become the containing block for the
	overlay's `position: fixed` and trap it inside the header's box.
-->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/state';
	import MorphicNav from '$lib/components/kokonut/MorphicNav.svelte';
	import ThemeSwitch from '$lib/components/kokonut/ThemeSwitch.svelte';
	import MobileMenu from './MobileMenu.svelte';
	import { navItems } from './navItems';
	import { theme } from '$lib/state/theme.svelte';
	import { cn } from '$lib/utils/cn';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	/** Pixels of scroll before the bar becomes glass. */
	const GLASS_AT = 24;

	const MENU_ID = 'mobile-menu';

	/** One past the mobile breakpoint: matching means the pill is back. */
	const DESKTOP_QUERY = '(min-width: 769px)';

	let scrolled = $state(false);
	let menuOpen = $state(false);
	let hamburgerEl = $state<HTMLButtonElement | undefined>();

	const logoSrc = $derived(
		theme.current === 'light'
			? '/icons/website-logo/website-logo-light-mode.png'
			: '/icons/website-logo/website-logo-dark-mode.png'
	);

	async function closeMenu() {
		if (!menuOpen) return;
		menuOpen = false;
		// The overlay is unmounting and focus would fall to <body>; put it back on
		// the control that opened it. Only after the flush, though: the menu marks
		// this header `inert` while it is open and lifts that in its teardown, and
		// focusing an inert element is a no-op.
		await tick();
		hamburgerEl?.focus();
	}

	onMount(() => {
		const onscroll = () => {
			scrolled = window.scrollY > GLASS_AT;
		};
		onscroll();
		window.addEventListener('scroll', onscroll, { passive: true });

		// Resizing or rotating past the breakpoint puts the pill back on screen,
		// which would leave an unreachable overlay covering the page.
		const desktop = window.matchMedia(DESKTOP_QUERY);
		const onbreakpoint = (event: MediaQueryListEvent) => {
			if (event.matches) closeMenu();
		};
		desktop.addEventListener('change', onbreakpoint);

		return () => {
			window.removeEventListener('scroll', onscroll);
			desktop.removeEventListener('change', onbreakpoint);
		};
	});
</script>

<header class={cn('nav', scrolled && 'nav--scrolled', className)}>
	<div class="container nav__inner">
		<a href="/" class="nav__logo">
			<img src={logoSrc} alt="Kidus Dereje home" width="44" height="44" />
		</a>

		<MorphicNav class="nav__pill" items={navItems} current={page.url.pathname} />

		<div class="nav__controls">
			<ThemeSwitch />
			<button
				bind:this={hamburgerEl}
				type="button"
				class="nav__hamburger"
				aria-label={menuOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={menuOpen}
				aria-controls={MENU_ID}
				onclick={() => (menuOpen ? closeMenu() : (menuOpen = true))}
			>
				<span class="nav__hamburger-bar" aria-hidden="true"></span>
				<span class="nav__hamburger-bar" aria-hidden="true"></span>
			</button>
		</div>
	</div>
</header>

{#if menuOpen}
	<MobileMenu id={MENU_ID} onclose={closeMenu} />
{/if}

<style>
	.nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 60;
		border-bottom: 1px solid transparent;
		transition:
			background-color 300ms var(--ease-out-expo),
			border-color 300ms var(--ease-out-expo);
	}

	.nav--scrolled {
		background-color: color-mix(in srgb, var(--surface) 70%, transparent);
		backdrop-filter: blur(16px);
		border-bottom-color: var(--border);
	}

	.nav__inner {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 1rem;
		height: 4.5rem;
	}

	.nav__logo {
		justify-self: start;
		display: inline-flex;
		align-items: center;
		border-radius: var(--radius-md);
	}

	.nav__logo img {
		height: 44px;
		width: auto;
		display: block;
	}

	.nav__controls {
		justify-self: end;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.nav__hamburger {
		display: none;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 5px;
		height: 2.25rem;
		width: 2.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--text);
		cursor: pointer;
	}

	.nav__hamburger-bar {
		display: block;
		width: 16px;
		height: 1.5px;
		border-radius: var(--radius-full);
		background-color: currentColor;
	}

	/* The pill is the desktop affordance; below this the hamburger takes over. */
	@media (max-width: 768px) {
		.nav :global(.nav__pill) {
			display: none;
		}

		.nav__hamburger {
			display: flex;
		}

		.nav__inner {
			grid-template-columns: auto 1fr;
			height: 4rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav {
			transition: none;
		}
	}
</style>
