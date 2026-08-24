# OW-Tools Style Suite

> **Obsidian plugin — v1.0.2** · Requires Obsidian ≥ 1.4.4 · Works on desktop and mobile

A comprehensive inline-styling and typography suite for [Obsidian](https://obsidian.md).
It adds a floating formatting toolbar, rich passage typography, aesthetic highlights, custom fonts,
and per-document appearance controls — all without touching your Markdown source beyond
standard `<span>` and `<mark>` inline tags.

---

## Features

### 🖊️ Floating Formatting Toolbar
A context-sensitive toolbar appears whenever you make a selection. It exposes the most
common formatting operations without requiring you to remember keyboard shortcuts.

### 🎨 Text Color
Apply any foreground color to a selected range. Colors are stored as
`<span style="color: …">…</span>` tags and render correctly in Live Preview and
Reading View. Applying a color to an already-colored range replaces the existing color
rather than nesting wrappers.

### ✏️ Highlight
Apply aesthetic background highlights beyond Obsidian's built-in `==…==` syntax.
Highlights are stored as `<mark style="background: …">…</mark>` and respect RTL text.

### 📐 Underline
Semantic underline via `<span style="text-decoration: underline">…</span>`, distinct
from Obsidian's link underlines.

### 🔠 Custom Fonts (Passage Typography)
Assign a font family, size, and line-height to any selected passage. Typography is
applied as editor-only `!important` inline declarations so the saved Markdown stays
portable. A font picker modal with a live preview is included.

### 📄 Document Appearance
Per-note settings (stored in YAML frontmatter under a dedicated key) control:
- Document font family and size
- Line height
- Text alignment (logical `start`, `center`, `end`, `justify`)

Changes apply to the active leaf only and do not affect other open editors.

### 🌐 RTL / BiDi Support
All formatting operations are RTL-safe. The plugin detects each line's dominant script
direction and sets a CodeMirror line decoration (`dir="rtl"` / `dir="ltr"`) rather than
wrapping inline content in a direction attribute. This keeps cursor movement, text
selection, and CodeMirror's own bidi geometry correct for Arabic, Persian, Urdu, and
mixed-script paragraphs.

### 🛡️ Atomic Markup Protection
Opening and closing style tags are treated as hidden atomic ranges in the editor. The
cursor crosses each wrapper boundary in a single step; Backspace and Delete skip over
tags cleanly. Adjacent tags from the same formatting operation are merged so the cursor
never lands between two invisible characters.

---

## Installation

### Manual
1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Copy them to `.obsidian/plugins/ow-tools-style-suite/` inside your vault.
3. Enable the plugin in **Settings → Community plugins**.

### From the Community Plugin Browser *(when published)*
Search for **OW-Tools Style Suite** and click **Install**.

---

## Keyboard Shortcuts

All commands are registered under the **OW-Tools** prefix and can be bound to any
hotkey in **Settings → Hotkeys**.

| Command | Default shortcut |
|---------|-----------------|
| Toggle formatting toolbar | *(none — reassign as needed)* |
| Apply / remove text color | *(none)* |
| Apply / remove highlight | *(none)* |
| Apply / remove underline | *(none)* |
| Open font picker | *(none)* |
| Open document appearance | *(none)* |
| Clear all formatting | *(none)* |

---

## Project Structure

```
ow-tools-style-suite/
├── src/
│   ├── main.ts                      # Plugin entry point, command registration
│   ├── editor/
│   │   ├── FormattingController.ts  # Core formatting engine (selection → transaction)
│   │   ├── RichEditorExtensions.ts  # CodeMirror extension orchestrator
│   │   ├── BidiGuard.ts             # Direction detection & legacy control migration
│   │   ├── BidiLineDirection.ts     # Per-line RTL/LTR decoration facet
│   │   ├── InlineStyleDecorations.ts # Atomic hidden-range protection
│   │   ├── InlineTypography.ts      # Passage font/size/line-height decorations
│   │   └── DocumentAppearance.ts   # Document-level CSS variable management
│   ├── ui/
│   │   ├── toolbar/                 # Floating selection toolbar
│   │   ├── menu/                    # Editor context menu extensions
│   │   ├── settings/                # Plugin settings tab
│   │   ├── FontPickerModal.ts       # Font browser with live preview
│   │   ├── TextColorModal.ts        # Color picker UI
│   │   ├── PassageAppearanceModal.ts
│   │   ├── DocumentAppearanceModal.ts
│   │   ├── QuickColorPopover.ts     # Inline quick-pick color popover
│   │   └── QuickTypographyPopover.ts
│   ├── commands/                    # Discrete command implementations
│   ├── services/                    # SettingsService, persistence helpers
│   └── core/
│       └── types/                   # Shared TypeScript types and interfaces
├── tests/                           # Vitest unit tests (58 passing)
├── styles.css                       # Plugin stylesheet
├── manifest.json                    # Obsidian plugin manifest
├── esbuild.config.mjs               # Build configuration
├── PLAN.md                          # RTL-safe formatting design & implementation plan
└── DESIGN.md                        # Explainer site design system reference
```

---

## Development

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Setup
```bash
npm install
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Watch mode — rebuilds on every save |
| `npm run build` | Type-check + production bundle |
| `npm test` | Run the full Vitest suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run deploy` | Deploy built files to the configured vault |

### Running Tests
```bash
npm test
# 58 tests across formatting, RTL, atomic decorations, and edge cases
```

### Building
```bash
npm run build
# Outputs main.js (production bundle)
```

---

## Architecture Notes

### Formatting Model
- Formatting is stored as valid HTML inline tags (`<span>`, `<mark>`) directly in the
  Markdown source. No zero-width markers or invisible control characters are ever written.
- Every formatting operation is line-local: a selection spanning multiple lines is split
  into one segment per non-blank line before being transformed.
- Block prefixes (`#`, `>`, `-`, `*`, `+`, numbered list markers) are always preserved
  when a whole-line selection is processed.

### Direction Model
- The plugin does **not** wrap formatted text in a `dir="rtl"` attribute.
- Instead, `BidiLineDirection` adds a CodeMirror line decoration for each RTL line and
  enables `EditorView.perLineTextDirection` so the editor's own cursor, selection, and
  bidi geometry use the correct direction.
- `BidiGuard` is used only for direction detection and one-time migration of legacy
  direction controls (`U+200E`, `U+200F`) that older plugin versions wrote into notes.

### Passage Typography
- Font and size overrides are applied as editor-only `!important` inline style
  declarations via CodeMirror `Decoration.mark`. The saved Markdown source is not
  modified. Typography settings are stored in YAML frontmatter.

---

## License

MIT — see [LICENSE](./LICENSE).
