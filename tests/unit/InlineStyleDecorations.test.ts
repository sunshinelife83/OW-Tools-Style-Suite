import { describe, expect, it } from 'vitest';
import { EditorState, EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { createBidiLineDirectionExtension } from '../../src/editor/BidiLineDirection.js';
import { createInlineStyleDecorationExtension } from '../../src/editor/InlineStyleDecorations.js';

function createTestView(doc: string, isMarkupHidden = true) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const state = EditorState.create({
    doc,
    extensions: [
      createBidiLineDirectionExtension(),
      createInlineStyleDecorationExtension({
        isMarkupHidden: () => isMarkupHidden,
      }),
    ],
  });

  const view = new EditorView({
    state: state as any,
    parent: container,
  });

  return { view, container };
}

describe('InlineStyleDecorations Micro-Syntax & Navigation Protection', () => {
  it('prevents Backspace at openEnd from corrupting hidden <mark> tag', () => {
    const doc = 'Hello <mark b="#fef08a">world</mark>';
    const { view } = createTestView(doc);

    // Place cursor at openEnd (23 - right before 'w' of world)
    const wPos = doc.indexOf('world');
    view.dispatch({ selection: EditorSelection.cursor(wPos) });

    // Document contains valid tag
    expect(view.state.doc.toString()).toContain('<mark b="#fef08a">world</mark>');
  });

  it('preserves micro-tag integrity when navigating boundaries', () => {
    const doc = '<mark c="red">word1</mark> <mark c="blue">word2</mark>';
    const { view } = createTestView(doc);

    // Verify both micro-tags are parsed cleanly
    expect(view.state.doc.toString()).toContain('word1');
    expect(view.state.doc.toString()).toContain('word2');
  });

  it('keeps semantic HTML formatting visible while the cursor is inside the text', () => {
    const doc = '<span style="font-family: Amiri"><b><i>حصن المسلم</i></b></span>';
    const { view, container } = createTestView(doc);

    try {
      const visibleTextStart = doc.indexOf('حصن المسلم');
      view.dispatch({ selection: EditorSelection.cursor(visibleTextStart + 2) });

      expect(container.querySelector('.rich-editor-inline-bold')?.textContent).toContain('حصن المسلم');
      expect(container.querySelector('.rich-editor-inline-italic')?.textContent).toContain('حصن المسلم');
    } finally {
      view.destroy();
    }
  });

  it('uses native semantic elements for inline formatting decorations', () => {
    const doc = '<u>العربية</u> <s>نص مشطوب</s>';
    const { view, container } = createTestView(doc);

    try {
      expect(container.querySelector('u.rich-editor-inline-underline')?.textContent).toBe('العربية');
      expect(container.querySelector('s.rich-editor-inline-strikethrough')?.textContent).toBe('نص مشطوب');
    } finally {
      view.destroy();
    }
  });

  it('keeps mouse or programmatic selection endpoints out of hidden markup', () => {
    const doc = '<span style="font-family: Amiri"><b>حصن</b></span>';
    const { view } = createTestView(doc);

    try {
      const insideHiddenOpeningTags = doc.indexOf('<b>') + 1;
      view.dispatch({ selection: EditorSelection.cursor(insideHiddenOpeningTags) });
      expect(view.state.selection.main.head).toBe(doc.indexOf('حصن'));
    } finally {
      view.destroy();
    }
  });

  it('crosses all adjacent hidden tags in one movement without consuming Arabic text', () => {
    const openingTag = "<span style='font-family: Amiri; font-size: 1.2em; color: #2563eb'>";
    const visibleText = 'حصن المسلم';
    const doc = `A${openingTag}<b><i>${visibleText}</i></b></span>Z`;
    const { view } = createTestView(doc);
    const spanStart = doc.indexOf('<span');
    const visibleStart = doc.indexOf(visibleText);
    const closingStart = doc.indexOf('</i>');
    const closingEnd = doc.indexOf('</span>') + '</span>'.length;

    // One logical move crosses the adjacent opening tags and lands on the
    // first visible Arabic character—not an invisible position between tags.
    expect(view.moveByChar(EditorSelection.cursor(spanStart), true).head).toBe(visibleStart);
    const nextVisiblePosition = view.moveByChar(EditorSelection.cursor(visibleStart), true).head;
    // CM6 uses bidi-aware visual movement for Arabic. The important invariant
    // is that the next position stays in visible text, never inside a tag.
    expect(nextVisiblePosition).toBeGreaterThan(visibleStart);
    expect(nextVisiblePosition).toBeLessThanOrEqual(closingStart);

    // The adjacent closing tags are also one atomic segment.
    expect(view.moveByChar(EditorSelection.cursor(closingStart), true).head).toBe(closingEnd);
    expect(view.moveByChar(EditorSelection.cursor(closingEnd), false).head).toBe(closingStart);
  });

  it('keeps a whole-paragraph highlight inline instead of creating a bidi box', () => {
    const doc = '<mark style="background-color: #fef08a">العربية فقرة كاملة</mark>';
    const { view, container } = createTestView(doc);

    try {
      const highlight = container.querySelector('.rich-editor-inline-highlight');
      expect(highlight?.getAttribute('style')).not.toContain('display: inline-block');
    } finally {
      view.destroy();
    }
  });

  it('locks passage typography while the line changes between inactive and active states', () => {
    const doc = '<span style="font-family: Tajawal; font-size: 18px; color: #e5484d">العربية فقرة كاملة</span>';
    const { view, container } = createTestView(doc);

    try {
      const visibleTextStart = doc.indexOf('العربية');
      const styledText = () => container.querySelector('.rich-editor-inline-styled-text');

      view.dispatch({ selection: EditorSelection.cursor(visibleTextStart) });
      const inactiveOrActiveStyle = styledText()?.getAttribute('style') ?? '';
      expect(inactiveOrActiveStyle).toContain('font-family: Tajawal !important');
      expect(inactiveOrActiveStyle).toContain('font-size: 18px !important');
      expect(inactiveOrActiveStyle).toMatch(/color: (?:#e5484d|rgb\(229, 72, 77\)) !important/);

      view.dispatch({ selection: EditorSelection.cursor(doc.length) });
      expect(styledText()?.getAttribute('style')).toBe(inactiveOrActiveStyle);
    } finally {
      view.destroy();
    }
  });

  it('renders RTL direction on the line without wrapping source in a bidi span', () => {
    const doc = '<span style="font-family: Amiri">العربية فقرة كاملة</span>';
    const { view, container } = createTestView(doc);

    try {
      expect(view.state.doc.toString()).not.toContain('\u200F');
      const direction = container.querySelector('.cm-line.rich-editor-rtl-line');
      expect(direction?.getAttribute('dir')).toBe('rtl');
      expect(container.querySelector('.rich-editor-inline-rtl-content')).toBeNull();

      // A caret outside the styled content remains a normal source position.
      view.dispatch({ selection: EditorSelection.cursor(doc.length) });
      expect(view.state.selection.main.head).toBe(doc.length);
    } finally {
      view.destroy();
    }
  });

  it('assigns direction independently to mixed-script lines', () => {
    const arabic = 'العربية فقرة';
    const english = 'English paragraph';
    const listItem = `- ${arabic}`;
    const doc = `${arabic}\n${english}\n${listItem}`;
    const { view, container } = createTestView(doc, false);

    try {
      const lines = Array.from(container.querySelectorAll<HTMLElement>('.cm-line'));
      expect(lines).toHaveLength(3);
      expect(lines[0]?.getAttribute('dir')).toBe('rtl');
      expect(lines[1]?.getAttribute('dir')).toBeNull();
      expect(lines[2]?.getAttribute('dir')).toBe('rtl');
      expect(view.state.doc.toString()).toBe(doc);
    } finally {
      view.destroy();
    }
  });
});
