<script lang="ts">
	import { page } from '$app/stores';
	import { themeStore } from '$lib/stores/theme';
	import { scrollStore } from '$lib/stores/scroll';
	import { cursorTarget } from '$lib/actions/cursor';
	import { magnetic } from '$lib/actions/magnetic';

	const { scrollY } = scrollStore;

	const navLinks = [
		{ href: '/work', label: 'Work' },
		{ href: '/about', label: 'About' },
		{ href: '/blog', label: 'Blog' }
	];
</script>

<header
	class="nav"
	class:nav--scrolled={$scrollY > 60}
>
	<nav class="nav__inner">
		<a href="/" class="nav__logo" use:cursorTarget={'hover'}>
			<span>KD</span>
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
			class="nav__theme-toggle"
			onclick={() => themeStore.toggle()}
			aria-label="Toggle theme"
			use:magnetic
		>
			<span class="nav__theme-icon" aria-hidden="true">
				{#if $themeStore === 'dark'}☀{:else}☾{/if}
			</span>
		</button>
	</nav>
</header>

<style>
	.nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		padding: 1.5rem var(--spacing-container);
		transition: padding 0.4s var(--ease-out-expo), background 0.4s var(--ease-out-expo),
			backdrop-filter 0.4s;
	}

	.nav--scrolled {
		padding: 1rem var(--spacing-container);
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(16px) saturate(1.5);
	}

	.nav__inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1400px;
		margin: 0 auto;
	}

	.nav__logo {
		font-size: var(--text-base);
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.nav__logo:hover span {
		color: var(--accent);
	}

	.nav__logo span {
		transition: color 0.2s;
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

	.nav__theme-toggle {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		transition: color 0.2s;
		font-size: 1rem;
	}

	.nav__theme-toggle:hover {
		color: var(--accent);
	}
</style>
