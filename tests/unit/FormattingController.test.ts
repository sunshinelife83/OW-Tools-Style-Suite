import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Editor, EditorPosition } from 'obsidian';
import { FormattingController } from '../../src/editor/FormattingController.js';

class FakeEditor {
  private lines: string[];
  private from: EditorPosition = { line: 0, ch: 0 };
  private to: EditorPosition = { line: 0, ch: 0 };
  private focused = true;

  constructor(content: string) {
    this.lines = content.split('\n');
  }

  public setSelection(from: EditorPosition, to?: EditorPosition): void {
    this.from = from;
    this.to = to ?? from;
  }

  public getCursor(which?: string): EditorPosition {
    if (which === 'from') return this.from;
    if (which === 'to') return this.to;
    return this.to;
  }

  public setCursor(position: EditorPosition): void {
    this.from = position;
    this.to = position;
  }

  public focus(): void {
    this.focused = true;
  }

  public hasFocus(): boolean {
    return this.focused;
  }

  public blur(): void {
    this.focused = false;
  }

  public getLine(line: number): string {
    return this.lines[line] ?? '';
  }

  public lastLine(): number {
    return this.lines.length - 1;
  }

  public getValue(): string {
    return this.lines.join('\n');
  }

  public getRange(from: EditorPosition, to: EditorPosition): string {
    if (from.line === to.line) return this.getLine(from.line).slice(from.ch, to.ch);
    const parts = [this.getLine(from.line).slice(from.ch)];
    for (let line = from.line + 1; line < to.line; line += 1) {
      parts.push(this.getLine(line));
    }
    parts.push(this.getLine(to.line).slice(0, to.ch));
    return parts.join('\n');
  }

  public replaceRange(replacement: string, from: EditorPosition, to?: EditorPosition): void {
    const end = to ?? from;
    const before = this.getLine(from.line).slice(0, from.ch);
    const after = this.getLine(end.line).slice(end.ch);
    const next = before + replacement + after;
    this.lines.splice(from.line, end.line - from.line + 1, ...next.split('\n'));
  }

  public wordAt(position: EditorPosition): { from: EditorPosition; to: EditorPosition } | null {
    const line = this.getLine(position.line);
    if (!line) return null;
    const match = /\b[\w\u0600-\u06FF-]+\b/g;
    let found: RegExpExecArray | null;
    while ((found = match.exec(line)) !== null) {
      const from = found.index;
      const to = found.index + found[0].length;
      if (position.ch >= from && position.ch <= to) {
        return {
          from: { line: position.line, ch: from },
          to: { line: position.line, ch: to },
        };
      }
    }
    return null;
  }
}

