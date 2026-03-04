# UI Components

Key reusable components in `src/lib/components/`.

---

## PublicationModal

**File:** `src/lib/components/ui/PublicationModal.svelte`

### Props

```ts
interface Props {
  pub: Publication;   // { title, venue, year, url, officialUrl?, bullets[] }
  index: number;      // position in the parent list — used for store coordination
}
```

### Behaviour

- Renders a trigger button (`<button class="pub-trigger">`) that opens the modal on click
- Modal state is owned locally with `$state(open)`
- Opening: `open = true` → `setTimeout(0)` to flush DOM → GSAP timeline animates overlay + card + bullets
- Closing: GSAP exit timeline → `open = false` inside `onComplete` (preserves exit animation)
- Escape key handled via `window.addEventListener('keydown', ...)` registered in `onMount`, torn down on destroy
- One open modal at a time: `activePublicationIndex` writable store (`src/lib/stores/publications.ts`) is set to `index` on open; all other instances subscribe and call `closeModal()` if their index no longer matches

### Portal pattern

The `{#if open}` overlay div uses a local `portal` Svelte action:

```ts
function portal(node: HTMLElement) {
  document.body.appendChild(node);
  return {
    destroy() {
      if (node.isConnected) node.remove();
    }
  };
}
```

**Why:** Parent publication list items have `use:revealOnScroll` which applies a GSAP `translateY` transform. Any in-progress or completed (but not `clearProps`-ed) transform on an ancestor creates a CSS stacking context, causing `position: fixed` children to be positioned relative to that ancestor instead of the viewport. Moving the overlay to `document.body` escapes all ancestor transforms.

**Order matters:** `use:portal` is placed before `bind:this={overlayEl}` in the markup — Svelte processes `bind:this` first, so `overlayEl` is set before the portal action runs, keeping the GSAP reference valid after the node is reparented.

### GSAP timeline pattern

```ts
let activeTl: gsap.core.Timeline | null = null;

function openModal() {
  bulletEls = [];      // reset before {#if} renders new <li> elements
  open = true;
  activePublicationIndex.set(index);
  setTimeout(() => {
    activeTl?.kill();
    activeTl = gsap.timeline();
    activeTl
      .fromTo(overlayEl, { opacity: 0 }, { opacity: 1, ... })
      .fromTo(cardEl, { opacity: 0, scale: 0.85, y: 20 }, { opacity: 1, scale: 1, y: 0, ease: 'back.out(1.4)' }, '<0.05')
      .fromTo(bulletEls, { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.07 }, '-=0.15');
  }, 0);
}

function closeModal() {
  activeTl?.kill();
  activeTl = gsap.timeline({
    onComplete: () => { open = false; }
  });
  activeTl
    .to(cardEl, { opacity: 0, scale: 0.9, y: 10, ease: 'power2.in' })
    .to(overlayEl, { opacity: 0, ease: 'power2.in' }, '<');
}
```

Single `activeTl` variable — always killed before creating a new one to prevent competing animations.

### Cursor integration

`PublicationModal` uses `use:cursorTarget={'hover'}` on the trigger button, close button, arXiv link, and Read Publication link. All of these elements also have explicit `cursor: none` in their CSS — without this the user-agent `cursor: pointer` would show through even though the site-wide reset is in the universal selector.

The modal overlay (`position: fixed`, `z-index: 9999`) is portaled to `document.body`. `CustomCursor` is at `z-index: 10000` so it renders above the overlay.

### Link buttons

The modal renders one or two link buttons below the title, wrapped in a `div.modal-links` flex row:

- **arXiv button** (`.modal-link--ghost`): always rendered from `pub.url` — outline accent style
- **Read Publication button** (`.modal-link--primary`): only rendered when `pub.officialUrl` is set — filled accent style, links to the officially published version (e.g. ACM DL, IEEE Xplore, Springer)

```svelte
<div class="modal-links">
  <a href={pub.url} class="modal-link modal-link--ghost">arXiv →</a>
  {#if pub.officialUrl}
    <a href={pub.officialUrl} class="modal-link modal-link--primary">Read Publication →</a>
  {/if}
</div>
```

To add a "Read Publication" button to a paper, set `officialUrl` in its `Publication` entry. See [`docs/managing-content.md`](./managing-content.md) for the data format.

### Svelte 5 notes

- `bind:this` targets inside `{#if}` blocks must be `$state()` to avoid `non_reactive_update` warnings
- `bulletEls: HTMLLIElement[] = $state([])` — reset to `[]` before `open = true` so the array is fresh when the new `<li>` elements bind
- Overlay needs `tabindex="-1"` (role="dialog") and `onkeydown` handler alongside `onclick` for a11y

---

## BlogPostLayout

**File:** `src/lib/components/layout/BlogPostLayout.svelte`

This is the mdsvex layout — every `.md` blog post is automatically wrapped in this component. It is configured as the default mdsvex layout in `svelte.config.js` via the `_` key. Frontmatter fields are passed as props automatically by mdsvex.

### Props

```ts
interface Props {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  readingTime?: number;    // calculated in +page.ts, passed via <Content readingTime={...} />
  coverImage?: string;     // optional — if omitted, a gradient placeholder renders
  children: Snippet;       // the compiled post body (injected by mdsvex)
}
```

### Structure

