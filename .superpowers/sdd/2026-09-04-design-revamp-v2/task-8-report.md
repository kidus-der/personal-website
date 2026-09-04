# Task 8 report — Work pages (filterable project grid + project detail)

- **Worktree:** `/Volumes/main-storage-2tb/projects/personal-website/.claude/worktrees/agent-a841f2cff7febb03e`
- **Branch:** `worktree-agent-a841f2cff7febb03e`
- **Base:** `fae982f` (HEAD was `e7330e6` on arrival; `git reset --hard fae982f` as instructed)
- **Commit:** `a392bd9` — `feat(work): filterable project grid and project detail pages`

## Implementation

### `src/lib/components/sections/work/order.ts` (new)

`orderProjectsForGrid(projects: Project[]): Project[]` — pure, total, non-mutating
(`[...projects].sort(...)`). Three tiers:

1. featured, in `featuredProjects()` order (which is year desc, capped at 3)
2. everything else by year, newest first
3. `personal-website`, always last

Ties inside a tier keep the content file's order, which `Array.prototype.sort`'s
stability gives for free. Because it filters over whatever array it is handed, a
filtered category (`projectsByCategory('systems')`) simply contributes nothing to
the tiers it has no members in.

`featuredProjects()` is read once per call rather than once per comparison — it
re-filters and re-sorts the whole content array on every invocation.

Resulting full order: `prime-radiant, coeus-ai, poseidon-wildfire, elevent,
flairglow, port-scanner, svm-stock-predictor, personal-website`.

### `src/routes/(portfolio)/work/+page.ts` (new)

`load({ url })` reads `category`, validates against `PROJECT_CATEGORIES` ids and
falls back to `'all'` for anything else (typo, empty value, wrong case, stale
bookmark). Returns `{ category, projects: orderProjectsForGrid(projectsByCategory(category)) }`.

Written as `(({ url }) => …) satisfies PageLoad` rather than `const load: PageLoad = …`
so the page still sees the concrete return type *and* the event type stays
available to the tests as `Parameters<typeof load>[0]`.

An invalid category is deliberately not a 404 — the page is real, only the filter
was nonsense.

### `src/routes/(portfolio)/work/+page.svelte` (rewritten)

- All legacy imports gone (`revealOnScroll`, `cursorTarget`, `VantaBackground`, `$app/stores`).
- `<SEO title="Work" description="Selected projects across AI, full-stack, systems and mobile." />`
- Page `<h1>` rendered directly (display font, `var(--text-3xl)`, `-0.02em`) because
  `SectionHeading` only supports `level` 2|3. Lede below it at `--text-lg`, muted.
  No sub-sections were needed, so `SectionHeading` is not imported at all.
- `SmoothTabs tabs={PROJECT_CATEGORIES.map(…)} active={data.category} label="Filter projects"`,
  `onchange` → `goto(id === 'all' ? '/work' : '/work?category=' + id, { replaceState: true, noScroll: true, keepFocus: true })`.
- `ProjectGrid id="project-grid" projects={data.projects}`.
- Visually-hidden `aria-live="polite"` status line reporting `"{n} projects"`.
  Pluralised (`1 project`) — the brief's literal string would misreport a
  single-result category. Clipped with `clip-path: inset(50%)` rather than
  `display: none`, which would remove it from the accessibility tree.
- `use:reveal` on the header.

### `src/lib/components/sections/work/ProjectGrid.svelte` (new)

Props `{ projects: Project[]; id?: string; class?: string }`. Consumes the
existing `ProjectCard` unchanged.

- 3 → 2 (≤1024px) → 1 (≤640px) column grid, `gap: 1.25rem`, `use:reveal={{ stagger: 0.06 }}`
  on the `<ul>` so the action staggers the `<li>` children.
