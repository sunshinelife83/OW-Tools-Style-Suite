/**
 * Stores plugin settings and persists updates through the plugin's save callback.
 */

import { DEFAULT_SETTINGS, RichEditorSettings } from '../core/types/settings.js';

export class SettingsService {
  private settings: RichEditorSettings = { ...DEFAULT_SETTINGS };
  private saveCallback?: (settings: RichEditorSettings) => Promise<void>;
  private listeners = new Set<(settings: RichEditorSettings) => void>();

  public setSaveCallback(callback: (settings: RichEditorSettings) => Promise<void>): void {
    this.saveCallback = callback;
  }

  public getSettings(): RichEditorSettings {
    return { ...this.settings };
  }

  public async load(data: unknown): Promise<void> {
    if (data && typeof data === 'object') {
      this.settings = { ...DEFAULT_SETTINGS, ...(data as Partial<RichEditorSettings>) };
    } else {
      this.settings = { ...DEFAULT_SETTINGS };
    }
    this.notify();
  }

  public async updateSettings(updates: Partial<RichEditorSettings>): Promise<void> {
    this.settings = { ...this.settings, ...updates };
    await this.persist();
    this.notify();
  }

  public async resetToDefaults(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.persist();
    this.notify();
  }

  public onDidChange(listener: (settings: RichEditorSettings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async persist(): Promise<void> {
    if (this.saveCallback) {
      await this.saveCallback(this.settings);
    }
  }

  private notify(): void {
    const snapshot = this.getSettings();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

