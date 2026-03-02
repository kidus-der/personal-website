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

Personal website for kidus-der. Built with SvelteKit 2 + Svelte 5, TypeScript, GSAP, Lenis, Tailwind v4, and mdsvex.

## Repository

- GitHub: `git@github.com:kidus-der/personal-website.git`
- `my-cv.pdf` is present locally but should not be committed to git.

## Commands

```bash
pnpm dev          # Start dev server at localhost:5173
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm check        # TypeScript + Svelte diagnostics
pnpm check:watch  # Watch mode
pnpm lint         # Prettier + ESLint
pnpm format       # Auto-format
```

## Stack

| Concern | Choice |
|---|---|
| Framework | SvelteKit 2 + Svelte 5 |
| Language | TypeScript throughout |
| Package manager | pnpm |
| Animations | GSAP (ScrollTrigger, Flip) |
| Smooth scroll | Lenis v2 |
| CSS | Tailwind v4 + SCSS for animation styles |
| Content (blog) | mdsvex (`.md` files in `src/content/posts/`) |
| Content (projects) | TypeScript data files (`src/content/projects/index.ts`) |
| Deployment | Vercel + `@sveltejs/adapter-vercel` |

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/          # Primitives (Button, Tag, Link)
│   │   ├── layout/      # Nav, Footer, BlogPostLayout
│   │   └── animation/   # CustomCursor, etc.
│   ├── actions/         # Svelte actions — GSAP integration layer
│   │   ├── gsap.ts      # use:gsapFrom, use:gsapTo
│   │   ├── magnetic.ts  # use:magnetic
│   │   ├── revealOnScroll.ts
│   │   └── cursor.ts    # use:cursorTarget
│   ├── stores/          # cursor.ts, scroll.ts, theme.ts
│   ├── animation/       # Pure TS: gsap.config.ts, lenis.config.ts, easings.ts, timelines/
│   ├── utils/           # math.ts (lerp, clamp), dom.ts
│   └── types/           # content.ts, animation.ts
├── routes/
│   ├── +layout.svelte          # Root: Lenis init, theme injection
│   ├── (portfolio)/            # Route group — portfolio section
│   │   ├── +layout.svelte      # Portfolio chrome: cursor, nav, page transitions
│   │   ├── +page.svelte        # Home / hero
│   │   ├── work/               # /work, /work/[slug]
│   │   └── about/              # /about
│   └── blog/                   # Blog section — editorial atmosphere
│       ├── +layout.svelte
│       ├── +page.svelte        # Blog listing
│       └── [slug]/             # Blog post (mdsvex)
├── content/
│   ├── projects/index.ts       # Project data (typed array)
│   └── posts/                  # Blog posts as .md files
└── styles/
    ├── app.css                 # Tailwind v4 entry + @theme design tokens
    └── _tokens.scss, _typography.scss, _animations.scss
```

## Key Architecture Decisions

### Animation System
- **Never call GSAP directly in component markup** — use Svelte Actions or Timeline factories
- Svelte Actions (`src/lib/actions/`) — element-level animations tied to mount/unmount
- Timeline factories (`src/lib/animation/timelines/`) — multi-element orchestrated sequences
- GSAP plugins registered once in `gsap.config.ts`, imported in root layout

### Design Tokens
- Single source of truth: `@theme` block in `src/styles/app.css`
- Themes scoped to `[data-theme="dark"]` / `[data-theme="light"]` on `<html>`
- Blocking inline script in root layout prevents theme flash on load

### Blog "Second Half"
- Same SvelteKit app, same domain, completely separate layout
- `src/routes/(portfolio)/` — portfolio section (animated, cinematic)
- `src/routes/blog/` — blog section (editorial, reading-focused)
- mdsvex processes `.md` files with frontmatter and Svelte component interpolation

### Lenis + GSAP sync
```ts
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
lenis.on('scroll', ScrollTrigger.update)
```
Destroyed/re-initialized around SvelteKit `beforeNavigate` / `afterNavigate`.

### Publication Modal
- `PublicationModal` component lives in `src/lib/components/ui/PublicationModal.svelte`
- Accepts `pub: Publication` (type from `$lib/types/content`) and `index: number` props
- Self-contained: owns `$state(open)`, GSAP open/close timelines, and Escape key handler
- Opens with GSAP spring animation (`back.out(1.4)`), closes in `onComplete` callback
- Glassmorphism card: `backdrop-filter: blur(24px)`, `:global([data-theme="light"])` override
- Publications data lives in `src/routes/(portfolio)/about/+page.svelte` as `Publication[]`

## Adding Content

**New blog post:** Add a `.md` file to `src/content/posts/` with frontmatter:
```md
---
title: Post title
description: Short description
publishedAt: "2026-03-01"
tags: ["tag"]
draft: false
---
```

**New project:** Add an entry to `src/content/projects/index.ts` following the `Project` type.
