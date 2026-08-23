/**
 * Focused floating color palette for a selected passage.
 *
 * Highlight and text color deliberately use separate instances so each header
 * control has one clear purpose and the selection toolbar can stay compact.
 */

import { Editor, Notice, setIcon } from 'obsidian';
import { normalizeColor } from '../editor/DocumentAppearance.js';
import { type EditorSelectionRange, FormattingController } from '../editor/FormattingController.js';
import { SettingsService } from '../services/SettingsService.js';

export type QuickColorMode = 'text' | 'background';

export interface QuickColorPopoverOptions {
  settingsService: SettingsService;
  controller: FormattingController;
  editor: Editor;
  selection: EditorSelectionRange;
  anchorEl: HTMLElement;
  mode: QuickColorMode;
  onClose?: () => void;
}

export const POPULAR_HIGHLIGHTS = [
  { name: 'Canary Yellow', color: '#fef08a' },
  { name: 'Peach Apricot', color: '#fed7aa' },
  { name: 'Mint Green', color: '#bbf7d0' },
  { name: 'Sky Blue', color: '#bae6fd' },
  { name: 'Soft Lavender', color: '#e9d5ff' },
  { name: 'Blush Rose', color: '#fbcfe8' },
  { name: 'Golden Glow', color: '#854d0e66' },
  { name: 'Emerald Glow', color: '#065f4666' },
  { name: 'Sapphire Glow', color: '#1e40af66' },
  { name: 'Amethyst Glow', color: '#6b21a866' },
  { name: 'Ruby Glow', color: '#9f123966' },
  { name: 'Teal Glow', color: '#115e5966' },
];

export const POPULAR_TEXT_COLORS = [
  { name: 'Ruby Red', color: '#e11d48' },
  { name: 'Warm Orange', color: '#ea580c' },
  { name: 'Golden Amber', color: '#d97706' },
  { name: 'Emerald Green', color: '#059669' },
  { name: 'Cyan Teal', color: '#0891b2' },
  { name: 'Royal Blue', color: '#2563eb' },
  { name: 'Indigo Violet', color: '#6366f1' },
  { name: 'Purple', color: '#9333ea' },
  { name: 'Hot Pink', color: '#db2777' },
  { name: 'Coral Bright', color: '#fb7185' },
  { name: 'Mint Bright', color: '#34d399' },
  { name: 'Sky Bright', color: '#60a5fa' },
];

export class QuickColorPopover {
  private popoverEl: HTMLElement | null = null;
  private outsideClickListener: ((event: MouseEvent) => void) | null = null;
  private keydownListener: ((event: KeyboardEvent) => void) | null = null;
  private resizeListener: (() => void) | null = null;
  private outsideClickTimer: number | null = null;

  constructor(private options: QuickColorPopoverOptions) {}

  public open(): void {
    this.close();

    const popover = this.options.anchorEl.ownerDocument.createElement('div');
    popover.className = 'rich-editor-quick-popover rich-editor-color-popover rich-editor-glass-panel';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', this.isText ? 'Text color palette' : 'Highlight color palette');
    this.popoverEl = popover;
    this.options.anchorEl.ownerDocument.body.appendChild(popover);

    this.render();
    this.position();

    this.outsideClickListener = (event) => {
      if (!this.popoverEl) return;
      const target = event.target as Node;
      if (!this.popoverEl.contains(target) && !this.options.anchorEl.contains(target)) {
        this.close();
      }
    };
    this.outsideClickTimer = this.ownerWindow.setTimeout(() => {
      if (this.outsideClickListener) {
        this.ownerWindow.addEventListener('mousedown', this.outsideClickListener);
      }
      this.outsideClickTimer = null;
    }, 0);

    this.keydownListener = (event) => {
      if (event.key === 'Escape') this.close();
    };
    this.resizeListener = () => this.position();
    this.ownerWindow.addEventListener('keydown', this.keydownListener);
    this.ownerWindow.addEventListener('resize', this.resizeListener);
    this.ownerWindow.addEventListener('scroll', this.resizeListener, true);
  }

