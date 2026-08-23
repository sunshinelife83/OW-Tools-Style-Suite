import { normalizeColor, normalizeFontFamily, normalizeFontSize } from './DocumentAppearance.js';

export interface InlineTypography {
  fontFamily?: string;
  fontSize?: string;
  textColor?: string;
  backgroundColor?: string;
}

export interface InlineTypographyRegion {
  open: number;
  openEnd: number;
  close: number;
  closeEnd: number;
  typography: InlineTypography;
}

export function normalizeInlineTypography(updates: Partial<InlineTypography>): InlineTypography {
  return {
    fontFamily: normalizeFontFamily(updates.fontFamily),
    fontSize: normalizeFontSize(updates.fontSize),
    textColor: normalizeColor(updates.textColor),
    backgroundColor: normalizeColor(updates.backgroundColor),
  };
}

export function mergeInlineTypography(
  current: InlineTypography,
  updates: { fontFamily?: string | null; fontSize?: string | null; textColor?: string | null; backgroundColor?: string | null }
): InlineTypography {
  const next = { ...current };

  if (Object.prototype.hasOwnProperty.call(updates, 'fontFamily')) {
    next.fontFamily = normalizeFontFamily(updates.fontFamily) ?? undefined;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'fontSize')) {
    next.fontSize = normalizeFontSize(updates.fontSize) ?? undefined;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'textColor')) {
    next.textColor = normalizeColor(updates.textColor) ?? undefined;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'backgroundColor')) {
    next.backgroundColor = normalizeColor(updates.backgroundColor) ?? undefined;
  }

  return next;
}

export function inlineTypographyToCss(typography: InlineTypography): string {
  const normalized = normalizeInlineTypography(typography);
  const declarations: string[] = [];
  if (normalized.fontFamily) declarations.push(`font-family: ${normalized.fontFamily}`);
  if (normalized.fontSize) declarations.push(`font-size: ${normalized.fontSize}`);
  if (normalized.textColor) declarations.push(`color: ${normalized.textColor}`);
  if (normalized.backgroundColor) declarations.push(`background-color: ${normalized.backgroundColor}`);
  return declarations.join('; ');
}

export function getInlineTypographyTagType(typography: InlineTypography): 'mark' | 'span' {
  const norm = normalizeInlineTypography(typography);
  return norm.backgroundColor ? 'mark' : 'span';
}

/**
 * Generates clean standard HTML5 inline tags with native style attributes:
 * - Highlights use <mark style="background-color: ...">
 * - Text colors / Fonts use <span style="color: ...">
 */
export function createInlineTypographyOpenTag(typography: InlineTypography): string {
  const css = inlineTypographyToCss(typography);
  if (!css) return '';
  const tagType = getInlineTypographyTagType(typography);
  return `<${tagType} style="${escapeHtmlAttribute(css)}">`;
}

export function wrapInlineTypography(text: string, typography: InlineTypography): { text: string; contentOffset: number } {
  if (!text) return { text, contentOffset: 0 };
  const openTag = createInlineTypographyOpenTag(typography);
  if (!openTag) return { text, contentOffset: 0 };
  const tagType = getInlineTypographyTagType(typography);
  return {
    text: `${openTag}${text}</${tagType}>`,
    contentOffset: openTag.length,
  };
}

export function stripAllInlineTypographyTags(text: string): { cleanText: string; accumulatedTypography: InlineTypography } {
  const regions = findAllInlineTypographyRegions(text);
  let accumulated: InlineTypography = {};
  for (const r of regions) {
    accumulated = mergeInlineTypography(accumulated, r.typography);
  }

  const cleanText = text
    .replace(/<mark\b[^>]*>/gi, '')
    .replace(/<\/mark\s*>/gi, '')
    .replace(/<span\b[^>]*>/gi, '')
    .replace(/<\/span\s*>/gi, '');

  return { cleanText, accumulatedTypography: accumulated };
}

export function findInlineTypographyRegion(
  text: string,
  fromCh: number,
  toCh: number
): InlineTypographyRegion | null {
  let best: InlineTypographyRegion | null = null;
  for (const region of findAllInlineTypographyRegions(text)) {
    if (fromCh < region.openEnd || toCh > region.close) continue;
    if (!best || region.closeEnd - region.open < best.closeEnd - best.open) best = region;
  }
  return best;
}

