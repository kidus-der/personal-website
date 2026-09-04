# Task 5 report — Kokonut cards, nav primitives, ui atoms, shared section cards

**Worktree:** `/Volumes/main-storage-2tb/projects/personal-website/.claude/worktrees/agent-a42934ff17e5315e1`
**Branch:** `worktree-agent-a42934ff17e5315e1`
**Base:** `2131db7` (reset from `e7330e6`, as instructed)
**Commit:** `81aa6d1` — `feat(kokonut): spotlight/bento/mouse-effect cards, morphic nav, theme switch, smooth tabs`

---

## 1. What was built

### `src/lib/components/kokonut/`

| File | Notes |
|---|---|
| `SpotlightCard.svelte` | `perspective: 1000px` on the root, `rotateX/rotateY` on the inner surface. Layers in the original's order: static tint (`color` at 6%), pointer-tracked aurora (`--gx/--gy`, opacity sprung with `springs.soft`), shimmer sweep, content, bottom accent line (`scaleX 0→1`). `dimmed` → opacity .45 + scale .98. Reports `onhoverstart/onhoverend` from pointer **and** focus, guarded so the same hover is never reported twice. |
| `BentoCard.svelte` | `use:tilt={{ max: 2 }}`; the hover lift and the tilt share one `transform: translateY(var(--lift)) rotateX(var(--rx)) rotateY(var(--ry))` rule. `span` maps to `bento-card--sm/md/lg`, with the grid spans defined here behind a `min-width: 768px` query. Arrow icon only when `href`. |
| `MouseEffectCard.svelte` | Dot field capped at 400. One shared `requestAnimationFrame` loop integrating a fixed-timestep spring per dot, writing `transform` directly; it stops when the field settles and restarts on the next pointer change. `pointermove` only records a coordinate. Ambient opacity pulse is a staggered CSS animation (free, keeps running while the loop sleeps). `ResizeObserver` regenerates. Arrow keys drive a virtual pointer. |
| `mouseEffectDots.ts` | Pure geometry, extracted the way `backgroundPaths.ts` was: `generateDots`, `capDots`, `respondToPointer`, `MAX_DOTS`. |
| `MorphicNav.svelte` | `items` + `current`, never reads `$app/state`. Active = `href === '/' ? current === '/' : current.startsWith(href)`; `aria-current="page"` on it. One indicator measured from the active anchor's `offsetLeft/offsetWidth`, animated with `springs.snappy`. Re-measures on `current` change and on window resize. |
| `SmoothTabs.svelte` | `role="tablist"` / `role="tab"`, `aria-selected`, roving `tabindex`. ArrowLeft/ArrowRight wrap, Home/End jump; selection moves focus with it (automatic activation). Same indicator mechanics. |
| `ThemeSwitch.svelte` | `theme.toggle()`. Label names the destination ("Switch to light theme" while dark). Sun rotates 180° between states. `showLabel` default `false`. |
| `indicator.ts` | `measureIndicator` / `moveIndicator` — the measuring, the instant-first-placement rule and the reduced-motion path, shared by the two indicator components instead of written twice. |
| `index.ts` | Barrel extended with all six components plus the two new helper modules. |

### `src/lib/components/ui/`

- `Tag.svelte` — 8px chip, hairline, `tone: neutral | accent`, `children` snippet.
- `SectionHeading.svelte` — display-face title (`--text-2xl`), optional `lede`, optional right-side `action` snippet, `level` 2 or 3. No eyebrow.
- `Button.svelte` — `variant: primary | ghost | link`, `size: sm | md | lg`, real `<a>` when `href` else `<button>`, `use:press`, platform-correct disabled link.

### `src/lib/components/sections/`

