<script lang="ts">
	import { page } from '$app/stores';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { gsap } from '$lib/animation/gsap.config';
	import { themeStore } from '$lib/stores/theme';
	import { scrollStore } from '$lib/stores/scroll';
	import { cursorTarget } from '$lib/actions/cursor';
	import { magnetic } from '$lib/actions/magnetic';

	const { scrollY } = scrollStore;

	const navLinks = [
		{ href: '/work', label: 'Work' },
		{ href: '/about', label: 'About' },
		{ href: '/blog', label: 'The Buna Print' }
	];

	let mobileMenuOpen = $state(false);
	let overlayEl: HTMLDivElement | undefined = $state();
	let menuEl: HTMLDivElement | undefined = $state();
	let hamburgerEl: HTMLButtonElement | undefined = $state();

	let activeTl: gsap.core.Timeline | null = null;

	function openMobileMenu() {
		mobileMenuOpen = true;
		setTimeout(() => {
			if (!overlayEl || !menuEl || !hamburgerEl) return;
			activeTl?.kill();
			activeTl = gsap.timeline();
			activeTl
				.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
				.fromTo(
					menuEl,
					{ opacity: 0, x: '100%' },
					{ opacity: 1, x: '0%', duration: 0.4, ease: 'power3.out' },
					'<0.05'
				);
			hamburgerEl.setAttribute('aria-expanded', 'true');
		}, 0);
	}

	function closeMobileMenu() {
		if (!overlayEl || !menuEl) return;
		activeTl?.kill();
		activeTl = gsap.timeline({
			onComplete: () => {
				mobileMenuOpen = false;
				hamburgerEl?.setAttribute('aria-expanded', 'false');
			}
		});
		activeTl.to(menuEl, { opacity: 0, x: '100%', duration: 0.3, ease: 'power2.in' });
		activeTl.to(overlayEl, { opacity: 0, duration: 0.25, ease: 'power2.in' }, '<');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && mobileMenuOpen) closeMobileMenu();
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.isConnected) node.remove();
			}
		};
	}

	// Close mobile menu on navigation
	beforeNavigate(() => {
		if (mobileMenuOpen) closeMobileMenu();
	});

	afterNavigate(() => {
		if (mobileMenuOpen) closeMobileMenu();
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="nav" class:nav--scrolled={$scrollY > 60}>
	<nav class="nav__inner">
		<a href="/" class="nav__logo" use:cursorTarget={'hover'}>
			<img
				src={$themeStore === 'light'
					? '/icons/website-logo/website-logo-light-mode.png'
					: '/icons/website-logo/website-logo-dark-mode.png'}
				alt="Home"
				class="nav__logo-img"
			/>
		</a>

		<ul class="nav__links">
			{#each navLinks as link}
				<li>
					<a
						href={link.href}
						class="nav__link"
						class:nav__link--active={$page.url.pathname.startsWith(link.href)}
						use:cursorTarget={'hover'}
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>

		<button
			class="nav__hamburger"
			bind:this={hamburgerEl}
			onclick={openMobileMenu}
			aria-label="Open menu"
			aria-expanded="false"
			aria-controls="mobile-menu"
			use:cursorTarget={'hover'}
		>
			<span class="nav__hamburger-line"></span>
			<span class="nav__hamburger-line"></span>
			<span class="nav__hamburger-line"></span>
		</button>

		<button
			class="nav__theme-toggle"
			onclick={() => themeStore.toggle()}
			aria-label="Toggle theme"
			use:magnetic
			use:cursorTarget={'hover'}
		>
			<span class="nav__theme-icon" aria-hidden="true">
				{#if $themeStore === 'dark'}☀{:else}☾{/if}
			</span>
		</button>
	</nav>
</header>

{#if mobileMenuOpen}
	<div
		id="mobile-menu"
		use:portal
		bind:this={overlayEl}
		class="mobile-overlay"
		role="presentation"
		onclick={closeMobileMenu}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') closeMobileMenu();
		}}
	>
		<div
			bind:this={menuEl}
			class="mobile-menu"
			role="dialog"
			aria-modal="true"
			aria-label="Navigation menu"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<button
				class="mobile-menu__close"
				onclick={closeMobileMenu}
				aria-label="Close menu"
				use:cursorTarget={'hover'}
			>
				×
			</button>

			<ul class="mobile-menu__links">
				{#each navLinks as link}
					<li>
						<a
							href={link.href}
							class="mobile-menu__link"
							class:mobile-menu__link--active={$page.url.pathname.startsWith(link.href)}
							use:cursorTarget={'hover'}
							onclick={closeMobileMenu}
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}

<style>
	.nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		padding: 1.25rem var(--spacing-container);
		transition: padding 0.4s var(--ease-out-expo), background 0.4s var(--ease-out-expo),
			backdrop-filter 0.4s;
	}

	.nav--scrolled {
		padding: 1rem var(--spacing-container);
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(16px) saturate(1.5);
	}

	:global([data-theme='light']) .nav--scrolled {
		background: rgba(240, 240, 240, 0.75);
	}

	.nav__inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1400px;
		margin: 0 auto;
	}

	.nav__logo {
		display: block;
		line-height: 0;
		flex-shrink: 0;
	}

	.nav__logo-img {
		height: 5.6rem;
		width: auto;
		border-radius: var(--radius-sm);
		transition: transform 0.35s var(--ease-out-expo);
	}

	.nav__logo:hover .nav__logo-img {
		transform: scale(1.1);
	}

	.nav__links {
		display: flex;
		gap: 2.5rem;
		list-style: none;
	}

	.nav__link {
		font-size: var(--text-sm);
		letter-spacing: 0.05em;
		color: var(--text-muted);
		transition: color 0.2s;
		position: relative;
	}

	.nav__link::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		width: 0;
		height: 1px;
		background: var(--accent);
		transition: width 0.3s var(--ease-out-expo);
	}

	.nav__link:hover,
	.nav__link--active {
		color: var(--text);
	}

	.nav__link:hover::after,
	.nav__link--active::after {
		width: 100%;
	}

	/* ── Hamburger ───────────────────────────────── */
	.nav__hamburger {
		display: none;
		flex-direction: column;
		justify-content: center;
		gap: 5px;
		width: 32px;
		height: 32px;
		background: none;
		border: none;
		cursor: none;
		padding: 0;
	}

	.nav__hamburger-line {
		display: block;
		width: 100%;
		height: 2px;
		background: var(--text-muted);
		border-radius: 2px;
		transition: background 0.2s;
	}

	.nav__hamburger:hover .nav__hamburger-line {
		background: var(--accent);
	}

	/* ── Theme toggle ────────────────────────────── */
	.nav__theme-toggle {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		transition: color 0.2s;
		font-size: 1.75rem;
		background: none;
		border: none;
		cursor: none;
		flex-shrink: 0;
	}

	.nav__theme-toggle:hover {
		color: var(--accent);
	}

	/* ── Mobile overlay ──────────────────────────── */
	.mobile-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.7);
		cursor: none;
	}

	/* ── Mobile menu panel ──────────────────────── */
	.mobile-menu {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: min(320px, 85vw);
		background: var(--surface);
		border-left: 1px solid var(--border);
		padding: 5rem 2rem 2rem;
		display: flex;
		flex-direction: column;
		cursor: none;
	}

	:global([data-theme='light']) .mobile-menu {
		background: var(--bg);
		border-left: 1px solid rgba(43, 92, 230, 0.12);
	}

	.mobile-menu__close {
		position: absolute;
		top: 1.25rem;
		right: 1.25rem;
		font-size: 2rem;
		color: var(--text-muted);
		line-height: 1;
		transition: color 0.2s;
		font-family: inherit;
		cursor: none;
		background: none;
		border: none;
	}

	.mobile-menu__close:hover {
		color: var(--text);
	}

	.mobile-menu__links {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.mobile-menu__link {
		display: block;
		font-size: var(--text-xl);
		font-weight: 500;
		color: var(--text-muted);
		padding: 0.75rem 0;
		transition: color 0.2s, padding-left 0.3s var(--ease-out-expo);
		border-bottom: 1px solid var(--border);
	}

	.mobile-menu__link:hover,
	.mobile-menu__link--active {
		color: var(--text);
		padding-left: 0.5rem;
	}

	.mobile-menu__link--active {
		color: var(--accent);
	}

	/* ── Responsive: tablet + mobile ─────────────── */
	@media (max-width: 768px) {
		.nav__logo-img {
			height: 3rem;
		}

		.nav__links {
			display: none;
		}

		.nav__hamburger {
			display: flex;
		}

		.nav__inner {
			gap: 0.75rem;
		}
	}

	/* ── Responsive: tablet gap reduction ────────── */
	@media (min-width: 769px) and (max-width: 1024px) {
		.nav__links {
			gap: 1.5rem;
		}
	}
</style>
