# Task 7 report — Home page

**Worktree:** `/Volumes/main-storage-2tb/projects/personal-website/.claude/worktrees/agent-ac86b04cc31179f4a`
**Branch:** `worktree-agent-ac86b04cc31179f4a`
**Base:** `fae982f` (reset from `e7330e6` as instructed)
**Commit:** `038b0f3` — `feat(home): hero with verification card, glance bento, selected work, latest writing, contact`

## Verification

| Gate | Result |
|---|---|
| `pnpm test:unit` | 586 passed / 56 files (was 545 at base) |
| `pnpm check` | 0 errors, 1 warning (pre-existing, `about/+page.svelte` unused CSS selector — Task 9's file) |
| `pnpm lint` | exit 0, 0 errors, 22 warnings (all pre-existing) |
| `pnpm build` | ✓ built |
| `pnpm dev` + `curl /` | 200, 175 KB, all five bands SSR'd, no error markers, no dev-server errors |

SSR spot checks in the rendered HTML: `<section class="hero">`, `glance`, `selected-work`,
`latest-writing`, `contact-cta`; five `bento-card` tiles; `ring-center-value` reads `98.2%`;
one `featured-post`. `/work`, `/blog`, `/about` all still 200.

## TDD evidence

All seven test files were written before the components existed. Because that ordering
leaves no observed red run in the transcript, I ran an explicit mutation check after the
first green run — four deliberate defects, one per component:

| Mutation | Caught by |
|---|---|
| `score = 98.2` → `90.0` | `VerificationCard > renders the default detection score…` |
| headline `real from fake` → `real from lies` (emphasis span removed) | `Hero > renders the headline as the page h1`, `Hero > emphasises exactly one phrase…` |
| `{#if rest.length > 0}` → `>= 0` | `LatestWriting > drops the grid entirely when there is only one post` |
| `onclick={contactModal.show}` → `onclick={() => {}}` | `ContactCta > opens the contact dialog from the button` |

Result: **4 test files failed, 5 tests failed.** Mutations reverted, 586 pass.

## Files

**New**

- `src/lib/components/sections/home/Hero.svelte`
- `src/lib/components/sections/home/VerificationCard.svelte`
- `src/lib/components/sections/home/Glance.svelte`
- `src/lib/components/sections/home/SelectedWork.svelte`
- `src/lib/components/sections/home/LatestWriting.svelte`
- `src/lib/components/sections/home/ContactCta.svelte`
- `src/lib/state/contact.svelte.ts`
- `src/routes/(portfolio)/+page.ts`
- `tests/unit/sections/home/{Hero,VerificationCard,Glance,SelectedWork,LatestWriting,ContactCta}.test.ts`
- `tests/unit/sections/home/homeMocks.ts`
- `tests/unit/ui/ContactModal.test.ts`

**Rewritten / modified**

- `src/routes/(portfolio)/+page.svelte` — composition only; `SEO` kept, no duplicate JSON-LD
- `src/lib/components/ui/ContactModal.svelte` — restyled

Nothing under `src/lib/components/layout/**` or any `+layout.svelte` was touched.

## Implementation notes

### Hero

Copy is verbatim from the brief. Headline is two `.hero__line` spans with the single
permitted italic emphasis (`real from fake`, Fraunces italic, accent). `BackgroundPaths
opacity={0.5}` sits inside the section, which carries `position: relative; overflow:
hidden; color: var(--accent)`. Grid is `7fr 5fr` at ≥960px, stacked below.

The entrance runs in `onMount`, guarded by `reducedMotion()`. Staged elements are hidden
there (not in the stylesheet), so the server-rendered hero is complete for a reader who
never runs the script. Timings: headline lines `stagger(0.08, { startDelay: 0.25 })`,
`y 24→0`, `opacity 0→1`, `easings.outExpo`, `durations.slow`; sub at 0.55, buttons 0.65,
socials 0.75; the card's cue flips at 600 ms.

Social icons are inline `currentColor` SVGs (GitHub octicon, LinkedIn and Google Scholar
from Simple Icons) rather than the `static/icons/*` files — those are fixed-brand-colour
and would not follow the theme. Each is `use:magnetic` with an `aria-label`.

### VerificationCard

Props `{ score = 98.2, modalities = [image 99.1, video 97.8, audio 98.5, document 96.4],
animate = true }`. `RingChart` size 168, `centerLabel="deepfakes caught"`,
`formatValue={(n) => n.toFixed(1) + '%'}`; `BarChart` at `'3 / 1'`, no grid, x axis on;
verdict row as three mono spans (`Verdict` / `Authentic` / `0.98`), no interpunct.

**One design decision worth flagging.** The charts' `animate={false}` state is *full*, not
empty. Passing the hero's cue straight through would have shown a complete ring at
hydration, blanked it at 600 ms, and redrawn — a visible glitch. So the chart block is
hidden in `onMount` (client, motion allowed only) and faded in when the cue arrives, which
is also why `.verification-card__charts` exists as a wrapper. Two tests pin both branches.

The scan line is a full-size element with the 1px gradient painted along its top edge,
translated `0 → 100%`: `translateY(100%)` of a 1px box travels 1px, whereas 100% of the
card's own height is exactly the sweep. `animation-play-state: paused` under reduced motion.

### Glance

Five `BentoCard`s in a 3-column grid (`md` span on the role card, so 5 tiles fill 6 cells).
Copy is derived from `$content` rather than retyped — the role title is
`${experience[0].role}, ${experience[0].company}`, the description is the first clause of
`experience[0].bullets[0]` (everything before its enumeration colon), the counter target is
`publications.length`, the sparkline is `publicationsByYear()`. The writing tile is dropped
when there is no post (4 tiles). The counter starts *at* the final count so SSR and no-JS
read correctly, then rewinds and animates `animate(0, 8, { duration: 1.2, onUpdate })`;
under reduced motion it never moves.

### Contact wiring

Two openers, one dialog. `src/lib/state/contact.svelte.ts` holds a module-level `$state`
exposed as a settable `open` property plus `show()`/`close()`. `ContactCta` renders the
single `<ContactModal bind:open={contactModal.open} />`; `Glance`'s "Get in touch" and
`ContactCta`'s `ParticleButton` both call `contactModal.show()`. `open` is `$bindable`
because the modal closes itself — the exit animation has to finish before the node leaves
the DOM. Both bind directions are tested.

### ContactModal

Fetch payload, endpoint, response handling and error copy are byte-identical to the
GSAP version. GSAP timelines replaced with `animate` (overlay `opacity 0→1` over
`durations.base`; card `opacity 0→1` + `scale .92→1` with `springs.snappy`; exit is a
`durations.fast` fade to `scale .96`). Uses `Button`, tokens and `var(--radius-card)`.
`cursorTarget`/`magnetic` imports removed along with the component's own trigger button.
Escape closes; focus is captured before the dialog takes it and restored on close.

## Bugs found and fixed during the work

1. **Escape was dead.** Carrying the old card-level `onkeydown={(e) => e.stopPropagation()}`
   forward meant a keydown from a focused field — i.e. every real keypress in the dialog —
   never reached the `<svelte:window>` listener. Removed the handler; added a test that
   presses Escape *from inside* the message field rather than on `window`.
2. **Stale success state on an external close.** Reset moved out of `requestClose` into the
   effect's close branch, so it happens however the modal closes. Typed field values are
   deliberately kept, so reopening does not throw away a half-written message.
3. **`RangeError` risk at SSR.** A malformed `education.graduation` would have thrown out of
   `Intl.format` during render; it now falls back to the raw string.

## Concerns / notes for the controller

1. **No honeypot in `ContactModal`.** The brief said to keep "the fetch/validation logic and
   honeypot exactly". There is no honeypot in this component at `fae982f`, and
   `/api/contact` accepts no such field — the honeypot lives in `SubscribeSection`
   (`website`) against `/api/subscribe`. I kept the fetch logic exactly as it was rather
   than adding a field the server ignores. Adding one is a small change to both the
   component and the endpoint if you want it.
2. **No focus trap in the dialog.** Tab can leave the modal, as it could before. Out of
   scope here, but worth a follow-up if a11y is being swept.
3. **Amharic in the settled greeting.** `DynamicText` sets `lang` on the *cycling* words, so
   `:global([lang='am'])` picks up `var(--font-ethiopic)` for those. The settled string
   `"ሰላም, I'm Kidus."` mixes scripts in one text node with no `lang` hook, so its Amharic
   relies on the browser's per-glyph fallback. The token-pure alternatives all involve
   hard-coding font names next to the tokens; if you want it exact, `DynamicText` would need
   to accept a snippet (or a `finalLang`) rather than a plain string.
4. **`tests/unit/sections/home/homeMocks.ts`** is a new local mock module (`reveal`,
   `magnetic`) rather than an extension of `tests/unit/kokonut/actionsMock.ts`, chosen to
   avoid a merge conflict with the parallel layout task. If that task adds the same stubs,
   the two should be folded into `actionsMock.ts` at merge time.
5. **`ContactModal`'s API changed** (no trigger button; `open` bindable + `onclose`). Its
   only consumer was the home page, which is updated. Any later task wanting a contact
   trigger should call `contactModal.show()`.
6. `+page.ts` leaves the rendering mode alone — `prerender` is not set, as instructed.
