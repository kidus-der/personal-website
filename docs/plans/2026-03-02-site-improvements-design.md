# Site Improvements — Design Document
**Date:** 2026-03-02
**Branch:** `feature/site-improvements`
**Status:** Approved — ready for implementation

---

## Overview

Five distinct improvement areas across theme, content, and a new animated publication popup component. All changes go on a feature branch and merge to main after user visual verification on `pnpm dev`.

---

## 1. Theme Overhaul

### Dark mode
- **Accent:** `#F05924` (deep orange-red ember) — replaces `#e8ff47` chartreuse yellow
- `--accent-dim`: `rgba(240, 89, 36, 0.15)`
- All other dark tokens unchanged (`--bg: #0a0a0a`, pure black surfaces)

### Light mode
- **Accent:** `#2B5CE6` (royal blue) — replaces near-black `#1a1a1a`
- `--bg`: `#ffffff` (pure white, up from `#fafafa`)
- `--surface`: `#f4f6ff` (faint blue tint)
- `--surface-raised`: `#eef1ff`
- `--border`: `rgba(43, 92, 230, 0.12)` (blue-tinted border)
- `--text`: `#0a0a0a`
- `--text-muted`: `rgba(10, 10, 10, 0.5)`
- `--accent-dim`: `rgba(43, 92, 230, 0.10)`

**File:** `src/styles/app.css`

---

## 2. Content & Data Fixes

### Projects (`src/content/projects/index.ts`)
- **Remove:** `flairglow-probeauty`, `svm-stock-predictor`, `port-scanner`
- **Keep:** `coeus-ai`, `elevent`, `poseidon-wildfire`
- **Promote** `elevent` → `featured: true` (home page needs 2 featured cards)
- Final list order: Coeus AI (featured), ELEVENT (featured), Poseidon Wildfire

### About page — Experience (`src/routes/(portfolio)/about/+page.svelte`)
- Change Scam AI role: `'ML Engineer'` → `'Founding Engineer'`
- Update Scam AI bullets to match CV (4 bullets, verbatim from source)
- Remove last experience entry (fabricated "Undergraduate Research Assistant")
- Final 3 entries: Founding Engineer @ Scam AI, Service Desk @ U of A, ML Intern @ Avolta

### About page — Publications
- Replace all 4 entries with correct CV data:

| Title | Venue | arXiv URL |
|---|---|---|
| Do Deepfake Detectors Work in Reality? | IEEE (submitted) | https://arxiv.org/abs/2502.10920 |
| Can Multi-modal (reasoning) LLMs work as deepfake detectors? | arXiv preprint | https://arxiv.org/pdf/2503.20084 |
| Can Multi-modal (reasoning) LLMs detect document manipulation? | arXiv preprint | https://arxiv.org/abs/2508.11021 |
| How well are open sourced AI-generated image detection models out-of-the-box: A comprehensive benchmark study | arXiv preprint | https://arxiv.org/abs/2602.07814 |

### Home page subheadline (`src/routes/(portfolio)/+page.svelte`)
- Update "ML Engineer at Scam AI" → "Founding Engineer at Scam AI"

---

## 3. Publications Popup — Animated GSAP Glassmorphism Modal

### Behaviour
- Each publication item is a clickable `<button>` (not a link — the popup is the destination)
- Click → modal springs in; click outside or press Escape → modal reverses out
- Only one modal open at a time

### Animation (GSAP)
**Open:**
```
overlay: opacity 0 → 0.6, duration 0.35, ease: power2.out
card: scale 0.85 → 1, opacity 0 → 1, y 20 → 0, duration 0.45, ease: back.out(1.4)
bullet stagger: y 12 → 0, opacity 0 → 1, stagger 0.07, starts after card lands
```
**Close (reverse):**
```
card: scale 1 → 0.9, opacity 1 → 0, y 0 → 10, duration 0.25, ease: power2.in
overlay: opacity 0.6 → 0, duration 0.25
```

### Visual Design — Glass Card
- `backdrop-filter: blur(24px) saturate(180%)`
- Background: `rgba(var(--surface-rgb), 0.75)` — adapts to theme
- Border: `1px solid rgba(255,255,255,0.12)` dark / `rgba(43,92,230,0.15)` light
- Border radius: `var(--radius-lg)` (16px)
- Max width: `640px`, padding: `2.5rem`
- Box shadow: `0 24px 60px rgba(0,0,0,0.4)`

### Card Content Layout
```
[×  close button — top right]

LABEL: "Publication"            ← xs uppercase accent color

TITLE                           ← text-xl, font-weight 600, line-height 1.3

[ Read on arXiv → ]             ← pill button, accent bg, opens in new tab

──────────────────────────────

• bullet point 1
• bullet point 2
• bullet point 3
```

### Component
- **New file:** `src/lib/components/ui/PublicationModal.svelte`
- Receives `pub: Publication` prop (with `title`, `venue`, `year`, `url`, `bullets[]`)
- Manages its own open/close state via `$state`
- Portal-rendered via Svelte `<svelte:body>` for correct stacking context
- Accessible: `role="dialog"`, `aria-modal="true"`, focus trap on open, restore on close

### Type update
- **Update:** `src/lib/types/content.ts` — add `url` and `bullets` fields to a new `Publication` type

### About page wiring
- Import `PublicationModal` in `about/+page.svelte`
- Each pub item renders `<PublicationModal pub={pub} />` — the component handles its own trigger button + modal

---

## 4. CTA Section Move

- **Remove** "Let's build something" section from bottom of `src/routes/(portfolio)/about/+page.svelte`
- **Add** equivalent section to bottom of `src/routes/(portfolio)/+page.svelte` (home page), below the selected work grid
- Style consistently with existing home page aesthetic (same spacing tokens, same button style)
- Keep the `use:revealOnScroll` animation

---

## Implementation Notes

- **Branch:** `git checkout -b feature/site-improvements` from `main`
- **Verification:** `pnpm check` must be 0 errors before PR; user runs `pnpm dev` for visual sign-off
- **Commit granularity:** One commit per section (theme, content fixes, popup component, CTA move)
- **CLAUDE.md:** Update after implementation to reflect new Publication type and modal component pattern
- **memory.md:** Update with glassmorphism modal pattern and GSAP open/close animation approach
