# Task 6 report — Layout chrome

**Worktree:** `/Volumes/main-storage-2tb/projects/personal-website/.claude/worktrees/agent-aec74b4939abf5b99`
**Branch:** `worktree-agent-aec74b4939abf5b99` (reset to `fae982f`, one commit on top)

## What was built

### `src/lib/components/layout/navItems.ts` (new)

The site's four primary destinations plus `isCurrent(href, pathname)`. One list shared by
`Nav`, `MobileMenu` and `Footer`, so a new section cannot reach two of the three and go
missing from the last. `isCurrent` encodes the "Home matches only itself, everything else
owns its subtree" rule.

### `src/lib/components/layout/Nav.svelte` (rewritten)

GSAP, the cursor store and the old bespoke mobile drawer are gone. Now:

- `position: fixed` header; inner `.container` is a `1fr auto 1fr` grid so the pill is
  optically centred no matter how wide the logo or the controls get.
- Logo: theme-aware PNG picked from `theme.current`, 44px tall, `alt="Kidus Dereje home"`,
  wrapped in an `<a href="/">`.
- Centre: `MorphicNav` with `current={page.url.pathname}` from `$app/state`.
- Right: `ThemeSwitch` plus a hamburger with `aria-expanded` / `aria-controls="mobile-menu"`
  and a label that names the action (`Open menu` / `Close menu`).
- Glass after 24px: passive `scroll` listener registered in `onMount` (removed on destroy),
  toggling `.nav--scrolled` → `backdrop-filter: blur(16px)`,
  `color-mix(in srgb, var(--surface) 70%, transparent)`, hairline bottom border.
- ≤768px the pill is `display: none` and the hamburger appears; the grid drops to two
  columns.
- **`MobileMenu` is rendered as a sibling of `<header>`, not inside it.** The bar's
  `backdrop-filter` would otherwise become the containing block for the overlay's
  `position: fixed` and trap it inside the header's box. This is why no `portal` action was
  needed — the effect is the same and it stays SSR-safe with zero extra machinery.

### `src/lib/components/layout/MobileMenu.svelte` (new)

Mounted only while open, so opening is a mount and closing is an unmount: the entrance, the
scroll lock and the trap all live in the ordinary lifecycle instead of being reconciled
against an `open` prop.

- `role="dialog" aria-modal="true" aria-label="Navigation"`, `id` matching the trigger's
  `aria-controls`.
- Focus trap: `keydown` on the dialog wraps Tab / Shift+Tab across the live list of
  focusable descendants (re-read per keystroke, so the theme switch and close button are
  always included). Focus moves to the first link on mount.
- Escape, the close button, a scrim click and `afterNavigate` all call `onclose`. Closing is
  the caller's decision — `Nav` owns the state and returns focus to the hamburger, which is
  where the hamburger lives.
- Body scroll lock captures and restores the previous `overflow` rather than blanking it.
- Links: `var(--font-display)` at 2.5rem, hidden synchronously then animated with
  `animate(links, { opacity: [0,1], y: [16,0] }, { delay: stagger(0.06) })` and handed back
  to the stylesheet on finish (same discipline as `use:reveal`). Under `reducedMotion()`
  nothing is touched at all, so links render at their final state — no invisible-menu
  failure mode.

### `src/lib/components/layout/Footer.svelte` (rewritten)

Was a 27-line stub. Now `.container` with three columns:

- **Navigate** — the shared `navItems`, in a `<nav aria-label="Navigate">`.
- **Elsewhere** — GitHub / LinkedIn / Google Scholar from `site.socials`, Email from
  `site.email` as a `mailto:`; the three web links get `target="_blank"` +
  `rel="noreferrer noopener"`, the mailto does not.
- **Newsletter** — "Occasional notes from the Buna Print" plus a compact form that speaks the
  exact protocol `SubscribeSection` uses: `POST /api/subscribe` with
  `{ email, website: honeypot }`, honeypot input hidden, success and error rendered inline
  (`role="status"` / `role="alert"`).

