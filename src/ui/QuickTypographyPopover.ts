/**
 * QuickTypographyPopover.ts — Ultra-sleek floating glassmorphism font & size popover.
 * Provides instant 1-click access to curated Arabic & English fonts, font sizes,
 * system font search, and quick reset.
 */

import { App, Editor, setIcon } from 'obsidian';
import { type EditorSelectionRange, FormattingController } from '../editor/FormattingController.js';
import { FontService } from '../services/FontService.js';
import { FontPickerModal } from './FontPickerModal.js';

export interface QuickTypographyPopoverOptions {
  app: App;
  controller: FormattingController;
  fontService: FontService;
  editor: Editor;
  selection: EditorSelectionRange;
  anchorEl: HTMLElement;
  initialTab?: 'font' | 'size';
  onClose?: () => void;
}

export const POPULAR_FONTS = [
  { name: 'Amiri (أميري)', font: 'Amiri' },
  { name: 'Cairo (القاهرة)', font: 'Cairo' },
  { name: 'Scheherazade', font: 'Scheherazade New' },
  { name: 'Tajawal (تجوال)', font: 'Tajawal' },
  { name: 'Almarai (المراعي)', font: 'Almarai' },
  { name: 'Inter (Sans)', font: 'Inter' },
  { name: 'Playfair (Serif)', font: 'Playfair Display' },
  { name: 'Monospace (Code)', font: 'monospace' },
];

export const POPULAR_SIZES = [
  { label: 'Small', value: '0.88em' },
  { label: 'Regular', value: '1em' },
  { label: 'Medium', value: '1.2em' },
  { label: 'Large', value: '1.4em' },
  { label: 'Huge', value: '1.8em' },
];

export class QuickTypographyPopover {
  private popoverEl: HTMLElement | null = null;
  private tab: 'font' | 'size';
  private outsideClickListener: ((e: MouseEvent) => void) | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(private options: QuickTypographyPopoverOptions) {
    this.tab = options.initialTab ?? 'font';
  }

