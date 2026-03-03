---
title: "How I Built This Site"
description: A technical deep-dive into the decisions behind this personal site — from choosing SvelteKit over Next.js, to syncing GSAP with Lenis, to wiring up a fast mdsvex blog that actually feels good to read.
publishedAt: "2026-03-03"
tags: ["SvelteKit", "GSAP", "TypeScript", "Web Performance"]
draft: false
---

Every personal site is a confession. The stack you choose, the animations you obsess over, the corners you cut — it's all legible to anyone who looks at the source. This one is no different.

I rebuilt my portfolio from scratch over the past few months. This post documents the decisions that held up, the ones that didn't, and a few things I'd do differently next time.

## Why SvelteKit (Not Next.js)

I've shipped production Next.js apps. I like it fine. But for a personal site, the bundle overhead and the "everything is a server component now" mental model felt like carrying a toolbox to a coffee meeting. I wanted something that would get out of my way.

SvelteKit's compile-time reactivity means the framework itself mostly disappears from the output. There's no virtual DOM. State mutations are genuine assignments. The compiler handles the rest. For a site this small, that clarity is worth a lot.

The other thing that tipped me was **Svelte 5's rune system**. Derived state and effects are now explicit — you write `$derived(x + 1)` instead of `$: derivedX = x + 1`. It reads like intent, not magic.

```typescript
// Svelte 4 — implicit reactivity
$: title = post.title.toUpperCase();

// Svelte 5 — explicit runes
const title = $derived(post.title.toUpperCase());
```

The rune version is slightly more to type but infinitely easier to audit. When something re-renders unexpectedly, you know exactly which derived value to look at.

### The One Thing I Miss from Next.js

The `next/image` component. SvelteKit has no equivalent, and getting responsive, lazily-loaded images right by hand is genuinely annoying. I ended up writing a small `<BlogImage>` wrapper that adds `loading="lazy"` and `decoding="async"` everywhere, but it's not the same as a well-tuned image pipeline.

## GSAP + Lenis: Making Them Not Fight

Smooth scroll and scroll-triggered animations are conceptually the same thing, but if you wire them up naively they'll fight over who owns the scroll position. The fix is a three-line integration:

```typescript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis();

// Hand Lenis's RAF output directly to GSAP's ticker
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Keep ScrollTrigger in sync with Lenis's virtual scroll position
lenis.on('scroll', ScrollTrigger.update);
```

The key insight: `gsap.ticker` becomes the single RAF loop. Lenis is no longer fighting `requestAnimationFrame` directly — it's just a consumer of GSAP's tick, which means they're always in sync.

One edge case that bit me: on SvelteKit navigations, ScrollTrigger's internal state goes stale. You have to tear down and reinitialize around `beforeNavigate` and `afterNavigate`:

```typescript
import { beforeNavigate, afterNavigate } from '$app/navigation';

beforeNavigate(() => {
  lenis.destroy();
  ScrollTrigger.getAll().forEach((t) => t.kill());
});

afterNavigate(() => {
  lenis = new Lenis();
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  lenis.on('scroll', ScrollTrigger.update);
  ScrollTrigger.refresh();
});
```

Without this, navigating back to a page leaves you with phantom scroll triggers firing at wrong positions. It's the kind of bug that only shows up in production when you've already forgotten what code could possibly cause it.

### GSAP Plugin Registration

GSAP plugins must be registered **once**, globally, before any component tries to use them. I handle this in the root layout's `<script>` block, not in individual components:

```typescript
// src/routes/+layout.svelte
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, Flip);
```

If you register inside a component, you might get double-registration warnings in dev mode, and you'll definitely get subtle bugs when components mount out of order.

## Svelte Actions as an Animation Abstraction Layer

My original instinct was to put GSAP calls directly in `onMount`. That works until you have fifteen components each doing their own `onMount` setup, and suddenly you're copy-pasting the same options object everywhere.

The cleaner approach is Svelte **actions** — functions that attach to DOM nodes and return a `destroy` callback:

```typescript
// src/lib/actions/gsap.ts
import { gsap } from 'gsap';
import type { Action } from 'svelte/action';

interface GsapFromOptions extends gsap.TweenVars {
  delay?: number;
}

export const gsapFrom: Action<HTMLElement, GsapFromOptions> = (node, options) => {
  const tween = gsap.from(node, {
    duration: 0.6,
    ease: 'power3.out',
    ...options
  });

  return {
    destroy() {
      tween.kill();
    }
  };
};
```

Then in any component:

```svelte
<h1 use:gsapFrom={{ opacity: 0, y: 24, delay: 0.1 }}>Hello</h1>
```

The tween is automatically killed when the element unmounts. No memory leaks, no cleanup code scattered across `onDestroy` calls, no accidental double-animations.

> The best abstraction is one that removes a decision without removing control. Actions fit this definition precisely — you can always drop down to `onMount` for one-off cases while keeping the common path clean.

