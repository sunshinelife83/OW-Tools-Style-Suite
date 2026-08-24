/**
 * Plain-text formatting helpers for Obsidian's native Markdown editor.
 *
 * This controller intentionally avoids non-standard rich-text syntaxes.
 * Basic formatting is stored as normal Markdown (and small inline HTML tags),
 * while document appearance is stored in YAML frontmatter.
 */

import { App, Editor, EditorPosition, MarkdownView, Notice, TFile } from 'obsidian';
import {
  DOCUMENT_ALIGNMENT_KEY,
  DOCUMENT_FONT_KEY,
  DOCUMENT_FONT_SIZE_KEY,
  DOCUMENT_LINE_HEIGHT_KEY,
  type DocumentAppearance,
} from './DocumentAppearance.js';
import {
  findAllInlineTypographyRegions,
  findEnclosingOrOverlappingRegion,
  findInlineTypographyRegion,
  mergeInlineTypography,
  normalizeInlineTypography,
  stripAllInlineTypographyTags,
  wrapInlineTypography,
  type InlineTypography,
  type InlineTypographyRegion,
} from './InlineTypography.js';
import {
  clampSegmentToBlockContent,
  getLeadingDirectionControlStart,
  stripGeneratedDirectionControls,
  stripLeadingDirectionControls,
} from './BidiGuard.js';

export type InlineMark = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'highlight';

export interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  highlight: boolean;
}

export interface EditorSelectionRange {
  from: EditorPosition;
  to: EditorPosition;
}

interface LineTransformationResult {
  delta: number;
  replaceFrom: number;
  replaceTo: number;
  sourceFrom: number;
  sourceTo: number;
  selectionStart: number;
  selectionEnd: number;
}

const MARK_DELIMS: Record<Exclude<InlineMark, 'underline'>, { pre: string; post: string }> = {
  bold: { pre: '**', post: '**' },
  italic: { pre: '*', post: '*' },
  strikethrough: { pre: '~~', post: '~~' },
  highlight: { pre: '==', post: '==' },
};

type HtmlMarkDefinition = {
  open: string;
  close: string;
  names: string[];
};

type HtmlMarkRegion = {
  open: number;
  openEnd: number;
  close: number;
  closeEnd: number;
  openTag: string;
  closeTag: string;
};

type HtmlTagStackEntry = {
  name: string;
  openTag: string;
};

const HTML_MARKS: Record<InlineMark, HtmlMarkDefinition> = {
  bold: { open: '<b>', close: '</b>', names: ['b', 'strong'] },
  italic: { open: '<i>', close: '</i>', names: ['i', 'em'] },
  underline: { open: '<u>', close: '</u>', names: ['u'] },
  strikethrough: { open: '<s>', close: '</s>', names: ['s', 'strike', 'del'] },
  highlight: { open: '<mark>', close: '</mark>', names: ['mark'] },
};

export class FormattingController {
  constructor(private app: App) { }