  public open(): void {
    this.close();

    const popover = document.createElement('div');
    popover.className = 'rich-editor-quick-popover rich-editor-glass-panel';
    this.popoverEl = popover;
    document.body.appendChild(popover);

    this.render();
    this.position();

    this.outsideClickListener = (event: MouseEvent) => {
      if (!this.popoverEl) return;
      const target = event.target as Node;
      if (!this.popoverEl.contains(target) && !this.options.anchorEl.contains(target)) {
        this.close();
      }
    };
    setTimeout(() => {
      if (this.outsideClickListener) {
        window.addEventListener('mousedown', this.outsideClickListener);
      }
    }, 10);

    this.keydownListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.close();
      }
    };
    window.addEventListener('keydown', this.keydownListener);
  }

  public close(): void {
    if (this.outsideClickListener) {
      window.removeEventListener('mousedown', this.outsideClickListener);
      this.outsideClickListener = null;
    }
    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
    if (this.popoverEl) {
      this.popoverEl.remove();
      this.popoverEl = null;
      this.options.onClose?.();
    }
  }

  private render(): void {
    if (!this.popoverEl) return;
    this.popoverEl.empty();

    const activeTypography = this.options.controller.getInlineTypography(this.options.editor, this.options.selection);
    const currentFont = activeTypography.fontFamily ?? '';
    const currentSize = activeTypography.fontSize ?? '';

    // ── Header / 2 Tabs: Fonts & Size ──
    const header = this.popoverEl.createDiv({ cls: 'rich-editor-popover-header' });
    const tabGroup = header.createDiv({ cls: 'rich-editor-popover-tabs' });

    const fontTab = tabGroup.createEl('button', {
      cls: `rich-editor-popover-tab ${this.tab === 'font' ? 'is-active' : ''}`,
      text: 'Typefaces',
    });
    setIcon(fontTab.createSpan({ cls: 'rich-editor-tab-icon' }), 'case-sensitive');
    fontTab.addEventListener('click', () => {
      this.tab = 'font';
      this.render();
      this.position();
    });

    const sizeTab = tabGroup.createEl('button', {
      cls: `rich-editor-popover-tab ${this.tab === 'size' ? 'is-active' : ''}`,
      text: 'Font Size',
    });
    setIcon(sizeTab.createSpan({ cls: 'rich-editor-tab-icon' }), 'move-vertical');
    sizeTab.addEventListener('click', () => {
      this.tab = 'size';
      this.render();
      this.position();
    });

    // ── Body ──
    if (this.tab === 'font') {
      const grid = this.popoverEl.createDiv({ cls: 'rich-editor-popover-font-grid' });
      for (const item of POPULAR_FONTS) {
        const isSelected = currentFont.toLowerCase() === item.font.toLowerCase();
        const btn = grid.createEl('button', {
          cls: `rich-editor-popover-font-btn ${isSelected ? 'is-selected' : ''}`,
          text: item.name,
        });
        btn.style.fontFamily = `"${item.font}", var(--font-text)`;
        btn.addEventListener('click', () => {
          this.applyFont(item.font);
        });
      }

      // Font actions row
      const actionRow = this.popoverEl.createDiv({ cls: 'rich-editor-popover-custom-row' });
      const searchBtn = actionRow.createEl('button', {
        cls: 'rich-editor-popover-btn',
        attr: { 'aria-label': 'Search all device fonts' },
      });
      setIcon(searchBtn, 'search');
      searchBtn.createSpan({ text: 'All fonts…' });
      searchBtn.addEventListener('click', () => {
        this.close();
        new FontPickerModal(this.options.app, this.options.fontService, (font) => {
          this.applyFont(font);
        }).open();
      });

      const clearBtn = actionRow.createEl('button', {
        cls: 'rich-editor-popover-btn rich-editor-popover-btn-danger',
        attr: { 'aria-label': 'Reset font family' },
      });
      setIcon(clearBtn, 'eraser');
      clearBtn.createSpan({ text: 'Reset' });
      clearBtn.addEventListener('click', () => {
        this.applyFont('');
      });
    } else {
      const sizeRow = this.popoverEl.createDiv({ cls: 'rich-editor-popover-size-row' });
      for (const item of POPULAR_SIZES) {
        const isSelected = currentSize === item.value;
        const sizeBtn = sizeRow.createEl('button', {
          cls: `rich-editor-popover-size-btn ${isSelected ? 'is-selected' : ''}`,
          text: item.label,
        });
        sizeBtn.addEventListener('click', () => {
          this.applyFontSize(item.value);
        });
      }

      // Custom size row
      const actionRow = this.popoverEl.createDiv({ cls: 'rich-editor-popover-custom-row' });
      const sizeInputWrap = actionRow.createDiv({ cls: 'rich-editor-popover-color-picker-wrap' });
      const input = sizeInputWrap.createEl('input', {
        type: 'text',
        cls: 'rich-editor-popover-size-input',
        placeholder: 'e.g. 18px',
        value: currentSize,
      });
      input.addEventListener('change', () => {
        if (input.value.trim()) {
          this.applyFontSize(input.value.trim());
        }
      });

      const clearSizeBtn = actionRow.createEl('button', {
        cls: 'rich-editor-popover-btn rich-editor-popover-btn-danger',
        attr: { 'aria-label': 'Reset font size' },
      });
      setIcon(clearSizeBtn, 'eraser');
      clearSizeBtn.createSpan({ text: 'Reset' });
      clearSizeBtn.addEventListener('click', () => {
        this.applyFontSize('');
      });
    }
  }

  private position(): void {
    if (!this.popoverEl) return;

    const anchorRect = this.options.anchorEl.getBoundingClientRect();
    const popoverRect = this.popoverEl.getBoundingClientRect();

    const padding = 8;
    let left = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2;
    let top = anchorRect.bottom + 6;

    if (left < padding) left = padding;
    if (left + popoverRect.width > window.innerWidth - padding) {
      left = window.innerWidth - popoverRect.width - padding;
    }
    if (top + popoverRect.height > window.innerHeight - padding) {
      top = anchorRect.top - popoverRect.height - 6;
    }

    this.popoverEl.style.left = `${Math.round(left)}px`;
    this.popoverEl.style.top = `${Math.round(top)}px`;
  }

  private applyFont(fontFamily: string): void {
    this.options.controller.setInlineTypography(this.options.editor, { fontFamily }, this.options.selection);
    this.close();
  }

  private applyFontSize(fontSize: string): void {
    this.options.controller.setInlineTypography(this.options.editor, { fontSize }, this.options.selection);
    this.close();
  }
}