```
┌─ .post-cover-wrap ─────────────────────────────────┐
│  <img> or .post-cover__placeholder                  │
│  ::after gradient (transparent → var(--bg))         │
└─────────────────────────────────────────────────────┘
┌─ .post-header ──────────────────────────────────────┐
│  ← Back to writing   [tag pills]                    │
│  <h1> title                                         │
│  description · date · reading time                  │
└─────────────────────────────────────────────────────┘
┌─ .post-body (2-column grid: 1fr 260px) ─────────────┐
│  ┌─ .prose-article ──────┐  ┌─ .toc-card ─────────┐ │
│  │  <slot /> post body   │  │  Table of contents  │ │
│  │  (prose styles)       │  │  (sticky, ≥2 h2/h3) │ │
│  └───────────────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

The `.prose-article` comes **first** in DOM order so it naturally fills full width when the TOC is absent (e.g. on mobile, or when < 2 headings exist). The TOC is the second grid child and sits in the right column.

### Cover image

- Height: `clamp(220px, 50vh, 520px)` — caps at 520px on large screens
- `overflow: hidden` + `border-radius: var(--radius-lg)` on the wrapper
- The `::after` pseudo-element fades the bottom 55% of the cover into `var(--bg)` — creating the "melt" effect between image and content
- When `coverImage` is provided: a `<img>` at `height: 120%; transform: translateY(-8.33%)` — the extra height + initial offset gives GSAP room to parallax. See [animation-system.md](./animation-system.md) for the full parallax setup.
- When `coverImage` is omitted: a `div.post-cover__placeholder` with a CSS gradient renders in its place (no parallax applied)

### Table of contents

```ts
// Built in onMount — runs after prose is in the DOM
const els = proseEl.querySelectorAll('h2[id], h3[id]');
headings = Array.from(els).map((el) => ({
  id: el.id,
  text: el.textContent ?? '',
  level: el.tagName === 'H2' ? 2 : 3
}));
```

- Only renders if `headings.length >= 2`
- Hidden below 1100px via CSS (`display: none`)
- Active section tracking via `IntersectionObserver` with `rootMargin: '-10% 0px -80% 0px'` — the active item gets `background: var(--accent-dim)` plus a `text-decoration-color: var(--accent)` underline (multi-line safe; fades in rather than drawing left-to-right)
- TOC items are plain anchor links (`href="#id"`) — Lenis handles smooth scroll to them
- TOC links use `use:cursorTarget={'hover'}` so the custom cursor ring animates on hover

### Svelte 5 / reactivity notes

- `coverWrapEl` and `coverImgEl` bound with `bind:this` — declared as `$state()` because they're referenced asynchronously in `onMount`
- `headings` and `activeId` are `$state()` arrays/strings updated by the `IntersectionObserver` callback

---

---

## CustomCursor

**File:** `src/lib/components/animation/CustomCursor.svelte`

The site uses a fully custom cursor — the native OS cursor is hidden site-wide and replaced by this component.

### How it works

- `cursor: none` is set on `*,*::before,*::after` in `app.css` as an author-level direct rule — this overrides the browser's `cursor: pointer` on `<a>` elements (which is a UA rule, always weaker than author rules)
- `CustomCursor` is rendered in both the portfolio and blog layouts; it sits at `z-index: 10000` with `pointer-events: none` so it's always above all content but never blocks clicks
- The `cursorStore` (`src/lib/stores/cursor`) holds the current variant (`'default'` | `'hover'` | `'drag'`)

### Triggering cursor variants

```svelte
<a href="/" use:cursorTarget={'hover'}>Link</a>
<div use:cursorTarget={'drag'}>Draggable</div>
```

Add `use:cursorTarget={'hover'}` to **every** interactive element (links, buttons, modal triggers). The action handles `mouseenter`/`mouseleave` and updates the store.

**For mdsvex-generated prose links** (can't use Svelte actions on markdown output):

```ts
onMount(() => {
  const links = proseEl.querySelectorAll('a');
  const enter = () => cursorStore.setVariant('hover');
  const leave = () => cursorStore.setVariant('default');
  links.forEach((l) => {
    l.addEventListener('mouseenter', enter);
    l.addEventListener('mouseleave', leave);
  });
  return () => links.forEach((l) => {
    l.removeEventListener('mouseenter', enter);
    l.removeEventListener('mouseleave', leave);
  });
});
```

### Navigation reset

SPA navigation fires before `mouseleave` on the clicked link, leaving the store in `'hover'`. Always reset in `afterNavigate`:

```ts
afterNavigate(() => {
  cursorStore.setVariant('default');
  // ... rest of afterNavigate
});
```

This is already wired in both `(portfolio)/+layout.svelte` and `blog/+layout.svelte`.

---

## Button (`btn`)

Not a standalone component — a CSS class convention used across portfolio pages.

```css
.btn { /* base: padding, border-radius, font, transition */ }
.btn--primary { background: var(--accent); color: var(--bg); }
.btn--ghost { border: 1px solid var(--border); color: var(--text-muted); }
```

Hover: `translateY(-2px)` lift. Ghost hover: border + text switch to `var(--accent)`.

---

## Tag

Not a standalone component — a `.tag` span class used on the work list and slug pages.

- **Work list (`/work`):** grey text/border at rest; fill-from-bottom accent color on `.work-item:hover` via `clip-path` on `::after { content: attr(data-text) }`
- **Slug page (`/work/[slug]`):** always accent-colored text + border (static, no animation)