- `work/ProjectCard.svelte` — `SpotlightCard` with `href="/work/{slug}"` and `color={project.accent}`; 16/10 visual (image with `alt = title`, else a gradient monogram from the project accent); title, year, description, first 4 tags, GitHub octicon link.
- `blog/FeaturedPost.svelte` — two-column card stacking under 720px, cover or `--ember` wash, first tag, 2xl display title, 3-line clamp, date + reading time as two spans.
- `blog/PostCard.svelte` — 4/3 thumb with a five-entry `--chart-*` gradient palette keyed by `index % 5`, tag, `--text-lg` display title, 2-line clamp, date + reading time.

---

## 2. TDD evidence

1. Wrote all twelve test files first. `pnpm test:unit` → **12 test files failed to resolve** (`Failed to resolve import "$lib/components/ui/Tag.svelte"` etc.), 29 pre-existing files passing, 209 tests.
2. Implemented component by component, running each suite as it went. Genuine red→green steps along the way, not just scaffolding:
   - `SectionHeading` "copy verbatim" assertion failed on markup whitespace → test tightened to `trim()`.
   - `SmoothTabs` indicator assertion failed because `tick().then(place)` resolves after the test's `await tick()` → both indicator components now call `place()` directly inside `$effect` (which already runs post-DOM-flush). This was a real design correction, not a test accommodation.
   - `MouseEffectCard` pointer/keyboard tests failed because Svelte 5 delegates `pointermove` and `keydown` at the root and the synthetic events were non-bubbling → tests now dispatch with `bubbles: true`, which is what a real event does.
3. Final: **42 files, 342 tests, all passing.**

Test files added (`tests/unit/`):
`kokonut/SpotlightCard.test.ts` (13), `kokonut/BentoCard.test.ts` (11), `kokonut/MouseEffectCard.test.ts` (12), `kokonut/mouseEffectDots.test.ts` (15), `kokonut/MorphicNav.test.ts` (10), `kokonut/SmoothTabs.test.ts` (12), `kokonut/ThemeSwitch.test.ts` (7), `ui/Tag.test.ts` (4), `ui/SectionHeading.test.ts` (6), `ui/Button.test.ts` (14), `sections/ProjectCard.test.ts` (12), `sections/FeaturedPost.test.ts` (9), `sections/PostCard.test.ts` (8). Plus `kokonut/actionsMock.ts`, a `use:tilt` double alongside the existing `motionMock.ts`.

Every brief-mandated assertion is covered: children + `dimmed` class; link when `href`; `aria-current="page"` with mocked offsets; theme toggle flipping `document.documentElement.dataset.theme` and the aria-label; tab click emitting `onchange` and updating `aria-selected`, ArrowRight moving selection; ≤400 dots for a 400×300 container. Plus reduced-motion paths, cleanup, and edge cases (unmatched route, empty tags, missing reading time, dot at the exact pointer position).

---

## 3. Verification

| Gate | Result |
|---|---|
| `pnpm test:unit` | 42 files, **342 passed** |
| `pnpm check` | **0 errors**, 1 warning — pre-existing unused CSS selector in `about/+page.svelte`, untouched |
| `pnpm lint` | **0 errors**, 23 warnings — all pre-existing, all in legacy route files this task does not touch |
| `pnpm format` | run over every touched directory; `prettier --check` clean |
| `pnpm build` | **green** (the `sharp` optional-dependency notice is pre-existing, from `@vercel/og`) |

---

## 4. Self-review

**Deliberate deviations, with reasons**

