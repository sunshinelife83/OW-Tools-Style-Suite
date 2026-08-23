/**
 * Command palette actions for OW-Tools: Style Suite.
 */

import type RichEditorPlugin from '../main.js';
import type { InlineMark } from '../editor/FormattingController.js';

export function registerFormattingCommands(plugin: RichEditorPlugin): void {
  const marks: Array<{ id: string; name: string; mark: InlineMark; icon: string }> = [
    { id: 'style-suite-toggle-bold', name: 'OW-Tools: Toggle bold', mark: 'bold', icon: 'bold' },
    { id: 'style-suite-toggle-italic', name: 'OW-Tools: Toggle italic', mark: 'italic', icon: 'italic' },
    { id: 'style-suite-toggle-underline', name: 'OW-Tools: Toggle underline', mark: 'underline', icon: 'underline' },
    {
      id: 'style-suite-toggle-strikethrough',
      name: 'OW-Tools: Toggle strikethrough',
      mark: 'strikethrough',
      icon: 'strikethrough',
    },
    { id: 'style-suite-toggle-highlight', name: 'OW-Tools: Toggle highlight', mark: 'highlight', icon: 'highlighter' },
  ];

  marks.forEach(({ id, name, mark, icon }) => {
    plugin.addCommand({
      id,
      name,
      icon,
      editorCallback: (editor) => plugin.formattingController.toggleMark(editor, mark),
    });
  });

  plugin.addCommand({
    id: 'style-suite-toggle-bullet-list',
    name: 'OW-Tools: Toggle bullet list',
    icon: 'list',
    editorCallback: (editor) => plugin.formattingController.toggleBulletList(editor),
  });

  plugin.addCommand({
    id: 'style-suite-toggle-numbered-list',
    name: 'OW-Tools: Toggle numbered list',
    icon: 'list-ordered',
    editorCallback: (editor) => plugin.formattingController.toggleNumberedList(editor),
  });

  plugin.addCommand({
    id: 'style-suite-toggle-blockquote',
    name: 'OW-Tools: Toggle blockquote',
    icon: 'quote',
    editorCallback: (editor) => plugin.formattingController.toggleBlockquote(editor),
  });

  plugin.addCommand({
    id: 'style-suite-heading-1',
    name: 'OW-Tools: Heading 1',
    icon: 'heading-1',
    editorCallback: (editor) => plugin.formattingController.setHeading(editor, 1),
  });

  plugin.addCommand({
    id: 'style-suite-heading-2',
    name: 'OW-Tools: Heading 2',
    icon: 'heading-2',
    editorCallback: (editor) => plugin.formattingController.setHeading(editor, 2),
  });

  plugin.addCommand({
    id: 'style-suite-heading-3',
    name: 'OW-Tools: Heading 3',
    icon: 'heading-3',
    editorCallback: (editor) => plugin.formattingController.setHeading(editor, 3),
  });

  plugin.addCommand({
    id: 'style-suite-normal-text',
    name: 'OW-Tools: Normal text',
    icon: 'pilcrow',
    editorCallback: (editor) => plugin.formattingController.setHeading(editor, 0),
  });

  plugin.addCommand({
    id: 'style-suite-color-passage',
    name: 'OW-Tools: Text and highlight color',
    icon: 'palette',
    editorCallback: (editor) => plugin.openColorPicker(editor),
  });

  plugin.addCommand({
    id: 'style-suite-style-passage',
    name: 'OW-Tools: Passage font and size',
    icon: 'type',
    editorCallback: (editor) => plugin.openPassageAppearance(editor),
  });

  plugin.addCommand({
    id: 'style-suite-clear-formatting',
    name: 'OW-Tools: Clear formatting',
    icon: 'eraser',
    editorCallback: (editor) => plugin.formattingController.clearFormatting(editor),
  });

  plugin.addCommand({
    id: 'style-suite-open-document-appearance',
    name: 'OW-Tools: Document appearance',
    icon: 'sliders-horizontal',
    callback: () => plugin.openAppearanceForActiveDocument(),
  });

  plugin.addCommand({
    id: 'style-suite-choose-document-font',
    name: 'OW-Tools: Choose document font',
    icon: 'type',
    callback: () => void plugin.chooseFontForActiveDocument(),
  });

  plugin.addCommand({
    id: 'style-suite-clear-document-font',
    name: 'OW-Tools: Clear document font',
    icon: 'rotate-ccw',
    callback: () => void plugin.clearFontForActiveDocument(),
  });

  plugin.addCommand({
    id: 'style-suite-toggle-style-markup',
    name: 'OW-Tools: Show or hide generated style markup',
    icon: 'code-xml',
    callback: () => void plugin.toggleInlineStyleMarkup(),
  });

  plugin.addCommand({
    id: 'style-suite-clear-document-appearance',
    name: 'OW-Tools: Clear document appearance',
    icon: 'trash-2',
    callback: () => void plugin.clearAppearanceForActiveDocument(),
  });
}