Beneath: the `Kidus` wordmark (`var(--font-display)`, `clamp(4rem, 14vw, 9rem)`,
`color: var(--text)`, `opacity: 0.08`, `aria-hidden`), then a baseline row with
`© {year} Kidus Dereje Zewde` and `Built with SvelteKit and Motion` as two separate spans
with a gap — no `·`.

### `src/lib/components/layout/PageTransition.svelte` (new)

Wrapper div; on `afterNavigate` animates `opacity 0→1`, `y 8→0` over `durations.base` with
`easings.outExpo`. Skips when `navigation.type === 'enter'` (the first, server-rendered
paint — animating it would blank content the browser already painted) and when
`reducedMotion()`. Stops any in-flight animation first so a fast click-through does not
stack transitions. No scroll manipulation — SvelteKit already owns that.

### Route layouts (rewritten)

`src/routes/(portfolio)/+layout.svelte` and `src/routes/blog/+layout.svelte` are now
`<Nav /> <PageTransition>{@render children()}</PageTransition> <Footer />` inside a flex
column shell. No `CustomCursor`, no GSAP, no `cursorStore`, no `pageEnter` timeline.

Each shell declares `--nav-height` (4.5rem, 4rem ≤768px) and uses it for its own
`padding-top`. The variable inherits into the page, so a full-bleed hero can pull back under
the bar with `margin-top: calc(-1 * var(--nav-height))` instead of guessing the number — the
page tasks running in parallel get a documented escape hatch rather than a magic constant.

### `src/routes/+error.svelte` (new)

Reads `page.status` / `page.error` from `$app/state`. `MatrixText` renders "Page not found"
for 404 and "Something went wrong" otherwise; the status code sits above it in
`var(--font-mono)`; a `SlideTextButton href="/" text="Back home"` closes it out; `<SEO>`
included with the headline and explanation.

## TDD evidence

Tests were written first and run red before a single component existed:

```
FAIL tests/unit/layout/Nav.test.ts
  Error: Failed to resolve import "$lib/components/layout/Nav.svelte" … Does the file exist?
FAIL tests/unit/layout/Footer.test.ts            (same)
FAIL tests/unit/layout/MobileMenu.test.ts        (same)
FAIL tests/unit/layout/PageTransition.test.ts    (same)
FAIL tests/unit/layout/ErrorPage.test.ts         (same)
 Test Files  5 failed (5)
      Tests  no tests
```

After implementation:

```
 ✓ tests/unit/layout/PageTransition.test.ts (4 tests)
 ✓ tests/unit/layout/ErrorPage.test.ts (4 tests)
 ✓ tests/unit/layout/MobileMenu.test.ts (9 tests)
 ✓ tests/unit/layout/Footer.test.ts (7 tests)
 ✓ tests/unit/layout/Nav.test.ts (9 tests)
 Test Files  5 passed (5)   Tests  33 passed (33)
```

Full suite, unchanged elsewhere: **54 files, 561 tests, all passing.**

### What the 33 tests actually assert

`tests/unit/layout/navigationMock.ts` is a new shared `$app/navigation` double in the style
of `motionMock.ts`: it records `afterNavigate` registrations so a test can drive a
navigation by hand (`runAfterNavigate({ type: 'link' })`).

- **Nav** (9): renders exactly 4 links with the right labels and hrefs; marks exactly one
  `aria-current="page"` for `/work`; keeps `/blog/hello-world` under "The Buna Print"; logo
  alt + `href="/"`; hamburger `aria-expanded`/`aria-controls` and that clicking opens a
  `role="dialog"` with `aria-modal` and the matching `id`; Escape closes it, flips
  `aria-expanded` back and **returns focus to the hamburger**; body `overflow` locks and
  restores; a navigation closes it; scrolling past 24 adds `.nav--scrolled` and scrolling
  back removes it.
- **MobileMenu** (9): accessible name; every primary link; the stagger call is made against
  the array of link elements with `opacity: [0,1]`; under reduced motion `animate` is never
  called *and* the links carry no inline opacity; Escape and `afterNavigate` each call
  `onclose` once; scroll lock restores the *previous* value (`auto`, not `''`); Tab wraps
  last→first and Shift+Tab wraps first→last; focus lands inside on open.
