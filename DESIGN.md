# OW-Tools Style Suite Explainer Design System

## 0. Research Log

- Embedded references: shortlisted `aside.md`, `notion.md`, and `vercel.md` from the curated index; picked the available `minimal` Layer A guidance plus `aside.md` as the Layer B reference because this is a developer-tool explainer that needs product framing, restraint, and a credible UI specimen.
- Lazyweb: 2 searches and 4 screens viewed (`Wix`, `devv.ai`, `Notion`, and `Craft`) → calm product navigation, a centered claim, evidence-rich product UI, and full-width explanatory bands.
- StyleGallery: reviewed `page-grid`, `stack`, `media-object`, and `tab-strip` → one document scroll owner, a stable central track, intrinsic reflow, and wrapped control rows.
- Interaction research: reviewed beui.dev `tabs` and `action-swap` source → use a spring-like active indicator idea only where it communicates state; hand-roll the small vanilla-JS equivalent with CSS transitions and a reduced-motion path.
- Imagen drafts: skipped — the app is a standalone, dependency-free documentation surface; its focal product frame is authored as semantic HTML/CSS so the explanation stays inspectable and honest.
- Skipped lanes: the curated UI-UX database and the dedicated Layer A files referenced by the router are not present in this environment; the installed `minimal` skill is the closest available Layer A source.

## 1. Atmosphere & Identity

An honest product manual with the confidence of a finished tool: bright paper, ink-black type, pale sky atmosphere, and dense editor evidence. The signature is the **proof surface** — the hero does not show an abstract illustration; it shows a small, readable editor specimen next to a clear statement of the plugin's boundaries.

The page should feel useful before it feels impressive. Claims are short, versioned, and paired with implementation evidence or a limitation. The visual language borrows Aside's product-frame confidence and Notion/Craft's document calm without copying either product's branding, screenshots, or copy.

## 2. Color

### Palette

| Role | Token | Value | Usage |
|------|------|------:|------|
| Canvas | `--color-canvas` | `#fbfcfa` | Page background |
| Paper | `--color-paper` | `#ffffff` | Cards, product frame, header |
| Ink | `--color-ink` | `#11161a` | Headlines and primary text |
| Ink soft | `--color-ink-soft` | `#334047` | Supporting copy |
| Muted | `--color-muted` | `#68757c` | Metadata and captions |
| Hairline | `--color-hairline` | `rgba(17, 22, 26, 0.12)` | Dividers and frame edges |
| Hairline faint | `--color-hairline-faint` | `rgba(17, 22, 26, 0.07)` | Quiet containment |
| Fog | `--color-fog` | `#f2f5f3` | Neutral controls and inset surfaces |
| Sky wash | `--color-sky-wash` | `#edf8ff` | Hero atmosphere |
| Sky tint | `--color-sky-tint` | `#d6efff` | Product-frame accents |
| Sky deep | `--color-sky-deep` | `#8ccaf0` | Small visual signal only |
| Signal | `--color-signal` | `#f2c94c` | Highlight marker and active proof |
| Success | `--color-success` | `#2d8a68` | Honest “implemented” status |
| Caution | `--color-caution` | `#a26b18` | Limitations and dependencies |
| Night panel | `--color-night` | `#101820` | Source/code specimen |
| Night soft | `--color-night-soft` | `#1b2832` | Code panel surfaces |
| Night text | `--color-night-text` | `#e8f0f1` | Dark specimen text |
| Code green | `--color-code-green` | `#a8d8b8` | Source-string syntax |
| Shadow | `--shadow-frame` | `rgba(24, 45, 57, 0.16)` | Product frame depth |

Accent colors are semantic, not decorative. Sky belongs to the product frame and hero atmosphere; signal marks a state or limitation; success and caution are never used to imply a guarantee beyond the copy.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|------|------|--------|-------------|----------|-------|
| Display | `clamp(2.75rem, 7vw, 5.5rem)` | 500 | 0.94 | `-0.055em` | Hero claim |
| H1 | `clamp(2rem, 4vw, 3.5rem)` | 500 | 1.02 | `-0.04em` | Section claim |
| H2 | `clamp(1.5rem, 2.4vw, 2.25rem)` | 600 | 1.08 | `-0.025em` | Evidence section |
| H3 | `1.25rem` | 650 | 1.2 | `-0.015em` | Card title |
| Body large | `1.125rem` | 400 | 1.55 | `0` | Hero and lead copy |
| Body | `1rem` | 400 | 1.6 | `0` | Explanations |
| Body small | `0.875rem` | 500 | 1.45 | `0` | UI labels and rows |
| Caption | `0.75rem` | 650 | 1.35 | `0.06em` | Overlines and status |

### Font Stack

