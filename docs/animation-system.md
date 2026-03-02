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

## Page transitions

Page enter/exit timelines live in `src/lib/animation/timelines/pageEnter.ts`. The portfolio layout manages them:

- On mount: play `createPageEnterTimeline(pageEl)`
- `beforeNavigate`: cancel navigation, play `createPageExitTimeline(pageEl)`, then allow navigation
- `afterNavigate`: play enter timeline on new page
