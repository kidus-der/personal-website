# Managing Content

Reference for adding, editing, or removing Projects, Experiences, Publications, and Education entries on the site. Each section covers the data format, the correct file to edit, and how animations are handled automatically.

---

## Projects

**File:** `src/content/projects/index.ts`

### Data shape

```ts
import type { Project } from '$lib/types/content';

{
  slug: string;           // URL segment: /work/<slug> — use kebab-case
  title: string;
  description: string;   // One-liner — shown on /work list and home page teaser
  longDescription?: string; // Optional — shown on /work/<slug> detail page
  tags: string[];         // Technology labels rendered as accent pills
  year: number;
  url?: string;           // Live demo / product URL (renders a "Live" button)
  githubUrl?: string;     // GitHub repo URL (renders a "GitHub" button)
  images: string[];       // Project image paths from the static/ directory (e.g. ['/coeus/coeus-project-picture.png'])
                          // First entry (images[0]) is displayed as the project thumbnail on /work, /work/[slug], and the home teaser
                          // Images are rendered with object-fit: cover — use landscape screenshots or logos with safe center-crop
                          // Use [] if no image is available yet; a grey placeholder renders automatically
  featured: boolean;      // true = eligible to appear on the home page teaser
}
```

### Adding a project

1. Open `src/content/projects/index.ts`.
2. Copy an existing entry and paste it at the desired position in the array.
3. Fill in all required fields. `longDescription`, `url`, and `githubUrl` are optional — omit the key entirely if not needed.
4. Set `slug` to a unique kebab-case string (e.g. `"my-new-project"`).

Array order controls display order on `/work`. Entries at the top of the array appear first.

### Featured projects on the home page

The home page (`src/routes/(portfolio)/+page.svelte`) shows:

```ts
const featured = projects.filter((p) => p.featured).slice(0, 2);
```

**The rule:** Only the first two entries in the array where `featured: true` are displayed. To control which two appear:

1. Set `featured: true` on the desired projects.
2. Place them in the order you want them displayed — array position matters.
3. Set `featured: false` on all others.

> **Example:** If you want Project C to show first on the home page, move it above Project A in the array and ensure both have `featured: true`.

### Animation

The work list loops with `use:revealOnScroll={{ delay: i * 0.05 }}` on each project card. Adding an entry to the array automatically gives it the staggered scroll-reveal animation — no manual action required.

---

## Experiences

**File:** `src/routes/(portfolio)/about/+page.svelte` — the `experience` array in the `<script>` block.

### Data shape

```ts
{
  role: string;       // Job title, e.g. "Founding Engineer"
  company: string;    // Company name, e.g. "Scam AI"
  period: string;     // Date range string, e.g. "Jan 2025 – Present"
  bullets: string[];  // Bullet points describing responsibilities/achievements
                      // May contain inline HTML, e.g. <span class="bullet-accent">text</span>
                      // to highlight key metrics in the accent color
}
```

### Adding an experience

1. Open `src/routes/(portfolio)/about/+page.svelte`.
2. Find the `const experience = [...]` array at the top of `<script lang="ts">`.
3. Add a new object to the **top** of the array (most recent position first — the timeline renders in array order).
4. Provide all four fields. For the current role, set `period` to `"Month YYYY – Present"`.

**Highlighting metrics:** Wrap key numbers or phrases in `<span class="bullet-accent">` to render them in the accent color:

```ts
bullets: [
  'Increased model accuracy by <span class="bullet-accent">20%</span>.',
]
```

### Animation

Each `.timeline__item` uses `use:revealOnScroll={{ delay: i * 0.08 }}`. The stagger is applied automatically in the `{#each}` loop — new entries animate at the correct delay without any manual configuration.

---

## Publications

**File:** `src/routes/(portfolio)/about/+page.svelte` — the `publications` array in the `<script>` block.

### Data shape

```ts
import type { Publication } from '$lib/types/content';

{
  title: string;         // Full paper title
  venue: string;         // Conference or journal, e.g. "ACM" or "arXiv preprint"
  year: string;          // Publication or submission year, e.g. "2025"
  url: string;           // arXiv abstract URL — always shown as the ghost "arXiv →" button
  officialUrl?: string;  // Optional — link to officially published version (ACM DL, IEEE Xplore, etc.)
                         // When set, a filled "Read Publication →" button appears alongside the arXiv button
  bullets: string[];     // 2–4 key findings or contributions shown inside the modal
}
```

### Adding a publication

1. Open `src/routes/(portfolio)/about/+page.svelte`.
2. Find the `const publications: Publication[] = [...]` array.
3. Add a new object. Typical placement: most recent at the top.
4. Write 2–4 concise bullets that summarise the paper's contribution (these appear in the modal when a reader clicks the entry).

### How the modal is rendered

```svelte
{#each publications as pub, i}
  <div use:revealOnScroll={{ delay: i * 0.06 }}>
    <PublicationModal {pub} index={i} />
  </div>
{/each}
```

**Do not break this pattern.** Specifically:

- **Always** wrap `<PublicationModal>` in a `<div use:revealOnScroll>` — the scroll-reveal fires on the wrapper div; the modal handles everything inside.
- **Do not** place `<PublicationModal>` directly in the `{#each}` without the wrapper div.
- The `index` prop wires each modal into the `activePublicationIndex` store, which ensures only one modal is open at a time. Pass `index={i}` exactly.
- `PublicationModal` is self-contained — it owns its open/close state, GSAP open/close timelines, and the Escape key handler. Do not add extra wrappers or event handlers around it.
- The modal uses a `portal` action (`document.body.appendChild`) so it escapes any GSAP `transform` context and `position: fixed` works correctly. Do not change or remove this.

See [`docs/components.md`](./components.md) for the full technical reference on `PublicationModal`.

### Animation

New publications animate automatically via the `delay: i * 0.06` stagger in the loop.

---

## Education

**File:** `src/routes/(portfolio)/about/+page.svelte` — the Education `<section>` in the HTML template (hardcoded, not a data array).

### Card structure

Each institution is a `.edu-card` block:

```html
<div class="edu-card">
  <div class="edu-card__left">
    <span class="edu-card__degree">Degree or certification title</span>
    <span class="edu-card__cert">Optional sub-line, e.g. additional certificate</span>
    <span class="edu-card__school">Institution name</span>
  </div>
  <span class="edu-card__period">Expected Month YYYY</span>
</div>
```

- `edu-card__cert` is optional — omit the `<span>` entirely if there is no sub-certification.
- `edu-card__period` uses the accent color automatically via CSS.

### Hover animation

On hover, `.edu-card__degree` and `.edu-card__cert` animate a left-to-right underline in the accent color. This uses the **left-to-right underline** CSS pattern (`width: fit-content` + `background-size: 0% 1px → 100% 1px`). See [`docs/animation-system.md`](./animation-system.md) for the full pattern reference.

**Critical:** Both elements must keep `width: fit-content` in their CSS rules. Without it, the underline gradient spans the full container width instead of just the text.

### Adding an education entry

1. Find the Education `<section>` block (search for `class="edu-card"`).
2. Copy the entire `<div class="edu-card">...</div>` block.
3. Paste it below (or above) the existing card inside the same section.
4. Update the text content.
5. The section has `use:revealOnScroll` at the section level — individual cards do not have their own stagger delays (there is only one card at present). If you add a second card and want a stagger, add `use:revealOnScroll={{ delay: 0.07 }}` to the second card's wrapper div.
