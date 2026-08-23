# RTL-safe formatting plan

## Goal

Keep Arabic, Persian, Urdu, and other right-to-left text stable when the user
applies text color, highlight, underline, or font changes to:

- a word or part of a paragraph;
- a complete paragraph, heading, list item, or blockquote;
- several complete paragraphs;
- a range that starts or ends inside another paragraph; and
- mixed styled and unstyled text.

Formatting must not cross a newline, alter Markdown block prefixes, create
duplicate containers, or move the caret into hidden markup.

## Root causes found

1. The editor wrapped formatted RTL source in an inline `dir="rtl"` span.
   That changed the bidi boundary inside a CodeMirror line while CodeMirror
   still calculated line geometry using the editor's default direction.
2. Document appearance CSS set `text-align: inherit` on every CodeMirror line.
   With no explicit alignment, this can force the line to use the surrounding
   left-aligned editor context instead of the line's logical start side.
3. Font rules leaked to every `.cm-line`, `.cm-content`, and Markdown preview
   in the application instead of being scoped to this plugin's document root.
4. Older builds wrote invisible U+200E/U+200F controls into notes. Those
   controls create real source positions and can hide the caret beside an
   HTML wrapper. They are compatibility data only, not part of the new model.

## Design

### 1. Direction belongs to the rendered line

- Detect the first strong directional character after removing HTML markup and
  legacy direction controls from the inspected text.
- Add `dir="rtl"` to the CodeMirror line decoration for RTL lines.
- Enable CodeMirror's `EditorView.perLineTextDirection` so cursor movement,
  coordinates, wrapping, and bidi spans use the rendered line direction.
- Do not wrap source text in a direction decoration and do not use
  `unicode-bidi: plaintext` for the inline formatting range.
- Keep the default document alignment as logical `start`; an explicit user
  alignment such as `left`, `right`, `center`, or `justify` still wins.

### 2. Keep source formatting line-local

- Normalize a selection into one segment per affected non-blank line.
- Clamp full-line selections after `# `, `> `, `- `, `* `, `+ `, or numbered
  list prefixes.
- Reuse the same segment model for typography, color, highlight, underline,
  and semantic marks.
- Preserve existing typography and nested semantic marks while flattening
  overlapping style containers into one valid inline container.
- Never generate an inline tag spanning a newline.

### 3. Keep hidden markup atomic without hiding real text

- Treat opening/closing style and semantic tags as hidden atomic ranges only
  when inline-style markup is hidden.
- Merge adjacent hidden tags so the cursor crosses a wrapper boundary once.
- Keep Backspace, Delete, mouse selection, and transaction filtering aligned
  with the same hidden-range calculation.
- Migrate only legacy direction controls directly attached to generated
  wrappers. Do not delete ordinary user-authored U+200E/U+200F text.
- New formatting writes no direction controls.

### 4. Scope the CSS

- Scope document font, font synthesis, emphasis, highlight, and alignment
  rules below `.rich-editor-document-surface`.
- Keep highlights inline; never create an inline-block bidi box around a whole
  paragraph.
- Keep the line direction rule separate from inline typography styles.

### 5. Keep active and inactive lines metrically identical

- Apply passage typography as editor-only inline declarations with
  `!important`; saved HTML remains clean and portable.
- Let styled editor ranges inherit the document surface defaults when a
  passage does not override a property, instead of applying a competing base
  font rule to every styled wrapper.
- Treat caret activation as a visual-state change only: it must not change
  font metrics, wrapping, or RTL line geometry.

## Implementation order

1. Use `BidiGuard` only for direction detection, block-prefix handling, and
   clearly named legacy-control migration helpers.
2. Implement `BidiLineDirection` with line decorations and CodeMirror's
   per-line direction facet.
3. Remove the inline RTL decoration and the `unicode-bidi` CSS rule.
4. Scope the document CSS and change the unset alignment fallback to `start`.
5. Keep the existing line-segment formatting transformer and atomic markup
   protection, removing obsolete anchor-oriented names and branches.
6. Add regression tests for whole-line, partial-line, mixed-line,
   multi-paragraph, list/heading/blockquote, repeated, and cursor-edge cases.
7. Build the bundle from `src/`, deploy it to the active vault, and verify the
   deployed checksums.
8. Add an active/inactive-line regression that verifies the rendered passage
   style remains unchanged when the selection moves.

## Verification matrix

### Automated

- Arabic, Persian/Urdu, Latin, mixed-script, punctuation, and numeric lines.
- Full paragraph color, highlight, underline, and font operations.
- Partial, word, reversed, mixed, and multi-line selections.
- Markdown prefixes and blank separator lines.
- Repeated apply/remove without nested containers.
- Cursor movement and deletion beside hidden wrappers.
- No inline RTL wrapper, no new U+200E/U+200F controls, and no
  `display: inline-block` highlight decoration.

### Manual Obsidian checks

- Live Preview and Reading View.
- RTL-only and mixed Arabic/Latin paragraphs.
- Headings, lists, blockquotes, tables, punctuation, and numbers.
- Cursor before, inside, after, and on a blank line beside a formatted block.
- Apply each of the four reported operations to whole and partial selections,
  then remove them and confirm the source remains clean.

## Acceptance criteria

- All four reported whole-paragraph operations preserve RTL line alignment.
- Partial and mixed selections behave consistently with whole paragraphs.
- The caret remains visible at every valid source position.
- No generated direction character or cross-line wrapper remains.
- Existing LTR formatting behavior and unrelated Obsidian editors are not
  changed by plugin CSS.
- Activating a formatted line does not reflow its text or change its passage
  typography.
- `npm test`, `npm run build`, and strict unused-code type checking pass.
