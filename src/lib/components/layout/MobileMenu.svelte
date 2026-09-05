<!--
	MobileMenu — the full-screen navigation overlay below 768px.

	Mounted only while open, so opening is a mount and closing is an unmount: the
	entrance animation, the scroll lock and the focus trap all live in the normal
	mount/destroy lifecycle instead of being reconciled against an `open` prop.

	Closing is the caller's decision, not this component's — `onclose` is called
	on Escape, on the close button, on a backdrop click and after any navigation.
	`Nav` owns the open state and returns focus to the trigger, which is where the
	trigger lives.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { animate, durations, easings, reducedMotion, stagger } from '$lib/motion';
	import ThemeSwitch from '$lib/components/kokonut/ThemeSwitch.svelte';
	import { navItems } from './navItems';
	import { isActivePath } from '$lib/utils/navigation';
	import { cn } from '$lib/utils/cn';

	interface Props {
		/** Matches the trigger's `aria-controls`. */
		id?: string;
		onclose: () => void;
		class?: string;
	}

	let { id = 'mobile-menu', onclose, class: className = '' }: Props = $props();

	/** Seconds between consecutive link entrances. */
	const LINK_STAGGER = 0.06;

	let dialogEl = $state<HTMLDivElement | undefined>();
	let linkEls = $state<(HTMLAnchorElement | undefined)[]>([]);

	// Any navigation started from inside the menu — or from a browser gesture
	// while it is open — should leave the reader looking at the new page.
	afterNavigate(() => onclose());

	/** The conventional tabbable set, in DOM order. */
	const FOCUSABLE =
		'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

	/** Tabbable descendants, in DOM order. Re-read per keystroke: cheap, and correct. */
	function focusable(): HTMLElement[] {
		if (!dialogEl) return [];
		return [...dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
			(element) => element.tabIndex !== -1
		);
	}

	/**
	 * Take everything outside the dialog out of the accessibility tree.
	 *
	 * A focus trap only stops Tab; a screen reader's virtual cursor walks the DOM
	 * regardless. `inert` is what actually makes the page behind a modal go away,
	 * so it is applied to every sibling on the path from the dialog up to `<body>`
	 * — the dialog is nested inside the layout shell, so inerting `body`'s children
	 * alone would leave the header and the page content reachable.
	 *
	 * Returns the undo, which records whether each element already had the
	 * attribute rather than assuming this component put it there.
	 */
	function isolate(dialog: HTMLElement): () => void {
		const touched: { element: Element; had: boolean }[] = [];

		let node: HTMLElement = dialog;
		while (node.parentElement) {
			const parent: HTMLElement = node.parentElement;
			for (const sibling of parent.children) {
				if (sibling === node) continue;
				touched.push({ element: sibling, had: sibling.hasAttribute('inert') });
				sibling.setAttribute('inert', '');
			}
			if (parent === document.body) break;
			node = parent;
		}

		return () => {
			for (const { element, had } of touched) {
				if (!had) element.removeAttribute('inert');
			}
		};
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onclose();
			return;
		}

		if (event.key !== 'Tab') return;

		// Bound to `document`, not the dialog: a Tab pressed while focus has escaped
		// — browser chrome, an address-bar round trip, a stray programmatic focus —
		// must still be pulled back in, and a listener on the dialog never sees it.
		const elements = focusable();
		if (elements.length === 0) return;
		const first = elements[0];
		const last = elements[elements.length - 1];
		const active = document.activeElement;
		const inside = Boolean(dialogEl?.contains(active));

		if (event.shiftKey && (active === first || !inside)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && (active === last || !inside)) {
			event.preventDefault();
			first.focus();
		}
	}

	onMount(() => {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		const release = dialogEl ? isolate(dialogEl) : () => {};
		document.addEventListener('keydown', onkeydown);

		focusable()[0]?.focus();

		const links = linkEls.filter((element): element is HTMLAnchorElement => Boolean(element));
		let animation: ReturnType<typeof animate> | undefined;

		if (!reducedMotion() && links.length > 0) {
			// Hidden synchronously so the first paint never shows the final state,
			// then handed back to the stylesheet once every link has arrived.
			for (const link of links) {
				link.style.opacity = '0';
				link.style.transform = 'translateY(16px)';
			}
			animation = animate(
				links,
				{ opacity: [0, 1], y: [16, 0] },
				{
					duration: durations.base,
					ease: easings.outExpo,
					delay: stagger(LINK_STAGGER)
				}
			);
			animation.finished
				.then(() => {
					for (const link of links) {
						link.style.removeProperty('opacity');
						link.style.removeProperty('transform');
					}
				})
				.catch(() => {
					// Interrupted by an unmount — nothing left to clean up.
				});
		}

		return () => {
			animation?.stop();
			document.removeEventListener('keydown', onkeydown);
			release();
			document.body.style.overflow = previousOverflow;
		};
	});
