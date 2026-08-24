/**
 * OW-Tools: Style Suite for Obsidian.
 *
 * A comprehensive styling and typography suite for Obsidian:
 * - floating selection formatting toolbar with quick swatches
 * - passage typography & clean HTML5 highlights
 * - document-level appearance & custom fonts
 */

import { Editor, MarkdownView, Notice, Plugin, TFile } from 'obsidian';
import { registerFormattingCommands } from './commands/FormattingCommands.js';
import type { RichEditorSettings } from './core/types/settings.js';
import { detectContentDirection } from './editor/BidiGuard.js';
import { buildRichEditorExtensions } from './editor/RichEditorExtensions.js';
import { INLINE_STYLE_VISIBILITY_EVENT } from './editor/InlineStyleDecorations.js';
import {
  applyDocumentAppearanceToElement,
  readDocumentAppearanceFromFrontmatter,
  type DocumentAppearance,
} from './editor/DocumentAppearance.js';
import { type EditorSelectionRange, FormattingController } from './editor/FormattingController.js';
import { FontService } from './services/FontService.js';
import { SettingsService } from './services/SettingsService.js';
import { DocumentAppearanceModal } from './ui/DocumentAppearanceModal.js';
import { PassageAppearanceModal } from './ui/PassageAppearanceModal.js';
import { QuickColorPopover, type QuickColorMode } from './ui/QuickColorPopover.js';
import { QuickTypographyPopover } from './ui/QuickTypographyPopover.js';
import { TextColorModal } from './ui/TextColorModal.js';
import { buildEditorContextMenu, openDocumentFontPicker } from './ui/menu/EditorContextMenu.js';
import { RichEditorSettingsTab } from './ui/settings/RichEditorSettingsTab.js';

export default class RichEditorPlugin extends Plugin {
  private settingsService = new SettingsService();
  private fontService = new FontService();
  private quickColorPopover: QuickColorPopover | null = null;
  private quickColorPopoverTrigger: HTMLElement | null = null;
  private quickTypographyPopover: QuickTypographyPopover | null = null;
  private quickTypographyPopoverTrigger: HTMLElement | null = null;
  private lastDocumentActionSettings: Pick<RichEditorSettings, 'showDocumentActions' | 'showColorHeaderActions'> | null = null;

  public formattingController!: FormattingController;

