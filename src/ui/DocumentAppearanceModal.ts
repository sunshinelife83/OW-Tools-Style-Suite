/**
 * One simple modal for per-document typography.
 */

import { App, Modal, Setting } from 'obsidian';
import type { DocumentAlignment, DocumentAppearance } from '../editor/DocumentAppearance.js';
import { FontService } from '../services/FontService.js';
import { FontPickerModal } from './FontPickerModal.js';

interface DraftAppearance {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  alignment: DocumentAlignment | '';
}

export interface DocumentAppearanceModalOptions {
  appearance: DocumentAppearance;
  fontService: FontService;
  onApply: (appearance: Partial<DocumentAppearance>) => Promise<void> | void;
}

const FONT_SIZE_OPTIONS = ['', '0.9em', '1em', '1.1em', '1.2em', '14px', '16px', '18px', '20px', '24px'];
const LINE_HEIGHT_OPTIONS = ['', '1', '1.2', '1.4', '1.6', '1.8', '2'];

export class DocumentAppearanceModal extends Modal {
  private draft: DraftAppearance;

  constructor(app: App, private options: DocumentAppearanceModalOptions) {
    super(app);
    this.draft = {
      fontFamily: options.appearance.fontFamily ?? '',
      fontSize: options.appearance.fontSize ?? '',
      lineHeight: options.appearance.lineHeight ?? '',
      alignment: options.appearance.alignment ?? '',
    };
  }

  public onOpen(): void {
    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('rich-editor-appearance-modal');

    contentEl.createEl('h2', { text: 'Document appearance' });
    contentEl.createEl('p', {
      cls: 'setting-item-description',
      text: 'Control how this note feels to read and edit. These choices are saved in the note frontmatter, so every device can reuse them.',
    });

    new Setting(contentEl)
      .setName('Font family')
      .setDesc(this.draft.fontFamily || 'Using plugin/default theme font')
      .addButton((button) =>
        button.setButtonText('Choose font').setIcon('type').onClick(() => {
          new FontPickerModal(this.app, this.options.fontService, (font) => {
            this.draft.fontFamily = font;
            this.render();
          }).open();
        })
      )
      .addButton((button) =>
        button.setButtonText('Clear').setIcon('x').onClick(() => {
          this.draft.fontFamily = '';
          this.render();
        })
      );

    new Setting(contentEl)
      .setName('Font size')
      .setDesc('Leave empty to use the plugin/default font size.')
      .addDropdown((dropdown) => {
        FONT_SIZE_OPTIONS.forEach((value) => dropdown.addOption(value, value || 'Default'));
        dropdown.setValue(this.draft.fontSize).onChange((value) => {
          this.draft.fontSize = value;
        });
      })
      .addText((text) =>
        text.setPlaceholder('Example: 18px or 1.15em').setValue(this.draft.fontSize).onChange((value) => {
          this.draft.fontSize = value.trim();
        })
      );

    new Setting(contentEl)
      .setName('Line height')
      .setDesc('Increase this for comfortable long-form reading.')
      .addDropdown((dropdown) => {
        LINE_HEIGHT_OPTIONS.forEach((value) => dropdown.addOption(value, value || 'Default'));
        dropdown.setValue(this.draft.lineHeight).onChange((value) => {
          this.draft.lineHeight = value;
        });
      });

    new Setting(contentEl)
      .setName('Text alignment')
      .setDesc('Optional paragraph alignment for this note.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('', 'Default')
          .addOption('left', 'Left')
          .addOption('center', 'Center')
          .addOption('right', 'Right')
          .addOption('justify', 'Justify')
          .setValue(this.draft.alignment)
          .onChange((value) => {
            this.draft.alignment = value as DocumentAlignment | '';
          })
      );


    contentEl.createEl('h3', { text: 'Quick presets' });
    const presets = contentEl.createDiv({ cls: 'rich-editor-preset-row' });
    this.addPresetButton(presets, 'Clean typography', {
      fontFamily: '',
      fontSize: '',
      lineHeight: '1.6',
      alignment: '',
    });
    this.addPresetButton(presets, 'Arabic typography', {
      fontFamily: 'Amiri',
      fontSize: '1.15em',
      lineHeight: '1.9',
      alignment: 'right',
    });
    this.addPresetButton(presets, 'Large reading', {
      fontFamily: '',
      fontSize: '1.2em',
      lineHeight: '1.8',
      alignment: '',
    });

    new Setting(contentEl)
      .addButton((button) =>
        button.setButtonText('Clear document appearance').setClass('mod-warning').onClick(() => {
          void this.clearAppearance();
        })
      )
      .addButton((button) =>
        button.setButtonText('Cancel').onClick(() => {
          this.close();
        })
      )
      .addButton((button) =>
        button.setButtonText('Apply').setCta().onClick(() => {
          void this.applyAppearance();
        })
      );
  }

  private async clearAppearance(): Promise<void> {
    try {
      await this.options.onApply({
        fontFamily: '',
        fontSize: '',
        lineHeight: '',
        alignment: undefined,
      });
      this.close();
    } catch {
      // Keep the modal open so the user can retry when persistence fails.
    }
  }

  private async applyAppearance(): Promise<void> {
    try {
      await this.options.onApply(this.toUpdate());
      this.close();
    } catch {
      // Keep the modal open so the user can retry when persistence fails.
    }
  }

  private addPresetButton(parent: HTMLElement, label: string, preset: DraftAppearance): void {
    const button = parent.createEl('button', { text: label, cls: 'mod-cta' });
    button.addEventListener('click', () => {
      this.draft = { ...preset };
      this.render();
    });
  }

  private toUpdate(): Partial<DocumentAppearance> {
    return {
      fontFamily: this.draft.fontFamily.trim(),
      fontSize: this.draft.fontSize.trim(),
      lineHeight: this.draft.lineHeight.trim(),
      alignment: this.draft.alignment || undefined,
    };
  }
}
