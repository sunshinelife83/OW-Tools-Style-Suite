/**
 * Direction detection and Markdown block helpers.
 *
 * Direction is rendered on the editor line and must not be stored as a
 * zero-width source character. The control helpers below exist only to
 * migrate notes written by older plugin versions.
 */

const DIRECTION_CONTROLS = /[\u200E\u200F]/g;

const RTL_STRONG_RE = /[\u0590-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LTR_STRONG_RE = /[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u0370-\u03FF\u0400-\u04FF]/;

// Markdown syntax that belongs to the block rather than to its inline text.
// Keep this intentionally conservative: a prefix is excluded only when the
// requested range includes the complete line.
const BLOCK_PREFIX_RE = /^(?:\s*#{1,6}\s+|\s*>\s?|\s*[-*+]\s+|\s*\d+[.)]\s+)*/;

export type ContentDirection = 'rtl' | 'ltr' | null;

export function detectContentDirection(text: string): ContentDirection {
  for (const character of visibleText(text)) {
    if (RTL_STRONG_RE.test(character)) return 'rtl';
    if (LTR_STRONG_RE.test(character)) return 'ltr';
  }
  return null;
}

export function stripDirectionControls(text: string): string {
  return text.replace(DIRECTION_CONTROLS, '');
}

export function stripLeadingDirectionControls(text: string): string {
  let index = 0;
  while (index < text.length && isDirectionControl(text[index])) index += 1;
  return index > 0 ? text.slice(index) : text;
}

function isDirectionControl(character: string): boolean {
  return character === '\u200E' || character === '\u200F';
}

export function getLeadingDirectionControlStart(text: string, position: number): number {
  let start = Math.max(0, Math.min(position, text.length));
  while (start > 0 && isDirectionControl(text[start - 1] ?? '')) start -= 1;
  return start;
}

const GENERATED_DIRECTION_CONTROL_LINE_RE = /^((?:\s*#{1,6}\s+|\s*>\s?|\s*[-*+]\s+|\s*\d+[.)]\s+)*)[\u200E\u200F]+(?=<(?:span|mark|u)\b)/i;

/**
 * Remove direction controls emitted by older plugin builds when they are
 * directly attached to a generated inline style wrapper. Ordinary user text
 * containing U+200E/U+200F is left untouched.
 */
export function stripGeneratedDirectionControls(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(GENERATED_DIRECTION_CONTROL_LINE_RE, '$1'))
    .join('\n');
}

export function visibleText(text: string): string {
  return stripDirectionControls(text).replace(/<[^>]+>/g, '');
}

export function getBlockPrefixLength(lineText: string): number {
  return BLOCK_PREFIX_RE.exec(lineText)?.[0].length ?? 0;
}

export function clampSegmentToBlockContent(
  lineText: string,
  fromCh: number,
  toCh: number
): { fromCh: number; toCh: number } {
  const prefixLength = getBlockPrefixLength(lineText);
  if (prefixLength <= 0 || prefixLength >= lineText.length) return { fromCh, toCh };
  if (toCh <= prefixLength) return { fromCh: prefixLength, toCh: prefixLength };
  return { fromCh: Math.max(fromCh, prefixLength), toCh };
}
