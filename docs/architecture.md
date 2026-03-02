# Architecture Decision Record

## Stack decisions

| Concern | Choice | Rationale |
|---|---|---|
| Framework | SvelteKit 2 + Svelte 5 | Compiles to vanilla JS — zero abstraction between GSAP and the DOM. Svelte Actions are a natural GSAP lifecycle wrapper. Genuinely fullstack. |
| Language | TypeScript | Required for long-term maintainability |
| Package manager | pnpm | Strict dependency graph, disk-efficient |
| Animations | GSAP (ScrollTrigger, Flip) | Industry standard, most powerful |
| Smooth scroll | Lenis v2 | Best GSAP/ScrollTrigger integration |
| CSS | Tailwind v4 + SCSS | Tailwind for layout/spacing/tokens; SCSS for keyframes, clip-path masks |
| Content (blog) | mdsvex | Markdown + Svelte component interpolation |
| Content (projects) | TypeScript data files | Structured, typed, no parsing overhead |
| Deployment | Vercel + adapter-vercel | Zero-config, officially maintained adapter |

## Route architecture

```
src/routes/
├── +layout.svelte          ← Root: Lenis init, global head, theme script
│
├── (portfolio)/            ← Route group (no URL impact)
│   ├── +layout.svelte      ← Portfolio chrome: cinematic nav, cursor, GSAP transitions
│   ├── +page.svelte        → /
│   ├── work/               → /work, /work/[slug]
│   └── about/              → /about
│
└── blog/
    ├── +layout.svelte      ← Blog chrome: editorial nav, reading-focused atmosphere
    ├── +page.svelte        → /blog
    └── [slug]/             → /blog/[slug]
```

### Why two separate layouts?

The blog is a "second half" of the ecosystem — same design tokens, same domain, but a completely different visual atmosphere. Route groups let us achieve this without URL pollution or separate deployments.

- **Same domain** — cross-linking is trivial; SEO stays concentrated
- **Shared tokens** — visually coherent (same fonts, same color system)
- **Separate layout** — blog breathes differently (wider reading margins, no custom cursor DOM weight, slower pace)
- **Future-proof** — if the blog grows to warrant its own subdomain, it's a Vercel config change

## Data flow

- Projects: `src/content/projects/index.ts` → imported directly in work pages
- Blog posts: `src/content/posts/*.md` → mdsvex preprocesses → dynamic `import.meta.glob` in `+page.ts`
- Theme: CSS custom properties on `<html data-theme>` — blocking inline script prevents flash