- **Footer** (7): the current year in the copyright line; the stack credit; the four
  Navigate hrefs; all four Elsewhere links resolved from `site`; the wordmark is
  `aria-hidden`; a submit posts `{ email, website: '' }` to `/api/subscribe` and shows the
  inbox confirmation; a 400 surfaces the server's `error` string inline.
- **PageTransition** (4): renders children; animates the wrapper with the exact keyframes,
  duration and easing after a `link` navigation; does **not** animate on `type: 'enter'`;
  does not animate under reduced motion.
- **+error.svelte** (4): "Page not found" for 404 (asserted via the `role="img"` name
  `MatrixText` exposes), the status code, the home link, and the generic message + code for
  500.

## Verification

| Command | Result |
|---|---|
| `pnpm test:unit` | 54 files, 561 tests, 0 failures |
| `pnpm check` | **0 errors**, 1 warning — pre-existing unused CSS selector in `(portfolio)/about/+page.svelte`, owned by another task |
| `pnpm lint` | 0 errors, 21 warnings — all pre-existing, **none in any file this task touched** (verified by grepping the report for the touched paths) |
| `pnpm format` | all touched files unchanged after formatting |
| `pnpm build` | ✓ built; only the pre-existing `sharp` optional-dependency notices |

## Self-review

**Things I checked and am satisfied with**

- Every listener is removed: the nav's scroll listener in `onMount`'s teardown, the menu's
  scroll lock and any in-flight animation in its teardown, the transition's animation stopped
  before a new one starts.
- Reduced motion is honoured in all three animated places (`MobileMenu` entrance,
  `PageTransition`, and every CSS transition has a `prefers-reduced-motion` escape).
- Tokens only — no raw hex, no hard-coded font stacks. `cn()` used for every composed class.
- Copy: sentence case, no all-caps eyebrows, no `·`, no `→`.
- SSR-safe: nothing touches `document` or `window` outside `onMount`; `MobileMenu` never
  renders on the server because `menuOpen` starts false.
- Legacy files (`CustomCursor`, `pageEnter`, `stores/cursor`, GSAP actions) were left in
  place — the old page files still import them and the build confirms they still compile.
- No `+page.svelte` / `+page.ts` was touched.

**Deliberate choices worth a second opinion**

1. **Overlay placement over a `portal` action.** The brief offered either. Rendering
   `MobileMenu` as a sibling of `<header>` inside `Nav`'s own template achieves the same
   escape from the glass bar's containing block, with no imperative DOM moving and no
   SSR/hydration edge cases. If a future overlay needs to escape a transformed *page*
   ancestor, a real portal action becomes worth writing.
2. **Menu mounted on open rather than always-rendered-and-hidden.** Costs a mount per open;
   buys a much simpler lifecycle (no `$effect` reconciling `open`) and guarantees the links
   are never in the tab order while closed. For a four-link menu the mount cost is nil.
3. **`--nav-height` exposed to pages.** Two extra lines per shell; removes a magic number
   from every hero that wants to bleed under the bar.

## Concerns / follow-ups

1. **`isCurrent` duplicates `MorphicNav`'s internal `isActive`.** Same three-line rule lives
   in `navItems.ts` and inline in `src/lib/components/kokonut/MorphicNav.svelte`. I did not
   touch `MorphicNav` because the interface sheet says not to modify it. The clean fix is a
   one-line import in `MorphicNav` (behaviour is identical, its tests would still pass) — but
   that points `kokonut/` at `layout/`, so the honest fix is probably to move `isCurrent`
   into `$lib/utils/` and have both import it. **Flagging for the integrator to decide.**
2. **The two route layouts are now byte-identical apart from the class name.** I kept them
   separate because the spec has the blog diverging (§3.1: an ember/ice wash behind the blog
   header). If that divergence does not land, they should collapse into one `SiteShell`
   component.
3. **The nav's `padding-top` reservation may fight a full-bleed hero.** Task 8/9's home hero
   may want to sit under the glass bar. `--nav-height` is the escape hatch, but the page
   agents do not know it exists unless someone tells them. Worth a line in the integration
   notes.
