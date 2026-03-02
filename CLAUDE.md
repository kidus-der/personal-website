# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
