import { App, Modal, Notice, Setting } from 'obsidian';
import { normalizeColor } from '../editor/DocumentAppearance.js';
import type { InlineTypography } from '../editor/InlineTypography.js';

export interface TextColorModalOptions {
  appearance: InlineTypography;
  initialMode?: 'text' | 'background';
  onApply: (colors: { textColor: string; backgroundColor: string }) => Promise<void> | void;
  onSetDefaultQuickColor?: (type: 'text' | 'background', color: string) => Promise<void> | void;
}

const HIGHLIGHT_PRESETS = [
  // Soft, readable pastels for light mode & universal highlighting
  { name: 'Canary Yellow', color: '#fef08a' },
  { name: 'Peach Apricot', color: '#fed7aa' },
  { name: 'Mint Green', color: '#bbf7d0' },
  { name: 'Sky Blue', color: '#bae6fd' },
  { name: 'Soft Lavender', color: '#e9d5ff' },
  { name: 'Blush Rose', color: '#fbcfe8' },
  { name: 'Coral Pink', color: '#fecdd3' },
  { name: 'Soft Seafoam', color: '#a7f3d0' },
  { name: 'Neutral Slate', color: '#e2e8f0' },
  { name: 'Warm Cream', color: '#fef9c3' },
  // Subtle dark-mode compatible glowing highlights (translucent hex)
  { name: 'Golden Glow', color: '#854d0e66' },
  { name: 'Emerald Glow', color: '#065f4666' },
  { name: 'Sapphire Glow', color: '#1e40af66' },
  { name: 'Amethyst Glow', color: '#6b21a866' },
  { name: 'Ruby Glow', color: '#9f123966' },
  { name: 'Teal Glow', color: '#115e5966' },
];

const TEXT_COLOR_PRESETS = [
  { name: 'Ruby Red', color: '#e11d48' },
  { name: 'Warm Orange', color: '#ea580c' },
  { name: 'Golden Amber', color: '#d97706' },
  { name: 'Emerald Green', color: '#059669' },
  { name: 'Cyan Teal', color: '#0891b2' },
  { name: 'Royal Blue', color: '#2563eb' },
  { name: 'Indigo Violet', color: '#6366f1' },
  { name: 'Purple', color: '#9333ea' },
  { name: 'Hot Pink', color: '#db2777' },
  { name: 'Slate Gray', color: '#64748b' },
  // Bright accents for dark mode
  { name: 'Coral Bright', color: '#fb7185' },
  { name: 'Mint Bright', color: '#34d399' },
  { name: 'Sky Bright', color: '#60a5fa' },
  { name: 'Lavender Bright', color: '#c084fc' },
  { name: 'Amber Bright', color: '#fbbf24' },
  { name: 'Snow White', color: '#f8fafc' },
];

export class TextColorModal extends Modal {
  private mode: 'text' | 'background';
  private textColor: string;
  private backgroundColor: string;

  constructor(app: App, private options: TextColorModalOptions) {
    super(app);
    this.mode = options.initialMode ?? 'text';
    this.textColor = options.appearance.textColor ?? '';
    this.backgroundColor = options.appearance.backgroundColor ?? '';
  }

