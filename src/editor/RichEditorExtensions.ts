/**
 * CodeMirror extensions contributed by OW-Tools: Style Suite.
 */

import { Prec, type Extension } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import type { App } from 'obsidian';
import { FormattingController, type InlineMark } from './FormattingController.js';
import { createBidiLineDirectionExtension } from './BidiLineDirection.js';
import { createInlineStyleDecorationExtension } from './InlineStyleDecorations.js';
import { createSelectionToolbarExtension } from '../ui/toolbar/SelectionToolbar.js';

export interface RichEditorExtensionDeps {
  app: App;
  controller: FormattingController;
  isToolbarEnabled: () => boolean;
  isMarkupHidden: () => boolean;
}

export function buildRichEditorExtensions(deps: RichEditorExtensionDeps): Extension[] {
  // Obsidian's native Markdown shortcuts would otherwise write ** and * even
  // inside a custom-font span. Route the standard shortcuts through the same
  // controller as the floating toolbar so styled text always uses HTML marks.
  const toggleShortcut = (mark: InlineMark): boolean => {
    const editor = deps.controller.getActiveEditor();
    if (!editor) return false;
    deps.controller.toggleMark(editor, mark);
    return true;
  };
  const formattingShortcutKeymap = Prec.highest(
    keymap.of([
      { key: 'Mod-b', run: () => toggleShortcut('bold') },
      { key: 'Mod-i', run: () => toggleShortcut('italic') },
      { key: 'Mod-u', run: () => toggleShortcut('underline') },
      { key: 'Mod-Shift-s', run: () => toggleShortcut('strikethrough') },
    ])
  );

  return [
    formattingShortcutKeymap,
    createBidiLineDirectionExtension(),
    createInlineStyleDecorationExtension({
      isMarkupHidden: deps.isMarkupHidden,
    }),
    createSelectionToolbarExtension({
      app: deps.app,
      controller: deps.controller,
      isEnabled: deps.isToolbarEnabled,
    }),
  ];
}
