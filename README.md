# personal-website

My personal site: a portfolio and a blog ("The Buna Print") in one SvelteKit app.
Live at [kidusder.com](https://kidusder.com).

## Stack

- **SvelteKit 2** + **Svelte 5** (runes), TypeScript throughout
- **Motion** for animation, wrapped in `$lib/motion` and a set of Svelte actions
  (`use:reveal`, `use:tilt`, `use:magnetic`, `use:parallax`, …)
- **Tailwind v4** plus plain CSS driven by design tokens in `src/styles/app.css`
- **mdsvex** + **Shiki** for the blog; everything else is typed data in
  `src/content/`
- **Resend** for the contact form and double opt-in subscriptions
- **Vitest** + Testing Library for unit tests, **Playwright** for e2e
- Deployed on **Vercel**

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in the placeholders
pnpm dev               # localhost:5173
```

`pnpm build` reads the env at build time, so a `.env` has to exist even locally.
The values need to be present, not real, unless you are exercising email.

## Commands

```bash
pnpm dev          # Dev server
pnpm build        # Production build
pnpm preview      # Preview the production build
pnpm check        # TypeScript + Svelte diagnostics
pnpm lint         # Prettier --check + ESLint
pnpm format       # Auto-format
pnpm test         # Unit tests, then e2e
pnpm test:unit    # Vitest
pnpm test:e2e     # Playwright
```

## Layout

- `src/content/` — site data (projects, publications, experience, skills,
  education) and blog posts, behind the `$content` alias
- `src/lib/` — motion wrapper, actions, rune state modules, components (`ui`,
  `layout`, `kokonut`, `charts`, `sections`), server helpers, utils, types
- `src/routes/` — `(portfolio)` for home, work and about; `blog` for the writing;
  `api` for the contact, subscription and broadcast endpoints
- `tests/` — `unit/` (Vitest, mirroring `src/`) and `e2e/` (Playwright)

See `CLAUDE.md` for the architecture notes and conventions.
