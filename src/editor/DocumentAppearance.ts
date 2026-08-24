/**
 * Shared helpers for document-level appearance settings stored in frontmatter.
 */


export type DocumentAlignment = 'left' | 'center' | 'right' | 'justify';

export interface DocumentAppearance {
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  alignment?: DocumentAlignment;
}

export const DOCUMENT_FONT_KEY = 'rich-editor-font';
export const DOCUMENT_FONT_SIZE_KEY = 'rich-editor-font-size';
export const DOCUMENT_LINE_HEIGHT_KEY = 'rich-editor-line-height';
export const DOCUMENT_ALIGNMENT_KEY = 'rich-editor-alignment';

// Font families can legitimately be named in Arabic or any other Unicode
// script. Keep CSS injection characters out, but do not reject valid names
// merely because they are not ASCII.
const SAFE_CSS_VALUE_RE = /^[\p{L}\p{N}_\s.,'"()#%+-]+$/u;
const CSS_LENGTH_RE = /^(?:\d+(?:\.\d+)?)(?:px|pt|em|rem|%)$/;
const LINE_HEIGHT_RE = /^(?:\d+(?:\.\d+)?)(?:px|pt|em|rem|%)?$/;

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 && SAFE_CSS_VALUE_RE.test(trimmed) ? trimmed : undefined;
}

export function normalizeFontFamily(value: unknown): string | undefined {
  return normalizeString(value);
}

export function normalizeFontSize(value: unknown): string | undefined {
  const normalized = normalizeString(value);
  if (!normalized) return undefined;
  return CSS_LENGTH_RE.test(normalized) ? normalized : undefined;
}

const CSS_COLOR_RE = /^(?:#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)$/i;

export function normalizeColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > 50) return undefined;
  return CSS_COLOR_RE.test(normalized) ? normalized.toLowerCase() : undefined;
}

function normalizeLineHeight(value: unknown): string | undefined {
  const normalized = normalizeString(value);
  if (!normalized) return undefined;
  return LINE_HEIGHT_RE.test(normalized) ? normalized : undefined;
}


export function normalizeAlignment(value: unknown): DocumentAlignment | undefined {
  const normalized = normalizeString(value)?.toLowerCase();
  if (normalized === 'left' || normalized === 'center' || normalized === 'right' || normalized === 'justify') {
    return normalized;
  }
  return undefined;
}

export function readDocumentAppearanceFromFrontmatter(
  frontmatter: Record<string, unknown> | null | undefined
): DocumentAppearance {
  if (!frontmatter) return {};

  return {
    fontFamily: normalizeFontFamily(frontmatter[DOCUMENT_FONT_KEY]),
    fontSize: normalizeFontSize(frontmatter[DOCUMENT_FONT_SIZE_KEY]),
    lineHeight: normalizeLineHeight(frontmatter[DOCUMENT_LINE_HEIGHT_KEY]),
    alignment: normalizeAlignment(frontmatter[DOCUMENT_ALIGNMENT_KEY]),
  };
}

export function readDocumentAppearanceFromText(documentText: string): DocumentAppearance {
  if (!documentText.startsWith('---')) return {};

  const endIndex = documentText.indexOf('\n---', 3);
  if (endIndex === -1) return {};

  const frontmatter = documentText.slice(3, endIndex);
  const parsed: Record<string, string> = {};

  for (const rawLine of frontmatter.split('\n')) {
    const match = /^([\w-]+):\s*(.+)\s*$/.exec(rawLine.trim());
    if (!match) continue;
    parsed[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }

  return readDocumentAppearanceFromFrontmatter(parsed);
}

export function applyDocumentAppearanceToElement(element: HTMLElement, appearance: DocumentAppearance): void {
  element.classList.add('rich-editor-document-surface');
  setCssVariable(element, '--rich-editor-font-family', appearance.fontFamily);
  setCssVariable(element, '--rich-editor-font-size', appearance.fontSize);
  setCssVariable(element, '--rich-editor-line-height', appearance.lineHeight);
  setCssVariable(element, '--rich-editor-text-align', appearance.alignment);
}

function setCssVariable(element: HTMLElement, name: string, value: string | undefined): void {
  if (value) {
    element.setCssProps({ [name]: value });
  } else {
    element.style.removeProperty(name);
  }
}