4. **Footer newsletter vs. `SubscribeSection` duplication.** Both now hold the same fetch
   shape and state machine (~35 lines). Task 10 restyles `SubscribeSection`; once both are
   settled, the shared piece wants to become a `useSubscribe`-style `.svelte.ts` helper or a
   small `SubscribeForm` component with a `variant` prop. Deliberately *not* abstracted now:
   two callers with different layouts, and Task 10 is still in flight.
5. **Root `+error.svelte` carries no nav.** SvelteKit renders it under the root layout only,
   so route-group chrome does not apply. The brief's spec listed only `MatrixText`, the code
   and a home link, so that is what it has — but a reader who 404s has no header to navigate
   from. Adding `<Nav />` there is a two-line change if wanted.
6. **The scrim is a `<button aria-hidden="true" tabindex="-1">`.** Non-focusable and hidden
   from AT, so it is not a trap escape; but it does mean pointer-only dismissal relies on a
   control screen readers cannot see. Escape and the labelled Close button cover everyone
   else, so I judged this correct rather than a gap.

## Files changed

**New**

- `src/lib/components/layout/navItems.ts`
- `src/lib/components/layout/MobileMenu.svelte`
- `src/lib/components/layout/PageTransition.svelte`
- `src/routes/+error.svelte`
- `tests/unit/layout/navigationMock.ts`
- `tests/unit/layout/Nav.test.ts`
- `tests/unit/layout/MobileMenu.test.ts`
- `tests/unit/layout/Footer.test.ts`
- `tests/unit/layout/PageTransition.test.ts`
- `tests/unit/layout/ErrorPage.test.ts`

**Rewritten**

- `src/lib/components/layout/Nav.svelte`
- `src/lib/components/layout/Footer.svelte`
- `src/routes/(portfolio)/+layout.svelte`
- `src/routes/blog/+layout.svelte`

**Deleted:** none. Legacy animation files stay so the not-yet-rewritten pages keep compiling.

---

# Fix round — review findings

All nine findings addressed. Two deferred items (Footer/`SubscribeSection` duplication →
Task 11; `isCurrent`/`MorphicNav` duplication → Task 11) left alone as instructed, and the
`--accent-strong` error colour left for the palette follow-up.

## 1. (Important) Focus trap was cosmetic — `MobileMenu.svelte`

Correct: the `onkeydown` handler was bound to the dialog element, so
`!dialogEl.contains(active)` could never be true — a keystroke from outside never reached
the handler — and nothing stopped a screen reader's virtual cursor walking the page behind
the modal.

Two changes:

- **The Tab listener moved to `document`** (registered in `onMount`, removed in the
  teardown). The `inside` guards are now live: a Tab pressed while focus has escaped —
  browser chrome, an address-bar round trip, a stray programmatic focus — is pulled back to
  the first or last element. Escape moved with it; both existing tests still dispatch on the
  dialog and still pass, because the events bubble.
- **`inert` applied to the background.** A new `isolate(dialog)` walks from the dialog up to
  `<body>` and marks every off-path sibling `inert`, returning an undo that records whether
  each element *already* had the attribute rather than assuming this component put it there.

  **One deviation from the suggested fix, deliberate.** Option A said "every `document.body`
  child except the menu's own subtree". In this DOM the menu is nested *inside* the layout
  shell, which is itself the only meaningful body child — so that rule would skip the shell
  and leave the header, the page and the footer fully reachable, i.e. it would not fix the
  bug. The ancestor walk is a strict superset: it produces the same result for a body-level
  sibling (covered by a test) *and* inerts the header and page content that actually sit
  behind the overlay.

  **Knock-on fix:** `Nav.closeMenu()` focused the hamburger synchronously, but the header is
  inert until the menu's teardown runs, and focusing an inert element is a no-op. `closeMenu`
  is now `async` and `await tick()`s before restoring focus. Covered by a test that asserts
  the header loses `inert` *and* focus lands on the hamburger.

## 2. (Important) Duplicate "Primary" landmarks — `MobileMenu.svelte`

The inner `<nav>` is now `aria-label="Mobile"`; `MorphicNav` keeps "Primary". The dialog was
already labelled "Navigation", so nothing lost its name. Test asserts the attribute.

