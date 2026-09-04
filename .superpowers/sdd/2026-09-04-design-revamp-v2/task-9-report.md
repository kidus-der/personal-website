# Task 9 report — About page

Worktree: `/Volumes/main-storage-2tb/projects/personal-website/.claude/worktrees/agent-af11e9e1501d3cd75`
Branch: `worktree-agent-af11e9e1501d3cd75` (based on `fae982f`)

## Implementation

### New pure util — `src/lib/utils/period.ts`

`MONTH_NAMES`, `formatMonth(value)`, `formatPeriod(period)`. Hand-rolled rather than
`Intl.DateTimeFormat` for two reasons, both recorded in the file: the design spells
"June"/"Sept" (not "Jun"/"Sep"), and `new Date('2026-01')` is UTC midnight, which is
December in Edmonton — building a `Date` from a date-less `YYYY-MM` string would make
the rendered month timezone-dependent. Anything that is not a `YYYY-MM` stamp
(`'Present'`, a bare year, month `00`/`13`) is passed through unchanged, so a content
typo surfaces as itself rather than as a silently wrong date. Reused by `Education`
for `graduation`, so the two places that print a month agree by construction.

### `src/lib/components/sections/about/`

**`Bio.svelte`** — `BeamsBackground intensity="subtle"` inside a
`position: relative; overflow: hidden` section. `<h1>` in the display face:
`ሰላም` is a `<button type="button" class="selam">` (Ethiopic face, accent colour, all
control chrome removed) with `aria-describedby="selam-tip"`, plus "and hello.".
Tooltip is a sibling `<span id="selam-tip" role="tooltip">` — not a child of the
button, which would fold its text into the button's accessible name. Shown on
pointerenter/focus, hidden on pointerleave/blur, and dismissed by Escape via a
`<svelte:window>` listener (hover can raise it without focus ever moving, so a
handler on the trigger would not catch it). Two paragraphs at `--text-lg`, muted,
`max-width: 640px`, with `Scam AI` → scam.ai and `eight papers` → `#publications`.

Show/hide writes `el.hidden` directly rather than going through `$state`. `hidden` is
what actually removes the tooltip from the accessibility tree and the tab order, and
setting it imperatively means the element is genuinely visible — and therefore
animatable — in the same synchronous step, with no `tick()` between the reveal and
`animate(el, { opacity: [0, 1], scale: [0.93, 1] }, springs.bouncy)`. Under
`reducedMotion()` the tooltip appears with no spring.

**`ExperienceTimeline.svelte`** `{ roles }` — `<ol>` (a genuine sequence, which is
also what licenses the numbered/marker treatment the copy rules otherwise forbid).
Each `<li>`: marker dot (accent + halo on the first role only), role `<h3>` in the
display face at `--text-xl`, a meta row of separate spans with a gap (no "·"),
company as an external link when `role.url` is set, `formatPeriod(period)` in mono,
then the bullets.

The rail is a **sibling** of the list, not a child. An `<ol>` may only contain `<li>`,
and `use:reveal={{ stagger: 0.08 }}` animates the list's direct children — a rail in
there would be faded and lifted along with the roles. `use:scrollProgress={{ target: listEl }}`
therefore sits on the rail: the list is the tracked target, and `--progress` lands on
the element whose `.timeline__rail-fill` child reads it via `scaleY(var(--progress))`
with `transform-origin: top`. `bind:this` is undefined on first render; the action's
`update` handles the target arriving late.

**`PublicationRow.svelte`** `{ pub, open, ontoggle }` — a textbook disclosure. The
header is a `<button>` carrying `aria-expanded` and `aria-controls`, and owns no open
state: "one at a time" is a property of the set, so the parent decides. No key
handler — Enter and Space come from the platform, and adding one would fire the
toggle twice in a real browser. Header row: year (mono, muted), venue `Tag`, title
(display face, `--text-lg`), chevron that rotates 180° when open.