- Display: `Georgia, "Times New Roman", serif` — a deliberate editorial contrast for claims.
- Body/UI: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` — no remote font dependency in the standalone app.
- Mono: `ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace` — source snippets and implementation labels.

The display face is used for claims only. Product evidence and controls stay in the system sans so the page reads like documentation, not a poster.

## 4. Spacing & Layout

### Base Unit

All intentional spacing uses a 4px base.

| Token | Value | Usage |
|------|------:|-------|
| `--space-1` | `4px` | Icon-to-label |
| `--space-2` | `8px` | Tight groups |
| `--space-3` | `12px` | Control padding |
| `--space-4` | `16px` | Standard inset |
| `--space-5` | `20px` | Compact section rhythm |
| `--space-6` | `24px` | Card inset |
| `--space-8` | `32px` | Group separation |
| `--space-10` | `40px` | Section inner spacing |
| `--space-12` | `48px` | Section break |
| `--space-16` | `64px` | Major section break |
| `--space-20` | `80px` | Hero rhythm |
| `--space-24` | `96px` | Page-level separation |

### Grid

- Layout pattern: StyleGallery `page-grid` with a central track and fluid outer gutters.
- Content width: `min(1180px, 100%)`.
- Header and footer keep their full-bleed backgrounds, but their content is inset by the same `--page-outer` gutter so brand, navigation, and utility links share the page alignment.
- Main page scroll owner: the document; no nested scroll containers.
- Section composition: StyleGallery `stack` for vertical rhythm and `media-object` for evidence pairs.
- Control rows: StyleGallery `tab-strip`; rows wrap rather than forcing horizontal page scroll.
- Breakpoints: `640px`, `860px`, and `1180px`; mobile content remains one readable column.

## 5. Components

### Site Header

- **Structure**: `header` → brand mark, anchor navigation, status/version pill.
- **Variants**: desktop link row; mobile wrapped row.
- **States**: default, hover, focus-visible, active section.
- **Accessibility**: landmark, real anchors, visible focus, no icon-only navigation.
- **Motion**: color and background transition only, `150ms`.

### Product Frame

- **Structure**: `figure` → browser chrome, editor rail, document surface, evidence badge.
- **Variants**: `live-preview`, `reading-view`; `cursor-near`, `cursor-away`.
- **States**: default, active line, selected view, focus-visible controls.
- **Accessibility**: figure has a descriptive caption; controls are real buttons with `aria-pressed`; Arabic specimen has `dir="rtl"`.
- **Motion**: active state changes the caret and status label; no layout-changing animation.

### State Tabs

- **Structure**: `div[role=tablist]` with `button[role=tab]` and a labelled panel.
- **Variants**: view switcher and proof switcher.
- **States**: default, hover, active, focus-visible, reduced-motion.
- **Accessibility**: selected state is exposed with `aria-selected`; keyboard activation works naturally.
- **Motion**: active indicator uses a short transform/opacity transition; reduced motion removes it.

### Evidence Band

- **Structure**: section label, claim, evidence or code panel, short caption.
- **Variants**: feature proof, workflow, limitation ledger.
- **States**: default, expanded detail, compact mobile stack.
- **Accessibility**: headings preserve reading order; no meaning is encoded only by color.
- **Motion**: optional `IntersectionObserver` reveal uses opacity/transform only and is disabled for reduced motion.

### Copy Action

- **Structure**: semantic button with text label and inline SVG icon.
- **States**: default, hover, pressed, focus-visible, copied, disabled.
- **Accessibility**: label changes to “Copied” for feedback and returns after a short delay; no clipboard failure is hidden.
- **Motion**: label/icon action-swap uses `150ms` opacity/transform; reduced motion is an instant text swap.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|---------:|--------|-------|
| Micro | `150ms` | `ease-out` | Button hover, copy feedback |
| Standard | `220ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Tab indicator and panel entry |
| Emphasis | `520ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | First viewport reveal |

The page uses CSS transitions and a small amount of vanilla JavaScript; no animation library is justified for this static explainer. Only `transform`, `opacity`, and `filter` animate. `prefers-reduced-motion: reduce` disables reveals and state movement while preserving all content and feedback.

## 7. Depth & Surface

### Strategy: mixed

Use tonal shifts for broad page bands, hairline borders for engineered structure, and one restrained shadow token for the product frame. Cards are not floating by default; elevation belongs to the evidence specimen.

- Frame shadow: `0 24px 64px var(--shadow-frame)`.
- Quiet divider: `1px solid var(--color-hairline-faint)`.
- Product frame edge: `1px solid var(--color-hairline)`.
- No decorative glow, glass blur, or saturated gradient is used as a substitute for product evidence.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA target: minimum 4.5:1 body contrast and 3:1 large-text contrast.
- Every control is keyboard reachable with a visible focus ring.
- The page uses semantic landmarks, heading order, labelled regions, and actual buttons/anchors.
- Arabic content remains readable with explicit RTL direction and no emoji used as interface icons.
- Reduced motion is respected without hiding information.
- The primary document track must reflow at 320px, 375px, 768px, and 1280px without horizontal page scrolling.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| Product frame is an illustrative specimen, not a live Obsidian embed. | `site/index.html` | A standalone page cannot safely instantiate Obsidian internals; the copy labels it as a specimen. | Replace with an approved screenshot or hosted demo if one becomes available. |
| Feature claims describe the current workspace implementation, not a published marketplace contract. | Content sections | No public release notes or repository URL were supplied. | Replace version/capability copy with official release docs when published. |