</script>

<!--
	`aria-modal` plus the focus trap is the contract; the backdrop button is a
	real control so a pointer user can dismiss without reaching the X, and it is
	kept out of the tab order because Escape and the X already serve keyboards.
-->
<div
	bind:this={dialogEl}
	{id}
	class={cn('mobile-menu', className)}
	role="dialog"
	aria-modal="true"
	aria-label="Navigation"
	tabindex="-1"
>
	<button
		type="button"
		class="mobile-menu__scrim"
		tabindex="-1"
		aria-hidden="true"
		onclick={() => onclose()}
	></button>

	<div class="mobile-menu__panel">
		<!-- Not "Primary": the desktop `MorphicNav` owns that landmark name. -->
		<nav class="mobile-menu__links" aria-label="Mobile">
			{#each navItems as item, index (item.href)}
				<a
					bind:this={linkEls[index]}
					href={item.href}
					class="mobile-menu__link"
					class:mobile-menu__link--current={isActivePath(page.url.pathname, item.href)}
					aria-current={isActivePath(page.url.pathname, item.href) ? 'page' : undefined}
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="mobile-menu__footer">
			<ThemeSwitch showLabel />
			<button
				type="button"
				class="mobile-menu__close"
				aria-label="Close navigation"
				onclick={() => onclose()}
			>
				Close
			</button>
		</div>
	</div>
</div>

<style>
	.mobile-menu {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.mobile-menu__scrim {
		position: absolute;
		inset: 0;
		border: 0;
		padding: 0;
		background-color: color-mix(in srgb, var(--bg) 96%, transparent);
		backdrop-filter: blur(20px);
		cursor: default;
	}

	.mobile-menu__panel {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 3rem;
		padding-inline: var(--spacing-container);
		padding-block: 6rem 3rem;
	}

	.mobile-menu__links {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.mobile-menu__link {
		font-family: var(--font-display);
		font-size: 2.5rem;
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.15;
		color: var(--text-muted);
		text-decoration: none;
		transition: color 200ms var(--ease-out-expo);
	}

	.mobile-menu__link:hover,
	.mobile-menu__link--current {
		color: var(--text);
	}

	.mobile-menu__link--current {
		text-decoration: underline;
		text-decoration-color: var(--accent);
		text-decoration-thickness: 2px;
		text-underline-offset: 0.18em;
	}

	.mobile-menu__footer {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.mobile-menu__close {
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		padding: 0.5rem 1rem;
		background: transparent;
		color: var(--text-muted);
		font-family: var(--font-body);
		font-size: var(--text-sm);
		cursor: pointer;
		transition:
			color 200ms var(--ease-out-expo),
			border-color 200ms var(--ease-out-expo);
	}

	.mobile-menu__close:hover {
		color: var(--text);
		border-color: var(--border-strong);
	}

	@media (prefers-reduced-motion: reduce) {
		.mobile-menu__link,
		.mobile-menu__close {
			transition: none;
		}
	}
</style>
