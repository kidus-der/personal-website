# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# My preferred way of working

Review this plan thoroughly before making any code changes. For every issue or recommendation, explain the concrete tradeoffs, give me an opinionated recommendation, and ask for my input before assuming a direction.

My engineering preferences (use these to guide your recommendations):

- **DRY is important**—flag repetition aggressively.

- **Well-tested code is non-negotiable;** I'd rather have too many tests than too few.

- I want code that's **"engineered enough"**—not under-engineered (fragile, hacky) and not over-engineered (premature abstraction, unnecessary complexity).

- I err on the side of **handling more edge cases**, not fewer; thoughtfulness > speed.

- **Bias toward explicit** over clever.

## 1. Architecture review

Evaluate:

- Overall system design and component boundaries.

- Dependency graph and coupling concerns.

- Data flow patterns and potential bottlenecks.

- Scaling characteristics and single points of failure.

- Security architecture (auth, data access, API boundaries).

### 2. Code quality review

Evaluate:

- Code organization and module structure.

- DRY violations—be aggressive here.

- Error handling patterns and missing edge cases (call these out explicitly).

- Technical debt hotspots.

- Areas that are over-engineered or under-engineered relative to my preferences.

### 3. Test review

Evaluate:

- Test coverage gaps (unit, integration, e2e).

- Test quality and assertion strength.

- Missing edge case coverage—be thorough.

- Untested failure modes and error paths.

### 4. Performance review

Evaluate:

- N+1 queries and database access patterns.

- Memory-usage concerns.

- Caching opportunities.

- Slow or high-complexity code paths.

### For each issue you find

For every specific issue (bug, smell, design concern, or risk):

- Describe the problem concretely, with file and line references.

- Present 2–3 options, including "do nothing" where that's reasonable.

- For each option, specify: implementation effort, risk, impact on other code, and maintenance burden.

- Give me your recommended option and why, mapped to my preferences above.

- Then explicitly ask whether I agree or want to choose a different direction before proceeding.

### Workflow and interaction

- Do not assume my priorities on timeline or scale.

- After each section, pause and ask for my feedback before moving on.

---

**BEFORE YOU START:**

Ask if I want one of two options:

**1/ BIG CHANGE:** Work through this interactively, one section at a time (Architecture $\rightarrow$ Code Quality $\rightarrow$ Tests $\rightarrow$ Performance) with at most 4 top issues in each section.

**2/ SMALL CHANGE:** Work through interactively ONE question per review section

**FOR EACH STAGE OF REVIEW:** output the explanation and pros and cons of each stage's questions AND your opinionated recommendation and why, and then use `AskUserQuestion`. Also NUMBER issues and then give LETTERS for options and when using `AskUserQuestion` make sure each option clearly labels the issue NUMBER and option LETTER so the user doesn't get confused. Make the recommended option always the 1st option.

## Project

Personal website for kidus-der: a portfolio and a blog ("The Buna Print") in one
SvelteKit app. Built with SvelteKit 2 + Svelte 5 runes, TypeScript, Motion,
Tailwind v4 and mdsvex.

## Repository

- GitHub: `git@github.com:kidus-der/personal-website.git`
- `my-cv.pdf` / `my-cv.tex` are present locally but are gitignored, as is every
  PDF at the repo root.

## Commands

```bash
pnpm dev          # Dev server at localhost:5173
pnpm build        # Production build
pnpm preview      # Preview the production build
pnpm check        # TypeScript + Svelte diagnostics (must be 0 errors, 0 warnings)
pnpm check:watch  # Watch mode
pnpm lint         # Prettier --check + ESLint
pnpm format       # Auto-format
pnpm test         # test:unit then test:e2e
pnpm test:unit    # Vitest (jsdom)
pnpm test:e2e     # Playwright
```

`pnpm build` reads `$env/static/private` and `$env/static/public`, so it needs a
`.env`. Copy `.env.example` and fill in placeholders — the values only have to be
present, not real, for a local build:

```
RESEND_API_KEY, RESEND_SEGMENT_ID, SUBSCRIBE_HMAC_SECRET, ADMIN_SECRET,
PUBLIC_SITE_URL
```

## Stack

