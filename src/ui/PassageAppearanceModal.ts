import { App, Modal, Notice, Setting } from 'obsidian';
import { normalizeFontFamily, normalizeFontSize } from '../editor/DocumentAppearance.js';
import type { InlineTypography } from '../editor/InlineTypography.js';
import { FontService } from '../services/FontService.js';
import { FontPickerModal } from './FontPickerModal.js';

export interface PassageAppearanceModalOptions {
  appearance: InlineTypography;
  fontService: FontService;
  onApply: (appearance: { fontFamily: string; fontSize: string }) => Promise<void> | void;
}

const POPULAR_FONTS = [
  { name: 'Amiri (أميري)', font: 'Amiri' },
  { name: 'Cairo (القاهرة)', font: 'Cairo' },
  { name: 'Scheherazade', font: 'Scheherazade New' },
  { name: 'Tajawal (تجوال)', font: 'Tajawal' },
  { name: 'Almarai (المراعي)', font: 'Almarai' },
  { name: 'Inter (Sans)', font: 'Inter' },
  { name: 'Playfair (Serif)', font: 'Playfair Display' },
  { name: 'Monospace (Code)', font: 'monospace' },
];

const POPULAR_SIZES = [
  { label: 'Small', value: '0.88em' },
  { label: 'Regular', value: '1em' },
  { label: 'Medium', value: '1.2em' },
  { label: 'Large', value: '1.4em' },
  { label: 'Heading', value: '1.8em' },
];

export class PassageAppearanceModal extends Modal {
  private fontFamily: string;
  private fontSize: string;

  constructor(app: App, private options: PassageAppearanceModalOptions) {
    super(app);
    this.fontFamily = options.appearance.fontFamily ?? '';
    this.fontSize = options.appearance.fontSize ?? '';
  }

  public onOpen(): void {
    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('rich-editor-passage-modal', 'rich-editor-glass-modal');

    contentEl.createEl('h2', { text: 'Passage Typography & Fonts' });
    contentEl.createEl('p', {
      cls: 'setting-item-description',
      text: 'Apply exquisite typography, custom fonts, or sizing to the selected passage with full Markdown compatibility.',
    });

    const preview = contentEl.createDiv({ cls: 'rich-editor-passage-preview rich-editor-glass-preview' });
    preview.setText('Selected passage preview — بسم الله الرحمن الرحيم — The quick brown fox jumps');
    preview.setCssStyles({
      fontFamily: this.fontFamily ? `"${this.fontFamily}", var(--font-text)` : '',
      fontSize: this.fontSize,
    });

    // ── Quick Font Presets ──
    contentEl.createEl('h4', { text: 'Popular Typefaces (Arabic & English)' });
    const fontChips = contentEl.createDiv({ cls: 'rich-editor-preset-row' });
    for (const item of POPULAR_FONTS) {
      const isSelected = this.fontFamily.toLowerCase() === item.font.toLowerCase();
      const chip = fontChips.createEl('button', {
        cls: `rich-editor-chip ${isSelected ? 'is-selected' : ''}`,
        text: item.name,
      });
      chip.setCssStyles({ fontFamily: `"${item.font}", var(--font-text)` });
      chip.addEventListener('click', () => {
        this.fontFamily = item.font;
        this.render();
      });
    }

    // ── Font Family Custom Setting ──
    new Setting(contentEl)
      .setName('Font family')
      .setDesc(this.fontFamily ? `Current: ${this.fontFamily}` : 'Default note font')
      .addButton((button) =>
        button.setButtonText('All system fonts…').setIcon('search').onClick(() => {
          new FontPickerModal(this.app, this.options.fontService, (font) => {
            this.fontFamily = font;
            this.render();
          }).open();
        })
      )
      .addButton((button) =>
        button.setButtonText('Reset font').setIcon('rotate-ccw').onClick(() => {
          this.fontFamily = '';
          this.render();
        })
      );

    // ── Quick Size Presets ──
    contentEl.createEl('h4', { text: 'Font Sizing' });
    const sizeChips = contentEl.createDiv({ cls: 'rich-editor-preset-row' });
    for (const item of POPULAR_SIZES) {
      const isSelected = this.fontSize === item.value;
      const chip = sizeChips.createEl('button', {
        cls: `rich-editor-chip ${isSelected ? 'is-selected' : ''}`,
        text: `${item.label} (${item.value})`,
      });
      chip.addEventListener('click', () => {
        this.fontSize = item.value;
        this.render();
      });
    }

    // ── Custom Size Setting ──
    new Setting(contentEl)
      .setName('Custom size')
      .setDesc('Enter any CSS size such as 18px, 1.25em, or 130%')
      .addText((text) =>
        text.setPlaceholder('Example: 18px').setValue(this.fontSize).onChange((value) => {
          this.fontSize = value.trim();
          preview.setCssStyles({ fontSize: this.fontSize });
        })
      )
      .addButton((button) =>
        button.setButtonText('Reset size').setIcon('rotate-ccw').onClick(() => {
          this.fontSize = '';
          this.render();
        })
      );

    // ── Action Buttons ──
    new Setting(contentEl)
      .addButton((button) =>
        button.setClass('mod-warning').setButtonText('Clear typography').onClick(() => {
          void this.clearTypography();
        })
      )
      .addButton((button) => button.setButtonText('Cancel').onClick(() => this.close()))
      .addButton((button) =>
        button.setCta().setButtonText('Apply').onClick(() => {
          void this.applyTypography();
        })
      );
  }

  private async clearTypography(): Promise<void> {
    try {
      await this.options.onApply({ fontFamily: '', fontSize: '' });
      this.close();
    } catch {
      new Notice('OW-Tools: could not clear the passage typography.');
    }
  }

  private async applyTypography(): Promise<void> {
    const fontFamily = this.fontFamily.trim();
    const fontSize = this.fontSize.trim();
    if (fontFamily && !normalizeFontFamily(fontFamily)) {
      new Notice('That font family cannot be stored safely.');
      return;
    }
    if (fontSize && !normalizeFontSize(fontSize)) {
      new Notice('Use a font size such as 18px, 1.2em, or 120%.');
      return;
    }

    try {
      await this.options.onApply({ fontFamily, fontSize });
      this.close();
    } catch {
      new Notice('OW-Tools: could not apply the passage typography.');
    }
  }
}