  public onOpen(): void {
    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('rich-editor-color-modal');

    contentEl.createEl('h2', { text: 'Text and highlight color' });
    contentEl.createEl('p', {
      cls: 'setting-item-description',
      text: 'Select beautiful custom colors for text foreground or background highlight.',
    });

    const preview = contentEl.createDiv({ cls: 'rich-editor-color-preview' });
    preview.setText('Selected text preview — معاينة النص الجميل');
    const previewStyles: Partial<CSSStyleDeclaration> = {};
    if (this.options.appearance.fontFamily) previewStyles.fontFamily = this.options.appearance.fontFamily;
    if (this.options.appearance.fontSize) previewStyles.fontSize = this.options.appearance.fontSize;
    if (this.textColor) previewStyles.color = this.textColor;
    if (this.backgroundColor) previewStyles.backgroundColor = this.backgroundColor;
    preview.setCssStyles(previewStyles);
    preview.toggleClass('has-background-color', Boolean(this.backgroundColor));

    new Setting(contentEl)
      .setName('Color target')
      .setDesc('Switch between customizing the text color and the highlight background.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('text', 'Text color')
          .addOption('background', 'Highlight background')
          .setValue(this.mode)
          .onChange((value) => {
            this.mode = value as 'text' | 'background';
            this.render();
          })
      );

    const currentColor = this.mode === 'text' ? this.textColor : this.backgroundColor;
    const isText = this.mode === 'text';

    const colorSetting = new Setting(contentEl)
      .setName(isText ? 'Custom text color' : 'Custom highlight color')
      .setDesc(currentColor ? `Current: ${currentColor}` : 'No custom color set')
      .addColorPicker((picker) =>
        picker.setValue(this.toPickerColor(currentColor)).onChange((value) => {
          this.setCurrentColor(value);
          this.render();
        })
      )
      .addText((text) =>
        text.setPlaceholder(isText ? '#e11d48' : '#fef08a').setValue(currentColor).onChange((value) => {
          this.setCurrentColor(value.trim());
        })
      )
      .addButton((button) =>
        button.setButtonText('Reset').setIcon('rotate-ccw').setTooltip('Reset this color').onClick(() => {
          this.setCurrentColor('');
          this.render();
        })
      );

    if (currentColor && this.options.onSetDefaultQuickColor) {
      colorSetting.addButton((button) =>
        button
          .setButtonText('Set as 1-click default')
          .setTooltip('Use this as the default color for note-header quick buttons')
          .onClick(() => {
            void this.setDefaultQuickColor(currentColor, isText ? 'text' : 'background');
          })
      );
    }

    contentEl.createEl('h4', {
      text: isText ? 'Recommended text colors' : 'Beautiful highlight palettes (Light & Dark)',
    });

    const presets = contentEl.createDiv({ cls: 'rich-editor-color-presets' });
    const palette = isText ? TEXT_COLOR_PRESETS : HIGHLIGHT_PRESETS;

    for (const preset of palette) {
      const button = presets.createEl('button', {
        cls: 'rich-editor-color-swatch',
        attr: { 'aria-label': preset.name, title: `${preset.name} (${preset.color})` },
      });
      button.setCssStyles({ backgroundColor: preset.color });
      button.toggleClass('is-soft', preset.color.endsWith('66') || preset.color.endsWith('88'));
      button.addEventListener('click', () => {
        this.setCurrentColor(preset.color);
        this.render();
      });
    }

    new Setting(contentEl)
      .addButton((button) =>
        button.setClass('mod-warning').setButtonText('Clear custom colors').onClick(() => {
          void this.clearColors();
        })
      )
      .addButton((button) => button.setButtonText('Cancel').onClick(() => this.close()))
      .addButton((button) =>
        button.setCta().setButtonText('Apply').onClick(() => {
          void this.applyColors();
        })
      );
  }

  private async setDefaultQuickColor(color: string, type: 'text' | 'background'): Promise<void> {
    const valid = normalizeColor(color);
    if (!valid) {
      new Notice('Please select a valid hexadecimal color first.');
      return;
    }

    try {
      await this.options.onSetDefaultQuickColor?.(type, valid);
      new Notice(`Rich Editor: set default ${type === 'text' ? 'text' : 'highlight'} color to ${valid}`);
    } catch {
      new Notice('Rich Editor: could not save the default color.');
    }
  }

  private async clearColors(): Promise<void> {
    try {
      await this.options.onApply({ textColor: '', backgroundColor: '' });
      this.close();
    } catch {
      new Notice('Rich Editor: could not clear the colors.');
    }
  }

  private async applyColors(): Promise<void> {
    const textColor = this.textColor.trim();
    const backgroundColor = this.backgroundColor.trim();
    if ((textColor && !normalizeColor(textColor)) || (backgroundColor && !normalizeColor(backgroundColor))) {
      new Notice('Use a valid hexadecimal color such as #3b82f6 or #fef08a.');
      return;
    }

    try {
      await this.options.onApply({ textColor, backgroundColor });
      this.close();
    } catch {
      new Notice('Rich Editor: could not apply the colors.');
    }
  }

  private setCurrentColor(value: string): void {
    if (this.mode === 'text') this.textColor = value;
    else this.backgroundColor = value;
  }

  private toPickerColor(value: string): string {
    if (/^#[\da-f]{6}$/i.test(value)) return value;
    if (/^#[\da-f]{3}$/i.test(value)) {
      return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }
    return this.mode === 'text' ? '#e11d48' : '#fef08a';
  }
}
