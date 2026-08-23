/**
 * Floating selection toolbar for OW-Tools: Style Suite.
 * A focused glass toolbar for inline and block formatting.
 */

import { App, MarkdownView, Menu, setIcon } from 'obsidian';
import type { Editor } from 'obsidian';
import { EditorView, PluginValue, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { ActiveFormats, FormattingController, InlineMark } from '../../editor/FormattingController.js';

export interface SelectionToolbarDeps {
  app: App;
  controller: FormattingController;
  isEnabled: () => boolean;
}

class SelectionToolbarValue implements PluginValue {
  private toolbarEl: HTMLElement;
  private scheduled = false;
  private activeFormats: ActiveFormats | null = null;

  constructor(private view: EditorView, private deps: SelectionToolbarDeps) {
    this.toolbarEl = this.buildToolbar();
    this.view.dom.appendChild(this.toolbarEl);
  }

  public update(update: ViewUpdate): void {
    if (update.selectionSet || update.docChanged || update.geometryChanged || update.focusChanged) {
      this.schedulePosition();
    }
  }

  public destroy(): void {
    this.toolbarEl.remove();
  }

  private schedulePosition(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    requestAnimationFrame(() => {
      this.scheduled = false;
      this.position();
    });
  }

  private position(): void {
    const selection = this.view.state.selection.main;
    if (!this.deps.isEnabled() || selectionShouldHide(selection.empty, this.view.hasFocus, this.toolbarEl)) {
      this.hide();
      return;
    }

    const head = this.view.coordsAtPos(selection.from);
    if (!head) {
      this.hide();
      return;
    }

    const editorRect = this.view.dom.getBoundingClientRect();
    this.toolbarEl.style.display = 'flex';
    const toolbarRect = this.toolbarEl.getBoundingClientRect();

    let left = head.left - editorRect.left;
    let top = head.top - editorRect.top - toolbarRect.height - 8;
    left = Math.max(8, Math.min(left, editorRect.width - toolbarRect.width - 8));
    if (top < 4) top = head.bottom - editorRect.top + 8;

    this.toolbarEl.style.left = `${left}px`;
    this.toolbarEl.style.top = `${top}px`;
    this.updateActiveStates();
  }

  private hide(): void {
    this.toolbarEl.style.display = 'none';
  }

  private buildToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'rich-editor-selection-toolbar';
    toolbar.style.display = 'none';

    toolbar.addEventListener('mousedown', (event) => {
      event.preventDefault();
    });

    this.addIconButton(toolbar, 'bold', 'Bold (Ctrl/Cmd+B)', () => this.mark('bold'), 'bold');
    this.addIconButton(toolbar, 'italic', 'Italic (Ctrl/Cmd+I)', () => this.mark('italic'), 'italic');
    this.addIconButton(toolbar, 'underline', 'Underline (Ctrl/Cmd+U)', () => this.mark('underline'), 'underline');
    this.addIconButton(toolbar, 'strikethrough', 'Strikethrough', () => this.mark('strikethrough'), 'strikethrough');

    this.divider(toolbar);
    this.addIconButton(toolbar, 'heading', 'Heading', (event) => this.openHeadingMenu(event));
    this.addIconButton(toolbar, 'list', 'Bullet list', () => this.withEditor((editor) => this.deps.controller.toggleBulletList(editor)));
    this.addIconButton(toolbar, 'list-ordered', 'Numbered list', () => this.withEditor((editor) => this.deps.controller.toggleNumberedList(editor)));
    this.addIconButton(toolbar, 'quote', 'Blockquote', () => this.withEditor((editor) => this.deps.controller.toggleBlockquote(editor)));
    this.divider(toolbar);
    this.addIconButton(toolbar, 'eraser', 'Clear formatting', () => this.withEditor((editor) => this.deps.controller.clearFormatting(editor)));

    return toolbar;
  }

  private addIconButton(
    parent: HTMLElement,
    icon: string,
    label: string,
    onClick: (event: MouseEvent) => void,
    stateId?: string
  ): void {
    const button = parent.createEl('button', {
      cls: 'rich-editor-selection-btn clickable-icon',
      attr: { 'aria-label': label, ...(stateId ? { 'data-state-id': stateId } : {}) },
    });
    setIcon(button, icon);
    button.addEventListener('click', (event) => onClick(event));
  }

  private divider(parent: HTMLElement): void {
    parent.createDiv({ cls: 'rich-editor-tb-divider' });
  }

  private withEditor(action: (editor: Editor) => void): void {
    const view = this.deps.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      action(view.editor);
      this.schedulePosition();
    }
  }

  private mark(mark: InlineMark): void {
    this.withEditor((editor) => this.deps.controller.toggleMark(editor, mark));
  }


  private openHeadingMenu(event: MouseEvent): void {
    const menu = new Menu();
    for (let level = 1; level <= 3; level += 1) {
      menu.addItem((item) =>
        item.setTitle(`Heading ${level}`).setIcon(`heading-${level}`).onClick(() =>
          this.withEditor((editor) => this.deps.controller.setHeading(editor, level))
        )
      );
    }
    menu.addSeparator();
    menu.addItem((item) =>
      item.setTitle('Normal text').setIcon('pilcrow').onClick(() => this.withEditor((editor) => this.deps.controller.setHeading(editor, 0)))
    );
    menu.showAtMouseEvent(event);
  }

  private updateActiveStates(): void {
    const view = this.deps.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    this.activeFormats = this.deps.controller.getFormatsAt(view.editor);
    const states: Record<string, boolean> = {
      bold: this.activeFormats.bold,
      italic: this.activeFormats.italic,
      underline: this.activeFormats.underline,
      strikethrough: this.activeFormats.strikethrough,
    };

    this.toolbarEl.querySelectorAll('[data-state-id]').forEach((button) => {
      const stateId = (button as HTMLElement).getAttr('data-state-id');
      if (!stateId) return;
      const isActive = !!states[stateId];
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }
}

function selectionShouldHide(selectionEmpty: boolean, hasFocus: boolean, toolbarEl: HTMLElement): boolean {
  return selectionEmpty || (!hasFocus && !toolbarEl.matches(':hover'));
}

export function createSelectionToolbarExtension(deps: SelectionToolbarDeps) {
  return ViewPlugin.define((view) => new SelectionToolbarValue(view, deps));
}
