# Animation System

## Core principle

GSAP is never called directly in component markup. All GSAP interaction goes through one of two abstraction layers:

1. **Svelte Actions** (`src/lib/actions/`) — For element-level animations tied to mount/unmount lifecycle
2. **Timeline factories** (`src/lib/animation/timelines/`) — For orchestrated, multi-element sequences

## Svelte Actions

```svelte
<!-- Reveal on scroll -->
<div use:revealOnScroll>...</div>
<div use:revealOnScroll={{ y: 60, duration: 0.8 }}>...</div>

<!-- Magnetic cursor attraction -->
<button use:magnetic>...</button>
<button use:magnetic={{ strength: 0.4 }}>...</button>

<!-- Cursor variant trigger -->
<a href="/" use:cursorTarget={'hover'}>...</a>
<div use:cursorTarget={'drag'}>...</div>

<!-- Raw GSAP from/to -->
<div use:gsapFrom={{ opacity: 0, y: 20, duration: 0.6 }}>...</div>
```

Actions receive the DOM node directly, create a GSAP context, and return a `destroy()` that kills it — perfectly aligned with Svelte's lifecycle.

## Timeline factories

```ts
import { createHeroRevealTimeline } from '$lib/animation/timelines/heroReveal';

onMount(() => {
  const tl = createHeroRevealTimeline({ eyebrow, headline, subheadline, cta });
  tl.play();
});
```

Factories return a paused `gsap.core.Timeline`. The calling component controls play/pause/reverse. This keeps animation logic out of components and makes timelines reusable and testable.

## Easing constants

All easing strings live in `src/lib/animation/easings.ts`. Use named constants rather than raw strings:

```ts
import { EASE_OUT_EXPO, EASE_OUT_QUART, DUR_MD } from '$lib/animation/easings';

gsap.to(el, { y: 0, duration: DUR_MD, ease: EASE_OUT_EXPO });
```

## GSAP plugin registration

Plugins are registered **once** in `src/lib/animation/gsap.config.ts` and imported in the root layout. Never call `gsap.registerPlugin()` in individual components — it causes double-registration and silent failures.

```ts
// gsap.config.ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

export function registerGSAPPlugins() {
  gsap.registerPlugin(ScrollTrigger, Flip);
}
```

## Lenis + GSAP connection

```ts
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);
```

This is in `lenis.config.ts` and is initialized/destroyed around SvelteKit navigations via `beforeNavigate` / `afterNavigate`.

## Reduced motion

GSAP defaults are overridden when `prefers-reduced-motion: reduce` is set:

```ts
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reducedMotion) {
  gsap.globalTimeline.timeScale(10); // run all animations 10x faster (effectively instant)
}
```

## CSS hover animations

For element-level hover effects that don't require GSAP, use pure CSS. Three established patterns in this codebase:

### 1. Left-to-right underline (single-line text only)

```css
.element {
  width: fit-content;                              /* REQUIRED — constrains to text width */
  background-image: linear-gradient(var(--accent), var(--accent));
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 0% 1px;
  transition: background-size 0.3s var(--ease-out-expo);
}
.parent:hover .element { background-size: 100% 1px; }
```

`width: fit-content` is critical — without it the element stretches to fill its container and the underline bar extends past the text. **Only use for reliably single-line text** (short labels, role names, degree titles).

### 2. Fill-from-bottom accent color (dynamic text, single-line)

Used on project card titles and work-list tags. Requires a `data-text` attribute mirroring the text content.

```svelte
<h3 class="title" data-text={title}>{title}</h3>
```

```css
.title { position: relative; }

.title::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  color: var(--accent);
  clip-path: inset(100% 0 0 0);                   /* hidden: clipped from top */
  transition: clip-path 0.35s var(--ease-out-expo);
  pointer-events: none;
}
.parent:hover .title::after { clip-path: inset(0% 0 0 0); } /* reveals bottom-to-top */
```

For tags, the `::after` needs matching `padding` so the text aligns exactly over the original.

### 3. Underline on multi-line text

When text may wrap to multiple lines, `background-size` creates a single bar at the bottom of the bounding box (wrong). Use `text-decoration-color` instead — it renders a proper underline on every line:

```css
.element {
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
  transition: text-decoration-color 0.3s var(--ease-out-expo);
}
.parent:hover .element { text-decoration-color: var(--accent); }
```

Trade-off: this fades in rather than drawing left-to-right. If directional reveal is required, the element must be constrained to single-line (use pattern 1).

## Page transitions

Page enter/exit timelines live in `src/lib/animation/timelines/pageEnter.ts`. The portfolio layout manages them:

- On mount: play `createPageEnterTimeline(pageEl)`
- `beforeNavigate`: cancel navigation, play `createPageExitTimeline(pageEl)`, then allow navigation
- `afterNavigate`: play enter timeline on new page