## 3. (Minor) `PageTransition.svelte` inline-style cleanup and destroy

`finished.then(clear).catch(noop)` now removes the inline `opacity`/`transform` Motion
leaves behind — same discipline as `reveal.ts` — and `onDestroy` stops any in-flight
animation. The target element is captured in a local so the callback cannot clear a wrapper
that has since been rebound. Three tests: styles cleared on finish, `stop()` called on
destroy, and (added while there) `stop()` called on the previous animation when two
navigations arrive back to back.

## 4. (Minor) `Footer.svelte` live regions

Both `role="status"` and `role="alert"` are now rendered from the first paint and filled
later, instead of being mounted with their text already in them. An empty `<p>` generates no
line box, so neither costs vertical space while idle. Test asserts both are present and empty
on mount, and that the success text lands in the *same* `role="status"` element.

The error region got the same treatment even though the finding named only the status one —
it was the identical bug one line down.

## 5. (Minor) `Footer.svelte` email label

The dead `id` + `aria-label` pair is replaced by a real
`<label class="footer__label" for="footer-subscribe-email">Email address</label>`, hidden
with a scoped clip-path rule. I kept the rule component-scoped rather than adding a
`.visually-hidden` utility to `src/styles/app.css`, which other tasks are editing in
parallel. Test asserts the label element exists and that the input's accessible name comes
from it.

## 6. (Minor) `focusable()` broadened

Now the conventional set: `a[href], button:not([disabled]), input:not([disabled]),
select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])`, still
filtered by `tabIndex !== -1`.

## 7. (Minor) `Nav.svelte` closes at the desktop breakpoint

`matchMedia('(min-width: 769px)')`; on a `change` where `matches` is true the menu closes,
so resizing or rotating past the breakpoint cannot leave an unreachable overlay over the
page. The listener is removed alongside the scroll listener in the same teardown. Two tests:
it closes when the query starts matching, and stays open when it does not.

## 8. (Minor) Test gaps

- `stagger` is asserted to be called with exactly `0.06`. Read off the mocked `$lib/motion`
  export directly rather than adding a `staggerMock` export to `tests/unit/kokonut/motionMock.ts`,
  which other tasks share.
- Nav's teardown is asserted to remove **both** listeners (`removeEventListener('scroll', …)`
  via a spy, and the media-query listener via a counting stub).

## 9. (Minor, controller ruling) `+error.svelte` gets the chrome

Now `<Nav /> <main> … </main> <Footer />` inside an `.error-shell` that mirrors the route-group
shells, `--nav-height` included. Test finds the "Primary" navigation landmark, asserts its
four hrefs match `navItems`, and asserts a `<footer>` is present.

## Commands and output

```
$ pnpm test:unit -- tests/unit/layout
 ✓ tests/unit/layout/PageTransition.test.ts (7 tests)
 ✓ tests/unit/layout/MobileMenu.test.ts (13 tests)
 ✓ tests/unit/layout/Footer.test.ts (9 tests)
 ✓ tests/unit/layout/Nav.test.ts (13 tests)
 ✓ tests/unit/layout/ErrorPage.test.ts (5 tests)
 Test Files  5 passed (5)   Tests  47 passed (47)

$ pnpm test:unit
 Test Files  54 passed (54)   Tests  575 passed (575)

$ pnpm check
 COMPLETED 830 FILES 0 ERRORS 1 WARNINGS 1 FILES_WITH_PROBLEMS
 (the one warning is the pre-existing unused selector in (portfolio)/about/+page.svelte)

$ pnpm lint
 ✖ 21 problems (0 errors, 21 warnings)   — all pre-existing, none in a file this task touched

$ pnpm format
 every touched file reported "unchanged"

$ pnpm build
 ✓ built in 2.45s
```

Layout tests went 33 → 47; the whole suite 561 → 575.

## Still-standing concern from the first round

The `--nav-height` escape hatch now exists in three shells (portfolio, blog, error) rather
than two. If Task 11 collapses the two route layouts into a shared `SiteShell`, the error
page should take it too.
