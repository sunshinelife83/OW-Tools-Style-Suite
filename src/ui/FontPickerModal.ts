/**
 * FontPickerModal — Searchable picker over every font on the device.
 *
 * Uses Obsidian's native FuzzySuggestModal so it looks and behaves like the
 * core Quick Switcher: type to fuzzy-search the full device font list (via
 * FontService → Local Font Access API with curated fallback), each suggestion
 * rendered in its own typeface for instant preview.
 */

import { App, FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import { FontService } from '../services/FontService.js';

export interface FontSearchEntry {
  font: string;
  searchText: string;
}

const MAX_FUZZY_CANDIDATES = 120;
const MAX_VISIBLE_RESULTS = 40;

export function createFontSearchIndex(fonts: string[]): FontSearchEntry[] {
  return fonts.map((font) => ({ font, searchText: font.toLocaleLowerCase() }));
}

export function searchFontCandidates(index: FontSearchEntry[], rawQuery: string, limit: number): string[] {
  const query = rawQuery.trim().toLocaleLowerCase();
  if (!query) return index.slice(0, limit).map((entry) => entry.font);

  const prefixes: string[] = [];
  const wordPrefixes: string[] = [];
  const contains: string[] = [];
  const fuzzy: string[] = [];
  const add = (bucket: string[], font: string): void => {
    if (bucket.length < limit) bucket.push(font);
  };

  for (const entry of index) {
    if (entry.searchText.startsWith(query)) {
      add(prefixes, entry.font);
    } else if (entry.searchText.split(/\s+/).some((word) => word.startsWith(query))) {
      add(wordPrefixes, entry.font);
    } else if (entry.searchText.includes(query)) {
      add(contains, entry.font);
    } else if (isSubsequence(query, entry.searchText)) {
      add(fuzzy, entry.font);
    }
  }

  return [...prefixes, ...wordPrefixes, ...contains, ...fuzzy].slice(0, limit);
}

function isSubsequence(query: string, value: string): boolean {
  let queryIndex = 0;
  for (let index = 0; index < value.length && queryIndex < query.length; index += 1) {
    if (value[index] === query[queryIndex]) queryIndex += 1;
  }
  return queryIndex === query.length;
}

export class FontPickerModal extends FuzzySuggestModal<string> {
  private fontIndex: FontSearchEntry[] = [];

  constructor(
    app: App,
    private fontService: FontService,
    private onPick: (font: string) => void
  ) {
    super(app);
    this.setPlaceholder('Search fonts on this device…');
    this.setInstructions([
      { command: '↑↓', purpose: 'navigate' },
      { command: '↵', purpose: 'apply font' },
      { command: 'esc', purpose: 'dismiss' },
    ]);
    this.limit = MAX_VISIBLE_RESULTS;
  }

  public onOpen(): void {
    super.onOpen();
    // Font enumeration is async; refresh the suggestion list once loaded.
    void this.loadFonts();
  }

  private async loadFonts(): Promise<void> {
    try {
      const fonts = await this.fontService.getAvailableFonts();
      this.fontIndex = createFontSearchIndex(fonts);
      // Re-run the current query against a small prefiltered candidate list.
      this.inputEl.dispatchEvent(new Event('input'));
    } catch {
      this.fontIndex = [];
    }
  }

  public getItems(): string[] {
    return searchFontCandidates(this.fontIndex, this.inputEl.value ?? '', MAX_FUZZY_CANDIDATES);
  }

  public getItemText(font: string): string {
    return font;
  }

  public renderSuggestion(match: FuzzyMatch<string>, el: HTMLElement): void {
    super.renderSuggestion(match, el);
    el.addClass('rich-editor-font-suggestion');
    // Live preview: render each entry in its own typeface
    if (!match.item.startsWith('var(')) {
      el.setCssStyles({ fontFamily: `"${match.item}", var(--font-text)` });
    }
  }

  public onChooseItem(font: string): void {
    this.onPick(font);
  }
}