1. **`ProjectCard`'s GitHub link is a sibling of the card link, not a child.** The brief described it as inside the card with `stopPropagation`. An `<a>` inside an `<a>` is not merely invalid — the HTML parser *closes* the outer anchor at the inner one, so a server-rendered card would hydrate into a broken tree with the card link truncated. It is now absolutely positioned over the card's corner, outside the `SpotlightCard`. `stopPropagation` is kept anyway (harmless, and correct if the structure ever changes). Consequence: hover reporting moved up to the `ProjectCard` wrapper, so sibling dimming stays stable while the pointer is over the icon.
2. **`tilt={false}` is implemented as `max: 0`, not a conditional action.** Svelte actions cannot be conditionally applied without a wrapper; a zero maximum gives the same flat card while keeping the glow tracking the pointer, through the action's existing `update` path. One code path instead of two.
3. **`MorphicNav` has no second hover pill.** The task brief mentioned one; the controller ruling specified "one absolutely positioned indicator". I followed the controller ruling and gave links a plain CSS hover colour instead.
4. **`MouseEffectCard` does not use one `animate()` per dot.** The controller offered both options; a single fixed-timestep spring loop was chosen because per-dot `animate()` subjects still allocate on every pointer move, which is the cost the cap exists to avoid. The step is fixed rather than measured so a dropped frame slows the field rather than teleporting it — and so the settle test is deterministic.
5. **`SmoothTabs` selection is a writable `$derived(active)`.** The parent owns the truth (the `?category=` param on `/work`), but a click must not wait for a navigation round trip before the indicator moves. `$derived` gives optimistic-then-corrected in one declaration; ESLint's `svelte/prefer-writable-derived` agreed after I first wrote it as `$state` + `$effect`.
6. **`generateDots` follows the reference formula, not its parenthetical.** The reference says `edgeFactor = min(dist / (maxDist * 0.7), 1)` and "dense in center, sparse at edges" — the formula actually produces the opposite. I followed the formula: the field thins and dims towards the centre, which is what keeps the card's text legible. The behaviour is asserted in `mouseEffectDots.test.ts`.

**Additive API, beyond the §7 contracts** (all optional, none breaking): `SpotlightCard.class`; `BentoCard.class`; `MouseEffectCard.dotSize`; `MorphicNav.label`; `SmoothTabs.label`; `Button.target/rel`.

**Accessibility suppressions**, each with an inline rationale: `a11y_no_static_element_interactions` on `SpotlightCard`'s `<svelte:element>` (the compiler cannot see through the dynamic tag that both `a[href]` and `article` already have roles) and on the `MouseEffectCard` / `ProjectCard` hover wrappers (decorative reporting only, nothing a keyboard user is denied); `a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions` on the dot field, which is a named `role="img"` graphic made focusable precisely so a keyboard user can drive the virtual pointer.

**Token discipline:** no raw colours anywhere. All spacing, radii, type sizes, easings and colours come from `app.css` tokens; per-card accents arrive as props and are mixed with `color-mix(in srgb, …)`. Copy is sentence case throughout, no all-caps labels, no `·` (date and reading time are two spans separated by a `gap`), no `→`.

**Reduced motion:** `SpotlightCard` sets the glow instantly, `MouseEffectCard` schedules no frames at all, `indicator.ts` collapses to `duration: 0`, and every CSS transition/animation is disabled by a `prefers-reduced-motion` block. The three atoms inherit it through `use:press`, which bails out itself.

---

## 5. Concerns for the integrator

1. **`SpotlightCard.__content` is now a flex column** (`height: 100%`), so a card's last row can be pushed to the bottom edge with `margin-top: auto`. Consumers writing card bodies should expect a single-column flex context, not raw block flow.
2. **`SpotlightCard` gained `height: 100%`** so a grid of cards lines up. It resolves to `auto` unless the parent has a definite height, so it is inert outside a stretched grid — but it is worth knowing about if a card ever lands in an unusual container.
3. **The glow flickers when the pointer crosses `ProjectCard`'s GitHub icon.** The icon is a DOM sibling, so the card receives `pointerleave`. Sibling *dimming* is unaffected (that moved to the wrapper); only the card's own aurora dips over a ~28px target in the corner. Fixing it properly would mean the stretched-link pattern, which costs `SpotlightCard` its content-derived accessible name. I judged the trade not worth it — flagging in case the design review disagrees.
4. **Section-card tests import mocks from `tests/unit/kokonut/`** (`../kokonut/motionMock`, `../kokonut/actionsMock`). Reusing them beat a third copy, but if a fourth consumer appears the mocks should move to a neutral `tests/unit/mocks/` directory.
5. **`MorphicNav` and `SmoothTabs` re-measure on `window.resize`, not via `ResizeObserver`.** That matches the controller's wording and is testable; a nav whose width changes without a viewport resize (a container query, a font swap) would not re-measure until the next route change.
6. **`MouseEffectCard`'s field is `pointer-events: none`** and the card above it tracks the pointer, so the card's own content keeps its links and text selection. The field is still focusable — `pointer-events: none` does not prevent keyboard focus.
7. **Page tasks should import the section cards, not rebuild them:** `$lib/components/sections/work/ProjectCard.svelte`, `$lib/components/sections/blog/FeaturedPost.svelte`, `$lib/components/sections/blog/PostCard.svelte`. The kokonut six and the three atoms are exported from `$lib/components/kokonut` and `$lib/components/ui/*.svelte` respectively (the `ui` directory has no barrel, matching the existing convention).

