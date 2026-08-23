import { Decoration, DecorationSet, EditorView, PluginValue, ViewPlugin, ViewUpdate, keymap } from '@codemirror/view';
import { EditorSelection, EditorState, Prec } from '@codemirror/state';
import {
  findAllInlineTypographyRegions,
  type InlineTypography,
  inlineTypographyToCss,
} from './InlineTypography.js';
import { stripGeneratedDirectionControls } from './BidiGuard.js';

export const INLINE_STYLE_VISIBILITY_EVENT = 'rich-editor-inline-style-visibility';

export interface InlineStyleDecorationDeps {
  isMarkupHidden: () => boolean;
}

interface TagBoundary {
  open: number;
  openEnd: number;
  close: number;
  closeEnd: number;
}

interface HiddenMarkupRange {
  from: number;
  to: number;
}

const HIDDEN_INLINE_MARKUP_PATTERN = /<\/?(?:b|strong|i|em|u|s|strike|del)\b[^>]*>/gi;
const SEMANTIC_MARKUP_PATTERN = /<\/?(b|strong|i|em|u|s|strike|del)\b[^>]*>/gi;

type SemanticFormat = 'bold' | 'italic' | 'underline' | 'strikethrough';

interface SemanticMarkRange {
  open: number;
  openEnd: number;
  close: number;
  closeEnd: number;
  format: SemanticFormat;
}

const SEMANTIC_FORMAT_BY_TAG: Record<string, SemanticFormat> = {
  b: 'bold',
  strong: 'bold',
  i: 'italic',
  em: 'italic',
  u: 'underline',
  s: 'strikethrough',
  strike: 'strikethrough',
  del: 'strikethrough',
};

class InlineStyleDecorationValue implements PluginValue {
  public decorations: DecorationSet;
  private destroyed = false;
  private legacyCleanupScheduled = false;

  constructor(private view: EditorView, private deps: InlineStyleDecorationDeps) {
    this.decorations = this.buildDecorations();
    window.addEventListener(INLINE_STYLE_VISIBILITY_EVENT, this.handleVisibilityChange);
    this.scheduleLegacyDirectionCleanup();
  }

  public update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations();

