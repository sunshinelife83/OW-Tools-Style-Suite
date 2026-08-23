/**
 * Settings tab for OW-Tools: Style Suite.
 */

import { App, PluginSettingTab, Setting } from 'obsidian';
import type RichEditorPlugin from '../../main.js';
import type { DocumentAlignment } from '../../editor/DocumentAppearance.js';
import { SettingsService } from '../../services/SettingsService.js';

export class RichEditorSettingsTab extends PluginSettingTab {
  constructor(app: App, plugin: RichEditorPlugin, private settingsService: SettingsService) {
    super(app, plugin);
  }

  public display(): void {
    const { containerEl } = this;
    const settings = this.settingsService.getSettings();
    containerEl.empty();

    containerEl.createEl('h2', { text: 'OW-Tools: Style Suite' });
    containerEl.createEl('p', {
      text: 'A comprehensive styling and typography suite for Obsidian notes with aesthetic highlights, custom fonts, floating toolbar, and document appearance.',
    });

    new Setting(containerEl)
      .setName('Selection toolbar')
      .setDesc('Show a small floating toolbar when text is selected in the editor.')
      .addToggle((toggle) =>
        toggle.setValue(settings.enableSelectionToolbar).onChange(async (value) => {
          await this.settingsService.updateSettings({ enableSelectionToolbar: value });
        })
      );

    new Setting(containerEl)
      .setName('Hide passage style markup')
      .setDesc('Hide style markup (<mark> tags) in Live Preview while seamlessly displaying the visual result.')
      .addToggle((toggle) =>
        toggle.setValue(settings.hideInlineStyleMarkup).onChange(async (value) => {
          await this.settingsService.updateSettings({ hideInlineStyleMarkup: value });
        })
      );

    new Setting(containerEl)
      .setName('Document action buttons')
      .setDesc('Show the document appearance button in each Markdown note header.')
      .addToggle((toggle) =>
        toggle.setValue(settings.showDocumentActions).onChange(async (value) => {
          await this.settingsService.updateSettings({ showDocumentActions: value });
        })
      );

    new Setting(containerEl)
      .setName('Quick color header buttons')
      .setDesc('Show 1-click text color and highlight buttons in each note header.')
      .addToggle((toggle) =>
        toggle.setValue(settings.showColorHeaderActions).onChange(async (value) => {
          await this.settingsService.updateSettings({ showColorHeaderActions: value });
        })
      );

    new Setting(containerEl)
      .setName('Highlight style and mode')
      .setDesc('Choose your highlight behavior: smooth pastel highlight, sharp modern highlight, or Obsidian classic Markdown (==text==).')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('rich-smooth', 'Style Suite — Smooth (Rounded corners, padded) [Default]')
          .addOption('rich-sharp', 'Style Suite — Sharp (Square edges)')
          .addOption('classic-markdown', 'Classic Markdown (==highlight==)')
          .setValue(settings.highlightMode || 'rich-smooth')
          .onChange(async (value) => {
            await this.settingsService.updateSettings({ highlightMode: value as 'rich-smooth' | 'rich-sharp' | 'classic-markdown' });
          })
      );

    new Setting(containerEl)
      .setName('Quick text color')
      .setDesc('Color applied by the 1-click text color button.')
      .addColorPicker((color) =>
        color.setValue(settings.activeTextColor || '#e11d48').onChange(async (value) => {
          await this.settingsService.updateSettings({ activeTextColor: value });
        })
      );

    new Setting(containerEl)
      .setName('Quick highlight color')
      .setDesc('Color applied by the 1-click custom highlight button.')
      .addColorPicker((color) =>
        color.setValue(settings.activeHighlightColor || '#fef08a').onChange(async (value) => {
          await this.settingsService.updateSettings({ activeHighlightColor: value });
        })
      );

    containerEl.createEl('h3', { text: 'Default document appearance' });

    new Setting(containerEl)
      .setName('Default font')
      .setDesc('Fallback font for notes that do not define their own document font.')
      .addText((text) =>
        text.setPlaceholder('Example: Amiri').setValue(settings.defaultDocumentFont).onChange(async (value) => {
          await this.settingsService.updateSettings({ defaultDocumentFont: value.trim() });
        })
      );

    new Setting(containerEl)
      .setName('Default font size')
      .setDesc('Fallback font size, such as 16px or 1.05em. Leave empty to use Obsidian theme size.')
      .addText((text) =>
        text.setPlaceholder('Example: 17px').setValue(settings.defaultDocumentFontSize).onChange(async (value) => {
          await this.settingsService.updateSettings({ defaultDocumentFontSize: value.trim() });
        })
      );

    new Setting(containerEl)
      .setName('Default line height')
      .setDesc('Comfortable spacing for long-form notes. Leave empty to use the theme default.')
      .addText((text) =>
        text.setPlaceholder('Example: 1.6').setValue(settings.defaultDocumentLineHeight).onChange(async (value) => {
          await this.settingsService.updateSettings({ defaultDocumentLineHeight: value.trim() });
        })
      );

    new Setting(containerEl)
      .setName('Default alignment')
      .setDesc('Fallback paragraph alignment for notes without a document-specific value.')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('', 'Theme/default')
          .addOption('left', 'Left')
          .addOption('center', 'Center')
          .addOption('right', 'Right')
          .addOption('justify', 'Justify')
          .setValue(settings.defaultDocumentAlignment)
          .onChange(async (value) => {
            await this.settingsService.updateSettings({ defaultDocumentAlignment: value as DocumentAlignment | '' });
          })
      );

    new Setting(containerEl)
      .setName('Reset settings')
      .setDesc('Restore the plugin settings to their defaults.')
      .addButton((button) =>
        button.setWarning().setButtonText('Reset').onClick(async () => {
          await this.settingsService.resetToDefaults();
          this.display();
        })
      );
  }
}
