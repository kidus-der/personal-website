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
├── api/
│   └── contact/
│       └── +server.ts      ← POST /api/contact — Resend email, rate-limited, server-only
│
└── blog/
    ├── +layout.svelte      ← Blog chrome: same portfolio Nav/Footer/CustomCursor + page transitions
    ├── +page.svelte        → /blog
    └── [slug]/             → /blog/[slug] (rendered via BlogPostLayout.svelte mdsvex layout)
```

### Why two separate layouts?

The blog is a "second half" of the ecosystem — same design tokens, same domain, same navigation, but a different reading-focused content layout. Route groups let us achieve this without URL pollution or separate deployments.

- **Same domain** — cross-linking is trivial; SEO stays concentrated
- **Shared tokens** — visually coherent (same fonts, same color system)
- **Shared nav** — `blog/+layout.svelte` uses the same `Nav`, `Footer`, and `CustomCursor` as the portfolio layout. There is intentionally one nav sitewide.
- **Separate content layout** — blog posts render inside `BlogPostLayout.svelte` (the mdsvex layout), which provides the cover image, TOC sidebar, and prose column — independent of the route layout
- **Future-proof** — if the blog grows to warrant its own subdomain, it's a Vercel config change

## Data flow

- Projects: `src/content/projects/index.ts` → imported directly in work pages
- Blog posts: `src/content/posts/*.md` → mdsvex preprocesses → dynamic `import.meta.glob` in `+page.ts`
- Theme: CSS custom properties on `<html data-theme>` — blocking inline script prevents flash
- Publications: typed `Publication[]` array defined inline in `src/routes/(portfolio)/about/+page.svelte`
- Active publication state: `src/lib/stores/publications.ts` — a `writable<number | null>` that lets multiple `PublicationModal` instances close each other when one opens
- Contact form: `ContactModal` component → `POST /api/contact` → Resend SDK (server-side only) → email delivered to destination address. The destination address and API key never reach the client bundle.

## Blog post processing pipeline

Blog posts (`.md` files in `src/content/posts/`) go through several processing layers before they render:

1. **mdsvex** — preprocesses `.md` files as Svelte components; applies the default layout (`_`) which maps to `BlogPostLayout.svelte`
2. **rehype-slug** — generates `id` attributes on all headings from their text content (lowercased, spaces → hyphens)
3. **rehype-autolink-headings** (behavior: `wrap`) — wraps each heading in an anchor link for hover-to-copy functionality
4. **Callout plugin** (`src/lib/remark/callouts.js`) — transforms Obsidian-style `> [!TYPE]` blockquotes into styled callout elements
5. **Shiki** (`github-dark-dimmed` theme) — syntax-highlights fenced code blocks; output is always dark regardless of site theme. Curly braces in Shiki output are escaped to `&#123;`/`&#125;` so Svelte doesn't interpret them as template expressions.
6. **`import.meta.glob`** — used in `src/routes/blog/+page.ts` to load post metadata (frontmatter) without importing full post content

The `BlogPostLayout.svelte` mdsvex layout receives frontmatter fields as props and builds the cover image, post header, prose column, and TOC sidebar around the post content.

> **Note on callouts.js:** The plugin is `.js` (not `.ts`) because `svelte.config.js` loads it directly via Node ESM with no TypeScript transpilation. It has `// @ts-nocheck` at the top because `checkJs: true` is enabled.

## Key components

### SEO

`src/lib/components/ui/SEO.svelte` — drop into any route's `<svelte:head>` equivalent. Handles `<title>`, meta description, canonical URL, Open Graph, Twitter Card, and article-specific tags (published/updated time, article:tag). Used on every portfolio page and every blog post.

### VantaBackground

`src/lib/components/animation/VantaBackground.svelte` — wraps Vanta.js WebGL effects. Two modes:

- **GLOBE** — used on the home page hero, fills a positioned container (`position: absolute; inset: 0`). Mouse-interactive by default. three.js + vanta dynamically imported inside `onMount` to avoid SSR.
- **NET** — used on the About and Blog listing pages as a `position: fixed; z-index: -1` full-viewport background layer. Non-interactive, `opacity: 0.35` by default.

Subscribes to `themeStore` and reinitializes the WebGL effect with correct colors whenever the theme changes. A `callId` cancellation guard prevents race conditions when the theme switches faster than the async imports resolve.

### ContactModal

`src/lib/components/ui/ContactModal.svelte` — renders a `.btn--primary` trigger button that opens a GSAP-animated modal contact form. Submits to `POST /api/contact` with JSON. Owns its own portal, open/close GSAP timelines, and Escape key handler. Three UI states: idle/loading/success/error. On success, displays a confirmation and resets status on close. See [`docs/components.md`](./components.md) for full reference.

### PublicationModal

`src/lib/components/ui/PublicationModal.svelte`

- Accepts `pub: Publication` and `index: number` props
- Self-contained: owns `$state(open)`, GSAP open/close timelines, and Escape key handler
- Uses a local **portal action** — on mount, the overlay node is appended to `document.body` so `position: fixed` isn't affected by ancestor `transform` stacking contexts (the `revealOnScroll` GSAP action on parent wrappers would otherwise constrain the overlay)
- Portal `destroy()` guards with `node.isConnected` to prevent double-remove when Svelte also unmounts the `{#if}` block
- `activePublicationIndex` store coordinates multi-instance close: when one modal opens, others subscribe and call `closeModal()` if their index no longer matches

## Security

See [`docs/security.md`](./security.md) for the full reference. Key points:

- `RESEND_API_KEY` and the destination email address live in `$env/static/private` — never bundled into client JS. Confirmed by grepping the production build output.
- `/api/contact` has server-side field validation + IP-based rate limiting (3 req / 15 min) + HTML escaping of all user input before interpolation into the email template.
- HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) are applied globally via `vercel.json`.