      if (update.docChanged) {
        const boundaries = computeTagBoundariesFromDoc(update.state.doc);
        const emptyTags = boundaries.filter((b) => b.openEnd === b.close);
        if (emptyTags.length > 0) {
          Promise.resolve().then(() => {
            const currentBoundaries = computeTagBoundariesFromDoc(this.view.state.doc);
            const currentEmpty = currentBoundaries.filter((b) => b.openEnd === b.close);
            if (currentEmpty.length > 0) {
              const changes = currentEmpty.map((b) => ({ from: b.open, to: b.closeEnd }));
              this.view.dispatch({ changes, userEvent: 'delete.emptyTag' });
            }
          });
        }
      }
    }
  }

  public destroy(): void {
    this.destroyed = true;
    window.removeEventListener(INLINE_STYLE_VISIBILITY_EVENT, this.handleVisibilityChange);
  }

  /**
   * One-time migration for notes written by the old source-anchor engine.
   * New formatting never creates these controls, and this deliberately does
   * not run as a document normalizer on every transaction.
   */
  private scheduleLegacyDirectionCleanup(): void {
    if (this.legacyCleanupScheduled) return;
    this.legacyCleanupScheduled = true;
    Promise.resolve().then(() => {
      if (this.destroyed) return;

      const changes: Array<{ from: number; to: number; insert: string }> = [];
      for (let lineNumber = 1; lineNumber <= this.view.state.doc.lines; lineNumber += 1) {
        const line = this.view.state.doc.line(lineNumber);
        const cleaned = stripGeneratedDirectionControls(line.text);
        if (cleaned !== line.text) {
          changes.push({ from: line.from, to: line.to, insert: cleaned });
        }
      }

      if (changes.length > 0) {
        this.view.dispatch({ changes, userEvent: 'input' });
      }
    });
  }

  private handleVisibilityChange = (): void => {
    this.decorations = this.buildDecorations();
    this.view.dispatch({});
  };

  private buildDecorations(): DecorationSet {
    const ranges: Array<any> = [];
    const hideMarkup = this.deps.isMarkupHidden();

    for (let lineNumber = 1; lineNumber <= this.view.state.doc.lines; lineNumber += 1) {
      const line = this.view.state.doc.line(lineNumber);
      for (const region of findAllInlineTypographyRegions(line.text)) {
        const openEnd = line.from + region.openEnd;
        const close = line.from + region.close;
        const isHighlight = Boolean(region.typography.backgroundColor);
        const markClass = isHighlight
          ? 'rich-editor-inline-styled-text rich-editor-inline-highlight'
          : 'rich-editor-inline-styled-text';

        if (openEnd < close) {
          // The active Live Preview line can receive a theme rule that differs
          // from the rendered reading line. Keep the passage's own typography
          // authoritative so activating the line cannot change its metrics or
          // move a word to a different visual line.
          let css = inlineTypographyToEditorCss(region.typography);
          if (isHighlight) {
            // Keep the highlight inline. An inline-block around an entire RTL
            // line becomes a bidi box and can change paragraph alignment.
            css += '; vertical-align: baseline !important; line-height: inherit !important; border-radius: var(--rich-editor-highlight-radius, 6px); padding: 0.12em 0.42em; margin: 0 0.08em; box-decoration-break: clone; -webkit-box-decoration-break: clone;';
          }
          ranges.push(
            Decoration.mark({
              class: markClass,
              attributes: { style: css },
            }).range(openEnd, close)
          );
        }
      }

      // Replaced HTML tags do not leave real <b>/<i>/<u>/<s> elements in
      // CodeMirror's DOM. Apply their semantic presentation to the content
      // explicitly so formatting stays visible while the cursor is inside it.
      for (const mark of findSemanticMarkRanges(line.text)) {
        const from = line.from + mark.openEnd;
        const to = line.from + mark.close;
        if (from >= to) continue;
        ranges.push(
          Decoration.mark({
            class: `rich-editor-inline-format rich-editor-inline-${mark.format}`,
          }).range(from, to)
        );
      }
    }

    if (hideMarkup) {
      for (const hidden of computeHiddenMarkupRangesFromDoc(this.view.state.doc)) {
        ranges.push(Decoration.replace({ inclusive: false }).range(hidden.from, hidden.to));
      }
    }

    ranges.sort((a, b) => a.from - b.from || a.to - b.to);

    return Decoration.set(ranges, true);
  }
}

/**
 * Editor-only form of inline typography CSS.
 *
 * Source HTML must stay clean and portable, so `inlineTypographyToCss()` does
 * not add cascade controls to saved markup. CodeMirror decorations, however,
 * sit inside Obsidian's active-line styling and need their explicit passage
 * values to win that cascade. Keeping this conversion here makes that
 * distinction visible and prevents active-line reflow.
 */
function inlineTypographyToEditorCss(typography: InlineTypography): string {
  return inlineTypographyToCss(typography)
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => `${declaration.replace(/\s*!important\s*$/i, '')} !important`)
    .join('; ');
}

function findSemanticMarkRanges(text: string): SemanticMarkRange[] {
  const stack: Array<{ tag: string; format: SemanticFormat; open: number; openEnd: number }> = [];
  const ranges: SemanticMarkRange[] = [];
  SEMANTIC_MARKUP_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = SEMANTIC_MARKUP_PATTERN.exec(text)) !== null) {
    const tagText = match[0];
    const tag = match[1].toLowerCase();
    const format = SEMANTIC_FORMAT_BY_TAG[tag];
    if (!format) continue;

    if (!tagText.startsWith('</')) {
      stack.push({ tag, format, open: match.index, openEnd: match.index + tagText.length });
      continue;
    }

    let openingIndex = -1;
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      if (stack[index].tag === tag) {
        openingIndex = index;
        break;
      }
    }
    if (openingIndex === -1) continue;

    const [opening] = stack.splice(openingIndex, 1);
    if (!opening) continue;
    ranges.push({
      open: opening.open,
      openEnd: opening.openEnd,
      close: match.index,
      closeEnd: match.index + tagText.length,
      format: opening.format,
    });
  }

  return ranges;
}

