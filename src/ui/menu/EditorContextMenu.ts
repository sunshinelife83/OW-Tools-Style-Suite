/**
 * Adds a small Rich Editor section to Obsidian's native editor context menu.
 */

import { App, Editor, MarkdownView, Menu } from 'obsidian';
import { FormattingController } from '../../editor/FormattingController.js';
import { FontService } from '../../services/FontService.js';
import { FontPickerModal } from '../FontPickerModal.js';

export interface EditorContextMenuDeps {
  controller: FormattingController;
  openDocumentAppearance: (view: MarkdownView) => void;
  chooseDocumentFont: (view: MarkdownView) => void;
  openPassageAppearance: (editor: Editor) => void;
  openColorPicker: (editor: Editor) => void;
}

export function buildEditorContextMenu(
  deps: EditorContextMenuDeps,
  menu: Menu,
  editor: Editor,
  view: MarkdownView
): void {
  menu.addSeparator();

  menu.addItem((item) =>
    item.setSection('rich-editor').setTitle('Bold').setIcon('bold').onClick(() => deps.controller.toggleMark(editor, 'bold'))
  );
  menu.addItem((item) =>
    item.setSection('rich-editor').setTitle('Italic').setIcon('italic').onClick(() => deps.controller.toggleMark(editor, 'italic'))
  );
  menu.addItem((item) =>
    item.setSection('rich-editor').setTitle('Underline').setIcon('underline').onClick(() => deps.controller.toggleMark(editor, 'underline'))
  );
  menu.addItem((item) =>
    item
      .setSection('rich-editor')
      .setTitle('Strikethrough')
      .setIcon('strikethrough')
      .onClick(() => deps.controller.toggleMark(editor, 'strikethrough'))
  );
  menu.addItem((item) =>
    item.setSection('rich-editor').setTitle('Bullet list').setIcon('list').onClick(() => deps.controller.toggleBulletList(editor))
  );
  menu.addItem((item) =>
    item
      .setSection('rich-editor')
      .setTitle('Numbered list')
      .setIcon('list-ordered')
      .onClick(() => deps.controller.toggleNumberedList(editor))
  );
  menu.addItem((item) =>
    item.setSection('rich-editor').setTitle('Blockquote').setIcon('quote').onClick(() => deps.controller.toggleBlockquote(editor))
  );
  menu.addItem((item) =>
    item
      .setSection('rich-editor')
      .setTitle('Classic highlight')
      .setIcon('highlighter')
      .onClick(() => deps.controller.toggleMark(editor, 'highlight'))
  );
  menu.addItem((item) =>
    item
      .setSection('rich-editor')
      .setTitle('Text and highlight color…')
      .setIcon('palette')
      .onClick(() => deps.openColorPicker(editor))
  );
  menu.addItem((item) =>
    item
      .setSection('rich-editor')
      .setTitle('Passage font and size…')
      .setIcon('type')
      .onClick(() => deps.openPassageAppearance(editor))
  );
  menu.addItem((item) =>
    item
      .setSection('rich-editor')
      .setTitle('Clear formatting')
      .setIcon('eraser')
      .onClick(() => deps.controller.clearFormatting(editor))
  );

  menu.addSeparator();

  menu.addItem((item) =>
    item
      .setSection('rich-editor')
      .setTitle('Document appearance…')
      .setIcon('sliders-horizontal')
      .onClick(() => deps.openDocumentAppearance(view))
  );
  menu.addItem((item) =>
    item
      .setSection('rich-editor')
      .setTitle('Choose document font…')
      .setIcon('type')
      .onClick(() => deps.chooseDocumentFont(view))
  );

}

export function openDocumentFontPicker(app: App, fontService: FontService, onPick: (font: string) => void): void {
  new FontPickerModal(app, fontService, onPick).open();
}