| Concern         | Choice                                                      |
| --------------- | ----------------------------------------------------------- |
| Framework       | SvelteKit 2 + Svelte 5 (runes)                              |
| Language        | TypeScript throughout                                       |
| Package manager | pnpm                                                        |
| Animation       | Motion (`motion` v13) behind `$lib/motion` + `$lib/actions` |
| CSS             | Tailwind v4 + plain CSS with design tokens (no SCSS)        |
| Blog content    | mdsvex (`.md` in `src/content/posts/`) + Shiki              |
| Site content    | Typed TS modules in `src/content/`, aliased `$content`      |
| Email           | Resend (contact form, double opt-in subscriptions)          |
| Unit tests      | Vitest 3 + jsdom + `@testing-library/svelte`                |
| E2E tests       | Playwright                                                  |
| Deployment      | Vercel + `@sveltejs/adapter-vercel`                         |

## Project Structure

```
src/
├── app.html                    # Blocking theme script lives here
├── content/                    # `$content` alias
│   ├── site.ts                 # Name, url, email, socials
│   ├── projects/index.ts       # projects, PROJECT_CATEGORIES, helpers
│   ├── publications.ts         # publications, publicationsByYear()
│   ├── experience.ts, education.ts, skills.ts
│   └── posts/                  # Blog posts as .md (mdsvex)
├── lib/
│   ├── motion/                 # config.ts (springs, easings, durations) + index.ts
│   ├── actions/                # reveal, tilt, magnetic, parallax, scrollProgress,
│   │                           # press, pointer — the only place Motion is called
│   ├── state/                  # Rune modules: theme, contact, subscribeForm
│   ├── components/
│   │   ├── ui/                 # Button, Tag, SectionHeading, SEO, modals
│   │   ├── layout/             # SiteShell, Nav, MobileMenu, Footer,
│   │   │                       # PageTransition, BlogPostLayout, navItems
│   │   ├── kokonut/            # KokonutUI ports (barrel export in index.ts)
│   │   ├── charts/             # RingChart, BarChart, RadarChart (barrel)
│   │   └── sections/           # home/, work/, about/, blog/ page sections
│   ├── server/                 # hmac, rateLimit, validation, emailTemplates
│   ├── utils/                  # cn, dates, posts, readingTime, jsonLd,
│   │                           # navigation, period, text
│   └── types/                  # content.ts, motion.ts
├── routes/
│   ├── +layout.svelte          # Fonts, tokens, analytics, theme.init()
│   ├── +error.svelte           # App-wide error page (SiteShell variant="error")
│   ├── (portfolio)/            # Home, /work, /work/[slug], /about
│   ├── blog/                   # /blog, /blog/[slug]
│   ├── api/                    # contact, subscribe, subscribe/confirm,
│   │                           # admin/broadcast
│   ├── og/                     # OG image endpoint
│   └── sitemap.xml/
└── styles/
    ├── app.css                 # Tailwind entry, @theme tokens, class utilities
    └── prose.css               # Blog post typography

tests/
├── unit/                       # Vitest; mirrors src/ + tests/unit/mocks/
└── e2e/                        # Playwright
```

## Key Architecture Decisions

### Animation system

- **Never call Motion from component markup.** Components import from
  `$lib/motion` inside `<script>`, or apply a Svelte action from `$lib/actions`.
- `$lib/motion` re-exports `animate, inView, scroll, stagger, spring, press,
hover` plus the shared `springs`, `easings`, `durations` and `reducedMotion()`.
- Actions are the element-level layer: `use:reveal`, `use:tilt`, `use:magnetic`,
  `use:parallax`, `use:scrollProgress`, `use:press`. Option types live in
  `$lib/types/motion`.
- Every animation must respect `reducedMotion()` (or a
  `prefers-reduced-motion` media query for pure-CSS transitions).

**Entrance pre-hide.** Anything that animates in is hidden by the stylesheet,
never by the script that animates it — a script writing `opacity: 0` on mount
makes server-rendered content paint, vanish and fade back in.

- The blocking script in `src/app.html` adds `class="js"` to `<html>` before
  first paint, ahead of anything that can throw.
- `app.css` hides `html.js [data-reveal]:not([data-revealed])`,
  `html.js [data-reveal-group]:not([data-revealed]) > *` and
  `html.js [data-hero]:not([data-revealed])`, all inside
  `@media (prefers-reduced-motion: no-preference)`.
- Markup carries the attribute: `data-reveal` on a `use:reveal` node,
  `data-reveal-group` on a staggered parent, `data-hero` on each element the
  hero stages. `use:reveal` only sets the starting transform, then animates and
  sets `data-revealed` when the element has arrived, which releases the rule.
- A `reveal-safety` keyframe fades anything still hidden at 3s back in, so a
  stalled or failed script cannot leave a blank page. A reader with no
  JavaScript never gets `html.js` and so is never hidden at all.
- `tests/unit/styles/prehide.test.ts` guards all of this, including that every
  `use:reveal` call site in `src/` carries the attribute.
