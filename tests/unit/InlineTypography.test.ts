import { describe, expect, it } from 'vitest';
import {
  createInlineTypographyOpenTag,
  findAllInlineTypographyRegions,
  getInlineTypographyTagType,
  stripAllInlineTypographyTags,
  wrapInlineTypography,
} from '../../src/editor/InlineTypography.js';

describe('InlineTypography (HTML5 Standards Engine)', () => {
  it('correctly determines tag type (mark for highlight, span for text/font)', () => {
    expect(getInlineTypographyTagType({ textColor: '#e11d48' })).toBe('span');
    expect(getInlineTypographyTagType({ fontFamily: 'Amiri' })).toBe('span');
    expect(getInlineTypographyTagType({ fontSize: '18px' })).toBe('span');
    expect(getInlineTypographyTagType({ backgroundColor: '#fef08a' })).toBe('mark');
    expect(getInlineTypographyTagType({ textColor: '#e11d48', backgroundColor: '#fef08a' })).toBe('mark');
  });

  it('generates standard HTML5 style attributes', () => {
    expect(createInlineTypographyOpenTag({ textColor: '#e11d48' })).toBe('<span style="color: #e11d48">');
    expect(createInlineTypographyOpenTag({ backgroundColor: '#fef08a' })).toBe('<mark style="background-color: #fef08a">');
    expect(createInlineTypographyOpenTag({ fontFamily: 'Amiri', fontSize: '18px' })).toBe(
      '<span style="font-family: Amiri; font-size: 18px">'
    );
  });

  it('wraps text cleanly in appropriate HTML5 tags', () => {
    const wrappedText = wrapInlineTypography('hello', { textColor: '#e11d48' });
    expect(wrappedText.text).toBe('<span style="color: #e11d48">hello</span>');
    expect(wrappedText.contentOffset).toBe('<span style="color: #e11d48">'.length);

    const wrappedHighlight = wrapInlineTypography('world', { backgroundColor: '#fef08a' });
    expect(wrappedHighlight.text).toBe('<mark style="background-color: #fef08a">world</mark>');
  });

  it('strips all inline typography tags cleanly', () => {
    const text = 'Hello <span style="color: #e11d48">world</span> and <mark style="background-color: #fef08a">welcome</mark>';
    const result = stripAllInlineTypographyTags(text);
    expect(result.cleanText).toBe('Hello world and welcome');
    expect(result.accumulatedTypography).toEqual({
      textColor: '#e11d48',
      backgroundColor: '#fef08a',
    });
  });

  it('parses nested or adjacent typography regions accurately', () => {
    const text = '<span style="color: red">word1</span> <mark style="background-color: yellow">word2</mark>';
    const regions = findAllInlineTypographyRegions(text);
    expect(regions.length).toBe(2);
    expect(regions[0].typography.textColor).toBe('red');
    expect(regions[1].typography.backgroundColor).toBe('yellow');
  });

  it('recognizes single-quoted, compact, and Unicode font-family typography regions', () => {
    const text = "<span style='font-family: Amiri; font-size: 1.2em'>حصن المسلم</span> <mark b='#fef08a'>word</mark>";
    const regions = findAllInlineTypographyRegions(text);
    expect(regions).toHaveLength(2);
    expect(regions[0].typography).toMatchObject({ fontFamily: 'Amiri', fontSize: '1.2em' });
    expect(regions[1].typography.backgroundColor).toBe('#fef08a');

    const arabicFont = '<span style="font-family: الخط العربي">حصن المسلم</span>';
    expect(findAllInlineTypographyRegions(arabicFont)[0]?.typography.fontFamily).toBe('الخط العربي');
  });

});