- Sibling dimming: `hovered` holds the hovered card's **slug**, not a boolean per
  card. A `pointerleave` only clears it when it comes from the card that currently
  owns the hover — otherwise a fast diagonal drag (leave fires after the next
  card's enter) would un-dim the grid while the pointer is still over a card.
- Empty state: `"Nothing in this category yet."`
- `id` sits on the region wrapper, not the `<ul>`, so it stays a valid reference
  target while the filter is showing nothing.

### `src/routes/(portfolio)/work/[slug]/+page.ts` (new)

`load({ params })` finds the project in `orderProjectsForGrid(projects)`,
`error(404, 'Project not found')` when the slug matches nothing, returns
`{ project, prev, next }` with modulo wrap-around at both ends. Walking the grid
order (not the content file order) means stepping through projects from a detail
page matches the order the visitor just scrolled past.

### `src/routes/(portfolio)/work/[slug]/+page.svelte` (rewritten)

All legacy imports gone. Back link `"All work"` → `/work` (no arrow, per copy
rules); `Tag`s for the stack; `<h1>` in the display face at `--text-3xl`;
`longDescription ?? description` at `--text-lg` muted; links row —
`Button variant="primary" target="_blank" rel="noopener noreferrer"` "Visit
project" when `url`, `Button variant="ghost"` "View source" when `githubUrl`;
16/9 rounded hairline frame holding either `images[0]` or the gradient monogram;
"Highlights" `<ul>` with an accent-dot `::before` marker (a dot, not the `→` the
publication modal uses — arrows are out under the copy rules); footer
`<nav aria-label="More projects">` with two prev/next cards showing a small
"Previous"/"Next" label above the title, no arrows.

Motion: `use:reveal` only. CSS transitions on the back link and nav cards are
guarded by `@media (prefers-reduced-motion: reduce)`.

## TDD evidence

Tests were written and run **before** any implementation existed:

```
Error: Failed to resolve import "$lib/components/sections/work/order" from
"tests/unit/sections/work/order.test.ts". Does the file exist?
 Test Files  3 failed (3)
      Tests  no tests
```

After implementation:

```
 ✓ tests/unit/sections/work/order.test.ts (10 tests)
 ✓ tests/unit/routes/work.test.ts (15 tests)
 ✓ tests/unit/sections/work/ProjectGrid.test.ts (11 tests)
```

### Coverage

`tests/unit/sections/work/order.test.ts` (10) — completeness (same set, no
dupes), featured block leads in `featuredProjects()` order, `personal-website`
last, remainder year-desc, rules hold inside `ai-ml` / `systems` / `full-stack`,
tie-break keeps input order, no mutation, empty input.

`tests/unit/routes/work.test.ts` (15) — index `load`: 8 for no category, 4 for
`ai-ml` (and every result actually in that category), 8 for an invalid category,
8 for an empty `?category=`, `?category=all`, case sensitivity (`AI-ML` → all),
unrelated query params ignored, output already in grid order. Detail `load`:
finds by slug, prev/next walk the grid order, wraps backwards from the first,
wraps forwards from the last, no project is ever its own neighbour (loops all 8),
404 thrown for an unknown slug with `status === 404` and
`body.message === 'Project not found'`, 404 for an empty slug. Nothing is mocked
— `error()` throws a real `HttpError`.

`tests/unit/sections/work/ProjectGrid.test.ts` (11) — one card per project with
the right hrefs, order preserved, `use:reveal` applied to the list with
`stagger: 0.06`, empty state replaces the list, no reveal when there is no list,
`id` lands on the region (present and non-empty both ways), dimming on hover,
un-dimming on leave, the stale-`pointerleave` case, nothing dimmed initially.

`tests/unit/sections/work/revealMock.ts` — new shared test double for
`use:reveal`, modelled on `tests/unit/kokonut/actionsMock.ts`. Needed because the
real action hides its targets synchronously and waits on an IntersectionObserver
that never fires in jsdom, which would leave every asserted node at `opacity: 0`.
Kept local to `sections/work/` rather than added to `tests/unit/kokonut/actionsMock.ts`
to avoid editing a file other Wave C agents are also touching.

## Verification

| Command | Result |
|---|---|
| `pnpm test:unit` | 52 files, **564 tests passed** (36 new) |
| `pnpm check` | **0 errors**, 1 warning — pre-existing, `about/+page.svelte` unused CSS selector (identical to the baseline at `fae982f`) |
| `pnpm lint` | **0 errors**, 20 warnings — all pre-existing, none in a file I touched (verified by grep) |
| `pnpm format` | applied; all my files report "unchanged" on re-run |
| `pnpm build` | ✔ done (only the usual `sharp` optional-dep warnings) |

Dev-server SSR (`pnpm dev --port 5387`):

- `GET /work` → 200, 8 `project-card` wrappers, `id="project-grid"` present,
  `aria-live="polite">8 projects`, new SEO description in the head
- `GET /work?category=ai-ml` → `4 projects`
- `GET /work?category=bogus` → `8 projects` (falls back to all)
- `GET /work/coeus-ai` → 200, `<h1>Coeus AI`, cover image rendered, Highlights
  section, prev `prime-radiant` / next `poseidon-wildfire`
- `GET /work/prime-radiant` → prev `personal-website` (wrap), next `coeus-ai`
- `GET /work/elevent` → monogram fallback `E` (no cover image)
- `GET /work/nope` → **404**

## Self-review

**What I'd flag if reviewing this:**

1. **Display-heading CSS is repeated three times** (`/work` h1, `/work/[slug]` h1,
   `/work/[slug]` h2 "Highlights") — same font-family / weight / tracking, only the
   size differs. `SectionHeading` cannot absorb the two h1s (it is `level` 2|3 only),
   and extracting a shared `.display-heading` utility would mean editing
   `src/styles/app.css`, which is not in my file set. Left as-is; a follow-up could
   add one utility class to `app.css` once every page has landed and the real
   repetition count is visible.

2. **Monogram markup is duplicated** between `ProjectCard` and the detail page
   (~15 lines of CSS). Deduping means either editing `ProjectCard` (forbidden by
   the controller ruling) or adding a `Monogram.svelte` that only one of the two
   consumers actually uses — which leaves the duplication in place and adds a file.
   I chose inline CSS and documented the reason in the component comment. Worth
   revisiting once `ProjectCard` is unlocked.

3. **`use:reveal` does not re-run when the category changes.** The `<ul>` is the
   same DOM node across filter changes, so newly rendered cards are not hidden and
   not staggered — they appear instantly. This is the correct behaviour here (a
   filtered result must not be invisible until an observer fires), and it matches
   `reveal`'s documented contract, but it does mean the stagger is a first-paint
   effect only, not a per-filter one. If a per-filter stagger is wanted, key the
   `<ul>` on `data.category` — I did not, because a keyed remount also throws away
   scroll position and re-triggers the entrance on every tab press, which reads as
   noisy.

4. **Pluralisation deviates from the brief's literal `"{n} projects"`** — I emit
   `"1 project"` for a single result. Flagging in case the exact string mattered.

5. **`alt=""` on the detail page's cover image.** The content model carries no alt
   text and every cover so far is a logo or screenshot of a project the page has
   already named and described, so it is genuinely redundant. Inventing
   `"Coeus AI screenshot"` would assert something we do not know. If per-image alt
   text is added to `Project` later, this should switch to it.

6. **The `load` tests cast a bare `{ url }` / `{ params }` to the event type.**
   One `as unknown as` per helper, isolated in two functions at the top of the file.
   The alternative — standing up a full SvelteKit `LoadEvent` — is a lot of
   ceremony for two property accesses.

7. **`?category=` is not normalised.** `AI-ML` falls back to "all" rather than
   matching `ai-ml`. That is deliberate (the ids are the canonical spelling and the
   tabs only ever produce them), but a hand-typed URL will silently show everything.
   Lower-casing before the lookup would be a one-line change if that is preferred.

## Concerns / things the integrator should know

- The `(portfolio)/+layout.svelte` chrome is still the legacy one (GSAP page-enter
  timeline, `CustomCursor`, `cursor: none`). Both pages render correctly under it,
  but the final look will only be right once the layout task lands. Nothing in my
  files depends on the layout.
- I added `tests/unit/sections/work/` as a new directory alongside the existing
  flat `tests/unit/sections/ProjectCard.test.ts`. If another agent moves the
  section tests into per-area folders, `ProjectGrid.test.ts`'s relative mock
  imports (`../../kokonut/…`) will need adjusting.
- `tests/unit/routes/` is new. If another page task also creates route-load tests,
  the directory already exists.
- Top padding on both pages is a flat `8rem`, matching what the legacy pages used.
  If the redesigned nav changes height, both values want revisiting.
