# Task 10 — Blog pages: report

**Worktree:** `/Volumes/main-storage-2tb/projects/personal-website/.claude/worktrees/agent-ae6e6007cb883bc0c`
**Branch:** `worktree-agent-ae6e6007cb883bc0c`
**Base:** `fae982f` (reset to it before starting; HEAD had drifted to `e7330e6`)
**Commit:** `23be726 feat(blog): editorial listing with tag filter, reading progress, share and post navigation`

---

## 1. Implementation

### New components — `src/lib/components/sections/blog/`

- **`ReadingProgress.svelte`** `{ target?: HTMLElement; class? }` — one `position: fixed`, `top: 0`, 2px accent bar whose `transform: scaleX(var(--progress, 0))` with `transform-origin: left` is driven by `use:scrollProgress={{ target }}`. `aria-hidden="true"` (the scrollbar already carries this information) and `pointer-events: none`. Stays live under reduced motion by design — `scrollProgress` itself is documented as non-motion.
- **`TagFilter.svelte`** `{ tags: string[]; active: string | null; onchange: (tag: string | null) => void; class? }` — `role="group" aria-label="Filter by tag"` wrapping toggle `<button>`s ("All" plus each tag), each carrying `aria-pressed`. Toggle buttons rather than tabs: the filter narrows one list in place, it does not switch panels. Fully controlled; the page owns `active`.
- **`ShareLinks.svelte`** `{ title: string; url: string; class? }` — X intent, LinkedIn share-offsite, and a "Copy link" `<button>` using `navigator.clipboard.writeText` with a 1.5s "Copied" state. The clipboard call is wrapped in `try/catch` (missing on insecure origins) and returns silently on failure rather than claiming a copy that never happened; the timer is cleared in `onDestroy`. Inline `currentColor` SVGs, sentence-case labels, `target="_blank" rel="noopener noreferrer"`.
- **`PostNav.svelte`** `{ prev: BlogPost | null; next: BlogPost | null; class? }` — two hairline cards, side by side from 720px and stacked below, labelled "Newer" / "Older". Renders nothing at all when both are null. The older card is pinned to the right-hand grid column so a first post's "Older" card does not slide left.

### `src/lib/utils/posts.ts`

Added `pickNeighbours(posts, slug): { prev, next }` — a pure helper over a newest-first archive: `prev` is the newer post, `next` the older, `null` at the ends and both `null` for an unknown slug. Extracted precisely so the `[slug]` neighbour logic is unit-testable without mocking Vite globs.

### `src/styles/prose.css` (new)

Every `.prose` rule from the old layout's `<style>` block, de-`:global()`-ed and moved here, imported from `BlogPostLayout.svelte`. It has to be a plain stylesheet because mdsvex output never passes through Svelte's style scoper.

Updated per the brief: h2/h3/h4 in `var(--font-display)`; body `var(--font-body)` at `1.0625rem/1.85`; links in `--accent` with a soft accent underline that firms up on hover. Kept verbatim in substance: callouts (all five tones), tables, images, `img + em` captions, blockquote, `hr`, the Shiki block rules, the autolink `#` affordance, and the `.prose h2[id^='the-frame'] ~ p img` constraint.

Two deliberate deviations, called out for review: `strong` is now `font-weight: 650` in `--text` and `em` is plain italic, where both were previously coloured `--accent`. Spec §3.2 reserves italic emphasis for display headlines and the accent-on-everything reading was loud; the brief lists the rules that must be kept and these were not among them. Easy to revert if you disagree.

### `src/lib/components/layout/BlogPostLayout.svelte` (rewrite)

- Kept: the DOM heading scan (`h2[id], h3[id]`) that builds the TOC, the active-heading `IntersectionObserver` (`rootMargin: '-10% 0px -80% 0px'`), and the JSON-LD `<svelte:head>` block built with `jsonLd()`.
- Dropped: every cursor import and the prose-link `mouseenter`/`mouseleave` wiring, which made `onMount` two near-identical branches. The cleanup is now one line.
- Added props `prev` / `next` (both default `null`), passed straight to `PostNav`.
- Composition: `ReadingProgress` → cover (`use:parallax={{ speed: 0.15 }}`) → header → TOC + prose → `ShareLinks` → `PostNav` → `SubscribeSection`.
- Header: back link reading "All posts" (no arrow glyph), `Tag tone="accent"` chips, `<h1>` in the display face at `--text-3xl`, description at `--text-lg` muted, and date + reading time as two separate spans with a gap — no `·` separator, and the calendar/clock icons are gone with it.
- Dates now go through `formatDate(publishedAt, 'long')`, which formats in UTC. The old inline `toLocaleDateString` rendered `hello.md` (`2026-03-06`) as **March 5, 2026** anywhere west of Greenwich; SSR now shows March 6.
- TOC card is `position: sticky` in a left column from 900px up (`minmax(0, 15rem) minmax(0, 1fr)`), `display: none` below; the article falls back to `:only-child` full width when there are fewer than two headings.
- Widths: `.container` for the page gutter, then a 1100px inner column, per the brief.
- `ReadingProgress` targets the `.prose` element rather than the whole `<article>`, so the bar reaches 100% at the end of the writing rather than at the end of the share links.