## The Blog Section: mdsvex

Adding a blog to a SvelteKit site used to mean picking a CMS or building your own. mdsvex changes that — it's a preprocessor that transforms `.md` files into Svelte components. Each file gets compiled with full Svelte component interpolation, which means you can do things like:

```markdown
<Counter initialCount={5} />

This counter starts at five because I said so.
```

And it just works. The `.md` file imports the component, Svelte compiles it, the user gets an interactive component inside a prose document.

### Syntax Highlighting with Shiki

Getting syntax highlighting right was more involved than I expected. The initial approach — dual theme (dark/light) — produced a subtle bug: in light mode, the syntax colors disappeared entirely and text fell back to the system color.

The root cause was how Shiki outputs dual-theme styles. In dual-theme mode, it puts the **light** hex value as an inline `style="color:#..."` on each span, and the **dark** value as a CSS variable `--shiki-dark`. So the CSS rule `color: var(--shiki-light)` does nothing because `--shiki-light` is never defined as a variable — it only exists as a hardcoded inline style.

The fix: drop dual-theme entirely. Code blocks now always render on a dark background (`#22272e`, the `github-dark-dimmed` surface) regardless of the site's light/dark toggle. This is standard practice in dev blogs — the contrast ratio is better and users expect code to be dark.

| Approach | Light-mode colors | Dark-mode colors | Complexity |
|---|---|---|---|
| Dual-theme (CSS vars) | Broken — var never set | Works | High |
| Dual-theme (inline style) | Works | Works | Medium |
| Single dark theme | N/A (dark always) | Works | Low |

We went with the third option.

### TOC with IntersectionObserver

The table of contents tracks the active heading using `IntersectionObserver` rather than `scroll` events. The distinction matters: scroll events fire constantly and require manual throttling. `IntersectionObserver` fires only when an element crosses a threshold, which is exactly what we need.

```typescript
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        activeId = entry.target.id;
      }
    }
  },
  { rootMargin: '-10% 0px -80% 0px' }
);
```

The `rootMargin` here is the interesting part. `-10% 0px -80% 0px` means the intersection zone is a 10% strip near the top of the viewport. Headings only "become active" when they enter that strip — so the active TOC item changes right as you're reading that section, not when the heading scrolls off the bottom.

## TypeScript Throughout

The TypeScript config is strict by default. No `any`, `noImplicitReturns`, `exactOptionalPropertyTypes`. It adds friction early and removes it everywhere else.

The one setting I wouldn't remove:

```json
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": true
  }
}
```

This makes `{ x?: string }` and `{ x?: string | undefined }` genuinely different types. Without it, you can accidentally pass `undefined` for an optional field and TypeScript shrugs. With it, the compiler catches the distinction. Worth the occasional extra `| undefined` annotation.

> [!TIP]
> If `exactOptionalPropertyTypes` produces too many errors on an existing codebase, add it incrementally by first running `tsc --strict` and fixing those errors, then layering in `exactOptionalPropertyTypes` as a second pass.

> [!NOTE]
> SvelteKit generates its own `tsconfig.json` that extends your base config. Don't put path aliases in your own `paths` — put them in `kit.alias` in `svelte.config.js`. SvelteKit will propagate them to the generated config automatically.

## Performance Notes

A few specific things that moved the Lighthouse score:

- **Blocking theme script**: The theme toggle injects a tiny inline `<script>` in `<head>` that reads `localStorage` and sets `data-theme` before the page paints. Without this, there's a flash of the wrong theme on load. The script is synchronous and must stay that way.
- **Font loading**: Neue Montreal is self-hosted with `font-display: swap`. No FOUT because the fallback font metrics are adjusted with `size-adjust` to approximate the display font's dimensions.
- **GSAP lazy registration**: ScrollTrigger is only registered once in the root layout. Individual components import `gsap` directly without re-registering plugins.
- **Lenis destroy on navigation**: Without this, the smooth scroll instance accumulates event listeners across SvelteKit's client-side navigations.

The portfolio section gets a full GSAP treatment — page transitions, scroll-triggered reveals, cursor tracking. The blog section deliberately avoids all of it. The right animation budget for a reading experience is zero animations.

## What I'd Do Differently

**Use a monorepo from day one.** The blog content, the design system, and the site scaffolding feel like separate concerns. Treating them as separate packages with explicit dependency boundaries would make each easier to evolve independently.

**Don't ship a custom cursor.** I spent two days getting the cursor tracking smooth and another day debugging a z-index issue with the modal. The result is polished, but the return on investment for a personal site is low. Most visitors are on mobile anyway.

**Write more content before building the framework for it.** I built a beautifully type-safe blog post loading system before writing a single post. The system is fine, but the posts are what matter. Tooling follows content, not the other way around.

---

The source is on [GitHub](https://github.com/kidus-der/personal-website) if any of this is useful to you. The stack choices are opinionated but none of them are precious — use whatever gets you to shipping.