  public async onload(): Promise<void> {
    this.formattingController = new FormattingController(this.app);

    await this.settingsService.load(await this.loadData());
    this.documentActionLayoutChanged(this.settingsService.getSettings());
    this.settingsService.setSaveCallback(async (settings) => {
      await this.saveData(settings);
    });

    this.settingsService.onDidChange((settings) => {
      this.refreshDocumentAppearance();
      if (this.documentActionLayoutChanged(settings)) {
        this.ensureDocumentActions();
      }
      window.dispatchEvent(new Event(INLINE_STYLE_VISIBILITY_EVENT));
    });

    this.registerEditorExtension(
      buildRichEditorExtensions({
        app: this.app,
        controller: this.formattingController,
        isToolbarEnabled: () => this.settingsService.getSettings().enableSelectionToolbar,
        isMarkupHidden: () => this.settingsService.getSettings().hideInlineStyleMarkup,
      })
    );

    // Markdown Post Processor for Reading View: ensures backward-compatibility with custom attributes
    this.registerMarkdownPostProcessor((element) => {
      this.applyReadingViewDirection(element);

      const marks = element.querySelectorAll<HTMLElement>('mark[c], mark[b], mark[f], mark[s]');
      marks.forEach((mark) => {
        const c = mark.getAttribute('c');
        const b = mark.getAttribute('b');
        const f = mark.getAttribute('f');
        const s = mark.getAttribute('s');
        const styles: Partial<CSSStyleDeclaration> = {
          backgroundColor: b ?? 'transparent',
        };
        if (c) styles.color = c;
        if (f) styles.fontFamily = f;
        if (s) styles.fontSize = s;
        mark.setCssStyles(styles);
      });
    });

    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        if (!(view instanceof MarkdownView)) return;
        buildEditorContextMenu(
          {
            controller: this.formattingController,
            openDocumentAppearance: (markdownView) => this.openAppearanceForView(markdownView),
            chooseDocumentFont: (markdownView) => this.chooseFontForView(markdownView),
            openPassageAppearance: (selectedEditor) => this.openPassageAppearance(selectedEditor),
            openColorPicker: (selectedEditor) => this.openColorPicker(selectedEditor),
          },
          menu,
          editor,
          view
        );
      })
    );

    this.registerEvent(this.app.workspace.on('layout-change', () => this.ensureDocumentActions()));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.ensureDocumentActions()));
    this.registerEvent(this.app.workspace.on('file-open', () => this.refreshDocumentAppearance()));
    this.registerEvent(this.app.metadataCache.on('changed', () => this.refreshDocumentAppearance()));

    this.app.workspace.onLayoutReady(() => {
      this.ensureDocumentActions();
      this.refreshDocumentAppearance();
    });

    registerFormattingCommands(this);
    this.addSettingTab(new RichEditorSettingsTab(this.app, this, this.settingsService));
  }

  public onunload(): void {
    this.closeQuickPopovers();
  }

  public openAppearanceForActiveDocument(): void {
    const view = this.getActiveMarkdownView();
    if (!view) {
      new Notice('Open a Markdown note first.');
      return;
    }
    this.openAppearanceForView(view);
  }

  public async chooseFontForActiveDocument(): Promise<void> {
    const view = this.getActiveMarkdownView();
    if (!view) {
      new Notice('Open a Markdown note first.');
      return;
    }
    this.chooseFontForView(view);
  }

  public async clearFontForActiveDocument(): Promise<void> {
    const file = this.formattingController.requireFile(this.getActiveMarkdownFile());
    if (!file) return;
    await this.formattingController.setDocumentFont(file, '');
    this.refreshDocumentAppearance();
    const view = this.getActiveMarkdownView();
    if (view) this.formattingController.restoreEditorFocus(view.editor);
    new Notice('OW-Tools: cleared document font.');
  }

  public openPassageAppearanceForActiveSelection(): void {
    const editor = this.formattingController.getActiveEditor();
    if (!editor) {
      new Notice('Open a Markdown note and select a passage first.');
      return;
    }
    this.openPassageAppearance(editor);
  }

  public async clearAppearanceForActiveDocument(): Promise<void> {
    const file = this.formattingController.requireFile(this.getActiveMarkdownFile());
    if (!file) return;
    await this.formattingController.setDocumentAppearance(file, {
      fontFamily: '',
      fontSize: '',
      lineHeight: '',
      alignment: undefined,
    });
    this.refreshDocumentAppearance();
    new Notice('OW-Tools: cleared document appearance.');
  }

  private getActiveMarkdownView(): MarkdownView | null {
    return this.app.workspace.getActiveViewOfType(MarkdownView);
  }

  private getActiveMarkdownFile(): TFile | null {
    return this.getViewFile(this.getActiveMarkdownView());
  }

  private getViewFile(view: MarkdownView | null): TFile | null {
    if (!view) return null;
    const file = (view as MarkdownView & { file?: TFile }).file;
    return file instanceof TFile ? file : null;
  }

  private openAppearanceForView(view: MarkdownView): void {
    const file = this.formattingController.requireFile(this.getViewFile(view));
    if (!file) return;

    new DocumentAppearanceModal(this.app, {
      appearance: this.getAppearanceForView(view),
      fontService: this.fontService,
      onApply: async (appearance) => {
        await this.formattingController.setDocumentAppearance(file, appearance);
        this.refreshDocumentAppearance();
        this.formattingController.restoreEditorFocus(view.editor);
        new Notice('OW-Tools: document appearance updated.');
      },
    }).open();
  }

  private chooseFontForView(view: MarkdownView): void {
    const file = this.formattingController.requireFile(this.getViewFile(view));
    if (!file) return;

    openDocumentFontPicker(this.app, this.fontService, (font) => {
      void this.applyDocumentFontSelection(file, font, view);
    });
  }

  private async applyDocumentFontSelection(file: TFile, font: string, view: MarkdownView): Promise<void> {
    try {
      await this.formattingController.setDocumentFont(file, font);
      this.refreshDocumentAppearance();
      this.formattingController.restoreEditorFocus(view.editor);
      new Notice(`OW-Tools: document font set to ${font}.`);
    } catch {
      new Notice('OW-Tools: could not save the document font.');
    }
  }

  public openPassageAppearance(editor: Editor): void {
    const current = this.formattingController.getSelectionRange(editor);
    const selection = { from: { ...current.from }, to: { ...current.to } };
    if (!editor.getRange(selection.from, selection.to)) {
      new Notice('Select a passage first.');
      return;
    }

    new PassageAppearanceModal(this.app, {
      appearance: this.formattingController.getInlineTypography(editor, selection),
      fontService: this.fontService,
      onApply: (appearance) => {
        this.formattingController.setInlineTypography(editor, appearance, selection);
      },
    }).open();
  }

  public openColorPicker(editor: Editor, initialMode?: 'text' | 'background'): void {
    const current = this.formattingController.getSelectionRange(editor);
    const selection = { from: { ...current.from }, to: { ...current.to } };
    const hasSelection = !!editor.getRange(selection.from, selection.to);

    new TextColorModal(this.app, {
      appearance: hasSelection ? this.formattingController.getInlineTypography(editor, selection) : {},
      initialMode,
      onApply: async (colors) => {
        const updates: Partial<RichEditorSettings> = {};
        if (colors.textColor) updates.activeTextColor = colors.textColor;
        if (colors.backgroundColor) updates.activeHighlightColor = colors.backgroundColor;
        if (Object.keys(updates).length > 0) {
          await this.settingsService.updateSettings(updates);
        }
        if (hasSelection) {
          this.formattingController.setInlineTypography(editor, colors, selection);
        }
        this.refreshActionState();
      },
      onSetDefaultQuickColor: async (type, color) => {
        if (type === 'text') {
          await this.settingsService.updateSettings({ activeTextColor: color });
        } else {
          await this.settingsService.updateSettings({ activeHighlightColor: color });
        }
        this.refreshActionState();
      },
    }).open();
  }


  private snapshotSelection(editor: Editor): EditorSelectionRange {
    const selection = this.formattingController.getSelectionRange(editor);
    return {
      from: { ...selection.from },
      to: { ...selection.to },
    };
  }

  private openQuickColorPopover(
    view: MarkdownView,
    anchorEl: HTMLElement,
    mode: QuickColorMode,
    selection: EditorSelectionRange
  ): void {
    this.closeQuickPopovers();
    anchorEl.classList.add('is-active');
    anchorEl.setAttribute('aria-expanded', 'true');

    const popover = new QuickColorPopover({
      settingsService: this.settingsService,
      controller: this.formattingController,
      editor: view.editor,
      selection,
      anchorEl,
      mode,
      onClose: () => {
        if (this.quickColorPopover === popover) {
          this.quickColorPopover = null;
          this.quickColorPopoverTrigger = null;
        }
        anchorEl.classList.remove('is-active');
        anchorEl.setAttribute('aria-expanded', 'false');
      },
    });
    this.quickColorPopover = popover;
    this.quickColorPopoverTrigger = anchorEl;
    popover.open();
  }

  private openQuickTypographyPopover(
    view: MarkdownView,
    anchorEl: HTMLElement,
    selection: EditorSelectionRange
  ): void {
    this.closeQuickPopovers();
    anchorEl.classList.add('is-active');
    anchorEl.setAttribute('aria-expanded', 'true');

    const popover = new QuickTypographyPopover({
      app: this.app,
      controller: this.formattingController,
      fontService: this.fontService,
      editor: view.editor,
      selection,
      anchorEl,
      onClose: () => {
        if (this.quickTypographyPopover === popover) {
          this.quickTypographyPopover = null;
          this.quickTypographyPopoverTrigger = null;
        }
        anchorEl.classList.remove('is-active');
        anchorEl.setAttribute('aria-expanded', 'false');
      },
    });
    this.quickTypographyPopover = popover;
    this.quickTypographyPopoverTrigger = anchorEl;
    popover.open();
  }

  private closeQuickPopovers(): void {
    this.closeQuickColorPopover();
    this.closeQuickTypographyPopover();
  }

  private closeQuickColorPopover(): void {
    this.quickColorPopover?.close();
    this.quickColorPopover = null;
    if (this.quickColorPopoverTrigger) {
      this.quickColorPopoverTrigger.classList.remove('is-active');
      this.quickColorPopoverTrigger.setAttribute('aria-expanded', 'false');
      this.quickColorPopoverTrigger = null;
    }
  }

  private closeQuickTypographyPopover(): void {
    this.quickTypographyPopover?.close();
    this.quickTypographyPopover = null;
    if (this.quickTypographyPopoverTrigger) {
      this.quickTypographyPopoverTrigger.classList.remove('is-active');
      this.quickTypographyPopoverTrigger.setAttribute('aria-expanded', 'false');
      this.quickTypographyPopoverTrigger = null;
    }
  }

  private documentActionLayoutChanged(settings: RichEditorSettings): boolean {
    const next = {
      showDocumentActions: settings.showDocumentActions,
      showColorHeaderActions: settings.showColorHeaderActions,
    };
    const changed =
      this.lastDocumentActionSettings === null ||
      this.lastDocumentActionSettings.showDocumentActions !== next.showDocumentActions ||
      this.lastDocumentActionSettings.showColorHeaderActions !== next.showColorHeaderActions;
    this.lastDocumentActionSettings = next;
    return changed;
  }

  private ensureDocumentActions(): void {
    this.closeQuickPopovers();
    const settings = this.settingsService.getSettings();

    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) return;

      view.containerEl.querySelectorAll('.rich-editor-view-action').forEach((element) => element.remove());
      
      if (settings.showDocumentActions) {
        const appearanceButton = view.addAction('sliders-horizontal', 'Document appearance', () => this.openAppearanceForView(view));
        appearanceButton.addClass('rich-editor-view-action', 'rich-editor-view-action-appearance');

        let typographySelection: EditorSelectionRange | null = null;
        const typographyButton = view.addAction('case-sensitive', 'Passage typography', () => {
          this.openQuickTypographyPopover(view, typographyButton, typographySelection ?? this.snapshotSelection(view.editor));
          typographySelection = null;
        });
        typographyButton.addClass('rich-editor-view-action', 'rich-editor-view-action-typography');
        typographyButton.setAttribute('aria-haspopup', 'dialog');
        typographyButton.setAttribute('aria-expanded', 'false');
        typographyButton.addEventListener('mousedown', (event) => {
          event.preventDefault();
          typographySelection = this.snapshotSelection(view.editor);
        });
        typographyButton.addEventListener('contextmenu', (event) => {
          event.preventDefault();
          this.openPassageAppearance(view.editor);
        });
      }

      if (settings.showColorHeaderActions) {
        let textSelection: EditorSelectionRange | null = null;
        const textColorButton = view.addAction('type', 'Text color palette', () => {
          this.openQuickColorPopover(view, textColorButton, 'text', textSelection ?? this.snapshotSelection(view.editor));
          textSelection = null;
        });
        textColorButton.addClass('rich-editor-view-action', 'rich-editor-view-action-text-color');
        textColorButton.setAttribute('aria-haspopup', 'dialog');
        textColorButton.setAttribute('aria-expanded', 'false');
        textColorButton.addEventListener('mousedown', (event) => {
          event.preventDefault();
          textSelection = this.snapshotSelection(view.editor);
        });
        textColorButton.addEventListener('contextmenu', (event) => {
          event.preventDefault();
          this.openColorPicker(view.editor, 'text');
        });

        let highlightSelection: EditorSelectionRange | null = null;
        const highlightButton = view.addAction('highlighter', 'Highlight palette', () => {
          this.openQuickColorPopover(view, highlightButton, 'background', highlightSelection ?? this.snapshotSelection(view.editor));
          highlightSelection = null;
        });
        highlightButton.addClass('rich-editor-view-action', 'rich-editor-view-action-highlight-color');
        highlightButton.setAttribute('aria-haspopup', 'dialog');
        highlightButton.setAttribute('aria-expanded', 'false');
        highlightButton.addEventListener('mousedown', (event) => {
          event.preventDefault();
          highlightSelection = this.snapshotSelection(view.editor);
        });
        highlightButton.addEventListener('contextmenu', (event) => {
          event.preventDefault();
          this.openColorPicker(view.editor, 'background');
        });
      }
    });

    this.refreshActionState();
  }

  public async toggleInlineStyleMarkup(): Promise<void> {
    const current = this.settingsService.getSettings().hideInlineStyleMarkup;
    await this.settingsService.updateSettings({ hideInlineStyleMarkup: !current });
    new Notice(`Inline style markup is now ${!current ? 'hidden' : 'visible'}.`);
  }

  private refreshActionState(): void {
    const settings = this.settingsService.getSettings();

    // Update global highlight corner style
    document.body.classList.toggle('rich-editor-highlight-sharp', settings.highlightMode === 'rich-sharp');
    document.body.classList.toggle('rich-editor-highlight-smooth', settings.highlightMode !== 'rich-sharp');
    document.body.setCssProps({
      '--rich-editor-highlight-radius': settings.highlightMode === 'rich-sharp' ? '0px' : '4px',
    });

    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) return;

      view.containerEl
        .querySelector('.rich-editor-view-action-appearance')
        ?.classList.toggle('has-document-appearance', this.hasExplicitAppearance(view));

      const passageTypography = this.formattingController.getInlineTypography(view.editor);
      view.containerEl
        .querySelector('.rich-editor-view-action-typography')
        ?.classList.toggle('has-passage-typography', !!(passageTypography.fontFamily || passageTypography.fontSize));

      const textColorBtn = view.containerEl.querySelector<HTMLElement>('.rich-editor-view-action-text-color');
      if (textColorBtn) {
        textColorBtn.setCssProps({
          '--rich-editor-active-text-color': settings.activeTextColor || '#e11d48',
        });
        textColorBtn.setAttribute(
          'aria-label',
          `Text color palette (${settings.activeTextColor || '#e11d48'})\nClick to choose a color, right-click for advanced settings`
        );
      }

      const highlightBtn = view.containerEl.querySelector<HTMLElement>('.rich-editor-view-action-highlight-color');
      if (highlightBtn) {
        highlightBtn.setCssProps({
          '--rich-editor-active-highlight-color': settings.activeHighlightColor || '#fef08a',
        });
        highlightBtn.setAttribute(
          'aria-label',
          `Highlight palette (${settings.activeHighlightColor || '#fef08a'})\nClick to choose a color, right-click for advanced settings`
        );
      }
    });
  }

  private refreshDocumentAppearance(): void {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) return;
      this.applyAppearanceToView(view);
    });

    this.refreshActionState();
  }

  private applyReadingViewDirection(element: HTMLElement): void {
    const blockSelector = 'p, li, blockquote, h1, h2, h3, h4, h5, h6, td, th';
    const blocks: HTMLElement[] = [];
    if (element.matches(blockSelector)) blocks.push(element);
    blocks.push(...Array.from(element.querySelectorAll<HTMLElement>(blockSelector)));

    for (const block of blocks) {
      const direction = detectContentDirection(block.textContent ?? '');
      if (direction === 'rtl') {
        block.setAttribute('dir', 'rtl');
        block.dataset.richEditorBidi = 'rtl';
      } else if (block.dataset.richEditorBidi === 'rtl') {
        block.removeAttribute('dir');
        delete block.dataset.richEditorBidi;
      }
    }
  }

  private applyAppearanceToView(view: MarkdownView): void {
    applyDocumentAppearanceToElement(view.containerEl, this.getEffectiveAppearanceForView(view));
  }

  private getEffectiveAppearanceForView(view: MarkdownView): DocumentAppearance {
    const settings = this.settingsService.getSettings();
    const appearance = this.getAppearanceForView(view);
    return {
      fontFamily: appearance.fontFamily ?? this.normalizeOptional(settings.defaultDocumentFont),
      fontSize: appearance.fontSize ?? this.normalizeOptional(settings.defaultDocumentFontSize),
      lineHeight: appearance.lineHeight ?? this.normalizeOptional(settings.defaultDocumentLineHeight),
      alignment: (appearance.alignment ?? settings.defaultDocumentAlignment) || undefined,
    };
  }

  private getAppearanceForView(view: MarkdownView): DocumentAppearance {
    const file = this.getViewFile(view);
    if (!file) return {};
    const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter ?? null;
    return readDocumentAppearanceFromFrontmatter(frontmatter);
  }

  private hasExplicitAppearance(view: MarkdownView): boolean {
    const appearance = this.getAppearanceForView(view);
    return Object.values(appearance).some((value) => value !== undefined && value !== '');
  }

  private normalizeOptional(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
