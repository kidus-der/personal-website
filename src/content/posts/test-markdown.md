---
title: "Markdown Feature Test"
description: A test post to verify all markdown features render correctly — code, tables, callouts, images, and more.
publishedAt: "2026-03-03"
tags: ["Test", "Markdown"]
draft: true
---

This post tests every markdown feature used in the blog. If everything looks right, the blog redesign is working.

## Code Blocks

Inline code: `const x = 42` should render with a monospace font.

A TypeScript block:

```typescript
interface Post {
  title: string;
  publishedAt: string;
  tags: string[];
}

async function getPost(slug: string): Promise<Post> {
  const res = await fetch(`/api/posts/${slug}`);
  if (!res.ok) throw new Error(`Post not found: ${slug}`);
  return res.json();
}
```

A Python example:

```python
def reading_time(text: str, wpm: int = 200) -> int:
    words = len(text.split())
    return max(1, -(-words // wpm))  # ceiling division
```

A bash snippet:

```bash
pnpm add -D rehype-slug rehype-autolink-headings shiki
```

## Tables

| Model | Accuracy | F1 Score | Notes |
|---|---|---|---|
| Baseline CNN | 73.2% | 0.71 | No augmentation |
| FaceXRay | 91.4% | 0.89 | Frequency domain |
| LipForensics | 88.7% | 0.86 | Temporal features |
| CLIP-based | 85.1% | 0.83 | Semantic features |

Table should scroll horizontally on mobile.

## Callouts

> [!NOTE]
> This is a note callout. Use it for supplementary information that's useful but not critical.

> [!TIP]
> This is a tip callout. Suggestions and best practices live here.

> [!WARNING]
> This is a warning callout. Something might break if you're not careful.

> [!DANGER]
> This is a danger callout. Serious consequences ahead.

> [!IMPORTANT]
> This is an important callout. Don't skip this.

## Headings Hierarchy

### Section Under H2

Content under h3 heading. The TOC should show this indented under its parent h2.

#### Deeper Heading (h4)

h4 should render slightly smaller than h3 with the same weight.

### Another H3

More content. The TOC should show both h3s indented under "Headings Hierarchy".

## Text Formatting

**Bold text** and *italic text* and ***bold italic***.

~~Strikethrough~~ works via GFM.

A [link to the home page](/) styled in accent color.

## Lists

Unordered:
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

Ordered:
1. Step one
2. Step two
3. Step three

## Blockquote

> The problem is that these networks don't just sharpen images — they *regenerate* texture.

A styled blockquote with left accent border.

## Horizontal Rule

---

Content below the HR.

## Second Top-Level Section

This second h2 section ensures the TOC shows at least two entries and is rendered.

### Sub-section A

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Sub-section B

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