---

# Fix report — review round 1

All ten findings addressed. Deferred items (SmoothTabs `aria-controls`, `void linkEls`, `respondToPointer` shared object) left alone as instructed — note that `void linkEls` disappeared anyway as a side effect of finding 8.

## 1. BentoCard: invisible tilt, transition fighting the spring — fixed

`src/lib/components/kokonut/BentoCard.svelte`

```css
transform: perspective(800px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
translate: 0 var(--lift, 0px);
transition:
    translate 300ms var(--ease-out-expo),
    border-color 300ms var(--ease-out-expo),
    background-color 300ms var(--ease-out-expo);
```

`transform` is out of the transition list, so nothing fights `use:tilt`. Rather than lose the lift's easing, it moved to the independent `translate` property — a separate animatable property, so it eases on hover while the transform stays entirely under the spring. This satisfies both halves of the finding without the wrapper element the review offered as the alternative.

## 2. SpotlightCard: pointer/focus desync — fixed

`pointerOver` and `focused` are now tracked separately, with `engaged` recording the last reported value of `pointerOver || focused`; `sync()` fires `onhoverstart`/`onhoverend` only on a real transition. `handleFocusOut` returns early when `event.relatedTarget` is still inside the card (`cardEl.contains(next)`), so focus stepping between descendants is a no-op. `bind:this={cardEl}` added to the `svelte:element` for the containment check.

## 3. Cover images duplicating the link name — fixed

`alt=""` on `.project-card__image`, `.featured-post__image` and `.post-card__image`, each with a note explaining that the card link is already named by the title beside it. The three tests that pinned `alt={title}` now assert `alt=""` instead, as their own named cases.

## 4. SmoothTabs: unmatched `active` — fixed

`selectedIndex` is a plain `findIndex` (`-1` when nothing matches), so no tab is `aria-selected` and `createIndicator` is handed `undefined`, hiding the pill — the same shape as `MorphicNav`. A separate `tabbableIndex` keeps the first tab in the page's tab order so the row is still reachable, and the arrow keys start from it.

## 5. ProjectCard: dead `stopPropagation` — removed

The handler and its mock-only test are gone; the "never nests the source link inside the card link" test stays, and the component comment now says explicitly that a sibling needs no propagation guard.

## 6. MouseEffectCard: redundant writes, greedy keys, stray tab stop — fixed

- Each dot's `Offset` carries the last `--dot-opacity` written (seeded `NaN` so the first frame always writes); the `setProperty` call is skipped when the rounded value is unchanged.
- `handleKeydown` returns early unless `event.target === fieldEl`, so nothing else's arrow keys are `preventDefault`ed.
- New `keyboardInteractive` prop, default `false` → `tabindex={keyboardInteractive ? 0 : -1}`. Documented in the file header and on the prop.

## 7. MorphicNav test: shared mutable layout — fixed

`BASE_LAYOUT` is a frozen-by-convention `Readonly` source; `beforeEach` assigns a `structuredClone` to `layout`. The resize test no longer needs to restore anything, and no test can leak into another.

## 8. Indicator lifecycle duplication — extracted