  public close(): void {
    if (this.outsideClickTimer !== null) {
      this.ownerWindow.clearTimeout(this.outsideClickTimer);
      this.outsideClickTimer = null;
    }
    if (this.outsideClickListener) {
      this.ownerWindow.removeEventListener('mousedown', this.outsideClickListener);
      this.outsideClickListener = null;
    }
    if (this.keydownListener) {
      this.ownerWindow.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
    if (this.resizeListener) {
      this.ownerWindow.removeEventListener('resize', this.resizeListener);
      this.ownerWindow.removeEventListener('scroll', this.resizeListener, true);
      this.resizeListener = null;
    }
    if (this.popoverEl) {
      this.popoverEl.remove();
      this.popoverEl = null;
      this.options.onClose?.();
    }
  }

  private get isText(): boolean {
    return this.options.mode === 'text';
  }

  private get ownerWindow(): Window {
    return this.options.anchorEl.ownerDocument.defaultView ?? window;
  }

  private render(): void {
    if (!this.popoverEl) return;
    this.popoverEl.empty();

    const settings = this.options.settingsService.getSettings();
    const activeColor = this.isText ? settings.activeTextColor || '#e11d48' : settings.activeHighlightColor || '#fef08a';
    const palette = this.isText ? POPULAR_TEXT_COLORS : POPULAR_HIGHLIGHTS;

    const header = this.popoverEl.createDiv({ cls: 'rich-editor-color-popover-header' });
    const icon = header.createSpan({ cls: 'rich-editor-color-popover-icon' });
    setIcon(icon, this.isText ? 'type' : 'highlighter');
    const heading = header.createDiv({ cls: 'rich-editor-color-popover-heading' });
    heading.createDiv({ cls: 'rich-editor-color-popover-title', text: this.isText ? 'Text color' : 'Highlight' });
    heading.createDiv({
      cls: 'rich-editor-color-popover-description',
      text: this.isText ? 'Give the selected text a clear visual hierarchy.' : 'Choose a soft, readable passage highlight.',
    });

    const grid = this.popoverEl.createDiv({ cls: 'rich-editor-popover-grid' });
    for (const item of palette) {
      const isSelected = activeColor.toLowerCase() === item.color.toLowerCase();
      const swatch = grid.createEl('button', {
        cls: `rich-editor-popover-swatch ${isSelected ? 'is-selected' : ''}`,
        attr: {
          type: 'button',
          'aria-label': `${item.name} (${item.color})`,
          title: item.name,
        },
      });
      swatch.style.backgroundColor = item.color;
      if (isSelected) {
        const checkIcon = swatch.createSpan({ cls: 'rich-editor-swatch-check' });
        setIcon(checkIcon, 'check');
      }
      swatch.addEventListener('click', () => void this.applyColor(item.color));
    }

    const actionRow = this.popoverEl.createDiv({ cls: 'rich-editor-popover-custom-row' });
    const colorPickerWrapper = actionRow.createDiv({ cls: 'rich-editor-popover-color-picker-wrap' });
    const pickerInput = colorPickerWrapper.createEl('input', {
      type: 'color',
      cls: 'rich-editor-popover-native-picker',
      value: /^#[\da-f]{6}$/i.test(activeColor) ? activeColor : this.isText ? '#e11d48' : '#fef08a',
    });
    const pickerLabel = colorPickerWrapper.createSpan({ cls: 'rich-editor-popover-picker-label' });
    setIcon(pickerLabel, 'pipette');
    pickerLabel.createSpan({ text: 'Custom' });
    pickerInput.addEventListener('input', (event) => {
      const color = (event.target as HTMLInputElement).value;
      if (color) void this.applyColor(color);
    });

    const defaultBtn = actionRow.createEl('button', {
      cls: 'rich-editor-popover-btn',
      attr: {
        type: 'button',
        'aria-label': `Save ${activeColor} as the default ${this.isText ? 'text' : 'highlight'} color`,
      },
    });
    setIcon(defaultBtn, 'star');
    defaultBtn.createSpan({ text: 'Set default' });
    defaultBtn.addEventListener('click', () => void this.setDefault(activeColor));

    const clearBtn = actionRow.createEl('button', {
      cls: 'rich-editor-popover-btn rich-editor-popover-btn-danger',
      attr: { type: 'button', 'aria-label': `Clear ${this.isText ? 'text color' : 'highlight'} on the selection` },
    });
    setIcon(clearBtn, 'eraser');
    clearBtn.createSpan({ text: 'Clear' });
    clearBtn.addEventListener('click', () => void this.applyColor(''));
  }

  private position(): void {
    if (!this.popoverEl || !this.options.anchorEl.isConnected) return;

    const anchorRect = this.options.anchorEl.getBoundingClientRect();
    const popoverRect = this.popoverEl.getBoundingClientRect();
    const padding = 10;
    let left = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2;
    let top = anchorRect.bottom + 8;

    left = Math.max(padding, Math.min(left, this.ownerWindow.innerWidth - popoverRect.width - padding));
    if (top + popoverRect.height > this.ownerWindow.innerHeight - padding) {
      top = Math.max(padding, anchorRect.top - popoverRect.height - 8);
    }

    this.popoverEl.style.left = `${Math.round(left)}px`;
    this.popoverEl.style.top = `${Math.round(top)}px`;
  }

  private async setDefault(color: string): Promise<void> {
    if (this.isText) {
      await this.options.settingsService.updateSettings({ activeTextColor: color });
    } else {
      await this.options.settingsService.updateSettings({ activeHighlightColor: color });
    }
    new Notice(`Saved ${color} as the default ${this.isText ? 'text' : 'highlight'} color.`);
    this.close();
  }

  private async applyColor(color: string): Promise<void> {
    if (color) {
      const valid = normalizeColor(color);
      if (!valid) return;
      this.options.controller.setInlineTypography(
        this.options.editor,
        this.isText ? { textColor: valid } : { backgroundColor: valid },
        this.options.selection
      );
      if (this.isText) {
        await this.options.settingsService.updateSettings({ activeTextColor: valid });
      } else {
        await this.options.settingsService.updateSettings({ activeHighlightColor: valid });
      }
    } else {
      this.options.controller.setInlineTypography(
        this.options.editor,
        this.isText ? { textColor: '' } : { backgroundColor: '' },
        this.options.selection
      );
    }

    this.close();
  }
}