- Budget: `document.getAnimations().length` on a settled page stays at or under
  40, asserted in `tests/e2e/perf.spec.ts`.

### Design tokens

- Single source of truth: the `@theme` block in `src/styles/app.css`.
- Themes are scoped to `[data-theme="dark"]` / `[data-theme="light"]` on
  `<html>`. Components read the raw vars (`--bg`, `--text`, `--accent`, …).
- Shared class utilities also live in `app.css`: `.container`, `.chip`,
  `.dot-grid`, `.bullet-list`, `.visually-hidden`, `.display-heading`. Reach for
  one before writing the same declarations into a component again.

### Theme

- The rune module is `$lib/state/theme.svelte` — `theme.current`, `theme.set()`,
  `theme.toggle()`, `theme.init()`.
- A blocking inline script in `src/app.html` (not the layout) applies the stored
  or preferred theme before first paint. `theme.init()` in the root layout only
  reconciles the rune with what that script already wrote.

### Layout shell

- `layout/SiteShell.svelte` is the one Nav / content / Footer frame, taking a
  `variant` of `portfolio`, `blog` or `error`. It owns `--nav-height`, which
  pages inherit so a full-bleed hero can pull back under the fixed nav.
- The `error` variant skips `PageTransition`: it renders outside both route
  groups and has no route change to animate.

### Blog

- Same app, same domain, its own layout and reading-focused typography
  (`src/styles/prose.css`).
- `src/routes/(portfolio)/` is the portfolio; `src/routes/blog/` is the blog.
- mdsvex processes `.md` with frontmatter, Shiki highlighting and a callouts
  plugin; every post is wrapped in `layout/BlogPostLayout.svelte`.
- Posts are read through `loadPosts()` in `$lib/utils/posts`, which takes the
  `import.meta.glob` result, drops drafts and sorts newest first. Every caller —
  the listing, the post page, the sitemap, the broadcast endpoint — uses it.

### Publications accordion

- `sections/about/Publications.svelte` holds the list and which row is open;
  `PublicationRow.svelte` is one disclosure. This replaced an earlier modal.
- Only one row opens at a time, tracked by publication id rather than index so
  the state survives filtering or reordering.
- Data lives in `$content/publications`, not in the page.

### Content

- Everything that is data lives in `src/content/*.ts` behind the `$content`
  alias, typed by `$lib/types/content`. Pages import it; they never inline it.

## Conventions

- Svelte 5 runes; `interface Props` + `$props()`; `$app/state` (not
  `$app/stores`).
- Compose classes with `cn()` from `$lib/utils/cn`.
- Tokens only — no hard-coded colours, spacing or type sizes.
- Copy: sentence case, no all-caps eyebrow labels, no `·` separators (use
  separate spans with a gap), no `→` inside link or button text.

## Testing

Unit tests are Vitest 3 in jsdom with `@testing-library/svelte`, under
`tests/unit/`, mirroring `src/`. E2E is Playwright under `tests/e2e/`.

- Reusable doubles live in `tests/unit/mocks/`: `motion.ts` (the shared
  `$lib/motion` singleton for component tests), `motionFactory.ts`
  (`createMotionMock()`, a fresh instance per action test), `navigation.ts`
  (`$app/navigation`), and `actions.ts` — `recordingAction(name)` plus ready-made
  `reveal`, `tilt` and `magnetic` recorders and `resetActionMocks()`.
- Mock a module lazily so `vi.mock` hoisting stays happy:
  `vi.mock('$lib/motion', async () => (await import('../mocks/motion')).motionModule())`.
- Mock `$app/state` as `vi.mock('$app/state', () => ({ page: { url: new
URL('http://localhost/'), params: {} } }))`.
- A test needing runes in the test file itself uses the `.test.svelte.ts`
  extension.

```bash
pnpm test:unit                       # everything
pnpm test:unit tests/unit/ui         # one directory
pnpm test:unit:watch                 # watch mode
```

## Adding Content

**Blog post:** add a `.md` file to `src/content/posts/` with frontmatter:

```md
---
title: Post title
description: Short description
publishedAt: '2026-03-01'
tags: ['tag']
draft: false
---
```

**Project:** add an entry to `src/content/projects/index.ts` following the
`Project` type. The slug becomes `/work/<slug>`.

**Publication:** add an entry to `src/content/publications.ts` (newest first)
following the `Publication` type; the year chart and the accordion both derive
from it.

**Experience, education, skills:** edit `src/content/experience.ts`,
`education.ts` or `skills.ts`. Each has a unit test asserting its shape, so run
`pnpm test:unit` after editing.
