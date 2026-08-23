import type { Range } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, PluginValue, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { detectContentDirection } from './BidiGuard.js';

const RTL_LINE_CLASS = 'rich-editor-rtl-line';

class BidiLineDirectionValue implements PluginValue {
  public decorations: DecorationSet;

  constructor(private view: EditorView) {
    this.decorations = this.buildDecorations();
  }

  public update(update: ViewUpdate): void {
    if (update.docChanged) {
      this.decorations = this.buildDecorations();
    }
  }

  private buildDecorations(): DecorationSet {
    const lines: Array<Range<Decoration>> = [];

    for (let lineNumber = 1; lineNumber <= this.view.state.doc.lines; lineNumber += 1) {
      const line = this.view.state.doc.line(lineNumber);
      if (detectContentDirection(line.text) !== 'rtl') continue;

      lines.push(
        Decoration.line({
          class: RTL_LINE_CLASS,
          attributes: { dir: 'rtl' },
        }).range(line.from)
      );
    }

    return lines.length > 0 ? Decoration.set(lines, true) : Decoration.none;
  }
}

/**
 * Let CodeMirror calculate cursor coordinates and visual movement using the
 * direction of each rendered line. The direction is a line attribute, not an
 * inline wrapper around source text, so formatting tags cannot change the
 * bidi boundary or hide a caret.
 */
export function createBidiLineDirectionExtension() {
  const plugin = ViewPlugin.define((view) => new BidiLineDirectionValue(view), {
    decorations: (value) => value.decorations,
  });

  return [EditorView.perLineTextDirection.of(true), plugin];
}