  public getActiveEditor(): Editor | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    return view?.editor ?? null;
  }

  public toggleMark(editor: Editor, mark: InlineMark): void {
    let selection = this.expandedSelection(editor);
    if (selection.from.line === selection.to.line) {
      const clamped = clampSegmentToBlockContent(
        editor.getLine(selection.from.line),
        selection.from.ch,
        selection.to.ch
      );
      selection = {
        from: { line: selection.from.line, ch: clamped.fromCh },
        to: { line: selection.to.line, ch: clamped.toCh },
      };
      if (selection.from.ch >= selection.to.ch) return;
    }

    if (selection.from.line === selection.to.line) {
      const lineText = editor.getLine(selection.from.line);
      const typographyRegion = this.findTypographyRegionForMark(
        lineText,
        selection.from.ch,
        selection.to.ch,
        mark
      );
      if (
        typographyRegion &&
        (this.migrateLegacyMarkdownInsideTypography(editor, selection.from.line, typographyRegion, selection) ||
          this.migrateLegacyMarkdownAroundTypography(editor, selection.from.line, typographyRegion, selection))
      ) {
        this.toggleMark(editor, mark);
        return;
      }
    }

    const rawFrom = editor.getCursor('from');
    const rawTo = editor.getCursor('to');
    const isCursorEmpty = rawFrom.line === rawTo.line && rawFrom.ch === rawTo.ch;
    const initialCh = rawFrom.ch;
    const text = editor.getRange(selection.from, selection.to);
    const isActive = this.getFormatsAt(editor)[mark];

    if (selection.from.line === selection.to.line) {
      const lineText = editor.getLine(selection.from.line);
      const typographyRegion = this.findTypographyRegionForMark(
        lineText,
        selection.from.ch,
        selection.to.ch,
        mark
      );
      if (typographyRegion) {
        this.toggleMarkInsideTypography(
          editor,
          selection.from.line,
          typographyRegion,
          selection.from.ch,
          selection.to.ch,
          mark,
          isActive,
          isCursorEmpty,
          initialCh
        );
        return;
      }

      if (this.toggleMarkAcrossTypographySelection(editor, selection, mark, isActive)) return;

      const envelope = this.getFormattingEnvelope(lineText, selection.from.ch, selection.to.ch);
      if (!isActive || envelope.marks.has(mark)) {
        const marks = new Set(envelope.marks);
        if (isActive) marks.delete(mark);
        else marks.add(mark);
        const contentText = stripLeadingDirectionControls(text);
        const formatted = this.applyMarkSet(contentText, marks);
        const leadingControl = getLeadingDirectionControlStart(lineText, envelope.from);
        const cursorOffset = isCursorEmpty
          ? formatted.contentOffset + Math.max(0, Math.min(initialCh - leadingControl, contentText.length))
          : undefined;
        this.replaceAndSelect(
          editor,
          { line: selection.from.line, ch: leadingControl },
          { line: selection.to.line, ch: envelope.to },
          formatted.text,
          formatted.contentOffset,
          formatted.contentOffset + contentText.length,
          cursorOffset
        );
        return;
      }
    }

    if (mark === 'underline') {
      this.toggleUnderline(editor);
      return;
    }

    if (selection.from.line !== selection.to.line) {
      const { pre, post } = MARK_DELIMS[mark];
      this.toggleWrapperAcrossLines(editor, selection, { pre, post }, false);
      return;
    }

    const { pre, post } = MARK_DELIMS[mark];
    if (isActive && text.startsWith(pre) && text.endsWith(post) && text.length >= pre.length + post.length) {
      const unwrapped = text.slice(pre.length, text.length - post.length);
      const cursorOffset = isCursorEmpty
        ? Math.max(0, Math.min(initialCh - selection.from.ch - pre.length, unwrapped.length))
        : undefined;
      this.replaceAndSelect(editor, selection.from, selection.to, unwrapped, 0, unwrapped.length, cursorOffset);
      return;
    }

    const before = editor.getRange(
      { line: selection.from.line, ch: Math.max(0, selection.from.ch - pre.length) },
      selection.from
    );
    const after = editor.getRange(selection.to, { line: selection.to.line, ch: selection.to.ch + post.length });
    if (isActive && before === pre && after === post) {
      const cursorOffset = isCursorEmpty
        ? Math.max(0, Math.min(initialCh - selection.from.ch, text.length))
        : undefined;
      this.replaceAndSelect(
        editor,
        { line: selection.from.line, ch: selection.from.ch - pre.length },
        { line: selection.to.line, ch: selection.to.ch + post.length },
        text,
        0,
        text.length,
        cursorOffset
      );
      return;
    }

    if (isActive && selection.from.line === selection.to.line) {
      const lineText = editor.getLine(selection.from.line);
      const region = this.findMarkRegion(lineText, pre, selection.from.ch, selection.to.ch, 'contain');
      if (region) {
        this.splitMarkRegion(editor, selection.from.line, region, { pre, post }, selection.from.ch, selection.to.ch, (value) => value);
        return;
      }
    }

    const replacement = `${pre}${text}${post}`;
    const cursorOffset = isCursorEmpty
      ? pre.length + Math.max(0, Math.min(initialCh - selection.from.ch, text.length))
      : undefined;
    this.replaceAndSelect(editor, selection.from, selection.to, replacement, pre.length, pre.length + text.length, cursorOffset);
  }

  public setHeading(editor: Editor, level: number): void {
    const line = editor.getCursor().line;
    const text = editor.getLine(line);
    const stripped = text.replace(/^#{1,6}\s+/, '');
    const prefix = level > 0 ? `${'#'.repeat(level)} ` : '';
    editor.replaceRange(prefix + stripped, { line, ch: 0 }, { line, ch: text.length });
  }

  public toggleBulletList(editor: Editor): void {
    this.toggleLinePrefix(editor, /^-\s+/, '- ');
  }

  public toggleBlockquote(editor: Editor): void {
    this.toggleLinePrefix(editor, /^>\s?/, '> ');
  }

  public toggleNumberedList(editor: Editor): void {
    const { startLine, endLine } = this.getSelectedLineRange(editor);
    const lines = this.getLines(editor, startLine, endLine);
    const allNumbered = lines.every((line) => line.trim() === '' || /^\d+\.\s+/.test(line));

    const updated = allNumbered
      ? lines.map((line) => line.replace(/^\d+\.\s+/, ''))
      : (() => {
        let index = 1;
        return lines.map((line) => {
          if (line.trim() === '') return line;
          const withoutPrefix = line.replace(/^\d+\.\s+/, '');
          const next = `${index}. ${withoutPrefix}`;
          index += 1;
          return next;
        });
      })();

    this.replaceLines(editor, startLine, endLine, updated);
  }

  public clearFormatting(editor: Editor): void {
    const selection = this.expandedSelection(editor);
    if (!this.hasText(editor, selection)) return;

    if (selection.from.line === selection.to.line) {
      const lineText = editor.getLine(selection.from.line);
      let expandFrom = selection.from.ch;
      let expandTo = selection.to.ch;

      // Iteratively expand outward through Markdown marks and HTML tags
      let changed = true;
      while (changed) {
        changed = false;

        // Expand through Markdown marks (**,*,~~,==)
        const envelope = this.getFormattingEnvelope(lineText, expandFrom, expandTo);
        if (envelope.from < expandFrom || envelope.to > expandTo) {
          expandFrom = envelope.from;
          expandTo = envelope.to;
          changed = true;
        }

        // Expand through surrounding HTML tags (<u>, <span>, etc.)
        const beforeSection = lineText.slice(0, expandFrom);
        const trailingOpenTag = beforeSection.match(/<(\w+)[^>]*>$/);
        if (trailingOpenTag) {
          const tagName = trailingOpenTag[1];
          const closeTag = `</${tagName}>`;
          const afterSection = lineText.slice(expandTo);
          if (afterSection.startsWith(closeTag)) {
            expandFrom -= trailingOpenTag[0].length;
            expandTo += closeTag.length;
            expandFrom = getLeadingDirectionControlStart(lineText, expandFrom);
            changed = true;
          }
        }
      }

      const rawText = stripGeneratedDirectionControls(lineText.slice(expandFrom, expandTo));

      // Strip all HTML tags (span containers + inline formatting)
      let plain = rawText.replace(/<[^>]+>/g, '');
      // Strip Markdown delimiters (**bold**, *italic*, ~~strike~~, ==highlight==)
      plain = this.stripInlineMarks(plain);
      plain = stripGeneratedDirectionControls(plain);

      if (plain !== rawText) {
        this.replaceAndSelect(
          editor,
          { line: selection.from.line, ch: expandFrom },
          { line: selection.to.line, ch: expandTo },
          plain,
          0,
          plain.length
        );
      }
      return;
    }

    const rawText = stripGeneratedDirectionControls(editor.getRange(selection.from, selection.to));
    let plain = rawText.replace(/<[^>]+>/g, '');
    plain = this.stripInlineMarks(plain);
    plain = stripGeneratedDirectionControls(plain);
    if (plain !== rawText) {
      this.replaceAndSelect(editor, selection.from, selection.to, plain, 0, plain.length);
    }
  }


  public getSelectionRange(editor: Editor): EditorSelectionRange {
    return this.expandedSelection(editor);
  }

  public getInlineTypography(editor: Editor, selection = this.expandedSelection(editor)): InlineTypography {
    const startLine = Math.min(selection.from.line, selection.to.line);
    const endLine = Math.max(selection.from.line, selection.to.line);
    let common: InlineTypography | null = null;

    for (let line = startLine; line <= endLine; line += 1) {
      const lineText = editor.getLine(line);
      if (!lineText.trim()) continue;

      let fromCh = 0;
      let toCh = lineText.length;
      if (line === selection.from.line && line === selection.to.line) {
        fromCh = Math.min(selection.from.ch, selection.to.ch);
        toCh = Math.max(selection.from.ch, selection.to.ch);
      } else if (line === selection.from.line) {
        fromCh = selection.from.ch;
      } else if (line === selection.to.line) {
        toCh = selection.to.ch;
      }

      const clamped = clampSegmentToBlockContent(lineText, fromCh, toCh);
      fromCh = clamped.fromCh;
      toCh = clamped.toCh;
      if (toCh <= fromCh) continue;

      const region = findEnclosingOrOverlappingRegion(lineText, fromCh, toCh);
      const current = region?.typography ?? {};
      if (!common) {
        common = { ...current };
        continue;
      }

      for (const property of ['fontFamily', 'fontSize', 'textColor', 'backgroundColor'] as const) {
        if (common[property] !== current[property]) delete common[property];
      }
    }

    return common ?? {};
  }

  public setInlineTypography(
    editor: Editor,
    updates: {
      fontFamily?: string | null;
      fontSize?: string | null;
      textColor?: string | null;
      backgroundColor?: string | null;
    },
    selection = this.expandedSelection(editor)
  ): void {
    const rawFrom = editor.getCursor('from');
    const rawTo = editor.getCursor('to');
    const isCursorEmpty = rawFrom.line === rawTo.line && rawFrom.ch === rawTo.ch;
    const initialCh = rawFrom.ch;

    if (!this.hasText(editor, selection)) {
      new Notice('Select a passage first.');
      return;
    }

    const safeUpdates: {
      fontFamily?: string | null;
      fontSize?: string | null;
      textColor?: string | null;
      backgroundColor?: string | null;
    } = {};
    if (Object.prototype.hasOwnProperty.call(updates, 'fontFamily')) {
      const value = updates.fontFamily?.trim() ?? '';
      const normalized = normalizeInlineTypography({ fontFamily: value }).fontFamily;
      if (value && !normalized) {
        new Notice('That font family cannot be stored safely.');
        return;
      }
      safeUpdates.fontFamily = normalized ?? '';
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'fontSize')) {
      const value = updates.fontSize?.trim() ?? '';
      const normalized = normalizeInlineTypography({ fontSize: value }).fontSize;
      if (value && !normalized) {
        new Notice('Use a font size such as 18px, 1.2em, or 120%.');
        return;
      }
      safeUpdates.fontSize = normalized ?? '';
    }
    for (const property of ['textColor', 'backgroundColor'] as const) {
      if (!Object.prototype.hasOwnProperty.call(updates, property)) continue;
      const value = updates[property]?.trim() ?? '';
      const normalized = normalizeInlineTypography({ [property]: value })[property];
      if (value && !normalized) {
        new Notice('Choose a valid hexadecimal color.');
        return;
      }
      safeUpdates[property] = normalized ?? '';
    }

    if (selection.from.line !== selection.to.line) {
      this.setInlineTypographyAcrossLines(editor, selection, safeUpdates);
      return;
    }

    const line = selection.from.line;
    const clamped = clampSegmentToBlockContent(
      editor.getLine(line),
      selection.from.ch,
      selection.to.ch
    );
    if (clamped.toCh <= clamped.fromCh) return;

    this.setInlineTypographyOnLine(
      editor,
      line,
      clamped.fromCh,
      clamped.toCh,
      safeUpdates,
      { isCursorEmpty, initialCh }
    );
  }

  /**
   * Applies passage typography to one source line. Inline HTML must never
   * cross a newline, so multi-line selections call this method once per
   * affected line.
   */
  private setInlineTypographyOnLine(
    editor: Editor,
    line: number,
    fromCh: number,
    toCh: number,
    safeUpdates: {
      fontFamily?: string | null;
      fontSize?: string | null;
      textColor?: string | null;
      backgroundColor?: string | null;
    },
    cursor: { isCursorEmpty: boolean; initialCh: number },
    restoreSelection = true
  ): LineTransformationResult {
    const lineText = editor.getLine(line);
    const region = findEnclosingOrOverlappingRegion(lineText, fromCh, toCh);

    if (!region) {
      const typography = mergeInlineTypography({}, safeUpdates);
      if (!Object.values(typography).some(Boolean)) {
        return {
          delta: 0,
          replaceFrom: fromCh,
          replaceTo: toCh,
          sourceFrom: fromCh,
          sourceTo: toCh,
          selectionStart: fromCh,
          selectionEnd: toCh,
        };
      }

      const envelope = this.getFormattingEnvelope(lineText, fromCh, toCh);
      const envelopeSlice = stripLeadingDirectionControls(lineText.slice(envelope.from, envelope.to));
      const { cleanText, accumulatedTypography } = stripAllInlineTypographyTags(envelopeSlice);
      const legacyMarks = this.markdownMarksOnly(envelope.marks);
      const canonicalContent = this.applyHtmlMarkSet(
        this.unwrapMarkdownMarkSet(cleanText, legacyMarks),
        legacyMarks
      );
      const finalTypography = mergeInlineTypography(accumulatedTypography, safeUpdates);
      const wrapped = wrapInlineTypography(canonicalContent, finalTypography);
      if (!wrapped.text) {
        return {
          delta: 0,
          replaceFrom: fromCh,
          replaceTo: toCh,
          sourceFrom: fromCh,
          sourceTo: toCh,
          selectionStart: fromCh,
          selectionEnd: toCh,
        };
      }

      const leadingControl = getLeadingDirectionControlStart(lineText, envelope.from);
      const replacement = wrapped.text;
      const plainWord = stripLeadingDirectionControls(this.stripInlineMarks(cleanText.replace(/<[^>]+>/g, '')));
      const innerOffset = canonicalContent.indexOf(plainWord);
      const selectedStart = wrapped.contentOffset + (innerOffset >= 0 ? innerOffset : 0);
      const selectedEnd = selectedStart + (plainWord.length > 0 ? plainWord.length : canonicalContent.length);
      const cursorOffset = cursor.isCursorEmpty
        ? selectedStart + Math.max(0, Math.min(cursor.initialCh - leadingControl, plainWord.length))
        : undefined;

      this.replaceAndSelect(
        editor,
        { line, ch: leadingControl },
        { line, ch: envelope.to },
        replacement,
        selectedStart,
        selectedEnd,
        cursorOffset,
        restoreSelection
      );
      return {
        delta: replacement.length - (envelope.to - leadingControl),
        replaceFrom: leadingControl,
        replaceTo: envelope.to,
        sourceFrom: fromCh,
        sourceTo: toCh,
        selectionStart: leadingControl + selectedStart,
        selectionEnd: leadingControl + selectedEnd,
      };
    }

    if (region.isFullEnclosure) {
      const from = Math.min(Math.max(fromCh, region.openEnd), region.close);
      const to = Math.min(Math.max(toCh, region.openEnd), region.close);
      const leftSlice = stripLeadingDirectionControls(lineText.slice(region.openEnd, from));
      const selectedSlice = lineText.slice(from, to);
      const rightSlice = lineText.slice(to, region.close);

      const { cleanText: cleanLeft } = stripAllInlineTypographyTags(leftSlice);
      const { cleanText: cleanSelected, accumulatedTypography: innerTypo } = stripAllInlineTypographyTags(selectedSlice);
      const { cleanText: cleanRight } = stripAllInlineTypographyTags(rightSlice);

      const left = wrapInlineTypography(cleanLeft, region.typography);
      const selectedTypography = mergeInlineTypography(
        mergeInlineTypography(region.typography, innerTypo),
        safeUpdates
      );
      const selected = wrapInlineTypography(cleanSelected, selectedTypography);
      const right = wrapInlineTypography(cleanRight, region.typography);
      const combined = left.text + selected.text + right.text;
      const leadingControl = getLeadingDirectionControlStart(lineText, region.rangeFrom);
      const replacement = combined;
      const selectedStart = left.text.length + selected.contentOffset;
      const cursorOffset = cursor.isCursorEmpty
        ? selectedStart + Math.max(0, Math.min(cursor.initialCh - from, cleanSelected.length))
        : undefined;

      this.replaceAndSelect(
        editor,
        { line, ch: leadingControl },
        { line, ch: region.rangeTo },
        replacement,
        selectedStart,
        selectedStart + cleanSelected.length,
        cursorOffset,
        restoreSelection
      );
      return {
        delta: replacement.length - (region.rangeTo - leadingControl),
        replaceFrom: leadingControl,
        replaceTo: region.rangeTo,
        sourceFrom: fromCh,
        sourceTo: toCh,
        selectionStart: leadingControl + selectedStart,
        selectionEnd: leadingControl + selectedStart + cleanSelected.length,
      };
    }

    // Overlapping one or more regions: flatten them into one canonical
    // container while retaining the accumulated style properties.
    const leadingControl = getLeadingDirectionControlStart(lineText, region.rangeFrom);
    const targetSlice = stripLeadingDirectionControls(lineText.slice(leadingControl, region.rangeTo));
    const { cleanText, accumulatedTypography } = stripAllInlineTypographyTags(targetSlice);
    const finalTypography = mergeInlineTypography(
      mergeInlineTypography(region.typography, accumulatedTypography),
      safeUpdates
    );
    const wrapped = wrapInlineTypography(cleanText, finalTypography);
    const replacement = wrapped.text;
    const cursorOffset = cursor.isCursorEmpty
      ? wrapped.contentOffset + Math.max(0, Math.min(cursor.initialCh - leadingControl, cleanText.length))
      : undefined;

    this.replaceAndSelect(
      editor,
      { line, ch: leadingControl },
      { line, ch: region.rangeTo },
      replacement,
      wrapped.contentOffset,
      wrapped.contentOffset + cleanText.length,
      cursorOffset,
      restoreSelection
    );
    return {
      delta: replacement.length - (region.rangeTo - leadingControl),
      replaceFrom: leadingControl,
      replaceTo: region.rangeTo,
      sourceFrom: fromCh,
      sourceTo: toCh,
      selectionStart: leadingControl + wrapped.contentOffset,
      selectionEnd: leadingControl + wrapped.contentOffset + cleanText.length,
    };
  }

  /**
   * Applies passage typography independently to each affected source line.
   * This avoids invalid inline tags spanning Markdown paragraphs/newlines.
   */
  private setInlineTypographyAcrossLines(
    editor: Editor,
    selection: EditorSelectionRange,
    safeUpdates: {
      fontFamily?: string | null;
      fontSize?: string | null;
      textColor?: string | null;
      backgroundColor?: string | null;
    }
  ): void {
    const startLine = Math.min(selection.from.line, selection.to.line);
    const endLine = Math.max(selection.from.line, selection.to.line);
    const changes = new Map<number, LineTransformationResult>();

    for (let line = startLine; line <= endLine; line += 1) {
      const lineText = editor.getLine(line);
      if (!lineText.trim()) continue;

      let fromCh = 0;
      let toCh = lineText.length;
      if (line === selection.from.line && line === selection.to.line) {
        fromCh = Math.min(selection.from.ch, selection.to.ch);
        toCh = Math.max(selection.from.ch, selection.to.ch);
      } else if (line === selection.from.line) {
        fromCh = selection.from.ch;
      } else if (line === selection.to.line) {
        toCh = selection.to.ch;
      }

      const clamped = clampSegmentToBlockContent(lineText, fromCh, toCh);
      fromCh = clamped.fromCh;
      toCh = clamped.toCh;
      if (toCh <= fromCh) continue;

      const change = this.setInlineTypographyOnLine(
        editor,
        line,
        fromCh,
        toCh,
        safeUpdates,
        { isCursorEmpty: false, initialCh: selection.from.ch },
        false
      );
      changes.set(line, change);
    }

    const mapEndpoint = (position: EditorPosition, endpoint: 'from' | 'to'): EditorPosition => {
      const change = changes.get(position.line);
      if (!change || change.delta === 0) return { ...position };
      if (position.ch < change.sourceFrom) return { ...position };
      if (position.ch > change.sourceTo) {
        return { line: position.line, ch: Math.max(0, position.ch + change.delta) };
      }

      if (endpoint === 'from' && position.ch === change.sourceFrom) {
        return { line: position.line, ch: change.selectionStart };
      }
      if (endpoint === 'to' && position.ch === change.sourceTo) {
        return { line: position.line, ch: change.selectionEnd };
      }

      const sourceLength = Math.max(1, change.sourceTo - change.sourceFrom);
      const outputLength = Math.max(0, change.selectionEnd - change.selectionStart);
      const offset = Math.max(0, Math.min(position.ch - change.sourceFrom, sourceLength));
      return {
        line: position.line,
        ch: change.selectionStart + Math.min(outputLength, Math.round((offset / sourceLength) * outputLength)),
      };
    };
    const from = mapEndpoint(selection.from, 'from');
    const to = mapEndpoint(selection.to, 'to');
    if (from.line === to.line && from.ch === to.ch) editor.setCursor(from);
    else editor.setSelection(from, to);
    this.restoreEditorFocus(editor);
  }

  public getFormatsAt(editor: Editor): ActiveFormats {
    const selection = this.expandedSelection(editor);
    const lineText = editor.getLine(selection.from.line);
    const sameLine = selection.from.line === selection.to.line;
    const selectedText = sameLine ? lineText.slice(selection.from.ch, selection.to.ch) : editor.getRange(selection.from, selection.to);
    const before = sameLine ? lineText.slice(0, selection.from.ch) : '';
    const after = sameLine ? lineText.slice(selection.to.ch) : '';
    const count = (text: string, token: string): number => text.split(token).length - 1;
    const enclosed = (delimiter: string): boolean =>
      (count(before, delimiter) % 2 === 1 && count(after, delimiter) % 2 === 1) ||
      (selectedText.startsWith(delimiter) && selectedText.endsWith(delimiter) && selectedText.length >= delimiter.length * 2);

    const beforeNoBold = before.replace(/\*\*/g, '');
    const afterNoBold = after.replace(/\*\*/g, '');
    const selectionNoBold = selectedText.replace(/\*\*/g, '');
    const hasHtmlTag = (
      openPattern: RegExp,
      closePattern: RegExp,
      beforeText = before,
      selected = selectedText
    ): boolean => {
      if (openPattern.test(selected) && closePattern.test(selected)) return true;
      const countOpen = (beforeText.match(openPattern) ?? []).length;
      const countClose = (beforeText.match(closePattern) ?? []).length;
      return countOpen > countClose;
    };

    const underlineRegion = sameLine ? this.findTagRegion(lineText, '<u>', '</u>', selection.from.ch, selection.to.ch, 'contain') : null;
    let isBold = enclosed('**') || hasHtmlTag(/<(?:b|strong)\b[^>]*>/i, /<\/(?:b|strong)>/i);
    let isItalic =
      ((count(beforeNoBold, '*') % 2 === 1 && count(afterNoBold, '*') % 2 === 1) ||
        (selectionNoBold.startsWith('*') && selectionNoBold.endsWith('*') && selectionNoBold.length >= 2)) ||
      hasHtmlTag(/<(?:i|em)\b[^>]*>/i, /<\/(?:i|em)>/i);
    let isUnderline =
      underlineRegion !== null ||
      this.countTag(before, '<u>') > this.countTag(before, '</u>') ||
      (selectedText.includes('<u>') && selectedText.includes('</u>')) ||
      hasHtmlTag(/<u\b[^>]*>/i, /<\/u>/i);
    let isStrikethrough = enclosed('~~') || hasHtmlTag(/<(?:s|strike|del)\b[^>]*>/i, /<\/(?:s|strike|del)>/i);
    let isHighlight = enclosed('==') || hasHtmlTag(/<mark\b[^>]*>/i, /<\/mark>/i);

    // `findAllInlineTypographyRegions` deliberately knows only about the
    // style container tags. Scan the container's inner text separately so
    // nested <b>/<i>/<u>/<s>/<mark> tags are visible to the toolbar too.
    if (sameLine) {
      const region = findInlineTypographyRegion(lineText, selection.from.ch, selection.to.ch);
      if (region) {
        const innerBefore = lineText.slice(region.openEnd, selection.from.ch);
        const innerSelected = lineText.slice(selection.from.ch, selection.to.ch);

        if (hasHtmlTag(/<(?:b|strong)\b[^>]*>/i, /<\/(?:b|strong)>/i, innerBefore, innerSelected)) isBold = true;
        if (hasHtmlTag(/<(?:i|em)\b[^>]*>/i, /<\/(?:i|em)>/i, innerBefore, innerSelected)) isItalic = true;
        if (hasHtmlTag(/<u\b[^>]*>/i, /<\/u>/i, innerBefore, innerSelected)) isUnderline = true;
        if (hasHtmlTag(/<(?:s|strike|del)\b[^>]*>/i, /<\/(?:s|strike|del)>/i, innerBefore, innerSelected)) isStrikethrough = true;
        if (hasHtmlTag(/<mark\b[^>]*>/i, /<\/mark>/i, innerBefore, innerSelected)) isHighlight = true;
      }
    }

    return {
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
      strikethrough: isStrikethrough,
      highlight: isHighlight,
    };
  }

  public async setDocumentFont(file: TFile, fontFamily: string): Promise<void> {
    await this.setDocumentAppearance(file, { fontFamily });
  }


  public async setDocumentAppearance(file: TFile, updates: Partial<DocumentAppearance>): Promise<void> {
    await this.app.fileManager.processFrontMatter(file, (frontmatter: unknown) => {
      const frontmatterRecord = frontmatter !== null && typeof frontmatter === 'object'
        ? frontmatter as Record<string, unknown>
        : {};
      this.writeFrontmatterValue(frontmatterRecord, DOCUMENT_FONT_KEY, updates, 'fontFamily');
      this.writeFrontmatterValue(frontmatterRecord, DOCUMENT_FONT_SIZE_KEY, updates, 'fontSize');
      this.writeFrontmatterValue(frontmatterRecord, DOCUMENT_LINE_HEIGHT_KEY, updates, 'lineHeight');
      this.writeFrontmatterValue(frontmatterRecord, DOCUMENT_ALIGNMENT_KEY, updates, 'alignment');
    });
  }

  private writeFrontmatterValue<K extends keyof DocumentAppearance>(
    frontmatter: Record<string, unknown>,
    key: string,
    updates: Partial<DocumentAppearance>,
    property: K
  ): void {
    if (!Object.prototype.hasOwnProperty.call(updates, property)) return;

    const value = updates[property];
    if (typeof value === 'string' && value.trim().length > 0) {
      frontmatter[key] = value.trim();
    } else {
      delete frontmatter[key];
    }
  }

  private findTypographyRegionForMark(
    lineText: string,
    fromCh: number,
    toCh: number,
    mark: InlineMark
  ): InlineTypographyRegion | null {
    const regions = findAllInlineTypographyRegions(lineText)
      .filter((region) => {
        const selectionIsInsideContent = fromCh >= region.openEnd && toCh <= region.close;
        const selectionIsExactlyWholeContainer = fromCh === region.open && toCh === region.closeEnd;
        return selectionIsInsideContent || selectionIsExactlyWholeContainer;
      })
      .sort((a, b) => a.closeEnd - a.open - (b.closeEnd - b.open));
    if (regions.length === 0) return null;

    // <mark> is both a typography container and the HTML representation of
    // highlight. When it is nested in a font span, target the font span so
    // toggling highlight can find and remove the inner <mark> tag.
    if (mark === 'highlight') {
      const nonHighlightContainer = regions.find(
        (region) => !/^<mark\b/i.test(lineText.slice(region.open, region.openEnd))
      );
      if (nonHighlightContainer) return nonHighlightContainer;
    }

    return regions[0];
  }

  private migrateLegacyMarkdownInsideTypography(
    editor: Editor,
    line: number,
    typographyRegion: InlineTypographyRegion,
    selection: EditorSelectionRange
  ): boolean {
    const lineText = editor.getLine(line);
    const innerText = lineText.slice(typographyRegion.openEnd, typographyRegion.close);
    const from = Math.max(0, selection.from.ch - typographyRegion.openEnd);
    const to = Math.min(innerText.length, Math.max(from, selection.to.ch - typographyRegion.openEnd));
    const envelope = this.getFormattingEnvelope(innerText, from, to);
    const marks = this.markdownMarksOnly(envelope.marks);
    if (marks.size === 0) return false;

    const legacySlice = innerText.slice(envelope.from, envelope.to);
    const replacement = this.applyHtmlMarkSet(this.unwrapMarkdownMarkSet(legacySlice, marks), marks);
    const selectedText = this.visibleInlineText(this.stripInlineMarks(innerText.slice(from, to)));
    const selectedStart = selectedText ? replacement.indexOf(selectedText) : 0;

    this.replaceAndSelect(
      editor,
      { line, ch: typographyRegion.openEnd + envelope.from },
      { line, ch: typographyRegion.openEnd + envelope.to },
      replacement,
      Math.max(0, selectedStart),
      Math.max(0, selectedStart) + selectedText.length
    );
    return true;
  }

  private migrateLegacyMarkdownAroundTypography(
    editor: Editor,
    line: number,
    typographyRegion: InlineTypographyRegion,
    selection: EditorSelectionRange
  ): boolean {
    const lineText = editor.getLine(line);
    const marks = new Set<InlineMark>();
    let rangeFrom = typographyRegion.open;
    let rangeTo = typographyRegion.closeEnd;
    let foundWrapper = true;

    while (foundWrapper) {
      foundWrapper = false;
      for (const mark of ['bold', 'strikethrough', 'highlight', 'italic'] as const) {
        const { pre, post } = MARK_DELIMS[mark];
        if (lineText.slice(rangeFrom - pre.length, rangeFrom) !== pre) continue;
        if (lineText.slice(rangeTo, rangeTo + post.length) !== post) continue;
        rangeFrom -= pre.length;
        rangeTo += post.length;
        marks.add(mark);
        foundWrapper = true;
        break;
      }
    }
    if (marks.size === 0) return false;

    const openTag = lineText.slice(typographyRegion.open, typographyRegion.openEnd);
    const innerText = lineText.slice(typographyRegion.openEnd, typographyRegion.close);
    const closeTag = lineText.slice(typographyRegion.close, typographyRegion.closeEnd);
    const canonicalInner = this.applyHtmlMarkSet(innerText, marks);
    const innerOffset = canonicalInner.indexOf(innerText);
    const selectedFrom = Math.min(innerText.length, Math.max(0, selection.from.ch - typographyRegion.openEnd));
    const selectedTo = Math.min(innerText.length, Math.max(selectedFrom, selection.to.ch - typographyRegion.openEnd));
    const replacement = `${openTag}${canonicalInner}${closeTag}`;

    this.replaceAndSelect(
      editor,
      { line, ch: rangeFrom },
      { line, ch: rangeTo },
      replacement,
      openTag.length + Math.max(0, innerOffset) + selectedFrom,
      openTag.length + Math.max(0, innerOffset) + selectedTo
    );
    return true;
  }

  private markdownMarksOnly(marks: ReadonlySet<InlineMark>): Set<Exclude<InlineMark, 'underline'>> {
    const markdownMarks = new Set<Exclude<InlineMark, 'underline'>>();
    for (const mark of ['bold', 'italic', 'strikethrough', 'highlight'] as const) {
      if (marks.has(mark)) markdownMarks.add(mark);
    }
    return markdownMarks;
  }

  private unwrapMarkdownMarkSet(text: string, marks: ReadonlySet<Exclude<InlineMark, 'underline'>>): string {
    let result = text;
    for (const mark of ['bold', 'strikethrough', 'highlight', 'italic'] as const) {
      if (!marks.has(mark)) continue;
      const { pre, post } = MARK_DELIMS[mark];
      if (result.startsWith(pre) && result.endsWith(post) && result.length >= pre.length + post.length) {
        result = result.slice(pre.length, result.length - post.length);
      }
    }
    return result;
  }

  private applyHtmlMarkSet(text: string, marks: ReadonlySet<InlineMark>): string {
    let result = text;
    for (const mark of ['italic', 'bold', 'underline', 'strikethrough', 'highlight'] as const) {
      if (!marks.has(mark)) continue;
      const definition = HTML_MARKS[mark];
      result = `${definition.open}${result}${definition.close}`;
    }
    return result;
  }

  private toggleMarkAcrossTypographySelection(
    editor: Editor,
    selection: EditorSelectionRange,
    mark: InlineMark,
    removeMark: boolean
  ): boolean {
    if (selection.from.line !== selection.to.line) return false;

    const line = selection.from.line;
    const lineText = editor.getLine(line);
    const regions = findAllInlineTypographyRegions(lineText)
      .filter((region) => selection.from.ch <= region.open && selection.to.ch >= region.closeEnd)
      .sort((a, b) => a.open - b.open);
    if (regions.length === 0) return false;

    const definition = HTML_MARKS[mark];
    const stripTargetMark = (text: string): string => {
      const tagPattern = new RegExp(`</?(?:${definition.names.join('|')})\\b[^>]*>`, 'gi');
      let result = text.replace(tagPattern, '');
      if (mark !== 'underline') {
        const { pre } = MARK_DELIMS[mark];
        result = result.split(pre).join('');
      }
      return result;
    };
    const transform = (text: string): string => (removeMark ? stripTargetMark(text) : `${definition.open}${text}${definition.close}`);

    let cursor = selection.from.ch;
    let replacement = '';
    for (const region of regions) {
      replacement += transform(lineText.slice(cursor, region.open));
      const openTag = lineText.slice(region.open, region.openEnd);
      const content = lineText.slice(region.openEnd, region.close);
      const closeTag = lineText.slice(region.close, region.closeEnd);
      replacement += `${openTag}${transform(content)}${closeTag}`;
      cursor = region.closeEnd;
    }
    replacement += transform(lineText.slice(cursor, selection.to.ch));

    this.replaceAndSelect(
      editor,
      { line, ch: selection.from.ch },
      { line, ch: selection.to.ch },
      replacement,
      0,
      replacement.length
    );
    return true;
  }

  private toggleMarkInsideTypography(
    editor: Editor,
    line: number,
    typographyRegion: {
      openEnd: number;
      close: number;
    },
    selectionFrom: number,
    selectionTo: number,
    mark: InlineMark,
    isActive: boolean,
    isCursorEmpty: boolean,
    initialCh: number
  ): void {
    const lineText = editor.getLine(line);
    const innerStart = typographyRegion.openEnd;
    const innerEnd = typographyRegion.close;
    const innerText = lineText.slice(innerStart, innerEnd);
    const from = Math.min(Math.max(selectionFrom - innerStart, 0), innerText.length);
    const to = Math.min(Math.max(selectionTo - innerStart, from), innerText.length);
    const definition = HTML_MARKS[mark];

    // Prefer an existing HTML wrapper. This also handles aliases such as
    // <strong>, <em>, <strike>, and <del> without converting unrelated markup.
    const htmlRegion = this.findHtmlMarkRegion(innerText, definition.names, from, to);
    if (htmlRegion) {
      this.replaceInlineMarkRegion(
        editor,
        line,
        innerStart,
        innerText,
        htmlRegion,
        from,
        to,
        isCursorEmpty,
        initialCh
      );
      return;
    }

    // Older notes may already contain Markdown markers inside the typography
    // container. Remove/split those markers in place instead of moving them
    // outside the container.
    const markdown = mark === 'underline' ? null : MARK_DELIMS[mark];
    const markdownRegion = markdown ? this.findMarkRegion(innerText, markdown.pre, from, to, 'contain') : null;
    if (markdownRegion && markdown) {
      this.replaceInlineMarkRegion(
        editor,
        line,
        innerStart,
        innerText,
        {
          open: markdownRegion.open,
          openEnd: markdownRegion.open + markdown.pre.length,
          close: markdownRegion.close,
          closeEnd: markdownRegion.close + markdown.post.length,
          openTag: markdown.pre,
          closeTag: markdown.post,
        },
        from,
        to,
        isCursorEmpty,
        initialCh
      );
      return;
    }

    if (isActive) {
      // This is a defensive fallback for a selection that includes the
      // wrapper itself rather than only its content.
      let unwrapped = innerText.slice(from, to);
      const htmlPattern = new RegExp(`</?(?:${definition.names.join('|')})\\b[^>]*>`, 'gi');
      unwrapped = unwrapped.replace(htmlPattern, '');
      if (markdown && unwrapped === innerText.slice(from, to)) {
        if (unwrapped.startsWith(markdown.pre) && unwrapped.endsWith(markdown.post)) {
          unwrapped = unwrapped.slice(markdown.pre.length, unwrapped.length - markdown.post.length);
        }
      }
      if (unwrapped !== innerText.slice(from, to)) {
        const cursorOffset = isCursorEmpty
          ? Math.max(0, Math.min(initialCh - (innerStart + from), unwrapped.length))
          : undefined;
        this.replaceAndSelect(
          editor,
          { line, ch: innerStart + from },
          { line, ch: innerStart + to },
          unwrapped,
          0,
          unwrapped.length,
          cursorOffset
        );
      }
      return;
    }

    const selected = innerText.slice(from, to);
    const replacement = `${definition.open}${selected}${definition.close}`;
    const cursorOffset = isCursorEmpty
      ? definition.open.length + Math.max(0, Math.min(initialCh - (innerStart + from), selected.length))
      : undefined;
    this.replaceAndSelect(
      editor,
      { line, ch: innerStart + from },
      { line, ch: innerStart + to },
      replacement,
      definition.open.length,
      definition.open.length + selected.length,
      cursorOffset
    );
  }

  private replaceInlineMarkRegion(
    editor: Editor,
    line: number,
    innerStart: number,
    innerText: string,
    region: HtmlMarkRegion,
    selectionFrom: number,
    selectionTo: number,
    isCursorEmpty: boolean,
    initialCh: number
  ): void {
    const from = Math.min(Math.max(selectionFrom, region.openEnd), region.close);
    const to = Math.min(Math.max(selectionTo, from), region.close);
    const fullContent = innerText.slice(region.openEnd, region.close);
    const selected = innerText.slice(from, to);

    if (this.visibleInlineText(fullContent) === this.visibleInlineText(selected)) {
      const selectionStart = from - region.openEnd;
      const selectionEnd = to - region.openEnd;
      const cursorOffset = isCursorEmpty
        ? selectionStart + Math.max(0, Math.min(initialCh - (innerStart + from), selected.length))
        : undefined;
      this.replaceAndSelect(
        editor,
        { line, ch: innerStart + region.open },
        { line, ch: innerStart + region.closeEnd },
        fullContent,
        selectionStart,
        selectionEnd,
        cursorOffset
      );
      return;
    }

    const contentFrom = from - region.openEnd;
    const contentTo = to - region.openEnd;
    const leftFragment = this.balancedHtmlFragment(fullContent, 0, contentFrom);
    const selectedFragment = this.balancedHtmlFragment(fullContent, contentFrom, contentTo);
    const rightFragment = this.balancedHtmlFragment(fullContent, contentTo, fullContent.length);
    const left = this.wrapHtmlMarkSide(leftFragment.text, region.openTag, region.closeTag);
    const right = this.wrapHtmlMarkSide(rightFragment.text, region.openTag, region.closeTag);
    const replacement = left + selectedFragment.text + right;
    const selectionStart = left.length + selectedFragment.contentStart;
    const selectionEnd = left.length + selectedFragment.contentEnd;
    const cursorOffset = isCursorEmpty
      ? selectionStart + Math.max(0, Math.min(initialCh - (innerStart + from), selected.length))
      : undefined;

    this.replaceAndSelect(
      editor,
      { line, ch: innerStart + region.open },
      { line, ch: innerStart + region.closeEnd },
      replacement,
      selectionStart,
      selectionEnd,
      cursorOffset
    );
  }

  private wrapHtmlMarkSide(part: string, openTag: string, closeTag: string): string {
    const visibleText = this.visibleInlineText(part);
    if (visibleText.length === 0) return '';
    if (!visibleText.trim()) return visibleText;
    return `${openTag}${part}${closeTag}`;
  }

  private visibleInlineText(text: string): string {
    return text.replace(/<[^>]+>/g, '');
  }

  private balancedHtmlFragment(
    text: string,
    rawFrom: number,
    rawTo: number
  ): { text: string; contentStart: number; contentEnd: number } {
    const from = Math.max(0, Math.min(rawFrom, text.length));
    const to = Math.max(from, Math.min(rawTo, text.length));
    const stack: HtmlTagStackEntry[] = [];
    const tagPattern = /<\/?([a-z][a-z0-9-]*)(?:\s[^>]*)?>/gi;
    let match: RegExpExecArray | null;

    while ((match = tagPattern.exec(text)) !== null) {
      if (match.index + match[0].length > from) break;
      this.updateHtmlTagStack(stack, match[0], match[1].toLowerCase());
    }

    const prefix = stack.map((entry) => entry.openTag).join('');
    const rawContent = text.slice(from, to);
    tagPattern.lastIndex = 0;
    while ((match = tagPattern.exec(rawContent)) !== null) {
      this.updateHtmlTagStack(stack, match[0], match[1].toLowerCase());
    }

    const suffix = [...stack]
      .reverse()
      .map((entry) => `</${entry.name}>`)
      .join('');
    return {
      text: prefix + rawContent + suffix,
      contentStart: prefix.length,
      contentEnd: prefix.length + rawContent.length,
    };
  }

  private updateHtmlTagStack(stack: HtmlTagStackEntry[], tag: string, name: string): void {
    if (/^<\//.test(tag)) {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index].name === name) {
          stack.splice(index, 1);
          break;
        }
      }
      return;
    }
    if (!/\/\s*>$/.test(tag)) stack.push({ name, openTag: tag });
  }

  private findHtmlMarkRegion(text: string, names: string[], fromCh: number, toCh: number): HtmlMarkRegion | null {
    const acceptedNames = new Set(names);
    const stack: Array<{ name: string; open: number; openEnd: number; openTag: string }> = [];
    const regions: HtmlMarkRegion[] = [];
    const tagPattern = /<\/?([a-z][a-z0-9-]*)(?:\s[^>]*)?>/gi;
    let match: RegExpExecArray | null;

    while ((match = tagPattern.exec(text)) !== null) {
      const tag = match[0];
      const name = match[1].toLowerCase();
      if (/^<\//.test(tag)) {
        let openingIndex = -1;
        for (let index = stack.length - 1; index >= 0; index -= 1) {
          if (stack[index].name === name) {
            openingIndex = index;
            break;
          }
        }
        if (openingIndex === -1) continue;
        const [opening] = stack.splice(openingIndex, 1);
        if (opening && acceptedNames.has(name)) {
          regions.push({
            open: opening.open,
            openEnd: opening.openEnd,
            close: match.index,
            closeEnd: match.index + tag.length,
            openTag: opening.openTag,
            closeTag: tag,
          });
        }
        continue;
      }

      stack.push({ name, open: match.index, openEnd: match.index + tag.length, openTag: tag });
    }

    return (
      regions
        .filter((region) => {
          const selectionIsInsideContent = fromCh >= region.openEnd && toCh <= region.close;
          const selectionIncludesWholeMark = fromCh <= region.open && toCh >= region.closeEnd;
          return selectionIsInsideContent || selectionIncludesWholeMark;
        })
        .sort((a, b) => a.closeEnd - a.open - (b.closeEnd - b.open))[0] ?? null
    );
  }

  private toggleUnderline(editor: Editor): void {
    const rawFrom = editor.getCursor('from');
    const rawTo = editor.getCursor('to');
    const isCursorEmpty = rawFrom.line === rawTo.line && rawFrom.ch === rawTo.ch;
    const initialCh = rawFrom.ch;
    const isActive = this.getFormatsAt(editor).underline;
    const selection = this.expandedSelection(editor);
    const openTag = '<u>';
    const closeTag = '</u>';

    if (selection.from.line !== selection.to.line) {
      this.toggleWrapperAcrossLines(editor, selection, { pre: openTag, post: closeTag }, true);
      return;
    }

    const clamped = clampSegmentToBlockContent(
      editor.getLine(selection.from.line),
      selection.from.ch,
      selection.to.ch
    );
    if (clamped.toCh <= clamped.fromCh) return;
    const formatSelection: EditorSelectionRange = {
      from: { line: selection.from.line, ch: clamped.fromCh },
      to: { line: selection.to.line, ch: clamped.toCh },
    };
    const text = editor.getRange(formatSelection.from, formatSelection.to);
    const textWithoutLeadingControls = stripLeadingDirectionControls(text);
    const leadingControlLength = text.length - textWithoutLeadingControls.length;

    if (
      isActive &&
      textWithoutLeadingControls.startsWith(openTag) &&
      textWithoutLeadingControls.endsWith(closeTag) &&
      textWithoutLeadingControls.length >= openTag.length + closeTag.length
    ) {
      const unwrapped = textWithoutLeadingControls.slice(openTag.length, textWithoutLeadingControls.length - closeTag.length);
      const cursorOffset = isCursorEmpty
        ? Math.max(0, Math.min(
          initialCh - formatSelection.from.ch - leadingControlLength - openTag.length,
          unwrapped.length
        ))
        : undefined;
      this.replaceAndSelect(editor, formatSelection.from, formatSelection.to, unwrapped, 0, unwrapped.length, cursorOffset);
      return;
    }

    const before = editor.getRange(
      { line: formatSelection.from.line, ch: Math.max(0, formatSelection.from.ch - openTag.length) },
      formatSelection.from
    );
    const after = editor.getRange(formatSelection.to, {
      line: formatSelection.to.line,
      ch: formatSelection.to.ch + closeTag.length,
    });

    if (isActive && before === openTag && after === closeTag) {
      const cursorOffset = isCursorEmpty
        ? Math.max(0, Math.min(initialCh - formatSelection.from.ch, text.length))
        : undefined;
      this.replaceAndSelect(
        editor,
        { line: formatSelection.from.line, ch: formatSelection.from.ch - openTag.length },
        { line: formatSelection.to.line, ch: formatSelection.to.ch + closeTag.length },
        text,
        0,
        text.length,
        cursorOffset
      );
      return;
    }

    if (isActive && selection.from.line === selection.to.line) {
      const lineText = editor.getLine(selection.from.line);
      const region = this.findTagRegion(
        lineText,
        openTag,
        closeTag,
        formatSelection.from.ch,
        formatSelection.to.ch,
        'contain'
      );
      if (region) {
        this.splitTagRegion(
          editor,
          selection.from.line,
          region,
          openTag,
          closeTag,
          formatSelection.from.ch,
          formatSelection.to.ch,
          (value) => value
        );
        return;
      }
    }

    const replacement = `${openTag}${text}${closeTag}`;
    const cursorOffset = isCursorEmpty
      ? openTag.length + Math.max(0, Math.min(initialCh - formatSelection.from.ch, text.length))
      : undefined;
    this.replaceAndSelect(
      editor,
      formatSelection.from,
      formatSelection.to,
      replacement,
      openTag.length,
      openTag.length + text.length,
      cursorOffset
    );
  }

  /**
   * Adds or removes a wrapper independently on every selected line. This is
   * used for underline and Markdown marks so no wrapper can cross a newline.
   */
  private toggleWrapperAcrossLines(
    editor: Editor,
    selection: EditorSelectionRange,
    wrapper: { pre: string; post: string },
    isHtml: boolean
  ): void {
    const startLine = Math.min(selection.from.line, selection.to.line);
    const endLine = Math.max(selection.from.line, selection.to.line);
    const segments: Array<{ line: number; fromCh: number; toCh: number }> = [];

    for (let line = startLine; line <= endLine; line += 1) {
      const lineText = editor.getLine(line);
      if (!lineText.trim()) continue;

      let fromCh = 0;
      let toCh = lineText.length;
      if (line === selection.from.line && line === selection.to.line) {
        fromCh = Math.min(selection.from.ch, selection.to.ch);
        toCh = Math.max(selection.from.ch, selection.to.ch);
      } else if (line === selection.from.line) {
        fromCh = selection.from.ch;
      } else if (line === selection.to.line) {
        toCh = selection.to.ch;
      }

      const clamped = clampSegmentToBlockContent(lineText, fromCh, toCh);
      fromCh = clamped.fromCh;
      toCh = clamped.toCh;
      if (toCh > fromCh) segments.push({ line, fromCh, toCh });
    }
    if (segments.length === 0) return;

    const normalizedSelected = (lineText: string, fromCh: number, toCh: number): string =>
      stripLeadingDirectionControls(lineText.slice(fromCh, toCh));

    const hasWrap = (lineText: string, fromCh: number, toCh: number): boolean => {
      const selected = normalizedSelected(lineText, fromCh, toCh);
      const beforeOpen = lineText.slice(Math.max(0, fromCh - wrapper.pre.length), fromCh) === wrapper.pre;
      const afterClose = lineText.slice(toCh, Math.min(lineText.length, toCh + wrapper.post.length)) === wrapper.post;
      if (
        selected.startsWith(wrapper.pre) &&
        selected.endsWith(wrapper.post) &&
        selected.length >= wrapper.pre.length + wrapper.post.length
      ) {
        return true;
      }
      return (
        (beforeOpen && (selected.endsWith(wrapper.post) || afterClose)) ||
        (selected.startsWith(wrapper.pre) && afterClose)
      );
    };

    const removeEverywhere = segments.every((segment) =>
      hasWrap(editor.getLine(segment.line), segment.fromCh, segment.toCh)
    );
    const plans: Array<{
      line: number;
      replaceFrom: number;
      replaceTo: number;
      replacement: string;
      sourceFrom: number;
      sourceTo: number;
      selectionStart: number;
      selectionEnd: number;
    }> = [];

    for (const segment of segments) {
      const lineText = editor.getLine(segment.line);
      const selected = lineText.slice(segment.fromCh, segment.toCh);
      const cleanSelected = normalizedSelected(lineText, segment.fromCh, segment.toCh);
      const selectedLeadingMarkup = selected.length - cleanSelected.length;

      if (removeEverywhere) {
        if (
          cleanSelected.startsWith(wrapper.pre) &&
          cleanSelected.endsWith(wrapper.post) &&
          cleanSelected.length >= wrapper.pre.length + wrapper.post.length
        ) {
          const replacement = cleanSelected.slice(wrapper.pre.length, cleanSelected.length - wrapper.post.length);
          plans.push({
            line: segment.line,
            replaceFrom: segment.fromCh,
            replaceTo: segment.toCh,
            replacement,
            sourceFrom: segment.fromCh,
            sourceTo: segment.toCh,
            selectionStart: segment.fromCh,
            selectionEnd: segment.fromCh + replacement.length,
          });
          continue;
        }

        const beforeStart = Math.max(0, segment.fromCh - wrapper.pre.length);
        const afterEnd = Math.min(lineText.length, segment.toCh + wrapper.post.length);
        const beforeOpen = lineText.slice(beforeStart, segment.fromCh) === wrapper.pre;
        const afterClose = lineText.slice(segment.toCh, afterEnd) === wrapper.post;
        const surrounds =
          beforeOpen && afterClose;
        const replaceFrom = isHtml
          ? getLeadingDirectionControlStart(lineText, beforeStart)
          : beforeStart;

        if (beforeOpen && cleanSelected.endsWith(wrapper.post)) {
          const replacement = cleanSelected.slice(0, cleanSelected.length - wrapper.post.length);
          plans.push({
            line: segment.line,
            replaceFrom,
            replaceTo: segment.toCh,
            replacement,
            sourceFrom: segment.fromCh,
            sourceTo: segment.toCh,
            selectionStart: replaceFrom,
            selectionEnd: replaceFrom + replacement.length,
          });
          continue;
        }

        if (cleanSelected.startsWith(wrapper.pre) && afterClose) {
          const replacement = cleanSelected.slice(wrapper.pre.length);
          plans.push({
            line: segment.line,
            replaceFrom: segment.fromCh,
            replaceTo: afterEnd,
            replacement,
            sourceFrom: segment.fromCh,
            sourceTo: segment.toCh,
            selectionStart: segment.fromCh,
            selectionEnd: segment.fromCh + replacement.length,
          });
          continue;
        }

        plans.push({
          line: segment.line,
          replaceFrom: surrounds ? replaceFrom : segment.fromCh,
          replaceTo: surrounds ? afterEnd : segment.toCh,
          replacement: cleanSelected,
          sourceFrom: segment.fromCh,
          sourceTo: segment.toCh,
          selectionStart: surrounds ? replaceFrom : segment.fromCh + selectedLeadingMarkup,
          selectionEnd: surrounds
            ? replaceFrom + cleanSelected.length
            : segment.fromCh + selectedLeadingMarkup + cleanSelected.length,
        });
        continue;
      }

      if (hasWrap(lineText, segment.fromCh, segment.toCh)) continue;
      const selectedForWrapper = cleanSelected;
      const replacement = `${wrapper.pre}${selectedForWrapper}${wrapper.post}`;
      plans.push({
        line: segment.line,
        replaceFrom: segment.fromCh,
        replaceTo: segment.toCh,
        replacement,
        sourceFrom: segment.fromCh,
        sourceTo: segment.toCh,
        selectionStart: segment.fromCh + wrapper.pre.length,
        selectionEnd: segment.fromCh + wrapper.pre.length + selectedForWrapper.length,
      });
    }

    const changes = new Map<number, (typeof plans)[number]>();
    for (const plan of plans) {
      editor.replaceRange(
        plan.replacement,
        { line: plan.line, ch: plan.replaceFrom },
        { line: plan.line, ch: plan.replaceTo }
      );
      changes.set(plan.line, plan);
    }

    const mapEndpoint = (position: EditorPosition, endpoint: 'from' | 'to'): EditorPosition => {
      const change = changes.get(position.line);
      if (!change) return { ...position };
      const delta = change.replacement.length - (change.replaceTo - change.replaceFrom);
      if (position.ch < change.sourceFrom) return { ...position };
      if (position.ch > change.sourceTo) {
        return { line: position.line, ch: Math.max(0, position.ch + delta) };
      }
      if (endpoint === 'from' && position.ch === change.sourceFrom) {
        return { line: position.line, ch: change.selectionStart };
      }
      if (endpoint === 'to' && position.ch === change.sourceTo) {
        return { line: position.line, ch: change.selectionEnd };
      }
      const sourceLength = Math.max(1, change.sourceTo - change.sourceFrom);
      const outputLength = Math.max(0, change.selectionEnd - change.selectionStart);
      const offset = Math.max(0, Math.min(position.ch - change.sourceFrom, sourceLength));
      return {
        line: position.line,
        ch: change.selectionStart + Math.min(outputLength, Math.round((offset / sourceLength) * outputLength)),
      };
    };
    const from = mapEndpoint(selection.from, 'from');
    const to = mapEndpoint(selection.to, 'to');
    if (from.line === to.line && from.ch === to.ch) editor.setCursor(from);
    else editor.setSelection(from, to);
    this.restoreEditorFocus(editor);
  }


  private toggleLinePrefix(editor: Editor, pattern: RegExp, prefix: string): void {
    const { startLine, endLine } = this.getSelectedLineRange(editor);
    const lines = this.getLines(editor, startLine, endLine);
    const everyLineHasPrefix = lines.every((line) => line.trim() === '' || pattern.test(line));
    const updated = lines.map((line) => {
      if (line.trim() === '') return line;
      return everyLineHasPrefix ? line.replace(pattern, '') : `${prefix}${line}`;
    });
    this.replaceLines(editor, startLine, endLine, updated);
  }

  private getSelectedLineRange(editor: Editor): { startLine: number; endLine: number } {
    const from = editor.getCursor('from');
    const to = editor.getCursor('to');
    return {
      startLine: Math.min(from.line, to.line),
      endLine: Math.max(from.line, to.line),
    };
  }

  private getLines(editor: Editor, startLine: number, endLine: number): string[] {
    const lines: string[] = [];
    for (let line = startLine; line <= endLine; line += 1) {
      lines.push(editor.getLine(line));
    }
    return lines;
  }

  private replaceLines(editor: Editor, startLine: number, endLine: number, lines: string[]): void {
    editor.replaceRange(
      lines.join('\n'),
      { line: startLine, ch: 0 },
      { line: endLine, ch: editor.getLine(endLine).length }
    );
  }

  private countTag(text: string, tag: string): number {
    return text.split(tag).length - 1;
  }

  private getFormattingEnvelope(
    text: string,
    fromCh: number,
    toCh: number
  ): { from: number; to: number; marks: Set<InlineMark> } {
    const wrappers: Array<{ mark: InlineMark; pre: string; post: string }> = [
      { mark: 'bold', pre: '**', post: '**' },
      { mark: 'strikethrough', pre: '~~', post: '~~' },
      { mark: 'highlight', pre: '==', post: '==' },
      { mark: 'italic', pre: '*', post: '*' },
      { mark: 'underline', pre: '<u>', post: '</u>' },
    ];
    const marks = new Set<InlineMark>();
    let from = fromCh;
    let to = toCh;
    let expanded = true;

    while (expanded) {
      expanded = false;
      for (const wrapper of wrappers) {
        if (marks.has(wrapper.mark) || from < wrapper.pre.length) continue;
        if (text.slice(from - wrapper.pre.length, from) !== wrapper.pre) continue;
        if (text.slice(to, to + wrapper.post.length) !== wrapper.post) continue;
        from -= wrapper.pre.length;
        to += wrapper.post.length;
        marks.add(wrapper.mark);
        expanded = true;
        break;
      }
    }

    return { from, to, marks };
  }

  private applyMarkSet(text: string, marks: Set<InlineMark>): { text: string; contentOffset: number } {
    const wrappers: Array<{ mark: InlineMark; pre: string; post: string }> = [
      { mark: 'italic', pre: '*', post: '*' },
      { mark: 'bold', pre: '**', post: '**' },
      { mark: 'strikethrough', pre: '~~', post: '~~' },
      { mark: 'highlight', pre: '==', post: '==' },
      { mark: 'underline', pre: '<u>', post: '</u>' },
    ];
    let formatted = text;
    let contentOffset = 0;

    for (const wrapper of wrappers) {
      if (!marks.has(wrapper.mark)) continue;
      formatted = `${wrapper.pre}${formatted}${wrapper.post}`;
      contentOffset += wrapper.pre.length;
    }

    return { text: formatted, contentOffset };
  }

  private findMarkRegion(
    text: string,
    delimiter: string,
    fromCh: number,
    toCh: number,
    mode: 'contain' | 'overlap'
  ): { open: number; close: number } | null {
    const positions: number[] = [];
    const delimiterChar = delimiter[0];

    for (let index = 0; index < text.length; index += 1) {
      if (text[index] !== delimiterChar) continue;
      if (index > 0 && text[index - 1] === '\\') continue;

      let runEnd = index;
      while (runEnd + 1 < text.length && text[runEnd + 1] === delimiterChar) {
        runEnd += 1;
      }

      if (runEnd - index + 1 === delimiter.length) {
        positions.push(index);
      }
      index = runEnd;
    }

    for (let position = 0; position + 1 < positions.length; position += 2) {
      const open = positions[position];
      const close = positions[position + 1];
      const innerStart = open + delimiter.length;
      const matches =
        mode === 'contain'
          ? fromCh >= innerStart && toCh <= close
          : fromCh < close && toCh > innerStart;

      if (matches) {
        return { open, close };
      }
    }

    return null;
  }

  private splitMarkRegion(
    editor: Editor,
    line: number,
    region: { open: number; close: number },
    delimiter: { pre: string; post: string },
    selectionFrom: number,
    selectionTo: number,
    transform: (selected: string) => string
  ): void {
    const lineText = editor.getLine(line);
    const innerStart = region.open + delimiter.pre.length;
    const innerEnd = region.close;
    const from = Math.min(Math.max(selectionFrom, innerStart), innerEnd);
    const to = Math.min(Math.max(selectionTo, innerStart), innerEnd);
    const side = (part: string): string => {
      const leadingWhitespace = part.match(/^\s*/)?.[0] ?? '';
      if (leadingWhitespace.length === part.length) return part;
      const trailingWhitespace = part.slice(leadingWhitespace.length).match(/\s*$/)?.[0] ?? '';
      const core = part.slice(leadingWhitespace.length, part.length - trailingWhitespace.length);
      return `${leadingWhitespace}${delimiter.pre}${core}${delimiter.post}${trailingWhitespace}`;
    };

    const left = side(lineText.slice(innerStart, from));
    const selected = transform(lineText.slice(from, to));
    const right = side(lineText.slice(to, innerEnd));
    this.replaceAndSelect(
      editor,
      { line, ch: region.open },
      { line, ch: region.close + delimiter.post.length },
      left + selected + right,
      left.length,
      left.length + selected.length
    );
  }

  private findTagRegion(
    text: string,
    openTag: string,
    closeTag: string,
    fromCh: number,
    toCh: number,
    mode: 'contain' | 'overlap'
  ): { open: number; close: number; innerStart: number; innerEnd: number } | null {
    let searchFrom = 0;

    while (searchFrom < text.length) {
      const open = text.indexOf(openTag, searchFrom);
      if (open === -1) return null;

      const innerStart = open + openTag.length;
      const close = text.indexOf(closeTag, innerStart);
      if (close === -1) return null;

      const innerEnd = close;
      const matches =
        mode === 'contain'
          ? fromCh >= innerStart && toCh <= innerEnd
          : fromCh < innerEnd && toCh > innerStart;

      if (matches) {
        return { open, close, innerStart, innerEnd };
      }

      searchFrom = close + closeTag.length;
    }

    return null;
  }

  private splitTagRegion(
    editor: Editor,
    line: number,
    region: { open: number; close: number; innerStart: number; innerEnd: number },
    openTag: string,
    closeTag: string,
    selectionFrom: number,
    selectionTo: number,
    transform: (selected: string) => string
  ): void {
    const lineText = editor.getLine(line);
    const from = Math.min(Math.max(selectionFrom, region.innerStart), region.innerEnd);
    const to = Math.min(Math.max(selectionTo, region.innerStart), region.innerEnd);
    const side = (part: string): string => {
      if (!part.trim()) return part;
      return `${openTag}${part}${closeTag}`;
    };

    const left = side(lineText.slice(region.innerStart, from));
    const selected = transform(lineText.slice(from, to));
    const right = side(lineText.slice(to, region.innerEnd));
    this.replaceAndSelect(
      editor,
      { line, ch: region.open },
      { line, ch: region.close + closeTag.length },
      left + selected + right,
      left.length,
      left.length + selected.length
    );
  }

  private stripInlineMarks(text: string): string {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      .replace(/==([^=]+)==/g, '$1')
      .replace(/(^|[^*\\])\*([^*]+)\*(?!\*)/g, '$1$2')
      .replace(/<u>(.*?)<\/u>/gi, '$1')
      .replace(/<\/?u\s*>/gi, '')
      .replace(/<(?:mark|span|font)\b[^>]*>/gi, '')
      .replace(/<\/(?:mark|span|font)\s*>/gi, '');
  }

  private hasText(editor: Editor, selection: EditorSelectionRange): boolean {
    return editor.getRange(selection.from, selection.to).length > 0;
  }

  private replaceAndSelect(
    editor: Editor,
    replaceFrom: EditorPosition,
    replaceTo: EditorPosition,
    replacement: string,
    selectionStart: number,
    selectionEnd: number,
    cursorOffset?: number,
    restoreSelection = true
  ): void {
    editor.replaceRange(replacement, replaceFrom, replaceTo);
    if (!restoreSelection) return;
    if (cursorOffset !== undefined) {
      const cursor = this.positionAtOffset(replaceFrom, replacement, cursorOffset);
      editor.setCursor(cursor);
      this.restoreEditorFocus(editor);
      return;
    }
    const start = this.positionAtOffset(replaceFrom, replacement, selectionStart);
    const end = this.positionAtOffset(replaceFrom, replacement, selectionEnd);
    if (start.line === end.line && start.ch === end.ch) {
      editor.setCursor(start);
    } else {
      editor.setSelection(start, end);
    }
    this.restoreEditorFocus(editor);
  }

  /**
   * Formatting can be initiated from a modal or popover, which temporarily
   * owns focus. Restore the editor after changing its selection so the native
   * CodeMirror caret remains visible at positions outside the styled range.
   * The optional runtime check keeps this helper compatible with lightweight
   * editor doubles used by integrations and tests.
   */
  public restoreEditorFocus(editor: Editor): void {
    const focusable = editor as Editor & { focus?: () => void; hasFocus?: () => boolean };
    const focus = focusable.focus;
    if (typeof focus !== 'function') return;

    const hadFocus = typeof focusable.hasFocus === 'function' ? focusable.hasFocus.call(editor) : false;
    focus.call(editor);

    // A modal/popover can restore its own focus after the formatting callback
    // returns. If the editor was blurred when formatting started, perform one
    // deferred check after that overlay has closed. This is deliberately not
    // a repeating timer and never steals focus from an already-focused editor.
    if (!hadFocus) {
      const schedule = typeof window !== 'undefined' ? window.setTimeout : setTimeout;
      schedule(() => {
        if (typeof focusable.hasFocus === 'function' && focusable.hasFocus.call(editor)) return;
        focus.call(editor);
      }, 0);
    }
  }

  private positionAtOffset(start: EditorPosition, text: string, offset: number): EditorPosition {
    const prefix = text.slice(0, Math.max(0, Math.min(offset, text.length)));
    const lines = prefix.split('\n');
    if (lines.length === 1) {
      return { line: start.line, ch: start.ch + prefix.length };
    }
    return { line: start.line + lines.length - 1, ch: lines[lines.length - 1].length };
  }

  private expandedSelection(editor: Editor): EditorSelectionRange {
    let from = editor.getCursor('from');
    let to = editor.getCursor('to');

    if (from.line > to.line || (from.line === to.line && from.ch > to.ch)) {
      [from, to] = [to, from];
    }

    if (from.line === to.line && from.ch === to.ch) {
      const word = editor.wordAt(from);
      if (word) {
        from = word.from;
        to = word.to;
      }
    } else if (from.line === to.line && from.ch !== to.ch) {
      // Trim accidental leading or trailing whitespace so tags wrap strictly around words
      const lineText = editor.getLine(from.line);
      let startCh = Math.min(from.ch, to.ch);
      let endCh = Math.max(from.ch, to.ch);
      while (startCh < endCh && /\s/.test(lineText[startCh])) {
        startCh += 1;
      }
      while (endCh > startCh && /\s/.test(lineText[endCh - 1])) {
        endCh -= 1;
      }
      if (startCh < endCh) {
        from = { line: from.line, ch: startCh };
        to = { line: to.line, ch: endCh };
      }
    }

    return { from, to };
  }

  public requireFile(file: TFile | null): TFile | null {
    if (file) return file;
    new Notice('Open a Markdown note first.');
    return null;
  }
}