### `src/routes/blog/+page.ts` / `+page.svelte`

`+page.ts` is now three lines over `loadPosts(...)` with the glob literal at the call site.

`+page.svelte`: `SEO title="The Buna Print"`; masthead wrapper `position: relative; overflow: hidden` with `BeamsBackground intensity="subtle"` behind an `<h1>` at `clamp(2.5rem, 6vw, 4.5rem)`, "የቡና እትም" beneath it in `var(--font-ethiopic)` with `lang="am"` in accent, then the lede. `TagFilter` derives its chips from `[...new Set(posts.flatMap(p => p.tags))]` sorted with `localeCompare`; filtering is `$derived.by`. Structure kept as requested: `FeaturedPost` for the first filtered post, then `SectionHeading title="More posts" level={2}` and a `PostCard` grid (1 → 2 at 640px → 3 at 960px) with `use:reveal={{ stagger: 0.06 }}`, then `SubscribeSection`. Empty states: "No posts yet. Check back soon." for an empty archive, "No posts with that tag yet." when the active tag matches nothing. All legacy imports (`cursorTarget`, `VantaBackground`, the hard-coded gradient table, the local `formatDate`) are gone.

### `src/routes/blog/[slug]/+page.ts` / `+page.svelte`

Reading time now comes from `readingTime()` on the raw source (same `?raw` glob as before) instead of an inlined word count. Neighbours come from `pickNeighbours(loadPosts(postModules), params.slug)`. The 404 is narrowed: the dynamic import is `.catch(() => null)`-guarded and `error(404, …)` fires only on a missing module, so a fault anywhere else in the load surfaces as itself instead of a misleading 404 (the old `try` wrapped the whole body). `+page.svelte` passes `readingTime`, `prev` and `next` into the mdsvex content component, which forwards them to the layout.

### `src/lib/components/ui/SubscribeSection.svelte` (restyle)

Fetch, honeypot and `?subscribed=1` logic are byte-for-byte the same. Presentation is rebuilt on tokens: hairline `--radius-card` card on `--surface`, input at `var(--radius-input)`, `ParticleButton type="submit"` reading "Subscribe" (and "Sending" while in flight). Legacy `btn btn--primary` and `subscribe-section__*` classes removed, `✓` glyphs dropped, copy moved to sentence case ("Stay in the loop"), error colour moved off the hard-coded `#e05252` onto `--accent-strong`. Switched `$app/stores` → `$app/state` per the wave conventions, and added the standard `class?` prop via `cn()`.

---

## 2. TDD evidence

Tests were written first and run against the unimplemented components:

```
Test Files  5 failed (5)
     Tests  21 failed | 3 passed (24)
```

(The three that passed were `pickNeighbours` assertions that happened to be structural; everything touching a component failed on a missing module.)

After implementation:

```
✓ tests/unit/sections/blog/ReadingProgress.test.ts (3 tests)
✓ tests/unit/sections/blog/PostNav.test.ts (5 tests)
✓ tests/unit/sections/blog/TagFilter.test.ts (6 tests)
✓ tests/unit/sections/blog/ShareLinks.test.ts (5 tests)
✓ tests/unit/routes/blog.test.ts (24 tests)
```

Full suite: **54 files, 571 tests, all passing.**

### What is covered

- `pickNeighbours`: middle, both ends, unknown slug, empty archive.
- Listing: masthead in both scripts (including `lang="am"`), three posts → one `FeaturedPost` + two `PostCard`s, one chip per distinct tag plus "All", clicking a chip narrows the list, "All" restores it, the empty-archive state, the "No posts with that tag yet." state (reached by keeping the chip selection across a `rerender` with different data — the only way it is reachable, since chips are derived from the posts on screen), and an assertion that no `·` appears anywhere.
- `BlogPostLayout`: title, long date and reading time; date and reading time as two spans with no `·`; the "All posts" back link; tag chips; a TOC built from two headings and suppressed at one; the reading-progress bar; share links carrying the current URL; `PostNav` absent with no neighbours and present with one; the cover image.
- `ShareLinks`: X and LinkedIn hrefs with exact encoding, `target`/`rel` on every outbound link, copy → `writeText` called → "Copied" → reverts after 1.5s on fake timers, and a copy-rules assertion.
- `TagFilter`: chip order, group label, `aria-pressed` in both directions, `onchange` payloads for a tag and for "All".
- `PostNav`: renders nothing when both null, each label/link individually, both cards together, `aria-label`, no `→`.
- `ReadingProgress`: bar present, `aria-hidden`, `--progress` seeded to 0, `scroll` subscribed against the given target, and the self-target fallback.

