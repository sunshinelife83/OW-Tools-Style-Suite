import { describe, expect, it } from 'vitest';
import {
  clampSegmentToBlockContent,
  detectContentDirection,
  stripGeneratedDirectionControls,
  stripDirectionControls,
} from '../../src/editor/BidiGuard.js';

describe('BidiGuard', () => {
  it('detects the first strong direction while ignoring markup and controls', () => {
    expect(detectContentDirection('<span style="font-family: Amiri">العربية</span>')).toBe('rtl');
    expect(detectContentDirection('\u200F<mark>العربية English</mark>')).toBe('rtl');
    expect(detectContentDirection('<span>English العربية</span>')).toBe('ltr');
    expect(detectContentDirection('123 — …')).toBe(null);
  });

  it('does not encode direction as a source character', () => {
    expect(stripGeneratedDirectionControls('\u200F<span style="font-family: Amiri">العربية</span>'))
      .toBe('<span style="font-family: Amiri">العربية</span>');
    expect(stripGeneratedDirectionControls('قبل \u200F<span>العربية</span>'))
      .toBe('قبل \u200F<span>العربية</span>');
  });

  it('keeps Markdown block prefixes outside inline formatting', () => {
    expect(clampSegmentToBlockContent('# عنوان عربي', 0, '# عنوان عربي'.length)).toEqual({ fromCh: 2, toCh: 12 });
    expect(clampSegmentToBlockContent('- فقرة عربية', 0, '- فقرة عربية'.length)).toEqual({ fromCh: 2, toCh: 12 });
    expect(clampSegmentToBlockContent('نص عربي', 0, 'نص عربي'.length)).toEqual({ fromCh: 0, toCh: 7 });
  });

  it('removes direction controls during source cleanup', () => {
    expect(stripDirectionControls('\u200Fقبل\u200E بعد')).toBe('قبل بعد');
  });
});