`indicator.ts` became `indicator.svelte.ts` (it owns `$effect`s now) and gained `createIndicator(indicator, target)`, which holds the `place` function, the `placed` latch, the placement `$effect`, the resize listener and the teardown. `MorphicNav` and `SmoothTabs` each shrank to one call plus their own accessors; both lost their `onMount` blocks and their local `animation`/`placed` state.

`vite.config.ts` gained `tests/unit/**/*.test.svelte.ts` in the Vitest `include`, so a test file can be compiled by vite-plugin-svelte and use runes directly.

## 9. `<div>` inside `<span>` — fixed

`.spotlight-card__inner` is a `<div>`; its now-redundant `display: block` is gone.

## 10. Svelte floor — bumped

`package.json` `"svelte": "^5.20.0"` → `"^5.25.0"`, the release that made `$derived` writable (which `SmoothTabs` relies on).

---

## Tests added

| Suite | Added | Covers |
|---|---|---|
| `kokonut/indicator.test.svelte.ts` | **13 (new file)** | `measureIndicator`, `moveIndicator` (spring/instant/reduced-motion/target copy) and `createIndicator` under `$effect.root`: first placement instant, later ones sprung, hidden on `undefined` target, hidden at mount, resize re-measure, listener removed on teardown, animation stopped on teardown |
| `kokonut/BentoCard.test.ts` | 4 | transform includes `perspective(`; `transform` absent from the transition; lift eases via `translate`; plus a guard test that the extracted rule is real, so the others cannot pass vacuously |
| `kokonut/SpotlightCard.test.ts` | 4 | pointer leaves while focused → still engaged, no `onhoverend`, glow not faded; focus leaves while pointer stays → still engaged; focus moving between descendants → no end/start pair; focus leaving to an outside element → ends |
| `kokonut/SmoothTabs.test.ts` | 5 | unmatched `active`: nothing selected, indicator hidden, first tab still tabbable, arrows start from it, ArrowLeft wraps to last |
| `kokonut/MouseEffectCard.test.ts` | 5 | `tabindex="-1"` by default; `0` with `keyboardInteractive`; arrow keys from a descendant are not `preventDefault`ed and start no frames; arrow keys on the field are claimed; `--dot-opacity` written far fewer times than frames run |
| `sections/*` | 3 | each cover image is `alt=""` |
| `sections/ProjectCard.test.ts` | −1 | the mock-only `stopPropagation` test removed |

**Mutation check on the new CSS assertions.** Because component CSS is never injected into jsdom under Vitest (`getComputedStyle(card).transform` returns `"none"`; `document.styleSheets.length` is `0`), the BentoCard invariants are pinned against the component source via `?raw`. To prove they are not vacuous I reverted both CSS changes and re-ran: 3 failed / 12 passed, exactly the three new assertions. Restored, back to 15 passed.

## Commands and output

```
$ pnpm test:unit -- tests/unit/kokonut tests/unit/ui tests/unit/sections
 Test Files  22 passed (22)
      Tests  247 passed (247)

$ pnpm test:unit
 Test Files  43 passed (43)
      Tests  374 passed (374)

$ pnpm check
COMPLETED 805 FILES 0 ERRORS 1 WARNINGS 1 FILES_WITH_PROBLEMS
# the one warning is the pre-existing unused `.scroll-hint--hidden` selector in about/+page.svelte

$ pnpm lint
All matched files use Prettier code style!
✖ 23 problems (0 errors, 23 warnings)
# all 23 pre-existing, all in legacy route files this task does not touch

$ pnpm build
✓ built in 2.36s
```

Test count moved 342 → 374 (+32 net: +33 added, −1 removed).

## One thing worth flagging

`pnpm check` caught a real miss mid-fix: the barrel's indicator re-export had been collapsed onto one line by an earlier `prettier` run, so my multi-line replacement silently did not match and `index.ts` still pointed at the deleted `./indicator`. Unit tests stayed green because nothing imports the barrel yet — only `svelte-check` saw it. Fixed, and the run above is clean.