`$lib/motion` is mocked through `tests/unit/kokonut/motionMock.ts` everywhere. `$app/stores` (for `SEO`) and `$app/state` (for `SubscribeSection` / the layout) are mocked in `blog.test.ts`; `HTMLCanvasElement.prototype.getContext` is stubbed to `null` there to silence the jsdom warning `BeamsBackground` provokes.

---

## 3. Verification

| Gate | Result |
|---|---|
| `pnpm test:unit` | 54 files / 571 tests passing |
| `pnpm check` | 0 errors, 1 warning — pre-existing unused selector in `(portfolio)/about/+page.svelte`, not mine |
| `pnpm lint` | 0 errors, 19 warnings — all pre-existing in `(portfolio)/*` and the root layout |
| `pnpm format` | run; only my files changed |
| `pnpm build` | succeeds (the sharp optional-dependency warning is pre-existing) |
| SSR | `/blog` 200, `/blog/hello` 200, `/blog/nope` 404 |

SSR spot-checks on `/blog/hello`: zero `·` and zero `→` in the body; `March 6, 2026` and `3 min read` in two separate spans; `share-links` with correctly percent-encoded X and LinkedIn hrefs; `reading-progress` bar present; `post-nav` correctly absent (only one post exists); `prose.css` rules served. On `/blog`: masthead, `Filter by tag` group, subscribe card.

One trap worth recording: the first `pnpm dev` picked port **5203** because 5199–5202 were already held by other agents' dev servers. Curling 5199 returned another worktree's *old* blog markup and briefly looked like a regression. Always read the port out of the dev log.

---

## 4. Self-review

**Ownership.** Untouched: `src/lib/components/layout/Nav.svelte`, `Footer.svelte`, every `+layout.svelte`, and `FeaturedPost.svelte` / `PostCard.svelte` (consumed as-is). `git status` confirms the 17 changed files are all within my brief.

**Constraints.** Svelte 5 runes throughout; `interface Props` + `$props()` in every new component; tokens only (no raw hex outside the Shiki block and the callout tone colours, both moved verbatim from the old layout); `cn()` on every `class` prop; animations only via `$lib/actions/*` from `<script>`; every transition has a `prefers-reduced-motion: reduce` escape; copy is sentence case with no `·`, no `→`, no all-caps labels; keyed `{#each}` everywhere.

**Things I would flag.**

1. **The `.prose` `strong`/`em` change** is the one place I exercised judgement beyond the brief. Described above; trivially revertable.
2. **`[slug]/+page.ts` holds an eager glob of every post** to compute neighbours, which pulls every compiled post component into that route's chunk and makes the neighbouring dynamic `import()` largely decorative. The listing route already did this, so it is not a regression, and at one post it costs nothing. If the archive grows past ~20 posts, the fix is `import.meta.glob(..., { eager: true, import: 'metadata' })` plus a `loadPosts` overload that accepts bare metadata records — I did not do it because it changes a util another task owns tests for.
3. **The "no posts with that tag" branch is only reachable across a data change** (chips are derived from the posts on screen, so a chip always matches at least one post). It is required by the brief and it is genuinely reachable on client-side navigation, which is what the test exercises — but it will never be seen on a first load.
4. **`use:reveal={{ stagger: … }}` captures its children at mount**, so cards that appear after a filter change are simply visible rather than animated in. That is the correct failure mode (never an invisible card) and matches the action's documented contract, but it does mean filtering is not animated.
5. **`ReadingProgress` sits at `z-index: 60`.** Whether it paints above or below the floating nav pill depends on the nav's stacking, which another agent owns. Worth a glance during wave D.
6. **The TOC is client-only**, since it is scanned from the rendered DOM. It has always been so; SSR output has no `<nav aria-label="Table of contents">`. That is the right trade (ids come from rehype-slug, so the TOC can never drift from the anchors) but it is a hydration-visible difference.
7. **The `blog/+layout.svelte` I was told not to touch still renders `CustomCursor` and sets `cursor: none`.** My pages no longer participate in it. Wave D presumably removes it.

**A footgun I hit and fixed:** a JS comment inside the `<script>` block containing the literal text `` `<style>` `` makes the Svelte 5 parser report `` `<script>` was left open `` at EOF, which in turn cascaded into a bogus TS error in the test file. Reworded rather than escaped.
