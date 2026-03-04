# Authoring Blog Posts

Reference for writing, publishing, and managing blog posts. Covers frontmatter fields, the featured/more-posts split, table of contents generation, and a complete markdown reference with site-specific rendering notes.

---

## Creating a Post

**Location:** `src/content/posts/<slug>.md`

The filename becomes the URL slug: `my-first-post.md` → `/blog/my-first-post`.

### Required frontmatter

```yaml
---
title: "Post Title"
description: "One or two sentences shown on the blog listing card and as the meta description."
publishedAt: "YYYY-MM-DD"
tags: ["Tag1", "Tag2"]
draft: false
---
```

### Optional frontmatter

```yaml
updatedAt: "YYYY-MM-DD"    # Shown in post meta if it differs from publishedAt
coverImage: "/images/my-cover.jpg"  # Absolute path to a cover image
                                    # If omitted, a styled placeholder renders instead
```

### Draft posts

Set `draft: true` while writing. The post loader filters out all drafts — the post will not appear on `/blog` or be accessible at its URL. Switch to `draft: false` when ready to publish.

---

## Featured vs. More Posts

The split is **fully automatic** — there is no `featured` flag in the frontmatter.

**How it works** (`src/routes/blog/+page.ts`):

1. All non-draft posts are loaded and sorted by `publishedAt` descending (newest first).
2. `featured = posts[0]` — always the single newest post.
3. `rest = posts.slice(1)` — everything else, in newest-first order.

**The rule:** To make a post the featured post, give it the most recent `publishedAt` date.

**Example sequence:**

| State | Featured | More Posts (in order) |
|---|---|---|
| Before | Post A (2026-03-03) | Post B (2026-01-15) |
| After adding Post C (2026-05-01) | Post C (2026-05-01) | Post A (2026-03-03), Post B (2026-01-15) |

To "un-feature" a post without deleting it, publish a newer post. To keep a post featured, don't publish anything with a later date.

---

## Table of Contents

The TOC is built automatically by `BlogPostLayout.svelte` from all `##` (h2) and `###` (h3) headings in the post body. **It only renders if there are 2 or more headings.**

> [!IMPORTANT]
> Do not use `#` (h1) in post content. The post `title` from frontmatter is already rendered as the page `<h1>` by `BlogPostLayout.svelte`. A second `#` in the body creates a duplicate h1, which is an SEO and accessibility problem. Start your heading hierarchy at `##`. h1 headings are also not picked up by the TOC.

### How IDs are assigned

`rehype-slug` generates anchor IDs by lowercasing the heading text and replacing spaces with hyphens:

```md
## Why SvelteKit  →  id="why-sveltekit"
### Getting started  →  id="getting-started"
```

Punctuation is stripped. Duplicate headings get a numeric suffix (`-1`, `-2`, etc.).

### Active section highlighting

The TOC highlights the currently visible section automatically via an `IntersectionObserver` in `BlogPostLayout.svelte`. No setup needed.

---

## Markdown Reference

Everything rendered through mdsvex. Site-specific notes are included for each element.

---

### Headings

```md
## Section title       ← h2
### Sub-section        ← h3
#### Minor heading     ← h4
```

| Level | Rendering |
|---|---|
| h2 | Full-width bottom border (`1px solid var(--border)`). Used for major sections. |
| h3 | Left accent border (`3px solid var(--accent)`) + left padding. Used for sub-sections. |
| h4 | Plain bold, no border. Used for minor labels. |

Anchor links (`#`) appear on hover for h2 and h3 (added by `rehype-autolink-headings`).

---

### Code blocks

````md
```typescript
const greeting = 'hello';
```
````

Always renders dark (`github-dark-dimmed` via Shiki), regardless of the site theme. The dark rendering is intentional — switching themes does not affect code blocks.

**Supported languages:**