describe('FormattingController (Clean HTML5 Inline Styling)', () => {
  let controller: FormattingController;

  beforeEach(() => {
    controller = new FormattingController({} as never);
  });

  it('toggles bold markers and preserves the selection range', () => {
    const editor = new FakeEditor('hello world');
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
    controller.toggleMark(editor as unknown as Editor, 'bold');
    expect(editor.getValue()).toBe('**hello** world');
    expect(editor.getRange(editor.getCursor('from'), editor.getCursor('to'))).toBe('hello');

    controller.toggleMark(editor as unknown as Editor, 'bold');
    expect(editor.getValue()).toBe('hello world');
    expect(editor.getRange(editor.getCursor('from'), editor.getCursor('to'))).toBe('hello');
  });

  it('toggles italic inside existing bold without disturbing bold markup', () => {
    const editor = new FakeEditor('**hello** world');
    editor.setSelection({ line: 0, ch: 2 }, { line: 0, ch: 7 });
    controller.toggleMark(editor as unknown as Editor, 'italic');
    expect(editor.getValue()).toBe('***hello*** world');
    expect(editor.getRange(editor.getCursor('from'), editor.getCursor('to'))).toBe('hello');

    controller.toggleMark(editor as unknown as Editor, 'italic');
    expect(editor.getValue()).toBe('**hello** world');
    expect(editor.getRange(editor.getCursor('from'), editor.getCursor('to'))).toBe('hello');
  });

  it('composes bold, italic, and strikethrough cleanly', () => {
    const editor = new FakeEditor('hello');
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
    controller.toggleMark(editor as unknown as Editor, 'bold');
    controller.toggleMark(editor as unknown as Editor, 'italic');
    controller.toggleMark(editor as unknown as Editor, 'strikethrough');

    expect(editor.getValue()).toBe('~~***hello***~~');
    expect(controller.getFormatsAt(editor as unknown as Editor)).toMatchObject({
      bold: true,
      italic: true,
      strikethrough: true,
    });

    controller.toggleMark(editor as unknown as Editor, 'italic');
    expect(editor.getValue()).toBe('~~**hello**~~');
    expect(editor.getRange(editor.getCursor('from'), editor.getCursor('to'))).toBe('hello');
  });

  it('splits a larger bold region when unbolding one word inside it', () => {
    const editor = new FakeEditor('**whole bold passage here** rest');
    editor.setSelection({ line: 0, ch: 8 }, { line: 0, ch: 12 });
    controller.toggleMark(editor as unknown as Editor, 'bold');
    expect(editor.getValue()).toBe('**whole** bold **passage here** rest');
  });

  it('applies underline using html tags only', () => {
    const editor = new FakeEditor('underline me');
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 9 });
    controller.toggleMark(editor as unknown as Editor, 'underline');
    expect(editor.getValue()).toBe('<u>underline</u> me');
  });

  it('falls back to the current word for empty selections', () => {
    const editor = new FakeEditor('hello world');
    editor.setSelection({ line: 0, ch: 8 });
    controller.toggleMark(editor as unknown as Editor, 'italic');
    expect(editor.getValue()).toBe('hello *world*');
  });

  it('applies and independently updates passage font and size using clean standard style attributes', () => {
    const editor = new FakeEditor('hello world');
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

    controller.setInlineTypography(editor as unknown as Editor, { fontFamily: 'Amiri' });
    expect(editor.getValue()).toBe('<span style="font-family: Amiri">hello</span> world');
    expect(editor.getRange(editor.getCursor('from'), editor.getCursor('to'))).toBe('hello');
    expect(editor.hasFocus()).toBe(true);

    controller.setInlineTypography(editor as unknown as Editor, { fontSize: '1.2em' });
    expect(editor.getValue()).toBe('<span style="font-family: Amiri; font-size: 1.2em">hello</span> world');
    expect(controller.getInlineTypography(editor as unknown as Editor)).toEqual({
      fontFamily: 'Amiri',
      fontSize: '1.2em',
    });

    controller.setInlineTypography(editor as unknown as Editor, { fontFamily: '' });
    expect(editor.getValue()).toBe('<span style="font-size: 1.2em">hello</span> world');

    controller.setInlineTypography(editor as unknown as Editor, { fontSize: '' });
    expect(editor.getValue()).toBe('hello world');
    expect(editor.getRange(editor.getCursor('from'), editor.getCursor('to'))).toBe('hello');
  });

  it('restores focus after a formatting overlay closes', () => {
    vi.useFakeTimers();
    try {
      const editor = new FakeEditor('hello world');
      editor.blur();
      editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

      controller.setInlineTypography(editor as unknown as Editor, { fontFamily: 'Amiri' });
      // Simulate the modal taking focus back after the formatting callback.
      editor.blur();
      vi.runAllTimers();

      expect(editor.hasFocus()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('converts Markdown marks to nested HTML when applying passage typography', () => {
    const editor = new FakeEditor('hello');
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
    controller.toggleMark(editor as unknown as Editor, 'bold');
    controller.toggleMark(editor as unknown as Editor, 'italic');
    controller.setInlineTypography(editor as unknown as Editor, { fontFamily: 'Noto Sans', fontSize: '18px' });

    expect(editor.getValue()).toBe('<span style="font-family: Noto Sans; font-size: 18px"><b><i>hello</i></b></span>');
    expect(editor.getRange(editor.getCursor('from'), editor.getCursor('to'))).toBe('hello');
  });

  it('clears combined marks and passage typography in one action', () => {
    const editor = new FakeEditor('hello');
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
    controller.toggleMark(editor as unknown as Editor, 'bold');
    controller.toggleMark(editor as unknown as Editor, 'italic');
    controller.toggleMark(editor as unknown as Editor, 'underline');
    controller.setInlineTypography(editor as unknown as Editor, { fontFamily: 'Amiri', fontSize: '18px' });

    controller.clearFormatting(editor as unknown as Editor);
    expect(editor.getValue()).toBe('hello');
    expect(editor.getRange(editor.getCursor('from'), editor.getCursor('to'))).toBe('hello');
  });

  it('rejects unsafe passage typography values without changing the note', () => {
    const editor = new FakeEditor('hello');
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
    controller.setInlineTypography(editor as unknown as Editor, { fontFamily: 'Bad; color: red' });
    expect(editor.getValue()).toBe('hello');
    controller.setInlineTypography(editor as unknown as Editor, { fontSize: 'huge' });
    expect(editor.getValue()).toBe('hello');
  });

  it('toggles classic highlight markers and preserves selection', () => {
    const editor = new FakeEditor('hello world');
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
    controller.toggleMark(editor as unknown as Editor, 'highlight');
    expect(editor.getValue()).toBe('==hello== world');
    expect(editor.getRange(editor.getCursor('from'), editor.getCursor('to'))).toBe('hello');

    controller.toggleMark(editor as unknown as Editor, 'highlight');
    expect(editor.getValue()).toBe('hello world');
    expect(editor.getRange(editor.getCursor('from'), editor.getCursor('to'))).toBe('hello');
  });

  it('composes highlight with bold and italic', () => {
    const editor = new FakeEditor('hello world');
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });
    controller.toggleMark(editor as unknown as Editor, 'bold');
    controller.toggleMark(editor as unknown as Editor, 'italic');
    controller.toggleMark(editor as unknown as Editor, 'highlight');
    expect(editor.getValue()).toBe('==***hello***== world');
    expect(controller.getFormatsAt(editor as unknown as Editor)).toMatchObject({
      bold: true,
      italic: true,
      highlight: true,
    });
  });

  it('applies, updates, and preserves inline text color and background color alongside font', () => {
    const editor = new FakeEditor('hello world');
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 5 });

    controller.setInlineTypography(editor as unknown as Editor, {
      fontFamily: 'Amiri',
      fontSize: '18px',
      textColor: '#e5484d',
      backgroundColor: '#ffe08a',
    });
    expect(editor.getValue()).toBe(
      '<mark style="font-family: Amiri; font-size: 18px; color: #e5484d; background-color: #ffe08a">hello</mark> world'
    );
    expect(controller.getInlineTypography(editor as unknown as Editor)).toEqual({
      fontFamily: 'Amiri',
      fontSize: '18px',
      textColor: '#e5484d',
      backgroundColor: '#ffe08a',
    });

    // Update text color only; font, size, and background color are preserved
    controller.setInlineTypography(editor as unknown as Editor, { textColor: '#30a46c' });
    expect(editor.getValue()).toBe(
      '<mark style="font-family: Amiri; font-size: 18px; color: #30a46c; background-color: #ffe08a">hello</mark> world'
    );

    // Clear background color only (switches tag to <span>)
    controller.setInlineTypography(editor as unknown as Editor, { backgroundColor: '' });
    expect(editor.getValue()).toBe(
      '<span style="font-family: Amiri; font-size: 18px; color: #30a46c">hello</span> world'
    );
  });

  it('recognizes and upgrades legacy data-rich-editor-typography tags', () => {
    const raw = '<span data-rich-editor-typography style="font-family: Amiri; font-size: 1.2em">hello</span> world';
    const editor = new FakeEditor(raw);
    const start = raw.indexOf('hello');
    editor.setSelection({ line: 0, ch: start }, { line: 0, ch: start + 5 });
    expect(controller.getInlineTypography(editor as unknown as Editor)).toEqual({
      fontFamily: 'Amiri',
      fontSize: '1.2em',
    });

    controller.setInlineTypography(editor as unknown as Editor, { textColor: '#e5484d' });
    expect(editor.getValue()).toBe(
      '<span style="font-family: Amiri; font-size: 1.2em; color: #e5484d">hello</span> world'
    );
  });

  it('reports active formats at the current selection', () => {
    const editor = new FakeEditor('**bold** and <u>underlined</u> and ==highlighted==');
    editor.setSelection({ line: 0, ch: 3 }, { line: 0, ch: 6 });
    expect(controller.getFormatsAt(editor as unknown as Editor)).toMatchObject({
      bold: true,
      italic: false,
      underline: false,
      strikethrough: false,
      highlight: false,
    });

    editor.setSelection({ line: 0, ch: 18 }, { line: 0, ch: 22 });
    expect(controller.getFormatsAt(editor as unknown as Editor)).toMatchObject({
      underline: true,
    });

    editor.setSelection({ line: 0, ch: 37 }, { line: 0, ch: 45 });
    expect(controller.getFormatsAt(editor as unknown as Editor)).toMatchObject({
      highlight: true,
    });
  });

  it('never creates nested mark/span tags when applying styles over existing styled text', () => {
    const raw = '<span style="font-family: mylotus3">العالمين</span>';
    const editor = new FakeEditor(raw);
    const start = raw.indexOf('العالمين');
    editor.setSelection({ line: 0, ch: start }, { line: 0, ch: start + 'العالمين'.length });

    // Apply highlight color over existing font-family
    controller.setInlineTypography(editor as unknown as Editor, { backgroundColor: '#fef08a' });

    // Must be a SINGLE unified mark, NEVER nested <mark...><mark...>
    const value = editor.getValue();
    expect(value).toBe('<mark style="font-family: mylotus3; background-color: #fef08a">العالمين</mark>');
    expect(value.split('<mark').length - 1).toBe(1);
    expect(value.split('</mark>').length - 1).toBe(1);
  });

  it('sanitizes and merges legacy nested tags into a single clean tag', () => {
    const nested = '<span data-rich-editor-style style="background-color: #fef08a"><span data-rich-editor-typography style="font-family: mylotus3">العالمين</span></span>';
    const editor = new FakeEditor(nested);
    const start = nested.indexOf('العالمين');
    editor.setSelection({ line: 0, ch: start }, { line: 0, ch: start + 'العالمين'.length });

    controller.setInlineTypography(editor as unknown as Editor, { textColor: '#e11d48' });

    const value = editor.getValue();
    expect(value).toBe('<mark style="font-family: mylotus3; color: #e11d48; background-color: #fef08a">العالمين</mark>');
    expect(value.split('<mark').length - 1).toBe(1);
    expect(value.split('</mark>').length - 1).toBe(1);
  });

  it('recognizes Markdown and HTML marks nested inside a custom-font span', () => {
    const raw = '<span style="font-family: Amiri"><b><i>word</i></b> and **marked**</span>';
    const editor = new FakeEditor(raw);
    const wordStart = raw.indexOf('word');
    editor.setSelection({ line: 0, ch: wordStart }, { line: 0, ch: wordStart + 4 });
    expect(controller.getFormatsAt(editor as unknown as Editor)).toMatchObject({ bold: true, italic: true });

    const markedStart = raw.indexOf('marked');
    editor.setSelection({ line: 0, ch: markedStart }, { line: 0, ch: markedStart + 6 });
    expect(controller.getFormatsAt(editor as unknown as Editor).bold).toBe(true);
  });

  it('adds and removes HTML marks inside a custom-font span for a full selection', () => {
    const raw = '<span style="font-family: Amiri">word</span>';
    const editor = new FakeEditor(raw);
    const start = raw.indexOf('word');
    editor.setSelection({ line: 0, ch: start }, { line: 0, ch: start + 4 });

    controller.toggleMark(editor as unknown as Editor, 'bold');
    expect(editor.getValue()).toBe('<span style="font-family: Amiri"><b>word</b></span>');

    controller.toggleMark(editor as unknown as Editor, 'bold');
    expect(editor.getValue()).toBe(raw);
  });

  it('formats a typography span when the visible selection includes its hidden container tags', () => {
    const raw = '<span style="font-family: Amiri">حصن المسلم</span>';
    const editor = new FakeEditor(raw);
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: raw.length });

    controller.toggleMark(editor as unknown as Editor, 'bold');
    expect(editor.getValue()).toBe('<span style="font-family: Amiri"><b>حصن المسلم</b></span>');

    controller.toggleMark(editor as unknown as Editor, 'bold');
    expect(editor.getValue()).toBe(raw);
  });

  it('formats an entire paragraph containing custom-font text without wrapping the span in Markdown', () => {
    const raw = 'before <span style="font-family: Amiri">حصن المسلم</span> after';
    const editor = new FakeEditor(raw);
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: raw.length });

    controller.toggleMark(editor as unknown as Editor, 'bold');
    expect(editor.getValue()).toBe(
      '<b>before </b><span style="font-family: Amiri"><b>حصن المسلم</b></span><b> after</b>'
    );

    controller.toggleMark(editor as unknown as Editor, 'bold');
    expect(editor.getValue()).toBe(raw);
  });

  it('splits a nested HTML mark for a partial selection without escaping the typography span', () => {
    const raw = '<span style="font-family: Amiri">hello world</span>';
    const editor = new FakeEditor(raw);
    const start = raw.indexOf('hello');
    editor.setSelection({ line: 0, ch: start }, { line: 0, ch: start + 5 });

    controller.toggleMark(editor as unknown as Editor, 'italic');
    expect(editor.getValue()).toBe('<span style="font-family: Amiri"><i>hello</i> world</span>');

    controller.toggleMark(editor as unknown as Editor, 'italic');
    expect(editor.getValue()).toBe(raw);
  });

  it('migrates legacy Markdown marks inside a custom-font span before toggling them', () => {
    const raw = '<span style="font-family: Amiri">**word**</span>';
    const editor = new FakeEditor(raw);
    const start = raw.indexOf('word');
    editor.setSelection({ line: 0, ch: start }, { line: 0, ch: start + 4 });

    expect(controller.getFormatsAt(editor as unknown as Editor).bold).toBe(true);
    controller.toggleMark(editor as unknown as Editor, 'bold');
    expect(editor.getValue()).toBe('<span style="font-family: Amiri">word</span>');
  });

  it('migrates legacy Markdown marks around a custom-font span before adding another format', () => {
    const raw = '**<span style="font-family: Amiri">word</span>**';
    const editor = new FakeEditor(raw);
    const start = raw.indexOf('word');
    editor.setSelection({ line: 0, ch: start }, { line: 0, ch: start + 4 });

    controller.toggleMark(editor as unknown as Editor, 'italic');
    expect(editor.getValue()).toBe('<span style="font-family: Amiri"><b><i>word</i></b></span>');
    expect(editor.getRange(editor.getCursor('from'), editor.getCursor('to'))).toBe('word');
  });

  it('toggles a nested HTML highlight without removing the surrounding font span', () => {
    const raw = '<span style="font-family: Amiri">word</span>';
    const editor = new FakeEditor(raw);
    const start = raw.indexOf('word');
    editor.setSelection({ line: 0, ch: start }, { line: 0, ch: start + 4 });

    controller.toggleMark(editor as unknown as Editor, 'highlight');
    expect(editor.getValue()).toBe('<span style="font-family: Amiri"><mark>word</mark></span>');

    controller.toggleMark(editor as unknown as Editor, 'highlight');
    expect(editor.getValue()).toBe(raw);
  });

  it('keeps a long custom-typography tag intact while toggling Arabic text formatting', () => {
    const openTag = '<span style="font-family: Amiri; font-size: 1.2em; color: #2563eb; background-color: #fef08a">';
    const raw = `${openTag}العربية</span>`;
    const editor = new FakeEditor(raw);
    const start = raw.indexOf('العربية');
    editor.setSelection({ line: 0, ch: start }, { line: 0, ch: start + 'العربية'.length });

    controller.toggleMark(editor as unknown as Editor, 'italic');
    expect(editor.getValue()).toBe(`${openTag}<i>العربية</i></span>`);
    expect(controller.getFormatsAt(editor as unknown as Editor).italic).toBe(true);

    controller.toggleMark(editor as unknown as Editor, 'italic');
    expect(editor.getValue()).toBe(raw);
  });

  it('composes and independently removes bold and italic inside a custom-font span', () => {
    const raw = "<span style='font-family: Amiri'>حصن المسلم</span>";
    const editor = new FakeEditor(raw);
    const start = raw.indexOf('حصن المسلم');
    editor.setSelection({ line: 0, ch: start }, { line: 0, ch: start + 'حصن المسلم'.length });

    controller.toggleMark(editor as unknown as Editor, 'bold');
    controller.toggleMark(editor as unknown as Editor, 'italic');
    expect(editor.getValue()).toBe("<span style='font-family: Amiri'><b><i>حصن المسلم</i></b></span>");
    expect(controller.getFormatsAt(editor as unknown as Editor)).toMatchObject({ bold: true, italic: true });

    controller.toggleMark(editor as unknown as Editor, 'bold');
    expect(editor.getValue()).toBe("<span style='font-family: Amiri'><i>حصن المسلم</i></span>");
    expect(controller.getFormatsAt(editor as unknown as Editor)).toMatchObject({ bold: false, italic: true });

    controller.toggleMark(editor as unknown as Editor, 'italic');
    expect(editor.getValue()).toBe(raw);
  });

  it('removes a partial outer mark while preserving nested formatting as valid HTML', () => {
    const raw = "<span style='font-family: Amiri'><b><i>حصن المسلم</i></b></span>";
    const editor = new FakeEditor(raw);
    const start = raw.indexOf('حصن');
    editor.setSelection({ line: 0, ch: start }, { line: 0, ch: start + 'حصن'.length });

    controller.toggleMark(editor as unknown as Editor, 'bold');
    expect(editor.getValue()).toBe("<span style='font-family: Amiri'><i>حصن</i><b><i> المسلم</i></b></span>");
    expect(controller.getFormatsAt(editor as unknown as Editor)).toMatchObject({ bold: false, italic: true });
  });

  it('preserves RTL direction when formatting an entire Arabic paragraph', () => {
    const paragraph = 'العربية فقرة كاملة';

    const colorEditor = new FakeEditor(paragraph);
    colorEditor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: paragraph.length });
    controller.setInlineTypography(colorEditor as unknown as Editor, { textColor: '#e11d48' });
    expect(colorEditor.getValue()).toBe(`<span style="color: #e11d48">${paragraph}</span>`);

    const highlightEditor = new FakeEditor(paragraph);
    highlightEditor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: paragraph.length });
    controller.setInlineTypography(highlightEditor as unknown as Editor, { backgroundColor: '#fef08a' });
    expect(highlightEditor.getValue()).toBe(`<mark style="background-color: #fef08a">${paragraph}</mark>`);

    const fontEditor = new FakeEditor(paragraph);
    fontEditor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: paragraph.length });
    controller.setInlineTypography(fontEditor as unknown as Editor, { fontFamily: 'Amiri' });
    expect(fontEditor.getValue()).toBe(`<span style="font-family: Amiri">${paragraph}</span>`);

    const underlineEditor = new FakeEditor(paragraph);
    underlineEditor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: paragraph.length });
    controller.toggleMark(underlineEditor as unknown as Editor, 'underline');
    expect(underlineEditor.getValue()).toBe(`<u>${paragraph}</u>`);
    controller.toggleMark(underlineEditor as unknown as Editor, 'underline');
    expect(underlineEditor.getValue()).toBe(paragraph);
  });

  it('keeps block prefixes outside whole-paragraph typography', () => {
    const raw = '- فقرة عربية';
    const editor = new FakeEditor(raw);
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: raw.length });

    controller.setInlineTypography(editor as unknown as Editor, { fontFamily: 'Amiri' });

    expect(editor.getValue()).toBe('- <span style="font-family: Amiri">فقرة عربية</span>');
  });

  it('keeps a partial paragraph range local to the selected words', () => {
    const raw = 'قبل العربية بعد';
    const editor = new FakeEditor(raw);
    const start = raw.indexOf('العربية');
    editor.setSelection({ line: 0, ch: start }, { line: 0, ch: start + 'العربية'.length });

    controller.setInlineTypography(editor as unknown as Editor, { textColor: '#e11d48' });

    expect(editor.getValue()).toBe('قبل <span style="color: #e11d48">العربية</span> بعد');
  });

  it('formats mixed multi-line selections one line at a time', () => {
    const lines = ['العربية الأولى', 'English second', 'العربية الثالثة'];
    const editor = new FakeEditor(lines.join('\n'));
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: 2, ch: lines[2].length }
    );

    controller.setInlineTypography(editor as unknown as Editor, { backgroundColor: '#fef08a' });

    expect(editor.getValue()).toBe(
      [
        `<mark style="background-color: #fef08a">${lines[0]}</mark>`,
        `<mark style="background-color: #fef08a">${lines[1]}</mark>`,
        `<mark style="background-color: #fef08a">${lines[2]}</mark>`,
      ].join('\n')
    );
    expect(editor.getValue()).not.toMatch(/<mark[^>]*>[^<\n]*\n/);

    const value = editor.getValue();
    expect(editor.getCursor('from')).toEqual({ line: 0, ch: value.indexOf(lines[0]) });
    expect(editor.getCursor('to')).toEqual({
      line: 2,
      ch: editor.getLine(2).lastIndexOf(lines[2]) + lines[2].length,
    });
  });

  it('toggles underline across paragraphs without crossing a newline', () => {
    const lines = ['العربية الأولى', 'العربية الثانية'];
    const editor = new FakeEditor(lines.join('\n'));
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: 1, ch: lines[1].length }
    );

    controller.toggleMark(editor as unknown as Editor, 'underline');

    expect(editor.getValue()).toBe(
      `<u>${lines[0]}</u>\n<u>${lines[1]}</u>`
    );
    expect(editor.getValue()).not.toContain('<u>العربية الأولى\n');

    controller.toggleMark(editor as unknown as Editor, 'underline');
    expect(editor.getValue()).toBe(lines.join('\n'));
  });

  it('removes legacy direction controls when clearing the whole styled block', () => {
    const raw = '\u200F<span style="font-family: Amiri">العربية</span>';
    const editor = new FakeEditor(raw);
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: raw.length });

    controller.setInlineTypography(editor as unknown as Editor, { fontFamily: '' });

    expect(editor.getValue()).toBe('العربية');
  });

  it('does not nest underline when a whole raw styled block is selected', () => {
    const raw = '\u200F<u>العربية</u>';
    const editor = new FakeEditor(raw);
    editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: raw.length });

    controller.toggleMark(editor as unknown as Editor, 'underline');

    expect(editor.getValue()).toBe('العربية');
  });

  it('clears legacy direction controls when clear formatting starts inside a styled block', () => {
    const raw = '\u200F<span style="font-family: Amiri">العربية</span> بعد';
    const editor = new FakeEditor(raw);
    const start = raw.indexOf('العربية');
    editor.setSelection({ line: 0, ch: start }, { line: 0, ch: start + 'العربية'.length });

    controller.clearFormatting(editor as unknown as Editor);

    expect(editor.getValue()).toBe('العربية بعد');
  });

  it('reports common typography across a multi-line selection', () => {
    const lines = [
      '\u200F<span style="font-family: Amiri; color: #e11d48">العربية</span>',
      '\u200F<span style="font-family: Amiri; color: #e11d48">الثانية</span>',
    ];
    const editor = new FakeEditor(lines.join('\n'));
    editor.setSelection({ line: 0, ch: 0 }, { line: 1, ch: lines[1].length });

    expect(controller.getInlineTypography(editor as unknown as Editor)).toEqual({
      fontFamily: 'Amiri',
      textColor: '#e11d48',
    });
  });

  it('removes legacy direction controls while updating an existing RTL style', () => {
    const raw = '\u200F\u200F<span style="font-family: Amiri">العربية</span>';
    const editor = new FakeEditor(raw);
    const start = raw.indexOf('العربية');
    editor.setSelection({ line: 0, ch: start }, { line: 0, ch: start + 'العربية'.length });

    controller.setInlineTypography(editor as unknown as Editor, { textColor: '#e11d48' });

    expect(editor.getValue()).toBe('<span style="font-family: Amiri; color: #e11d48">العربية</span>');
  });
});
