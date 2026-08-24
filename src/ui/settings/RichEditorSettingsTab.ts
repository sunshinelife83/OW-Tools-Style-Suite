/**
 * Settings tab for OW-Tools: Style Suite.
 */

import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type RichEditorPlugin from '../../main.js';
import type { DocumentAlignment } from '../../editor/DocumentAppearance.js';
import type { RichEditorSettings } from '../../core/types/settings.js';
import { SettingsService } from '../../services/SettingsService.js';

export class RichEditorSettingsTab extends PluginSettingTab {
  constructor(app: App, plugin: RichEditorPlugin, private settingsService: SettingsService) {
    super(app, plugin);
  }

  public display(): void {
    const { containerEl } = this;
    const settings = this.settingsService.getSettings();
    containerEl.empty();

    new Setting(containerEl).setName('OW-Tools Style Suite').setHeading();
    containerEl.createEl('p', {
      text: 'A comprehensive styling and typography suite for Obsidian notes with aesthetic highlights, custom fonts, floating toolbar, and document appearance.',
    });

    new Setting(containerEl)
      .setName('Selection toolbar')
      .setDesc('Show a small floating toolbar when text is selected in the editor.')
      .addToggle((toggle) =>
        toggle.setValue(settings.enableSelectionToolbar).onChange((value) => {
          this.persistSettings({ enableSelectionToolbar: value });
        })
      );

    new Setting(containerEl)
      .setName('Hide passage style markup')
      .setDesc('Hide style markup (<mark> tags) in Live Preview while seamlessly displaying the visual result.')
      .addToggle((toggle) =>
        toggle.setValue(settings.hideInlineStyleMarkup).onChange((value) => {
          this.persistSettings({ hideInlineStyleMarkup: value });
        })
      );

    new Setting(containerEl)
      .setName('Document action buttons')
      .setDesc('Show the document appearance button in each Markdown note header.')
      .addToggle((toggle) =>
        toggle.setValue(settings.showDocumentActions).onChange((value) => {
          this.persistSettings({ showDocumentActions: value });
        })
      );

    new Setting(containerEl)
      .setName('Quick color header buttons')
      .setDesc('Show 1-click text color and highlight buttons in each note header.')
      .addToggle((toggle) =>
        toggle.setValue(settings.showColorHeaderActions).onChange((value) => {
          this.persistSettings({ showColorHeaderActions: value });
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
          .onChange((value) => {
            this.persistSettings({ highlightMode: value as RichEditorSettings['highlightMode'] });
          })
      );

    new Setting(containerEl)
      .setName('Quick text color')
      .setDesc('Color applied by the 1-click text color button.')
      .addColorPicker((color) =>
        color.setValue(settings.activeTextColor || '#e11d48').onChange((value) => {
          this.persistSettings({ activeTextColor: value });
        })
      );

    new Setting(containerEl)
      .setName('Quick highlight color')
      .setDesc('Color applied by the 1-click custom highlight button.')
      .addColorPicker((color) =>
        color.setValue(settings.activeHighlightColor || '#fef08a').onChange((value) => {
          this.persistSettings({ activeHighlightColor: value });
        })
      );

    new Setting(containerEl).setName('Default document appearance').setHeading();

    new Setting(containerEl)
      .setName('Default font')
      .setDesc('Fallback font for notes that do not define their own document font.')
      .addText((text) =>
        text.setPlaceholder('Example: Amiri').setValue(settings.defaultDocumentFont).onChange((value) => {
          this.persistSettings({ defaultDocumentFont: value.trim() });
        })
      );

    new Setting(containerEl)
      .setName('Default font size')
      .setDesc('Fallback font size, such as 16px or 1.05em. Leave empty to use Obsidian theme size.')
      .addText((text) =>
        text.setPlaceholder('Example: 17px').setValue(settings.defaultDocumentFontSize).onChange((value) => {
          this.persistSettings({ defaultDocumentFontSize: value.trim() });
        })
      );

    new Setting(containerEl)
      .setName('Default line height')
      .setDesc('Comfortable spacing for long-form notes. Leave empty to use the theme default.')
      .addText((text) =>
        text.setPlaceholder('Example: 1.6').setValue(settings.defaultDocumentLineHeight).onChange((value) => {
          this.persistSettings({ defaultDocumentLineHeight: value.trim() });
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
          .onChange((value) => {
            this.persistSettings({ defaultDocumentAlignment: value as DocumentAlignment | '' });
          })
      );

    new Setting(containerEl)
      .setName('Reset settings')
      .setDesc('Restore the plugin settings to their defaults.')
      .addButton((button) =>
        button.setClass('mod-warning').setButtonText('Reset').onClick(() => {
          void this.resetSettings();
        })
      );
  }

  private async resetSettings(): Promise<void> {
    try {
      await this.settingsService.resetToDefaults();
      this.display();
    } catch {
      new Notice('OW-Tools: could not reset the settings.');
    }
  }

  private persistSettings(updates: Partial<RichEditorSettings>): void {
    void this.settingsService.updateSettings(updates).catch(() => {
      new Notice('OW-Tools: could not save that setting.');
    });
  }
}