`javascript` · `typescript` · `python` · `bash` · `html` · `css` · `json` · `svelte` · `markdown` · `yaml` · `rust` · `go`

For any other language, omit the language name or use `text` — it renders without syntax highlighting.

---

### Inline code

```md
Use `const` instead of `let` for immutable bindings.
```

Renders in the **accent color** on a raised surface background (`background: var(--surface-raised); color: var(--accent)`). Stands out clearly in both dark and light themes.

---

### Callouts

Obsidian-style callouts using a blockquote with a type marker:

```md
> [!NOTE]
> This is a note callout.

> [!TIP]
> Helpful tip goes here.

> [!WARNING]
> Be careful about this.

> [!DANGER]
> This will cause problems.

> [!IMPORTANT]
> Don't skip this step.
```

Each type renders with a distinct icon and accent color. Multi-line callouts: put the `[!TYPE]` marker on the first line; continuation lines are additional paragraphs inside the same blockquote block.

```md
> [!NOTE]
> First paragraph of the note.
>
> Second paragraph of the note.
```

---

### Blockquotes (non-callout)

```md
> "The best way to predict the future is to invent it."
> — Alan Kay
```

Renders with:
- Left accent border (`3px solid var(--accent)`)
- Surface background (`var(--surface)`)
- Non-italic text (unlike default browser styling)

Plain blockquotes are for quotes and asides. Use callouts for instructional notes.

---

### Tables

```md
| Header 1 | Header 2 | Header 3 |
|---|---|---|
| Row 1, Col 1 | Row 1, Col 2 | Row 1, Col 3 |
| Row 2, Col 1 | Row 2, Col 2 | Row 2, Col 3 |
```

Renders with:
- Bottom border on the header row in the accent color
- Alternating row shading for readability
- Horizontal scroll on overflow (safe on mobile)

---

### Links

```md
[Link text](https://example.com)
```

Standard inline links. In markdown they open in the same tab. To open in a new tab, use raw HTML:

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link text</a>
```

---

### Images

```md
![Alt text describing the image](/images/posts/my-image.png)
*Caption text shown below the image*
```

An `<em>` (`*...*`) placed **immediately after** an image (no blank line between) renders as a centered, muted caption in smaller text. If you don't want a caption, simply don't add italics after the image.

**Where to put image files:** Images are served from the `static/` directory at the project root (not inside `src/`). Create a folder structure like:

```
static/
└── images/
    └── posts/
        └── my-post-slug/
            └── my-image.png
```

Reference them with an absolute path starting with `/`:

```md
![Alt text](/images/posts/my-post-slug/my-image.png)
```

The `static/images/` directory does not exist yet — create it when you add your first image. Do not place images inside `src/content/` — files there are not served as static assets.

---

### Lists

**Unordered:**

```md
- First item
- Second item
  - Nested item
  - Another nested item
- Third item
```

**Ordered:**

```md
1. First step
2. Second step
3. Third step
```

Nested lists are supported at any depth.

---

### Horizontal rule

```md
---
```

Renders as a full-width `1px` line using `var(--border)`. Useful for major section breaks within a post when a heading is not appropriate.

---

## Animation Notes

Everything in a blog post that uses animation is handled automatically — you do not configure any animations in the markdown file.

| Element | How animation is applied |
|---|---|
| Cover image | Page-enter reveal via `BlogPostLayout.svelte` on mount |
| Post header (title, description, meta) | Page-enter reveal via `BlogPostLayout.svelte` on mount |
| Cover parallax | GSAP ScrollTrigger in `BlogPostLayout.svelte` — fires automatically if a `coverImage` is present |
| TOC active item | `text-decoration-color` CSS transition driven by `IntersectionObserver` — renders an underline per line of text (multi-line safe), no setup |
| Prose content | No individual scroll-reveals — intentional for reading focus |

If `coverImage` is omitted, the placeholder still gets the page-enter reveal. The GSAP parallax only fires when a real `<img>` element is present.