export function findEnclosingOrOverlappingRegion(
  text: string,
  fromCh: number,
  toCh: number
): { rangeFrom: number; rangeTo: number; typography: InlineTypography; isFullEnclosure: boolean; openEnd: number; close: number } | null {
  const regions = findAllInlineTypographyRegions(text);
  if (regions.length === 0) return null;

  // Single cleanly enclosed span/mark
  if (regions.length === 1 && fromCh >= regions[0].openEnd && toCh <= regions[0].close) {
    const r = regions[0];
    return {
      rangeFrom: r.open,
      rangeTo: r.closeEnd,
      openEnd: r.openEnd,
      close: r.close,
      typography: r.typography,
      isFullEnclosure: true,
    };
  }

  const overlapping = regions.filter((r) => Math.max(fromCh, r.open) < Math.min(toCh, r.closeEnd));
  if (overlapping.length > 0) {
    const rangeFrom = Math.min(fromCh, ...overlapping.map((r) => r.open));
    const rangeTo = Math.max(toCh, ...overlapping.map((r) => r.closeEnd));
    let typography: InlineTypography = {};
    for (const r of overlapping) {
      typography = mergeInlineTypography(typography, r.typography);
    }
    return {
      rangeFrom,
      rangeTo,
      openEnd: rangeFrom,
      close: rangeTo,
      typography,
      isFullEnclosure: false,
    };
  }

  return null;
}

export function findAllInlineTypographyRegions(text: string): InlineTypographyRegion[] {
  const tagPattern = /<(?:mark|span)\b[^>]*>|<\/(?:mark|span)\s*>/gi;
  const stack: Array<{ tagType: string; open: number; openEnd: number; typography: InlineTypography | null }> = [];
  const regions: InlineTypographyRegion[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(text)) !== null) {
    const tag = match[0];
    const isClosing = /^<\//.test(tag);
    const tagType = (/^<\/?([a-z0-9]+)/i.exec(tag)?.[1] ?? '').toLowerCase();

    if (!isClosing) {
      stack.push({
        tagType,
        open: match.index,
        openEnd: match.index + tag.length,
        typography: parseInlineTypographyTag(tag),
      });
      continue;
    }

    let openingIndex = -1;
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].tagType === tagType) {
        openingIndex = i;
        break;
      }
    }
    if (openingIndex === -1) continue;

    const [opening] = stack.splice(openingIndex, 1);
    if (!opening?.typography) continue;

    regions.push({
      open: opening.open,
      openEnd: opening.openEnd,
      close: match.index,
      closeEnd: match.index + tag.length,
      typography: opening.typography,
    });
  }

  return regions.sort((a, b) => a.open - b.open);
}

function parseStyleDeclarations(style: string): InlineTypography {
  const typography: InlineTypography = {};
  for (const declaration of style.split(';')) {
    const separator = declaration.indexOf(':');
    if (separator === -1) continue;
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const value = declaration.slice(separator + 1).trim();
    if (property === 'font-family') typography.fontFamily = normalizeFontFamily(value);
    if (property === 'font-size') typography.fontSize = normalizeFontSize(value);
    if (property === 'color') typography.textColor = normalizeColor(value);
    if (property === 'background-color' || property === 'background') typography.backgroundColor = normalizeColor(value);
  }
  return typography;
}

function parseInlineTypographyTag(tag: string): InlineTypography | null {
  // HTML permits either quote style. Supporting both is important because an
  // unrecognised style span cannot be decorated or included in atomic ranges.
  const style = readHtmlAttribute(tag, 'style');
  if (style !== null) {
    const parsed = parseStyleDeclarations(decodeHtmlAttribute(style));
    if (parsed.fontFamily || parsed.fontSize || parsed.textColor || parsed.backgroundColor) {
      return parsed;
    }
  }

  // Also support compact attributes: c (color), b (background), f (font), s (size)
  const typography: InlineTypography = {};
  const textColor = readHtmlAttribute(tag, 'c');
  if (textColor !== null) typography.textColor = normalizeColor(decodeHtmlAttribute(textColor));

  const backgroundColor = readHtmlAttribute(tag, 'b');
  if (backgroundColor !== null) typography.backgroundColor = normalizeColor(decodeHtmlAttribute(backgroundColor));

  const fontFamily = readHtmlAttribute(tag, 'f');
  if (fontFamily !== null) typography.fontFamily = normalizeFontFamily(decodeHtmlAttribute(fontFamily));

  const fontSize = readHtmlAttribute(tag, 's');
  if (fontSize !== null) typography.fontSize = normalizeFontSize(decodeHtmlAttribute(fontSize));

  // Bare <mark> with no attributes -> default highlight
  if (/^<mark\b/i.test(tag) && !tag.includes('=')) {
    typography.backgroundColor = '#fef08a';
  }

  return typography.fontFamily || typography.fontSize || typography.textColor || typography.backgroundColor ? typography : null;
}

function readHtmlAttribute(tag: string, name: string): string | null {
  const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
  if (!match) return null;
  return match[1] ?? match[2] ?? '';
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}
