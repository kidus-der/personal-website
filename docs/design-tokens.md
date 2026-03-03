# Design Tokens

## Single source of truth

All design tokens live in the `@theme` block in `src/styles/app.css`. Tailwind utilities, CSS custom properties, and SCSS variables all derive from here.

## Color system

Two themes: `dark` (default) and `light`. Both are defined as CSS custom properties scoped to `[data-theme]` on `<html>`.

### Semantic tokens

| Token | Purpose |
|---|---|
| `--color-bg` | Page background |
| `--color-surface` | Card/panel backgrounds |
| `--color-surface-raised` | Elevated surfaces |
| `--color-border` | Borders and dividers |
| `--color-text` | Primary text |
| `--color-text-muted` | Secondary/muted text |
| `--color-accent` | Primary accent — orange-red `#F05924` dark / royal blue `#2B5CE6` light |
| `--color-accent-dim` | Low-opacity accent for backgrounds/blobs |

### Theme values

| Token | Dark | Light |
|---|---|---|
| `--bg` | `#0a0a0a` | `#ffffff` |
| `--surface` | `#111111` | `#f4f6ff` (blue-tinted) |
| `--surface-raised` | `#1a1a1a` | `#eef1ff` (blue-tinted) |
| `--border` | `rgba(255,255,255,0.08)` | `rgba(43,92,230,0.12)` (blue-tinted) |
| `--text` | `#f0f0f0` | `#0a0a0a` |
| `--text-muted` | `rgba(240,240,240,0.45)` | `rgba(10,10,10,0.5)` |
| `--accent` | `#F05924` (orange-red ember) | `#2B5CE6` (royal blue) |
| `--accent-dim` | `rgba(240,89,36,0.15)` | `rgba(43,92,230,0.10)` |

## Typography

Fluid type scale using `clamp()` — all sizes defined in `src/styles/_typography.scss` and available as CSS custom properties:

| Token | Range |
|---|---|
| `--text-xs` | 0.7rem → 0.8rem |
| `--text-sm` | 0.85rem → 0.95rem |
| `--text-base` | 1rem → 1.1rem |
| `--text-lg` | 1.1rem → 1.3rem |
| `--text-xl` | 1.25rem → 1.6rem |
| `--text-2xl` | 1.5rem → 2rem |
| `--text-3xl` | 2rem → 3.5rem |
| `--text-4xl` | 2.5rem → 6rem |
| `--text-display` | 3.5rem → 9rem |

Font families:
- `--font-display`: Neue Montreal → Inter → system-ui (self-host when available)
- `--font-body`: same as display
- `--font-mono`: JetBrains Mono → Fira Code

## Animation easings

CSS custom properties for use in transitions (not GSAP — use the `easings.ts` constants for GSAP):

| Token | Value |
|---|---|
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` |
| `--ease-in-out-expo` | `cubic-bezier(0.87, 0, 0.13, 1)` |
| `--ease-in-out-quart` | `cubic-bezier(0.76, 0, 0.24, 1)` |

## Border radius

| Token | Value |
|---|---|
| `--radius-sm` | `4px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `16px` |
| `--radius-full` | `9999px` |

## Spacing

| Token | Value |
|---|---|
| `--spacing-section` | `clamp(5rem, 12vw, 10rem)` |
| `--spacing-container` | `clamp(1.25rem, 5vw, 4rem)` |
