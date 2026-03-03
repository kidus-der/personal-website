# UI Components

Key reusable components in `src/lib/components/`.

---

## PublicationModal

**File:** `src/lib/components/ui/PublicationModal.svelte`

### Props

```ts
interface Props {
  pub: Publication;   // { title, venue, year, url, bullets[] }
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

### Svelte 5 notes

- `bind:this` targets inside `{#if}` blocks must be `$state()` to avoid `non_reactive_update` warnings
- `bulletEls: HTMLLIElement[] = $state([])` — reset to `[]` before `open = true` so the array is fresh when the new `<li>` elements bind
- Overlay needs `tabindex="-1"` (role="dialog") and `onkeydown` handler alongside `onclick` for a11y

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