function computeHiddenMarkupRangesFromDoc(doc: any): HiddenMarkupRange[] {
  const ranges: HiddenMarkupRange[] = [];
  for (let lineNumber = 1; lineNumber <= doc.lines; lineNumber += 1) {
    const line = doc.line(lineNumber);
    for (const region of findAllInlineTypographyRegions(line.text)) {
      ranges.push({ from: line.from + region.open, to: line.from + region.openEnd });
      ranges.push({ from: line.from + region.close, to: line.from + region.closeEnd });
    }

    HIDDEN_INLINE_MARKUP_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = HIDDEN_INLINE_MARKUP_PATTERN.exec(line.text)) !== null) {
      ranges.push({ from: line.from + match.index, to: line.from + match.index + match[0].length });
    }

  }

  const seen = new Set<string>();
  const uniqueRanges = ranges
    .filter((range) => {
      const key = `${range.from}:${range.to}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return range.from < range.to;
    })
    .sort((a, b) => a.from - b.from || a.to - b.to);

  // CM6 moves across one atomic range at a time. Adjacent tags such as
  // <span><b><i> have no visible character between them, so expose them as
  // one atomic segment and avoid invisible intermediate cursor stops.
  const mergedRanges: HiddenMarkupRange[] = [];
  for (const range of uniqueRanges) {
    const previous = mergedRanges[mergedRanges.length - 1];
    if (previous && range.from <= previous.to) {
      previous.to = Math.max(previous.to, range.to);
    } else {
      mergedRanges.push({ ...range });
    }
  }
  return mergedRanges;
}

/**
 * `atomicRanges` handles ordinary cursor movement, but older CodeMirror builds
 * can still place a mouse or programmatic selection endpoint inside a replaced
 * range. Keep endpoints at the nearest visible boundary as a final safeguard.
 */
function selectionOutsideHiddenMarkup(selection: EditorSelection, ranges: HiddenMarkupRange[]): EditorSelection | null {
  let changed = false;
  const snap = (position: number): number => {
    for (const range of ranges) {
      if (position <= range.from || position >= range.to) continue;
      changed = true;
      return position - range.from <= range.to - position ? range.from : range.to;
    }
    return position;
  };

  const nextRanges = selection.ranges.map((range) =>
    EditorSelection.range(snap(range.anchor), snap(range.head))
  );
  return changed ? EditorSelection.create(nextRanges, selection.mainIndex) : null;
}

function computeTagBoundariesFromDoc(doc: any): TagBoundary[] {
  const boundaries: TagBoundary[] = [];
  for (let lineNumber = 1; lineNumber <= doc.lines; lineNumber++) {
    const line = doc.line(lineNumber);
    for (const region of findAllInlineTypographyRegions(line.text)) {
      boundaries.push({
        open: line.from + region.open,
        openEnd: line.from + region.openEnd,
        close: line.from + region.close,
        closeEnd: line.from + region.closeEnd,
      });
    }
  }
  return boundaries;
}

export function createInlineStyleDecorationExtension(deps: InlineStyleDecorationDeps) {
  const selectionGuard = EditorState.transactionFilter.of((tr) => {
    const ranges = deps.isMarkupHidden() ? computeHiddenMarkupRangesFromDoc(tr.newDoc) : [];
    const selection = selectionOutsideHiddenMarkup(
      tr.newSelection,
      ranges
    );
    return selection ? [tr, { selection }] : tr;
  });

  /**
   * Safe Deletion Filter: intercepts actual delete transactions and prevents
   * partial corruption of hidden <span...> and </span> tags.
   */
  const safeDeletionFilter = EditorState.transactionFilter.of((tr) => {
    // Formatting commands and source normalizers also replace document ranges.
    // Treating those transactions as deletion corrupts a styled span whenever
    // it sits within a longer line. Only intercept actual delete operations.
    if (!deps.isMarkupHidden() || !tr.docChanged || !tr.isUserEvent('delete')) return tr;

    const boundaries = computeTagBoundariesFromDoc(tr.startState.doc);
    if (boundaries.length === 0) return tr;

    let needsRemap = false;
    const remappedChanges: Array<{ from: number; to: number; insert?: string }> = [];

    tr.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
      let handled = false;

      for (const tag of boundaries) {
        // Deleting the entire content inside the span -> delete the span tags cleanly together
        if (fromA <= tag.openEnd && toA >= tag.close) {
          needsRemap = true;
          handled = true;
          remappedChanges.push({ from: tag.open, to: tag.closeEnd, insert: inserted.toString() });
          break;
        }

        // Deleting backward at tag.openEnd (e.g. Backspace at start of styled text)
        if (fromA >= tag.open && toA === tag.openEnd && inserted.length === 0) {
          needsRemap = true;
          handled = true;
          if (tag.open > 0) {
            remappedChanges.push({ from: tag.open - 1, to: tag.open, insert: '' });
          }
          break;
        }

        // Deleting forward at tag.close (e.g. Delete at end of styled text)
        if (fromA === tag.close && toA <= tag.closeEnd && inserted.length === 0) {
          needsRemap = true;
          handled = true;
          if (tag.closeEnd < tr.startState.doc.length) {
            remappedChanges.push({ from: tag.closeEnd, to: tag.closeEnd + 1, insert: '' });
          }
          break;
        }

        // Partial deletion overlapping tag opening
        if (fromA < tag.openEnd && toA > tag.open && fromA >= tag.open && toA <= tag.openEnd) {
          needsRemap = true;
          handled = true;
          // Discard corrupting change inside opening tag
          break;
        }

        // Partial deletion overlapping tag closing
        if (fromA < tag.closeEnd && toA > tag.close && fromA >= tag.close && toA <= tag.closeEnd) {
          needsRemap = true;
          handled = true;
          // Discard corrupting change inside closing tag
          break;
        }
      }

      if (!handled) {
        remappedChanges.push({ from: fromA, to: toA, insert: inserted.toString() });
      }
    });

    if (!needsRemap) return tr;

    return {
      changes: remappedChanges,
      selection: tr.selection,
      scrollIntoView: true,
    };
  });

  /**
   * Smart Backspace key handler with highest precedence.
   */
  const handleBackspace = (view: EditorView): boolean => {
    if (!deps.isMarkupHidden()) return false;
    const state = view.state;
    const sel = state.selection.main;
    if (!sel.empty) return false;

    const pos = sel.head;
    const boundaries = computeTagBoundariesFromDoc(state.doc);
    if (boundaries.length === 0) return false;

    for (const tag of boundaries) {
      if (pos === tag.openEnd) {
        if (tag.open > 0) {
          view.dispatch({
            changes: { from: tag.open - 1, to: tag.open },
            selection: EditorSelection.cursor(tag.openEnd - 1),
            scrollIntoView: true,
            userEvent: 'delete.backward',
          });
          return true;
        }
        return false;
      }

      if (pos === tag.open) {
        if (tag.open > 0) {
          view.dispatch({
            changes: { from: tag.open - 1, to: tag.open },
            selection: EditorSelection.cursor(tag.open - 1),
            scrollIntoView: true,
            userEvent: 'delete.backward',
          });
          return true;
        }
        // Tag at position 0: nothing behind it to remove; fall through.
        return false;
      }

      if (pos === tag.closeEnd) {
        if (tag.close > tag.openEnd) {
          if (tag.close === tag.openEnd + 1) {
            view.dispatch({
              changes: { from: tag.open, to: tag.closeEnd },
              selection: EditorSelection.cursor(tag.open),
              scrollIntoView: true,
              userEvent: 'delete.backward',
            });
            return true;
          }
          view.dispatch({
            changes: { from: tag.close - 1, to: tag.close },
            selection: EditorSelection.cursor(tag.closeEnd - 1),
            scrollIntoView: true,
            userEvent: 'delete.backward',
          });
          return true;
        }
      }

      if (pos === tag.openEnd + 1 && tag.close === tag.openEnd + 1) {
        view.dispatch({
          changes: { from: tag.open, to: tag.closeEnd },
          selection: EditorSelection.cursor(tag.open),
          scrollIntoView: true,
          userEvent: 'delete.backward',
        });
        return true;
      }
    }

    return false;
  };

  /**
   * Smart Delete key handler with highest precedence.
   */
  const handleDelete = (view: EditorView): boolean => {
    if (!deps.isMarkupHidden()) return false;
    const state = view.state;
    const sel = state.selection.main;
    if (!sel.empty) return false;

    const pos = sel.head;
    const boundaries = computeTagBoundariesFromDoc(state.doc);
    if (boundaries.length === 0) return false;

    for (const tag of boundaries) {
      if (pos === tag.close) {
        if (tag.closeEnd < state.doc.length) {
          view.dispatch({
            changes: { from: tag.closeEnd, to: tag.closeEnd + 1 },
            selection: EditorSelection.cursor(tag.close),
            scrollIntoView: true,
            userEvent: 'delete.forward',
          });
          return true;
        }
        // Tag ends at document end: nothing ahead to remove; fall through.
        return false;
      }

      if (pos === tag.closeEnd) {
        if (tag.closeEnd < state.doc.length) {
          view.dispatch({
            changes: { from: tag.closeEnd, to: tag.closeEnd + 1 },
            selection: EditorSelection.cursor(tag.closeEnd),
            scrollIntoView: true,
            userEvent: 'delete.forward',
          });
          return true;
        }
        return true;
      }

      if (pos === tag.open) {
        if (tag.openEnd < tag.close) {
          if (tag.openEnd + 1 === tag.close) {
            view.dispatch({
              changes: { from: tag.open, to: tag.closeEnd },
              selection: EditorSelection.cursor(tag.open),
              scrollIntoView: true,
              userEvent: 'delete.forward',
            });
            return true;
          }
          view.dispatch({
            changes: { from: tag.openEnd, to: tag.openEnd + 1 },
            selection: EditorSelection.cursor(tag.open),
            scrollIntoView: true,
            userEvent: 'delete.forward',
          });
          return true;
        }
      }
    }

    return false;
  };

  const richEditorKeymap = Prec.highest(
    keymap.of([
      { key: 'Backspace', run: handleBackspace },
      { key: 'Delete', run: handleDelete },
    ])
  );

  const plugin = ViewPlugin.define((view) => new InlineStyleDecorationValue(view, deps), {
    decorations: (value) => value.decorations,
  });

  const atomicRangesExtension = EditorView.atomicRanges.of((view) => {
    const ranges = (deps.isMarkupHidden() ? computeHiddenMarkupRangesFromDoc(view.state.doc) : []).map((range) =>
      Decoration.replace({ inclusive: false }).range(range.from, range.to)
    );
    return ranges.length > 0 ? Decoration.set(ranges, true) : Decoration.none;
  });

  return [
    richEditorKeymap,
    Prec.highest(selectionGuard),
    Prec.highest(safeDeletionFilter),
    atomicRangesExtension,
    plugin,
  ];
}