The body animates `height` with `durations.base` / `easings.outExpo`, then returns to
`height: auto` so later reflow still fits. `hidden` is again driven imperatively:
cleared, measured (`scrollHeight`), and animated inside one synchronous step. Mount
never animates (an SSR'd open row should not play an entrance); reduced motion jumps
straight to the end state. `onSettled()` swallows the rejection Motion raises when an
in-flight animation is stopped by a fast double-toggle, and both callbacks re-read
`open` before touching the DOM so a superseded animation cannot undo the newer one.

**`Publications.svelte`** `{ items }` — `<section id="publications">` so the bio can
link down to it. Intro row: `BarChart` of `publicationsByYear()`
(`xKey="year"`, series `[{ key: 'count', label: 'Papers' }]`, `aspectRatio="3 / 1"`,
`showGrid={false}`, `showXAxis`) beside the lede. Open row tracked as `openId` by
publication **id**, not index — an id survives the list being filtered or reordered.

**`Skills.svelte`** — two columns at ≥900px: `RadarChart` (size 320, levels 4, one
series keyed by metric key) | five `SpotlightCard tilt={false}` cards, each an `<h3>`
in the display face plus its items as `Tag`s. `Certifications` `<h3>` and a plain
`<ul>` underneath.

**`Education.svelte`** `{ education }` — hairline card: degree (display face), school,
optional `detail`, graduation on the right through `formatMonth`.

### Page — `src/routes/(portfolio)/about/+page.svelte`

Rewritten from scratch as pure composition; every inline `experience` /
`publications` / `skills` literal and all GSAP are gone, as are `revealOnScroll`,
`cursorTarget`, `VantaBackground`, `gsap` and `scrollStore` (verified by grep).
`SEO` with the specified title/description, JSON-LD `Person` via `jsonLd()` with
`sameAs: Object.values(site.socials)`, `jobTitle`, `worksFor` Scam AI and `alumniOf`
from `education.school`. Bands in order Bio → Experience → Publications → Skills →
Education, each in `.container`, separated by `var(--spacing-section)`, titled with
`SectionHeading`.

### Deleted

`src/lib/components/ui/PublicationModal.svelte` and `src/lib/stores/publications.ts`.
Grep confirmed the page was the modal's only importer and the modal was the store's
only importer; both greps come back empty afterwards.

## TDD evidence

1. `tests/unit/utils/period.test.ts` written first → failed to resolve
   `$lib/utils/period` ("Does the file exist?"). Implemented → 7 passed.
2. All six component test files written next → all six failed with
   "Failed to resolve import … Does the file exist?", 0 tests collected.
3. Implemented in order Bio (11 ✓) → ExperienceTimeline (9 ✓) → PublicationRow (11 ✓)
   → Publications (8 ✓) → Skills + Education (7 ✓ / 3 ✓). 49 tests in
   `tests/unit/sections/about/`.

Coverage beyond the brief's list: `formatPeriod`/`formatMonth` incl. out-of-range and
pass-through cases; company link vs. plain text; per-role bullet counts; the
current-role marker; rail `--progress` seeding; empty-list rendering for both the
timeline and the accordion; the disclosure's `aria-controls`↔`id` wiring; toggling a
row closed by its own header; the ACM link appearing only with `officialUrl`; the
open/close height keyframes and easing; instant open under reduced motion; the
tooltip's spring keyframes and its reduced-motion path; `tilt` reaching the skill
cards with `max: 0`.

## Verification

| Command | Result |
|---|---|
| `pnpm test:unit` | 56 files, **584 passed** (49 new about + 7 new period) |
| `pnpm check` | 832 files, **0 errors, 0 warnings** |
| `pnpm lint` | **0 errors**, 15 warnings — all pre-existing, none in a file I touched |
| `pnpm build` | ✓ built, adapter done |
| `curl localhost:5273/about` | **HTTP 200**, no dev-server warnings |

SSR spot-checks on the served HTML: `id="publications"` present, 8 "Read on arXiv"
links and 1 "ACM version", `timeline__marker--current`, 6 radar axis labels, 5 skill
group cards, `June 2026 – Present`, `bio__greeting`/`bio__tooltip`, and the Person
JSON-LD verbatim with `sameAs`, `jobTitle`, `worksFor` and `alumniOf`.

## Self-review — two issues found and fixed

1. **Tooltip reflowed the page.** It was a normal-flow sibling in the bio's flex
   column, so raising it pushed both paragraphs down — jarring on a hover. Wrapped
   heading + tooltip in `.bio__greeting { position: relative }` and took the tooltip
   out of flow (`position: absolute; top: calc(100% + .75rem)`).
2. **Unhandled promise rejection on fast toggles.** `animation.finished` rejects when
   Motion's `.stop()` cancels an in-flight animation, which is exactly what a quick
   double-toggle does. Added `onSettled()` with a rejection handler that runs the
   callback only when the animation has not already been superseded.

## Concerns / notes for integration

1. **`Publications` owns its own `SectionHeading`** while the other three bands get
   theirs from the page. Deliberate: `id="publications"` is on the `<section>`, so the
   heading has to live inside it or the bio's anchor jump lands below the title.
2. **The chart is not derived from the `items` prop.** Per the brief it calls
   `publicationsByYear()`, which reads the whole content module. With a filtered
   `items` the chart and the rows would disagree. Nothing filters today; worth a prop
   if filtering is ever added.
3. **"Eight papers" is hardcoded copy** in both `Bio` and `Publications` while the
   count comes from data — a ninth paper makes both lines stale. Per the brief's
   exact copy; flagging it as a content-maintenance trap.
4. **`use:reveal` only on the experience list**, as the brief specifies. Spec §3.4's
   general "sections reveal once" is therefore not applied to Publications, Skills or
   Education. Adding `use:reveal` to the skills grid would be a one-line follow-up;
   I did not do it because reveal writes inline `opacity`/`transform` onto children
   and I would not want it interacting with the accordion's scripted height without
   the tests to cover it.
5. **`tests/unit/kokonut/tiltMock.ts` does not exist** — the brief names it, but the
   real file is `tests/unit/kokonut/actionsMock.ts`. Used that.
6. **`CLAUDE.md` is stale** — it still documents GSAP/Lenis, the old `src/lib/stores/`
   layout, and a "Publication Modal" section describing the component this task
   deletes. Out of scope here; someone should refresh it at the end of the revamp.
7. Pre-existing lint warning `svelte/no-at-html-tags` on the page's JSON-LD `{@html}`,
   matching `+layout.svelte`. `jsonLd()` escapes `<`, and the payload is static.
