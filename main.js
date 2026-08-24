"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => RichEditorPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian10 = require("obsidian");

// src/commands/FormattingCommands.ts
function registerFormattingCommands(plugin) {
  const marks = [
    { id: "style-suite-toggle-bold", name: "OW-Tools: Toggle bold", mark: "bold", icon: "bold" },
    { id: "style-suite-toggle-italic", name: "OW-Tools: Toggle italic", mark: "italic", icon: "italic" },
    { id: "style-suite-toggle-underline", name: "OW-Tools: Toggle underline", mark: "underline", icon: "underline" },
    {
      id: "style-suite-toggle-strikethrough",
      name: "OW-Tools: Toggle strikethrough",
      mark: "strikethrough",
      icon: "strikethrough"
    },
    { id: "style-suite-toggle-highlight", name: "OW-Tools: Toggle highlight", mark: "highlight", icon: "highlighter" }
  ];
  marks.forEach(({ id, name, mark, icon }) => {
    plugin.addCommand({
      id,
      name,
      icon,
      editorCallback: (editor) => plugin.formattingController.toggleMark(editor, mark)
    });
  });
  plugin.addCommand({
    id: "style-suite-toggle-bullet-list",
    name: "OW-Tools: Toggle bullet list",
    icon: "list",
    editorCallback: (editor) => plugin.formattingController.toggleBulletList(editor)
  });
  plugin.addCommand({
    id: "style-suite-toggle-numbered-list",
    name: "OW-Tools: Toggle numbered list",
    icon: "list-ordered",
    editorCallback: (editor) => plugin.formattingController.toggleNumberedList(editor)
  });
  plugin.addCommand({
    id: "style-suite-toggle-blockquote",
    name: "OW-Tools: Toggle blockquote",
    icon: "quote",
    editorCallback: (editor) => plugin.formattingController.toggleBlockquote(editor)
  });
  plugin.addCommand({
    id: "style-suite-heading-1",
    name: "OW-Tools: Heading 1",
    icon: "heading-1",
    editorCallback: (editor) => plugin.formattingController.setHeading(editor, 1)
  });
  plugin.addCommand({
    id: "style-suite-heading-2",
    name: "OW-Tools: Heading 2",
    icon: "heading-2",
    editorCallback: (editor) => plugin.formattingController.setHeading(editor, 2)
  });
  plugin.addCommand({
    id: "style-suite-heading-3",
    name: "OW-Tools: Heading 3",
    icon: "heading-3",
    editorCallback: (editor) => plugin.formattingController.setHeading(editor, 3)
  });
  plugin.addCommand({
    id: "style-suite-normal-text",
    name: "OW-Tools: Normal text",
    icon: "pilcrow",
    editorCallback: (editor) => plugin.formattingController.setHeading(editor, 0)
  });
  plugin.addCommand({
    id: "style-suite-color-passage",
    name: "OW-Tools: Text and highlight color",
    icon: "palette",
    editorCallback: (editor) => plugin.openColorPicker(editor)
  });
  plugin.addCommand({
    id: "style-suite-style-passage",
    name: "OW-Tools: Passage font and size",
    icon: "type",
    editorCallback: (editor) => plugin.openPassageAppearance(editor)
  });
  plugin.addCommand({
    id: "style-suite-clear-formatting",
    name: "OW-Tools: Clear formatting",
    icon: "eraser",
    editorCallback: (editor) => plugin.formattingController.clearFormatting(editor)
  });
  plugin.addCommand({
    id: "style-suite-open-document-appearance",
    name: "OW-Tools: Document appearance",
    icon: "sliders-horizontal",
    callback: () => plugin.openAppearanceForActiveDocument()
  });
  plugin.addCommand({
    id: "style-suite-choose-document-font",
    name: "OW-Tools: Choose document font",
    icon: "type",
    callback: () => void plugin.chooseFontForActiveDocument()
  });
  plugin.addCommand({
    id: "style-suite-clear-document-font",
    name: "OW-Tools: Clear document font",
    icon: "rotate-ccw",
    callback: () => void plugin.clearFontForActiveDocument()
  });
  plugin.addCommand({
    id: "style-suite-toggle-style-markup",
    name: "OW-Tools: Show or hide generated style markup",
    icon: "code-xml",
    callback: () => void plugin.toggleInlineStyleMarkup()
  });
  plugin.addCommand({
    id: "style-suite-clear-document-appearance",
    name: "OW-Tools: Clear document appearance",
    icon: "trash-2",
    callback: () => void plugin.clearAppearanceForActiveDocument()
  });
}

// src/editor/BidiGuard.ts
var DIRECTION_CONTROLS = /[\u200E\u200F]/g;
var RTL_STRONG_RE = /[\u0590-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
var LTR_STRONG_RE = /[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02AF\u0370-\u03FF\u0400-\u04FF]/;
var BLOCK_PREFIX_RE = /^(?:\s*#{1,6}\s+|\s*>\s?|\s*[-*+]\s+|\s*\d+[.)]\s+)*/;
function detectContentDirection(text) {
  for (const character of visibleText(text)) {
    if (RTL_STRONG_RE.test(character)) return "rtl";
    if (LTR_STRONG_RE.test(character)) return "ltr";
  }
  return null;
}
function stripDirectionControls(text) {
  return text.replace(DIRECTION_CONTROLS, "");
}
function stripLeadingDirectionControls(text) {
  let index = 0;
  while (index < text.length && isDirectionControl(text[index])) index += 1;
  return index > 0 ? text.slice(index) : text;
}
function isDirectionControl(character) {
  return character === "\u200E" || character === "\u200F";
}
function getLeadingDirectionControlStart(text, position) {
  let start = Math.max(0, Math.min(position, text.length));
  while (start > 0 && isDirectionControl(text[start - 1] ?? "")) start -= 1;
  return start;
}
var GENERATED_DIRECTION_CONTROL_LINE_RE = /^((?:\s*#{1,6}\s+|\s*>\s?|\s*[-*+]\s+|\s*\d+[.)]\s+)*)[\u200E\u200F]+(?=<(?:span|mark|u)\b)/i;
function stripGeneratedDirectionControls(text) {
  return text.split("\n").map((line) => line.replace(GENERATED_DIRECTION_CONTROL_LINE_RE, "$1")).join("\n");
}
function visibleText(text) {
  return stripDirectionControls(text).replace(/<[^>]+>/g, "");
}
function getBlockPrefixLength(lineText) {
  return BLOCK_PREFIX_RE.exec(lineText)?.[0].length ?? 0;
}
function clampSegmentToBlockContent(lineText, fromCh, toCh) {
  const prefixLength = getBlockPrefixLength(lineText);
  if (prefixLength <= 0 || prefixLength >= lineText.length) return { fromCh, toCh };
  if (toCh <= prefixLength) return { fromCh: prefixLength, toCh: prefixLength };
  return { fromCh: Math.max(fromCh, prefixLength), toCh };
}

// src/editor/RichEditorExtensions.ts
var import_state2 = require("@codemirror/state");
var import_view4 = require("@codemirror/view");

// src/editor/BidiLineDirection.ts
var import_view = require("@codemirror/view");
var RTL_LINE_CLASS = "rich-editor-rtl-line";
var BidiLineDirectionValue = class {
  constructor(view) {
    this.view = view;
    this.decorations = this.buildDecorations();
  }
  decorations;
  update(update) {
    if (update.docChanged) {
      this.decorations = this.buildDecorations();
    }
  }
  buildDecorations() {
    const lines = [];
    for (let lineNumber = 1; lineNumber <= this.view.state.doc.lines; lineNumber += 1) {
      const line = this.view.state.doc.line(lineNumber);
      if (detectContentDirection(line.text) !== "rtl") continue;
      lines.push(
        import_view.Decoration.line({
          class: RTL_LINE_CLASS,
          attributes: { dir: "rtl" }
        }).range(line.from)
      );
    }
    return lines.length > 0 ? import_view.Decoration.set(lines, true) : import_view.Decoration.none;
  }
};
function createBidiLineDirectionExtension() {
  const plugin = import_view.ViewPlugin.define((view) => new BidiLineDirectionValue(view), {
    decorations: (value) => value.decorations
  });
  return [import_view.EditorView.perLineTextDirection.of(true), plugin];
}

// src/editor/InlineStyleDecorations.ts
var import_view2 = require("@codemirror/view");
var import_state = require("@codemirror/state");

// src/editor/DocumentAppearance.ts
var DOCUMENT_FONT_KEY = "rich-editor-font";
var DOCUMENT_FONT_SIZE_KEY = "rich-editor-font-size";
var DOCUMENT_LINE_HEIGHT_KEY = "rich-editor-line-height";
var DOCUMENT_ALIGNMENT_KEY = "rich-editor-alignment";
var SAFE_CSS_VALUE_RE = /^[\p{L}\p{N}_\s.,'"()#%+-]+$/u;
var CSS_LENGTH_RE = /^(?:\d+(?:\.\d+)?)(?:px|pt|em|rem|%)$/;
var LINE_HEIGHT_RE = /^(?:\d+(?:\.\d+)?)(?:px|pt|em|rem|%)?$/;
function normalizeString(value) {
  if (typeof value !== "string") return void 0;
  const trimmed = value.trim();
  return trimmed.length > 0 && SAFE_CSS_VALUE_RE.test(trimmed) ? trimmed : void 0;
}
function normalizeFontFamily(value) {
  return normalizeString(value);
}
function normalizeFontSize(value) {
  const normalized = normalizeString(value);
  if (!normalized) return void 0;
  return CSS_LENGTH_RE.test(normalized) ? normalized : void 0;
}
var CSS_COLOR_RE = /^(?:#(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)$/i;
function normalizeColor(value) {
  if (typeof value !== "string") return void 0;
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > 50) return void 0;
  return CSS_COLOR_RE.test(normalized) ? normalized.toLowerCase() : void 0;
}
function normalizeLineHeight(value) {
  const normalized = normalizeString(value);
  if (!normalized) return void 0;
  return LINE_HEIGHT_RE.test(normalized) ? normalized : void 0;
}
function normalizeAlignment(value) {
  const normalized = normalizeString(value)?.toLowerCase();
  if (normalized === "left" || normalized === "center" || normalized === "right" || normalized === "justify") {
    return normalized;
  }
  return void 0;
}
function readDocumentAppearanceFromFrontmatter(frontmatter) {
  if (!frontmatter) return {};
  return {
    fontFamily: normalizeFontFamily(frontmatter[DOCUMENT_FONT_KEY]),
    fontSize: normalizeFontSize(frontmatter[DOCUMENT_FONT_SIZE_KEY]),
    lineHeight: normalizeLineHeight(frontmatter[DOCUMENT_LINE_HEIGHT_KEY]),
    alignment: normalizeAlignment(frontmatter[DOCUMENT_ALIGNMENT_KEY])
  };
}
function applyDocumentAppearanceToElement(element, appearance) {
  element.classList.add("rich-editor-document-surface");
  setCssVariable(element, "--rich-editor-font-family", appearance.fontFamily);
  setCssVariable(element, "--rich-editor-font-size", appearance.fontSize);
  setCssVariable(element, "--rich-editor-line-height", appearance.lineHeight);
  setCssVariable(element, "--rich-editor-text-align", appearance.alignment);
}
function setCssVariable(element, name, value) {
  if (value) {
    element.setCssProps({ [name]: value });
  } else {
    element.style.removeProperty(name);
  }
}

// src/editor/InlineTypography.ts
function normalizeInlineTypography(updates) {
  return {
    fontFamily: normalizeFontFamily(updates.fontFamily),
    fontSize: normalizeFontSize(updates.fontSize),
    textColor: normalizeColor(updates.textColor),
    backgroundColor: normalizeColor(updates.backgroundColor)
  };
}
function mergeInlineTypography(current, updates) {
  const next = { ...current };
  if (Object.prototype.hasOwnProperty.call(updates, "fontFamily")) {
    next.fontFamily = normalizeFontFamily(updates.fontFamily) ?? void 0;
  }
  if (Object.prototype.hasOwnProperty.call(updates, "fontSize")) {
    next.fontSize = normalizeFontSize(updates.fontSize) ?? void 0;
  }
  if (Object.prototype.hasOwnProperty.call(updates, "textColor")) {
    next.textColor = normalizeColor(updates.textColor) ?? void 0;
  }
  if (Object.prototype.hasOwnProperty.call(updates, "backgroundColor")) {
    next.backgroundColor = normalizeColor(updates.backgroundColor) ?? void 0;
  }
  return next;
}
function inlineTypographyToCss(typography) {
  const normalized = normalizeInlineTypography(typography);
  const declarations = [];
  if (normalized.fontFamily) declarations.push(`font-family: ${normalized.fontFamily}`);
  if (normalized.fontSize) declarations.push(`font-size: ${normalized.fontSize}`);
  if (normalized.textColor) declarations.push(`color: ${normalized.textColor}`);
  if (normalized.backgroundColor) declarations.push(`background-color: ${normalized.backgroundColor}`);
  return declarations.join("; ");
}
function getInlineTypographyTagType(typography) {
  const norm = normalizeInlineTypography(typography);
  return norm.backgroundColor ? "mark" : "span";
}
function createInlineTypographyOpenTag(typography) {
  const css = inlineTypographyToCss(typography);
  if (!css) return "";
  const tagType = getInlineTypographyTagType(typography);
  return `<${tagType} style="${escapeHtmlAttribute(css)}">`;
}
function wrapInlineTypography(text, typography) {
  if (!text) return { text, contentOffset: 0 };
  const openTag = createInlineTypographyOpenTag(typography);
  if (!openTag) return { text, contentOffset: 0 };
  const tagType = getInlineTypographyTagType(typography);
  return {
    text: `${openTag}${text}</${tagType}>`,
    contentOffset: openTag.length
  };
}
function stripAllInlineTypographyTags(text) {
  const regions = findAllInlineTypographyRegions(text);
  let accumulated = {};
  for (const r of regions) {
    accumulated = mergeInlineTypography(accumulated, r.typography);
  }
  const cleanText = text.replace(/<mark\b[^>]*>/gi, "").replace(/<\/mark\s*>/gi, "").replace(/<span\b[^>]*>/gi, "").replace(/<\/span\s*>/gi, "");
  return { cleanText, accumulatedTypography: accumulated };
}
function findInlineTypographyRegion(text, fromCh, toCh) {
  let best = null;
  for (const region of findAllInlineTypographyRegions(text)) {
    if (fromCh < region.openEnd || toCh > region.close) continue;
    if (!best || region.closeEnd - region.open < best.closeEnd - best.open) best = region;
  }
  return best;
}
function findEnclosingOrOverlappingRegion(text, fromCh, toCh) {
  const regions = findAllInlineTypographyRegions(text);
  if (regions.length === 0) return null;
  if (regions.length === 1 && fromCh >= regions[0].openEnd && toCh <= regions[0].close) {
    const r = regions[0];
    return {
      rangeFrom: r.open,
      rangeTo: r.closeEnd,
      openEnd: r.openEnd,
      close: r.close,
      typography: r.typography,
      isFullEnclosure: true
    };
  }
  const overlapping = regions.filter((r) => Math.max(fromCh, r.open) < Math.min(toCh, r.closeEnd));
  if (overlapping.length > 0) {
    const rangeFrom = Math.min(fromCh, ...overlapping.map((r) => r.open));
    const rangeTo = Math.max(toCh, ...overlapping.map((r) => r.closeEnd));
    let typography = {};
    for (const r of overlapping) {
      typography = mergeInlineTypography(typography, r.typography);
    }
    return {
      rangeFrom,
      rangeTo,
      openEnd: rangeFrom,
      close: rangeTo,
      typography,
      isFullEnclosure: false
    };
  }
  return null;
}
function findAllInlineTypographyRegions(text) {
  const tagPattern = /<(?:mark|span)\b[^>]*>|<\/(?:mark|span)\s*>/gi;
  const stack = [];
  const regions = [];
  let match;
  while ((match = tagPattern.exec(text)) !== null) {
    const tag = match[0];
    const isClosing = /^<\//.test(tag);
    const tagType = (/^<\/?([a-z0-9]+)/i.exec(tag)?.[1] ?? "").toLowerCase();
    if (!isClosing) {
      stack.push({
        tagType,
        open: match.index,
        openEnd: match.index + tag.length,
        typography: parseInlineTypographyTag(tag)
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
      typography: opening.typography
    });
  }
  return regions.sort((a, b) => a.open - b.open);
}
function parseStyleDeclarations(style) {
  const typography = {};
  for (const declaration of style.split(";")) {
    const separator = declaration.indexOf(":");
    if (separator === -1) continue;
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const value = declaration.slice(separator + 1).trim();
    if (property === "font-family") typography.fontFamily = normalizeFontFamily(value);
    if (property === "font-size") typography.fontSize = normalizeFontSize(value);
    if (property === "color") typography.textColor = normalizeColor(value);
    if (property === "background-color" || property === "background") typography.backgroundColor = normalizeColor(value);
  }
  return typography;
}
function parseInlineTypographyTag(tag) {
  const style = readHtmlAttribute(tag, "style");
  if (style !== null) {
    const parsed = parseStyleDeclarations(decodeHtmlAttribute(style));
    if (parsed.fontFamily || parsed.fontSize || parsed.textColor || parsed.backgroundColor) {
      return parsed;
    }
  }
  const typography = {};
  const textColor = readHtmlAttribute(tag, "c");
  if (textColor !== null) typography.textColor = normalizeColor(decodeHtmlAttribute(textColor));
  const backgroundColor = readHtmlAttribute(tag, "b");
  if (backgroundColor !== null) typography.backgroundColor = normalizeColor(decodeHtmlAttribute(backgroundColor));
  const fontFamily = readHtmlAttribute(tag, "f");
  if (fontFamily !== null) typography.fontFamily = normalizeFontFamily(decodeHtmlAttribute(fontFamily));
  const fontSize = readHtmlAttribute(tag, "s");
  if (fontSize !== null) typography.fontSize = normalizeFontSize(decodeHtmlAttribute(fontSize));
  if (/^<mark\b/i.test(tag) && !tag.includes("=")) {
    typography.backgroundColor = "#fef08a";
  }
  return typography.fontFamily || typography.fontSize || typography.textColor || typography.backgroundColor ? typography : null;
}
function readHtmlAttribute(tag, name) {
  const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(tag);
  if (!match) return null;
  return match[1] ?? match[2] ?? "";
}
function escapeHtmlAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function decodeHtmlAttribute(value) {
  return value.replace(/&quot;/gi, '"').replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&");
}

// src/editor/InlineStyleDecorations.ts
var INLINE_STYLE_VISIBILITY_EVENT = "rich-editor-inline-style-visibility";
var HIDDEN_INLINE_MARKUP_PATTERN = /<\/?(?:b|strong|i|em|u|s|strike|del)\b[^>]*>/gi;
var SEMANTIC_MARKUP_PATTERN = /<\/?(b|strong|i|em|u|s|strike|del)\b[^>]*>/gi;
var SEMANTIC_FORMAT_BY_TAG = {
  b: "bold",
  strong: "bold",
  i: "italic",
  em: "italic",
  u: "underline",
  s: "strikethrough",
  strike: "strikethrough",
  del: "strikethrough"
};
var InlineStyleDecorationValue = class {
  constructor(view, deps) {
    this.view = view;
    this.deps = deps;
    this.decorations = this.buildDecorations();
    this.ownerWindow.addEventListener(INLINE_STYLE_VISIBILITY_EVENT, this.handleVisibilityChange);
    this.scheduleLegacyDirectionCleanup();
  }
  decorations;
  destroyed = false;
  legacyCleanupScheduled = false;
  update(update) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations();
      if (update.docChanged) {
        const boundaries = computeTagBoundariesFromDoc(update.state.doc);
        const emptyTags = boundaries.filter((b) => b.openEnd === b.close);
        if (emptyTags.length > 0) {
          void Promise.resolve().then(() => {
            const currentBoundaries = computeTagBoundariesFromDoc(this.view.state.doc);
            const currentEmpty = currentBoundaries.filter((b) => b.openEnd === b.close);
            if (currentEmpty.length > 0) {
              const changes = currentEmpty.map((b) => ({ from: b.open, to: b.closeEnd }));
              this.view.dispatch({ changes, userEvent: "delete.emptyTag" });
            }
          }).catch(() => void 0);
        }
      }
    }
  }
  destroy() {
    this.destroyed = true;
    this.ownerWindow.removeEventListener(INLINE_STYLE_VISIBILITY_EVENT, this.handleVisibilityChange);
  }
  /**
   * One-time migration for notes written by the old source-anchor engine.
   * New formatting never creates these controls, and this deliberately does
   * not run as a document normalizer on every transaction.
   */
  scheduleLegacyDirectionCleanup() {
    if (this.legacyCleanupScheduled) return;
    this.legacyCleanupScheduled = true;
    void Promise.resolve().then(() => {
      if (this.destroyed) return;
      const changes = [];
      for (let lineNumber = 1; lineNumber <= this.view.state.doc.lines; lineNumber += 1) {
        const line = this.view.state.doc.line(lineNumber);
        const cleaned = stripGeneratedDirectionControls(line.text);
        if (cleaned !== line.text) {
          changes.push({ from: line.from, to: line.to, insert: cleaned });
        }
      }
      if (changes.length > 0) {
        this.view.dispatch({ changes, userEvent: "input" });
      }
    }).catch(() => void 0);
  }
  get ownerWindow() {
    return this.view.dom.ownerDocument.defaultView ?? window;
  }
  handleVisibilityChange = () => {
    this.decorations = this.buildDecorations();
    this.view.dispatch({});
  };
  buildDecorations() {
    const ranges = [];
    const hideMarkup = this.deps.isMarkupHidden();
    for (let lineNumber = 1; lineNumber <= this.view.state.doc.lines; lineNumber += 1) {
      const line = this.view.state.doc.line(lineNumber);
      for (const region of findAllInlineTypographyRegions(line.text)) {
        const openEnd = line.from + region.openEnd;
        const close = line.from + region.close;
        const isHighlight = Boolean(region.typography.backgroundColor);
        const markClass = isHighlight ? "rich-editor-inline-styled-text rich-editor-inline-highlight" : "rich-editor-inline-styled-text";
        if (openEnd < close) {
          let css = inlineTypographyToEditorCss(region.typography);
          if (isHighlight) {
            css += "; vertical-align: baseline !important; line-height: inherit !important; border-radius: var(--rich-editor-highlight-radius, 6px); padding: 0.12em 0.42em; margin: 0 0.08em; -webkit-box-decoration-break: clone; box-decoration-break: clone;";
          }
          ranges.push(
            import_view2.Decoration.mark({
              class: markClass,
              attributes: { style: css }
            }).range(openEnd, close)
          );
        }
      }
      for (const mark of findSemanticMarkRanges(line.text)) {
        const from = line.from + mark.openEnd;
        const to = line.from + mark.close;
        if (from >= to) continue;
        ranges.push(
          import_view2.Decoration.mark({
            class: `rich-editor-inline-format rich-editor-inline-${mark.format}`
          }).range(from, to)
        );
      }
    }
    if (hideMarkup) {
      for (const hidden of computeHiddenMarkupRangesFromDoc(this.view.state.doc)) {
        ranges.push(import_view2.Decoration.replace({ inclusive: false }).range(hidden.from, hidden.to));
      }
    }
    ranges.sort((a, b) => a.from - b.from || a.to - b.to);
    return import_view2.Decoration.set(ranges, true);
  }
};
function inlineTypographyToEditorCss(typography) {
  return inlineTypographyToCss(typography).split(";").map((declaration) => declaration.trim()).filter(Boolean).map((declaration) => `${declaration.replace(/\s*!important\s*$/i, "")} !important`).join("; ");
}
function findSemanticMarkRanges(text) {
  const stack = [];
  const ranges = [];
  SEMANTIC_MARKUP_PATTERN.lastIndex = 0;
  let match;
  while ((match = SEMANTIC_MARKUP_PATTERN.exec(text)) !== null) {
    const tagText = match[0];
    const tag = match[1].toLowerCase();
    const format = SEMANTIC_FORMAT_BY_TAG[tag];
    if (!format) continue;
    if (!tagText.startsWith("</")) {
      stack.push({ tag, format, open: match.index, openEnd: match.index + tagText.length });
      continue;
    }
    let openingIndex = -1;
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      if (stack[index].tag === tag) {
        openingIndex = index;
        break;
      }
    }
    if (openingIndex === -1) continue;
    const [opening] = stack.splice(openingIndex, 1);
    if (!opening) continue;
    ranges.push({
      open: opening.open,
      openEnd: opening.openEnd,
      close: match.index,
      closeEnd: match.index + tagText.length,
      format: opening.format
    });
  }
  return ranges;
}
function computeHiddenMarkupRangesFromDoc(doc) {
  const ranges = [];
  for (let lineNumber = 1; lineNumber <= doc.lines; lineNumber += 1) {
    const line = doc.line(lineNumber);
    for (const region of findAllInlineTypographyRegions(line.text)) {
      ranges.push({ from: line.from + region.open, to: line.from + region.openEnd });
      ranges.push({ from: line.from + region.close, to: line.from + region.closeEnd });
    }
    HIDDEN_INLINE_MARKUP_PATTERN.lastIndex = 0;
    let match;
    while ((match = HIDDEN_INLINE_MARKUP_PATTERN.exec(line.text)) !== null) {
      ranges.push({ from: line.from + match.index, to: line.from + match.index + match[0].length });
    }
  }
  const seen = /* @__PURE__ */ new Set();
  const uniqueRanges = ranges.filter((range) => {
    const key = `${range.from}:${range.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return range.from < range.to;
  }).sort((a, b) => a.from - b.from || a.to - b.to);
  const mergedRanges = [];
  for (const range of uniqueRanges) {
    const previous = mergedRanges[mergedRanges.length - 1];
    if (previous && range.from <= previous.to) {
      previous.to = Math.max(previous.to, range.to);
    } else {
      mergedRanges.push({ ...range });
    }
  }
  return mergedRanges;
}
function selectionOutsideHiddenMarkup(selection, ranges) {
  let changed = false;
  const snap = (position) => {
    for (const range of ranges) {
      if (position <= range.from || position >= range.to) continue;
      changed = true;
      return position - range.from <= range.to - position ? range.from : range.to;
    }
    return position;
  };
  const nextRanges = selection.ranges.map(
    (range) => import_state.EditorSelection.range(snap(range.anchor), snap(range.head))
  );
  return changed ? import_state.EditorSelection.create(nextRanges, selection.mainIndex) : null;
}
function computeTagBoundariesFromDoc(doc) {
  const boundaries = [];
  for (let lineNumber = 1; lineNumber <= doc.lines; lineNumber++) {
    const line = doc.line(lineNumber);
    for (const region of findAllInlineTypographyRegions(line.text)) {
      boundaries.push({
        open: line.from + region.open,
        openEnd: line.from + region.openEnd,
        close: line.from + region.close,
        closeEnd: line.from + region.closeEnd
      });
    }
  }
  return boundaries;
}
function createInlineStyleDecorationExtension(deps) {
  const selectionGuard = import_state.EditorState.transactionFilter.of((tr) => {
    const ranges = deps.isMarkupHidden() ? computeHiddenMarkupRangesFromDoc(tr.newDoc) : [];
    const selection = selectionOutsideHiddenMarkup(
      tr.newSelection,
      ranges
    );
    return selection ? [tr, { selection }] : tr;
  });
  const safeDeletionFilter = import_state.EditorState.transactionFilter.of((tr) => {
    if (!deps.isMarkupHidden() || !tr.docChanged || !tr.isUserEvent("delete")) return tr;
    const boundaries = computeTagBoundariesFromDoc(tr.startState.doc);
    if (boundaries.length === 0) return tr;
    let needsRemap = false;
    const remappedChanges = [];
    tr.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
      let handled = false;
      for (const tag of boundaries) {
        if (fromA <= tag.openEnd && toA >= tag.close) {
          needsRemap = true;
          handled = true;
          remappedChanges.push({ from: tag.open, to: tag.closeEnd, insert: inserted.toString() });
          break;
        }
        if (fromA >= tag.open && toA === tag.openEnd && inserted.length === 0) {
          needsRemap = true;
          handled = true;
          if (tag.open > 0) {
            remappedChanges.push({ from: tag.open - 1, to: tag.open, insert: "" });
          }
          break;
        }
        if (fromA === tag.close && toA <= tag.closeEnd && inserted.length === 0) {
          needsRemap = true;
          handled = true;
          if (tag.closeEnd < tr.startState.doc.length) {
            remappedChanges.push({ from: tag.closeEnd, to: tag.closeEnd + 1, insert: "" });
          }
          break;
        }
        if (fromA < tag.openEnd && toA > tag.open && fromA >= tag.open && toA <= tag.openEnd) {
          needsRemap = true;
          handled = true;
          break;
        }
        if (fromA < tag.closeEnd && toA > tag.close && fromA >= tag.close && toA <= tag.closeEnd) {
          needsRemap = true;
          handled = true;
          break;
        }
      }
      if (!handled) {
        remappedChanges.push({ from: fromA, to: toA, insert: inserted.toString() });
      }
    });
    if (!needsRemap) return tr;
    return {
      changes: remappedChanges,
      selection: tr.selection,
      scrollIntoView: true
    };
  });
  const handleBackspace = (view) => {
    if (!deps.isMarkupHidden()) return false;
    const state = view.state;
    const sel = state.selection.main;
    if (!sel.empty) return false;
    const pos = sel.head;
    const boundaries = computeTagBoundariesFromDoc(state.doc);
    if (boundaries.length === 0) return false;
    for (const tag of boundaries) {
      if (pos === tag.openEnd) {
        if (tag.open > 0) {
          view.dispatch({
            changes: { from: tag.open - 1, to: tag.open },
            selection: import_state.EditorSelection.cursor(tag.openEnd - 1),
            scrollIntoView: true,
            userEvent: "delete.backward"
          });
          return true;
        }
        return false;
      }
      if (pos === tag.open) {
        if (tag.open > 0) {
          view.dispatch({
            changes: { from: tag.open - 1, to: tag.open },
            selection: import_state.EditorSelection.cursor(tag.open - 1),
            scrollIntoView: true,
            userEvent: "delete.backward"
          });
          return true;
        }
        return false;
      }
      if (pos === tag.closeEnd) {
        if (tag.close > tag.openEnd) {
          if (tag.close === tag.openEnd + 1) {
            view.dispatch({
              changes: { from: tag.open, to: tag.closeEnd },
              selection: import_state.EditorSelection.cursor(tag.open),
              scrollIntoView: true,
              userEvent: "delete.backward"
            });
            return true;
          }
          view.dispatch({
            changes: { from: tag.close - 1, to: tag.close },
            selection: import_state.EditorSelection.cursor(tag.closeEnd - 1),
            scrollIntoView: true,
            userEvent: "delete.backward"
          });
          return true;
        }
      }
      if (pos === tag.openEnd + 1 && tag.close === tag.openEnd + 1) {
        view.dispatch({
          changes: { from: tag.open, to: tag.closeEnd },
          selection: import_state.EditorSelection.cursor(tag.open),
          scrollIntoView: true,
          userEvent: "delete.backward"
        });
        return true;
      }
    }
    return false;
  };
  const handleDelete = (view) => {
    if (!deps.isMarkupHidden()) return false;
    const state = view.state;
    const sel = state.selection.main;
    if (!sel.empty) return false;
    const pos = sel.head;
    const boundaries = computeTagBoundariesFromDoc(state.doc);
    if (boundaries.length === 0) return false;
    for (const tag of boundaries) {
      if (pos === tag.close) {
        if (tag.closeEnd < state.doc.length) {
          view.dispatch({
            changes: { from: tag.closeEnd, to: tag.closeEnd + 1 },
            selection: import_state.EditorSelection.cursor(tag.close),
            scrollIntoView: true,
            userEvent: "delete.forward"
          });
          return true;
        }
        return false;
      }
      if (pos === tag.closeEnd) {
        if (tag.closeEnd < state.doc.length) {
          view.dispatch({
            changes: { from: tag.closeEnd, to: tag.closeEnd + 1 },
            selection: import_state.EditorSelection.cursor(tag.closeEnd),
            scrollIntoView: true,
            userEvent: "delete.forward"
          });
          return true;
        }
        return true;
      }
      if (pos === tag.open) {
        if (tag.openEnd < tag.close) {
          if (tag.openEnd + 1 === tag.close) {
            view.dispatch({
              changes: { from: tag.open, to: tag.closeEnd },
              selection: import_state.EditorSelection.cursor(tag.open),
              scrollIntoView: true,
              userEvent: "delete.forward"
            });
            return true;
          }
          view.dispatch({
            changes: { from: tag.openEnd, to: tag.openEnd + 1 },
            selection: import_state.EditorSelection.cursor(tag.open),
            scrollIntoView: true,
            userEvent: "delete.forward"
          });
          return true;
        }
      }
    }
    return false;
  };
  const richEditorKeymap = import_state.Prec.highest(
    import_view2.keymap.of([
      { key: "Backspace", run: handleBackspace },
      { key: "Delete", run: handleDelete }
    ])
  );
  const plugin = import_view2.ViewPlugin.define((view) => new InlineStyleDecorationValue(view, deps), {
    decorations: (value) => value.decorations
  });
  const atomicRangesExtension = import_view2.EditorView.atomicRanges.of((view) => {
    const ranges = (deps.isMarkupHidden() ? computeHiddenMarkupRangesFromDoc(view.state.doc) : []).map(
      (range) => import_view2.Decoration.replace({ inclusive: false }).range(range.from, range.to)
    );
    return ranges.length > 0 ? import_view2.Decoration.set(ranges, true) : import_view2.Decoration.none;
  });
  return [
    richEditorKeymap,
    import_state.Prec.highest(selectionGuard),
    import_state.Prec.highest(safeDeletionFilter),
    atomicRangesExtension,
    plugin
  ];
}

// src/ui/toolbar/SelectionToolbar.ts
var import_obsidian = require("obsidian");
var import_view3 = require("@codemirror/view");
var SelectionToolbarValue = class {
  constructor(view, deps) {
    this.view = view;
    this.deps = deps;
    this.toolbarEl = this.buildToolbar();
  }
  toolbarEl;
  scheduled = false;
  activeFormats = null;
  update(update) {
    if (update.selectionSet || update.docChanged || update.geometryChanged || update.focusChanged) {
      this.schedulePosition();
    }
  }
  destroy() {
    this.toolbarEl.remove();
  }
  schedulePosition() {
    if (this.scheduled) return;
    this.scheduled = true;
    this.ownerWindow.requestAnimationFrame(() => {
      this.scheduled = false;
      this.position();
    });
  }
  position() {
    const selection = this.view.state.selection.main;
    if (!this.deps.isEnabled() || selectionShouldHide(selection.empty, this.view.hasFocus, this.toolbarEl)) {
      this.hide();
      return;
    }
    const head = this.view.coordsAtPos(selection.from);
    if (!head) {
      this.hide();
      return;
    }
    const editorRect = this.view.dom.getBoundingClientRect();
    this.toolbarEl.addClass("is-visible");
    const toolbarRect = this.toolbarEl.getBoundingClientRect();
    let left = head.left - editorRect.left;
    let top = head.top - editorRect.top - toolbarRect.height - 8;
    left = Math.max(8, Math.min(left, editorRect.width - toolbarRect.width - 8));
    if (top < 4) top = head.bottom - editorRect.top + 8;
    this.toolbarEl.setCssProps({
      left: `${left}px`,
      top: `${top}px`
    });
    this.updateActiveStates();
  }
  hide() {
    this.toolbarEl.removeClass("is-visible");
  }
  buildToolbar() {
    const toolbar = this.view.dom.createDiv({ cls: "rich-editor-selection-toolbar" });
    toolbar.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    this.addIconButton(toolbar, "bold", "Bold (Ctrl/Cmd+B)", () => this.mark("bold"), "bold");
    this.addIconButton(toolbar, "italic", "Italic (Ctrl/Cmd+I)", () => this.mark("italic"), "italic");
    this.addIconButton(toolbar, "underline", "Underline (Ctrl/Cmd+U)", () => this.mark("underline"), "underline");
    this.addIconButton(toolbar, "strikethrough", "Strikethrough", () => this.mark("strikethrough"), "strikethrough");
    this.divider(toolbar);
    this.addIconButton(toolbar, "heading", "Heading", (event) => this.openHeadingMenu(event));
    this.addIconButton(toolbar, "list", "Bullet list", () => this.withEditor((editor) => this.deps.controller.toggleBulletList(editor)));
    this.addIconButton(toolbar, "list-ordered", "Numbered list", () => this.withEditor((editor) => this.deps.controller.toggleNumberedList(editor)));
    this.addIconButton(toolbar, "quote", "Blockquote", () => this.withEditor((editor) => this.deps.controller.toggleBlockquote(editor)));
    this.divider(toolbar);
    this.addIconButton(toolbar, "eraser", "Clear formatting", () => this.withEditor((editor) => this.deps.controller.clearFormatting(editor)));
    return toolbar;
  }
  get ownerWindow() {
    return this.view.dom.ownerDocument.defaultView ?? window;
  }
  addIconButton(parent, icon, label, onClick, stateId) {
    const button = parent.createEl("button", {
      cls: "rich-editor-selection-btn clickable-icon",
      attr: { "aria-label": label, ...stateId ? { "data-state-id": stateId } : {} }
    });
    (0, import_obsidian.setIcon)(button, icon);
    button.addEventListener("click", (event) => onClick(event));
  }
  divider(parent) {
    parent.createDiv({ cls: "rich-editor-tb-divider" });
  }
  withEditor(action) {
    const view = this.deps.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (view) {
      action(view.editor);
      this.schedulePosition();
    }
  }
  mark(mark) {
    this.withEditor((editor) => this.deps.controller.toggleMark(editor, mark));
  }
  openHeadingMenu(event) {
    const menu = new import_obsidian.Menu();
    for (let level = 1; level <= 3; level += 1) {
      menu.addItem(
        (item) => item.setTitle(`Heading ${level}`).setIcon(`heading-${level}`).onClick(
          () => this.withEditor((editor) => this.deps.controller.setHeading(editor, level))
        )
      );
    }
    menu.addSeparator();
    menu.addItem(
      (item) => item.setTitle("Normal text").setIcon("pilcrow").onClick(() => this.withEditor((editor) => this.deps.controller.setHeading(editor, 0)))
    );
    menu.showAtMouseEvent(event);
  }
  updateActiveStates() {
    const view = this.deps.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (!view) return;
    this.activeFormats = this.deps.controller.getFormatsAt(view.editor);
    const states = {
      bold: this.activeFormats.bold,
      italic: this.activeFormats.italic,
      underline: this.activeFormats.underline,
      strikethrough: this.activeFormats.strikethrough
    };
    this.toolbarEl.querySelectorAll("[data-state-id]").forEach((button) => {
      const stateId = button.getAttr("data-state-id");
      if (!stateId) return;
      const isActive = !!states[stateId];
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }
};
function selectionShouldHide(selectionEmpty, hasFocus, toolbarEl) {
  return selectionEmpty || !hasFocus && !toolbarEl.matches(":hover");
}
function createSelectionToolbarExtension(deps) {
  return import_view3.ViewPlugin.define((view) => new SelectionToolbarValue(view, deps));
}

// src/editor/RichEditorExtensions.ts
function buildRichEditorExtensions(deps) {
  const toggleShortcut = (mark) => {
    const editor = deps.controller.getActiveEditor();
    if (!editor) return false;
    deps.controller.toggleMark(editor, mark);
    return true;
  };
  const formattingShortcutKeymap = import_state2.Prec.highest(
    import_view4.keymap.of([
      { key: "Mod-b", run: () => toggleShortcut("bold") },
      { key: "Mod-i", run: () => toggleShortcut("italic") },
      { key: "Mod-u", run: () => toggleShortcut("underline") },
      { key: "Mod-Shift-s", run: () => toggleShortcut("strikethrough") }
    ])
  );
  return [
    formattingShortcutKeymap,
    createBidiLineDirectionExtension(),
    createInlineStyleDecorationExtension({
      isMarkupHidden: deps.isMarkupHidden
    }),
    createSelectionToolbarExtension({
      app: deps.app,
      controller: deps.controller,
      isEnabled: deps.isToolbarEnabled
    })
  ];
}

// src/editor/FormattingController.ts
var import_obsidian2 = require("obsidian");
var MARK_DELIMS = {
  bold: { pre: "**", post: "**" },
  italic: { pre: "*", post: "*" },
  strikethrough: { pre: "~~", post: "~~" },
  highlight: { pre: "==", post: "==" }
};
var HTML_MARKS = {
  bold: { open: "<b>", close: "</b>", names: ["b", "strong"] },
  italic: { open: "<i>", close: "</i>", names: ["i", "em"] },
  underline: { open: "<u>", close: "</u>", names: ["u"] },
  strikethrough: { open: "<s>", close: "</s>", names: ["s", "strike", "del"] },
  highlight: { open: "<mark>", close: "</mark>", names: ["mark"] }
};
var FormattingController = class {
  constructor(app) {
    this.app = app;
  }
  getActiveEditor() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian2.MarkdownView);
    return view?.editor ?? null;
  }
  toggleMark(editor, mark) {
    let selection = this.expandedSelection(editor);
    if (selection.from.line === selection.to.line) {
      const clamped = clampSegmentToBlockContent(
        editor.getLine(selection.from.line),
        selection.from.ch,
        selection.to.ch
      );
      selection = {
        from: { line: selection.from.line, ch: clamped.fromCh },
        to: { line: selection.to.line, ch: clamped.toCh }
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
      if (typographyRegion && (this.migrateLegacyMarkdownInsideTypography(editor, selection.from.line, typographyRegion, selection) || this.migrateLegacyMarkdownAroundTypography(editor, selection.from.line, typographyRegion, selection))) {
        this.toggleMark(editor, mark);
        return;
      }
    }
    const rawFrom = editor.getCursor("from");
    const rawTo = editor.getCursor("to");
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
        const cursorOffset2 = isCursorEmpty ? formatted.contentOffset + Math.max(0, Math.min(initialCh - leadingControl, contentText.length)) : void 0;
        this.replaceAndSelect(
          editor,
          { line: selection.from.line, ch: leadingControl },
          { line: selection.to.line, ch: envelope.to },
          formatted.text,
          formatted.contentOffset,
          formatted.contentOffset + contentText.length,
          cursorOffset2
        );
        return;
      }
    }
    if (mark === "underline") {
      this.toggleUnderline(editor);
      return;
    }
    if (selection.from.line !== selection.to.line) {
      const { pre: pre2, post: post2 } = MARK_DELIMS[mark];
      this.toggleWrapperAcrossLines(editor, selection, { pre: pre2, post: post2 }, false);
      return;
    }
    const { pre, post } = MARK_DELIMS[mark];
    if (isActive && text.startsWith(pre) && text.endsWith(post) && text.length >= pre.length + post.length) {
      const unwrapped = text.slice(pre.length, text.length - post.length);
      const cursorOffset2 = isCursorEmpty ? Math.max(0, Math.min(initialCh - selection.from.ch - pre.length, unwrapped.length)) : void 0;
      this.replaceAndSelect(editor, selection.from, selection.to, unwrapped, 0, unwrapped.length, cursorOffset2);
      return;
    }
    const before = editor.getRange(
      { line: selection.from.line, ch: Math.max(0, selection.from.ch - pre.length) },
      selection.from
    );
    const after = editor.getRange(selection.to, { line: selection.to.line, ch: selection.to.ch + post.length });
    if (isActive && before === pre && after === post) {
      const cursorOffset2 = isCursorEmpty ? Math.max(0, Math.min(initialCh - selection.from.ch, text.length)) : void 0;
      this.replaceAndSelect(
        editor,
        { line: selection.from.line, ch: selection.from.ch - pre.length },
        { line: selection.to.line, ch: selection.to.ch + post.length },
        text,
        0,
        text.length,
        cursorOffset2
      );
      return;
    }
    if (isActive && selection.from.line === selection.to.line) {
      const lineText = editor.getLine(selection.from.line);
      const region = this.findMarkRegion(lineText, pre, selection.from.ch, selection.to.ch, "contain");
      if (region) {
        this.splitMarkRegion(editor, selection.from.line, region, { pre, post }, selection.from.ch, selection.to.ch, (value) => value);
        return;
      }
    }
    const replacement = `${pre}${text}${post}`;
    const cursorOffset = isCursorEmpty ? pre.length + Math.max(0, Math.min(initialCh - selection.from.ch, text.length)) : void 0;
    this.replaceAndSelect(editor, selection.from, selection.to, replacement, pre.length, pre.length + text.length, cursorOffset);
  }
  setHeading(editor, level) {
    const line = editor.getCursor().line;
    const text = editor.getLine(line);
    const stripped = text.replace(/^#{1,6}\s+/, "");
    const prefix = level > 0 ? `${"#".repeat(level)} ` : "";
    editor.replaceRange(prefix + stripped, { line, ch: 0 }, { line, ch: text.length });
  }
  toggleBulletList(editor) {
    this.toggleLinePrefix(editor, /^-\s+/, "- ");
  }
  toggleBlockquote(editor) {
    this.toggleLinePrefix(editor, /^>\s?/, "> ");
  }
  toggleNumberedList(editor) {
    const { startLine, endLine } = this.getSelectedLineRange(editor);
    const lines = this.getLines(editor, startLine, endLine);
    const allNumbered = lines.every((line) => line.trim() === "" || /^\d+\.\s+/.test(line));
    const updated = allNumbered ? lines.map((line) => line.replace(/^\d+\.\s+/, "")) : (() => {
      let index = 1;
      return lines.map((line) => {
        if (line.trim() === "") return line;
        const withoutPrefix = line.replace(/^\d+\.\s+/, "");
        const next = `${index}. ${withoutPrefix}`;
        index += 1;
        return next;
      });
    })();
    this.replaceLines(editor, startLine, endLine, updated);
  }
  clearFormatting(editor) {
    const selection = this.expandedSelection(editor);
    if (!this.hasText(editor, selection)) return;
    if (selection.from.line === selection.to.line) {
      const lineText = editor.getLine(selection.from.line);
      let expandFrom = selection.from.ch;
      let expandTo = selection.to.ch;
      let changed = true;
      while (changed) {
        changed = false;
        const envelope = this.getFormattingEnvelope(lineText, expandFrom, expandTo);
        if (envelope.from < expandFrom || envelope.to > expandTo) {
          expandFrom = envelope.from;
          expandTo = envelope.to;
          changed = true;
        }
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
      const rawText2 = stripGeneratedDirectionControls(lineText.slice(expandFrom, expandTo));
      let plain2 = rawText2.replace(/<[^>]+>/g, "");
      plain2 = this.stripInlineMarks(plain2);
      plain2 = stripGeneratedDirectionControls(plain2);
      if (plain2 !== rawText2) {
        this.replaceAndSelect(
          editor,
          { line: selection.from.line, ch: expandFrom },
          { line: selection.to.line, ch: expandTo },
          plain2,
          0,
          plain2.length
        );
      }
      return;
    }
    const rawText = stripGeneratedDirectionControls(editor.getRange(selection.from, selection.to));
    let plain = rawText.replace(/<[^>]+>/g, "");
    plain = this.stripInlineMarks(plain);
    plain = stripGeneratedDirectionControls(plain);
    if (plain !== rawText) {
      this.replaceAndSelect(editor, selection.from, selection.to, plain, 0, plain.length);
    }
  }
  getSelectionRange(editor) {
    return this.expandedSelection(editor);
  }
  getInlineTypography(editor, selection = this.expandedSelection(editor)) {
    const startLine = Math.min(selection.from.line, selection.to.line);
    const endLine = Math.max(selection.from.line, selection.to.line);
    let common = null;
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
      for (const property of ["fontFamily", "fontSize", "textColor", "backgroundColor"]) {
        if (common[property] !== current[property]) delete common[property];
      }
    }
    return common ?? {};
  }
  setInlineTypography(editor, updates, selection = this.expandedSelection(editor)) {
    const rawFrom = editor.getCursor("from");
    const rawTo = editor.getCursor("to");
    const isCursorEmpty = rawFrom.line === rawTo.line && rawFrom.ch === rawTo.ch;
    const initialCh = rawFrom.ch;
    if (!this.hasText(editor, selection)) {
      new import_obsidian2.Notice("Select a passage first.");
      return;
    }
    const safeUpdates = {};
    if (Object.prototype.hasOwnProperty.call(updates, "fontFamily")) {
      const value = updates.fontFamily?.trim() ?? "";
      const normalized = normalizeInlineTypography({ fontFamily: value }).fontFamily;
      if (value && !normalized) {
        new import_obsidian2.Notice("That font family cannot be stored safely.");
        return;
      }
      safeUpdates.fontFamily = normalized ?? "";
    }
    if (Object.prototype.hasOwnProperty.call(updates, "fontSize")) {
      const value = updates.fontSize?.trim() ?? "";
      const normalized = normalizeInlineTypography({ fontSize: value }).fontSize;
      if (value && !normalized) {
        new import_obsidian2.Notice("Use a font size such as 18px, 1.2em, or 120%.");
        return;
      }
      safeUpdates.fontSize = normalized ?? "";
    }
    for (const property of ["textColor", "backgroundColor"]) {
      if (!Object.prototype.hasOwnProperty.call(updates, property)) continue;
      const value = updates[property]?.trim() ?? "";
      const normalized = normalizeInlineTypography({ [property]: value })[property];
      if (value && !normalized) {
        new import_obsidian2.Notice("Choose a valid hexadecimal color.");
        return;
      }
      safeUpdates[property] = normalized ?? "";
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
  setInlineTypographyOnLine(editor, line, fromCh, toCh, safeUpdates, cursor, restoreSelection = true) {
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
          selectionEnd: toCh
        };
      }
      const envelope = this.getFormattingEnvelope(lineText, fromCh, toCh);
      const envelopeSlice = stripLeadingDirectionControls(lineText.slice(envelope.from, envelope.to));
      const { cleanText: cleanText2, accumulatedTypography: accumulatedTypography2 } = stripAllInlineTypographyTags(envelopeSlice);
      const legacyMarks = this.markdownMarksOnly(envelope.marks);
      const canonicalContent = this.applyHtmlMarkSet(
        this.unwrapMarkdownMarkSet(cleanText2, legacyMarks),
        legacyMarks
      );
      const finalTypography2 = mergeInlineTypography(accumulatedTypography2, safeUpdates);
      const wrapped2 = wrapInlineTypography(canonicalContent, finalTypography2);
      if (!wrapped2.text) {
        return {
          delta: 0,
          replaceFrom: fromCh,
          replaceTo: toCh,
          sourceFrom: fromCh,
          sourceTo: toCh,
          selectionStart: fromCh,
          selectionEnd: toCh
        };
      }
      const leadingControl2 = getLeadingDirectionControlStart(lineText, envelope.from);
      const replacement2 = wrapped2.text;
      const plainWord = stripLeadingDirectionControls(this.stripInlineMarks(cleanText2.replace(/<[^>]+>/g, "")));
      const innerOffset = canonicalContent.indexOf(plainWord);
      const selectedStart = wrapped2.contentOffset + (innerOffset >= 0 ? innerOffset : 0);
      const selectedEnd = selectedStart + (plainWord.length > 0 ? plainWord.length : canonicalContent.length);
      const cursorOffset2 = cursor.isCursorEmpty ? selectedStart + Math.max(0, Math.min(cursor.initialCh - leadingControl2, plainWord.length)) : void 0;
      this.replaceAndSelect(
        editor,
        { line, ch: leadingControl2 },
        { line, ch: envelope.to },
        replacement2,
        selectedStart,
        selectedEnd,
        cursorOffset2,
        restoreSelection
      );
      return {
        delta: replacement2.length - (envelope.to - leadingControl2),
        replaceFrom: leadingControl2,
        replaceTo: envelope.to,
        sourceFrom: fromCh,
        sourceTo: toCh,
        selectionStart: leadingControl2 + selectedStart,
        selectionEnd: leadingControl2 + selectedEnd
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
      const leadingControl2 = getLeadingDirectionControlStart(lineText, region.rangeFrom);
      const replacement2 = combined;
      const selectedStart = left.text.length + selected.contentOffset;
      const cursorOffset2 = cursor.isCursorEmpty ? selectedStart + Math.max(0, Math.min(cursor.initialCh - from, cleanSelected.length)) : void 0;
      this.replaceAndSelect(
        editor,
        { line, ch: leadingControl2 },
        { line, ch: region.rangeTo },
        replacement2,
        selectedStart,
        selectedStart + cleanSelected.length,
        cursorOffset2,
        restoreSelection
      );
      return {
        delta: replacement2.length - (region.rangeTo - leadingControl2),
        replaceFrom: leadingControl2,
        replaceTo: region.rangeTo,
        sourceFrom: fromCh,
        sourceTo: toCh,
        selectionStart: leadingControl2 + selectedStart,
        selectionEnd: leadingControl2 + selectedStart + cleanSelected.length
      };
    }
    const leadingControl = getLeadingDirectionControlStart(lineText, region.rangeFrom);
    const targetSlice = stripLeadingDirectionControls(lineText.slice(leadingControl, region.rangeTo));
    const { cleanText, accumulatedTypography } = stripAllInlineTypographyTags(targetSlice);
    const finalTypography = mergeInlineTypography(
      mergeInlineTypography(region.typography, accumulatedTypography),
      safeUpdates
    );
    const wrapped = wrapInlineTypography(cleanText, finalTypography);
    const replacement = wrapped.text;
    const cursorOffset = cursor.isCursorEmpty ? wrapped.contentOffset + Math.max(0, Math.min(cursor.initialCh - leadingControl, cleanText.length)) : void 0;
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
      selectionEnd: leadingControl + wrapped.contentOffset + cleanText.length
    };
  }
  /**
   * Applies passage typography independently to each affected source line.
   * This avoids invalid inline tags spanning Markdown paragraphs/newlines.
   */
  setInlineTypographyAcrossLines(editor, selection, safeUpdates) {
    const startLine = Math.min(selection.from.line, selection.to.line);
    const endLine = Math.max(selection.from.line, selection.to.line);
    const changes = /* @__PURE__ */ new Map();
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
    const mapEndpoint = (position, endpoint) => {
      const change = changes.get(position.line);
      if (!change || change.delta === 0) return { ...position };
      if (position.ch < change.sourceFrom) return { ...position };
      if (position.ch > change.sourceTo) {
        return { line: position.line, ch: Math.max(0, position.ch + change.delta) };
      }
      if (endpoint === "from" && position.ch === change.sourceFrom) {
        return { line: position.line, ch: change.selectionStart };
      }
      if (endpoint === "to" && position.ch === change.sourceTo) {
        return { line: position.line, ch: change.selectionEnd };
      }
      const sourceLength = Math.max(1, change.sourceTo - change.sourceFrom);
      const outputLength = Math.max(0, change.selectionEnd - change.selectionStart);
      const offset = Math.max(0, Math.min(position.ch - change.sourceFrom, sourceLength));
      return {
        line: position.line,
        ch: change.selectionStart + Math.min(outputLength, Math.round(offset / sourceLength * outputLength))
      };
    };
    const from = mapEndpoint(selection.from, "from");
    const to = mapEndpoint(selection.to, "to");
    if (from.line === to.line && from.ch === to.ch) editor.setCursor(from);
    else editor.setSelection(from, to);
    this.restoreEditorFocus(editor);
  }
  getFormatsAt(editor) {
    const selection = this.expandedSelection(editor);
    const lineText = editor.getLine(selection.from.line);
    const sameLine = selection.from.line === selection.to.line;
    const selectedText = sameLine ? lineText.slice(selection.from.ch, selection.to.ch) : editor.getRange(selection.from, selection.to);
    const before = sameLine ? lineText.slice(0, selection.from.ch) : "";
    const after = sameLine ? lineText.slice(selection.to.ch) : "";
    const count = (text, token) => text.split(token).length - 1;
    const enclosed = (delimiter) => count(before, delimiter) % 2 === 1 && count(after, delimiter) % 2 === 1 || selectedText.startsWith(delimiter) && selectedText.endsWith(delimiter) && selectedText.length >= delimiter.length * 2;
    const beforeNoBold = before.replace(/\*\*/g, "");
    const afterNoBold = after.replace(/\*\*/g, "");
    const selectionNoBold = selectedText.replace(/\*\*/g, "");
    const hasHtmlTag = (openPattern, closePattern, beforeText = before, selected = selectedText) => {
      if (openPattern.test(selected) && closePattern.test(selected)) return true;
      const countOpen = (beforeText.match(openPattern) ?? []).length;
      const countClose = (beforeText.match(closePattern) ?? []).length;
      return countOpen > countClose;
    };
    const underlineRegion = sameLine ? this.findTagRegion(lineText, "<u>", "</u>", selection.from.ch, selection.to.ch, "contain") : null;
    let isBold = enclosed("**") || hasHtmlTag(/<(?:b|strong)\b[^>]*>/i, /<\/(?:b|strong)>/i);
    let isItalic = count(beforeNoBold, "*") % 2 === 1 && count(afterNoBold, "*") % 2 === 1 || selectionNoBold.startsWith("*") && selectionNoBold.endsWith("*") && selectionNoBold.length >= 2 || hasHtmlTag(/<(?:i|em)\b[^>]*>/i, /<\/(?:i|em)>/i);
    let isUnderline = underlineRegion !== null || this.countTag(before, "<u>") > this.countTag(before, "</u>") || selectedText.includes("<u>") && selectedText.includes("</u>") || hasHtmlTag(/<u\b[^>]*>/i, /<\/u>/i);
    let isStrikethrough = enclosed("~~") || hasHtmlTag(/<(?:s|strike|del)\b[^>]*>/i, /<\/(?:s|strike|del)>/i);
    let isHighlight = enclosed("==") || hasHtmlTag(/<mark\b[^>]*>/i, /<\/mark>/i);
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
      highlight: isHighlight
    };
  }
  async setDocumentFont(file, fontFamily) {
    await this.setDocumentAppearance(file, { fontFamily });
  }
  async setDocumentAppearance(file, updates) {
    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      const frontmatterRecord = frontmatter !== null && typeof frontmatter === "object" ? frontmatter : {};
      this.writeFrontmatterValue(frontmatterRecord, DOCUMENT_FONT_KEY, updates, "fontFamily");
      this.writeFrontmatterValue(frontmatterRecord, DOCUMENT_FONT_SIZE_KEY, updates, "fontSize");
      this.writeFrontmatterValue(frontmatterRecord, DOCUMENT_LINE_HEIGHT_KEY, updates, "lineHeight");
      this.writeFrontmatterValue(frontmatterRecord, DOCUMENT_ALIGNMENT_KEY, updates, "alignment");
    });
  }
  writeFrontmatterValue(frontmatter, key, updates, property) {
    if (!Object.prototype.hasOwnProperty.call(updates, property)) return;
    const value = updates[property];
    if (typeof value === "string" && value.trim().length > 0) {
      frontmatter[key] = value.trim();
    } else {
      delete frontmatter[key];
    }
  }
  findTypographyRegionForMark(lineText, fromCh, toCh, mark) {
    const regions = findAllInlineTypographyRegions(lineText).filter((region) => {
      const selectionIsInsideContent = fromCh >= region.openEnd && toCh <= region.close;
      const selectionIsExactlyWholeContainer = fromCh === region.open && toCh === region.closeEnd;
      return selectionIsInsideContent || selectionIsExactlyWholeContainer;
    }).sort((a, b) => a.closeEnd - a.open - (b.closeEnd - b.open));
    if (regions.length === 0) return null;
    if (mark === "highlight") {
      const nonHighlightContainer = regions.find(
        (region) => !/^<mark\b/i.test(lineText.slice(region.open, region.openEnd))
      );
      if (nonHighlightContainer) return nonHighlightContainer;
    }
    return regions[0];
  }
  migrateLegacyMarkdownInsideTypography(editor, line, typographyRegion, selection) {
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
  migrateLegacyMarkdownAroundTypography(editor, line, typographyRegion, selection) {
    const lineText = editor.getLine(line);
    const marks = /* @__PURE__ */ new Set();
    let rangeFrom = typographyRegion.open;
    let rangeTo = typographyRegion.closeEnd;
    let foundWrapper = true;
    while (foundWrapper) {
      foundWrapper = false;
      for (const mark of ["bold", "strikethrough", "highlight", "italic"]) {
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
  markdownMarksOnly(marks) {
    const markdownMarks = /* @__PURE__ */ new Set();
    for (const mark of ["bold", "italic", "strikethrough", "highlight"]) {
      if (marks.has(mark)) markdownMarks.add(mark);
    }
    return markdownMarks;
  }
  unwrapMarkdownMarkSet(text, marks) {
    let result = text;
    for (const mark of ["bold", "strikethrough", "highlight", "italic"]) {
      if (!marks.has(mark)) continue;
      const { pre, post } = MARK_DELIMS[mark];
      if (result.startsWith(pre) && result.endsWith(post) && result.length >= pre.length + post.length) {
        result = result.slice(pre.length, result.length - post.length);
      }
    }
    return result;
  }
  applyHtmlMarkSet(text, marks) {
    let result = text;
    for (const mark of ["italic", "bold", "underline", "strikethrough", "highlight"]) {
      if (!marks.has(mark)) continue;
      const definition = HTML_MARKS[mark];
      result = `${definition.open}${result}${definition.close}`;
    }
    return result;
  }
  toggleMarkAcrossTypographySelection(editor, selection, mark, removeMark) {
    if (selection.from.line !== selection.to.line) return false;
    const line = selection.from.line;
    const lineText = editor.getLine(line);
    const regions = findAllInlineTypographyRegions(lineText).filter((region) => selection.from.ch <= region.open && selection.to.ch >= region.closeEnd).sort((a, b) => a.open - b.open);
    if (regions.length === 0) return false;
    const definition = HTML_MARKS[mark];
    const stripTargetMark = (text) => {
      const tagPattern = new RegExp(`</?(?:${definition.names.join("|")})\\b[^>]*>`, "gi");
      let result = text.replace(tagPattern, "");
      if (mark !== "underline") {
        const { pre } = MARK_DELIMS[mark];
        result = result.split(pre).join("");
      }
      return result;
    };
    const transform = (text) => removeMark ? stripTargetMark(text) : `${definition.open}${text}${definition.close}`;
    let cursor = selection.from.ch;
    let replacement = "";
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
  toggleMarkInsideTypography(editor, line, typographyRegion, selectionFrom, selectionTo, mark, isActive, isCursorEmpty, initialCh) {
    const lineText = editor.getLine(line);
    const innerStart = typographyRegion.openEnd;
    const innerEnd = typographyRegion.close;
    const innerText = lineText.slice(innerStart, innerEnd);
    const from = Math.min(Math.max(selectionFrom - innerStart, 0), innerText.length);
    const to = Math.min(Math.max(selectionTo - innerStart, from), innerText.length);
    const definition = HTML_MARKS[mark];
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
    const markdown = mark === "underline" ? null : MARK_DELIMS[mark];
    const markdownRegion = markdown ? this.findMarkRegion(innerText, markdown.pre, from, to, "contain") : null;
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
          closeTag: markdown.post
        },
        from,
        to,
        isCursorEmpty,
        initialCh
      );
      return;
    }
    if (isActive) {
      let unwrapped = innerText.slice(from, to);
      const htmlPattern = new RegExp(`</?(?:${definition.names.join("|")})\\b[^>]*>`, "gi");
      unwrapped = unwrapped.replace(htmlPattern, "");
      if (markdown && unwrapped === innerText.slice(from, to)) {
        if (unwrapped.startsWith(markdown.pre) && unwrapped.endsWith(markdown.post)) {
          unwrapped = unwrapped.slice(markdown.pre.length, unwrapped.length - markdown.post.length);
        }
      }
      if (unwrapped !== innerText.slice(from, to)) {
        const cursorOffset2 = isCursorEmpty ? Math.max(0, Math.min(initialCh - (innerStart + from), unwrapped.length)) : void 0;
        this.replaceAndSelect(
          editor,
          { line, ch: innerStart + from },
          { line, ch: innerStart + to },
          unwrapped,
          0,
          unwrapped.length,
          cursorOffset2
        );
      }
      return;
    }
    const selected = innerText.slice(from, to);
    const replacement = `${definition.open}${selected}${definition.close}`;
    const cursorOffset = isCursorEmpty ? definition.open.length + Math.max(0, Math.min(initialCh - (innerStart + from), selected.length)) : void 0;
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
  replaceInlineMarkRegion(editor, line, innerStart, innerText, region, selectionFrom, selectionTo, isCursorEmpty, initialCh) {
    const from = Math.min(Math.max(selectionFrom, region.openEnd), region.close);
    const to = Math.min(Math.max(selectionTo, from), region.close);
    const fullContent = innerText.slice(region.openEnd, region.close);
    const selected = innerText.slice(from, to);
    if (this.visibleInlineText(fullContent) === this.visibleInlineText(selected)) {
      const selectionStart2 = from - region.openEnd;
      const selectionEnd2 = to - region.openEnd;
      const cursorOffset2 = isCursorEmpty ? selectionStart2 + Math.max(0, Math.min(initialCh - (innerStart + from), selected.length)) : void 0;
      this.replaceAndSelect(
        editor,
        { line, ch: innerStart + region.open },
        { line, ch: innerStart + region.closeEnd },
        fullContent,
        selectionStart2,
        selectionEnd2,
        cursorOffset2
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
    const cursorOffset = isCursorEmpty ? selectionStart + Math.max(0, Math.min(initialCh - (innerStart + from), selected.length)) : void 0;
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
  wrapHtmlMarkSide(part, openTag, closeTag) {
    const visibleText2 = this.visibleInlineText(part);
    if (visibleText2.length === 0) return "";
    if (!visibleText2.trim()) return visibleText2;
    return `${openTag}${part}${closeTag}`;
  }
  visibleInlineText(text) {
    return text.replace(/<[^>]+>/g, "");
  }
  balancedHtmlFragment(text, rawFrom, rawTo) {
    const from = Math.max(0, Math.min(rawFrom, text.length));
    const to = Math.max(from, Math.min(rawTo, text.length));
    const stack = [];
    const tagPattern = /<\/?([a-z][a-z0-9-]*)(?:\s[^>]*)?>/gi;
    let match;
    while ((match = tagPattern.exec(text)) !== null) {
      if (match.index + match[0].length > from) break;
      this.updateHtmlTagStack(stack, match[0], match[1].toLowerCase());
    }
    const prefix = stack.map((entry) => entry.openTag).join("");
    const rawContent = text.slice(from, to);
    tagPattern.lastIndex = 0;
    while ((match = tagPattern.exec(rawContent)) !== null) {
      this.updateHtmlTagStack(stack, match[0], match[1].toLowerCase());
    }
    const suffix = [...stack].reverse().map((entry) => `</${entry.name}>`).join("");
    return {
      text: prefix + rawContent + suffix,
      contentStart: prefix.length,
      contentEnd: prefix.length + rawContent.length
    };
  }
  updateHtmlTagStack(stack, tag, name) {
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
  findHtmlMarkRegion(text, names, fromCh, toCh) {
    const acceptedNames = new Set(names);
    const stack = [];
    const regions = [];
    const tagPattern = /<\/?([a-z][a-z0-9-]*)(?:\s[^>]*)?>/gi;
    let match;
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
            closeTag: tag
          });
        }
        continue;
      }
      stack.push({ name, open: match.index, openEnd: match.index + tag.length, openTag: tag });
    }
    return regions.filter((region) => {
      const selectionIsInsideContent = fromCh >= region.openEnd && toCh <= region.close;
      const selectionIncludesWholeMark = fromCh <= region.open && toCh >= region.closeEnd;
      return selectionIsInsideContent || selectionIncludesWholeMark;
    }).sort((a, b) => a.closeEnd - a.open - (b.closeEnd - b.open))[0] ?? null;
  }
  toggleUnderline(editor) {
    const rawFrom = editor.getCursor("from");
    const rawTo = editor.getCursor("to");
    const isCursorEmpty = rawFrom.line === rawTo.line && rawFrom.ch === rawTo.ch;
    const initialCh = rawFrom.ch;
    const isActive = this.getFormatsAt(editor).underline;
    const selection = this.expandedSelection(editor);
    const openTag = "<u>";
    const closeTag = "</u>";
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
    const formatSelection = {
      from: { line: selection.from.line, ch: clamped.fromCh },
      to: { line: selection.to.line, ch: clamped.toCh }
    };
    const text = editor.getRange(formatSelection.from, formatSelection.to);
    const textWithoutLeadingControls = stripLeadingDirectionControls(text);
    const leadingControlLength = text.length - textWithoutLeadingControls.length;
    if (isActive && textWithoutLeadingControls.startsWith(openTag) && textWithoutLeadingControls.endsWith(closeTag) && textWithoutLeadingControls.length >= openTag.length + closeTag.length) {
      const unwrapped = textWithoutLeadingControls.slice(openTag.length, textWithoutLeadingControls.length - closeTag.length);
      const cursorOffset2 = isCursorEmpty ? Math.max(0, Math.min(
        initialCh - formatSelection.from.ch - leadingControlLength - openTag.length,
        unwrapped.length
      )) : void 0;
      this.replaceAndSelect(editor, formatSelection.from, formatSelection.to, unwrapped, 0, unwrapped.length, cursorOffset2);
      return;
    }
    const before = editor.getRange(
      { line: formatSelection.from.line, ch: Math.max(0, formatSelection.from.ch - openTag.length) },
      formatSelection.from
    );
    const after = editor.getRange(formatSelection.to, {
      line: formatSelection.to.line,
      ch: formatSelection.to.ch + closeTag.length
    });
    if (isActive && before === openTag && after === closeTag) {
      const cursorOffset2 = isCursorEmpty ? Math.max(0, Math.min(initialCh - formatSelection.from.ch, text.length)) : void 0;
      this.replaceAndSelect(
        editor,
        { line: formatSelection.from.line, ch: formatSelection.from.ch - openTag.length },
        { line: formatSelection.to.line, ch: formatSelection.to.ch + closeTag.length },
        text,
        0,
        text.length,
        cursorOffset2
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
        "contain"
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
    const cursorOffset = isCursorEmpty ? openTag.length + Math.max(0, Math.min(initialCh - formatSelection.from.ch, text.length)) : void 0;
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
  toggleWrapperAcrossLines(editor, selection, wrapper, isHtml) {
    const startLine = Math.min(selection.from.line, selection.to.line);
    const endLine = Math.max(selection.from.line, selection.to.line);
    const segments = [];
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
    const normalizedSelected = (lineText, fromCh, toCh) => stripLeadingDirectionControls(lineText.slice(fromCh, toCh));
    const hasWrap = (lineText, fromCh, toCh) => {
      const selected = normalizedSelected(lineText, fromCh, toCh);
      const beforeOpen = lineText.slice(Math.max(0, fromCh - wrapper.pre.length), fromCh) === wrapper.pre;
      const afterClose = lineText.slice(toCh, Math.min(lineText.length, toCh + wrapper.post.length)) === wrapper.post;
      if (selected.startsWith(wrapper.pre) && selected.endsWith(wrapper.post) && selected.length >= wrapper.pre.length + wrapper.post.length) {
        return true;
      }
      return beforeOpen && (selected.endsWith(wrapper.post) || afterClose) || selected.startsWith(wrapper.pre) && afterClose;
    };
    const removeEverywhere = segments.every(
      (segment) => hasWrap(editor.getLine(segment.line), segment.fromCh, segment.toCh)
    );
    const plans = [];
    for (const segment of segments) {
      const lineText = editor.getLine(segment.line);
      const selected = lineText.slice(segment.fromCh, segment.toCh);
      const cleanSelected = normalizedSelected(lineText, segment.fromCh, segment.toCh);
      const selectedLeadingMarkup = selected.length - cleanSelected.length;
      if (removeEverywhere) {
        if (cleanSelected.startsWith(wrapper.pre) && cleanSelected.endsWith(wrapper.post) && cleanSelected.length >= wrapper.pre.length + wrapper.post.length) {
          const replacement2 = cleanSelected.slice(wrapper.pre.length, cleanSelected.length - wrapper.post.length);
          plans.push({
            line: segment.line,
            replaceFrom: segment.fromCh,
            replaceTo: segment.toCh,
            replacement: replacement2,
            sourceFrom: segment.fromCh,
            sourceTo: segment.toCh,
            selectionStart: segment.fromCh,
            selectionEnd: segment.fromCh + replacement2.length
          });
          continue;
        }
        const beforeStart = Math.max(0, segment.fromCh - wrapper.pre.length);
        const afterEnd = Math.min(lineText.length, segment.toCh + wrapper.post.length);
        const beforeOpen = lineText.slice(beforeStart, segment.fromCh) === wrapper.pre;
        const afterClose = lineText.slice(segment.toCh, afterEnd) === wrapper.post;
        const surrounds = beforeOpen && afterClose;
        const replaceFrom = isHtml ? getLeadingDirectionControlStart(lineText, beforeStart) : beforeStart;
        if (beforeOpen && cleanSelected.endsWith(wrapper.post)) {
          const replacement2 = cleanSelected.slice(0, cleanSelected.length - wrapper.post.length);
          plans.push({
            line: segment.line,
            replaceFrom,
            replaceTo: segment.toCh,
            replacement: replacement2,
            sourceFrom: segment.fromCh,
            sourceTo: segment.toCh,
            selectionStart: replaceFrom,
            selectionEnd: replaceFrom + replacement2.length
          });
          continue;
        }
        if (cleanSelected.startsWith(wrapper.pre) && afterClose) {
          const replacement2 = cleanSelected.slice(wrapper.pre.length);
          plans.push({
            line: segment.line,
            replaceFrom: segment.fromCh,
            replaceTo: afterEnd,
            replacement: replacement2,
            sourceFrom: segment.fromCh,
            sourceTo: segment.toCh,
            selectionStart: segment.fromCh,
            selectionEnd: segment.fromCh + replacement2.length
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
          selectionEnd: surrounds ? replaceFrom + cleanSelected.length : segment.fromCh + selectedLeadingMarkup + cleanSelected.length
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
        selectionEnd: segment.fromCh + wrapper.pre.length + selectedForWrapper.length
      });
    }
    const changes = /* @__PURE__ */ new Map();
    for (const plan of plans) {
      editor.replaceRange(
        plan.replacement,
        { line: plan.line, ch: plan.replaceFrom },
        { line: plan.line, ch: plan.replaceTo }
      );
      changes.set(plan.line, plan);
    }
    const mapEndpoint = (position, endpoint) => {
      const change = changes.get(position.line);
      if (!change) return { ...position };
      const delta = change.replacement.length - (change.replaceTo - change.replaceFrom);
      if (position.ch < change.sourceFrom) return { ...position };
      if (position.ch > change.sourceTo) {
        return { line: position.line, ch: Math.max(0, position.ch + delta) };
      }
      if (endpoint === "from" && position.ch === change.sourceFrom) {
        return { line: position.line, ch: change.selectionStart };
      }
      if (endpoint === "to" && position.ch === change.sourceTo) {
        return { line: position.line, ch: change.selectionEnd };
      }
      const sourceLength = Math.max(1, change.sourceTo - change.sourceFrom);
      const outputLength = Math.max(0, change.selectionEnd - change.selectionStart);
      const offset = Math.max(0, Math.min(position.ch - change.sourceFrom, sourceLength));
      return {
        line: position.line,
        ch: change.selectionStart + Math.min(outputLength, Math.round(offset / sourceLength * outputLength))
      };
    };
    const from = mapEndpoint(selection.from, "from");
    const to = mapEndpoint(selection.to, "to");
    if (from.line === to.line && from.ch === to.ch) editor.setCursor(from);
    else editor.setSelection(from, to);
    this.restoreEditorFocus(editor);
  }
  toggleLinePrefix(editor, pattern, prefix) {
    const { startLine, endLine } = this.getSelectedLineRange(editor);
    const lines = this.getLines(editor, startLine, endLine);
    const everyLineHasPrefix = lines.every((line) => line.trim() === "" || pattern.test(line));
    const updated = lines.map((line) => {
      if (line.trim() === "") return line;
      return everyLineHasPrefix ? line.replace(pattern, "") : `${prefix}${line}`;
    });
    this.replaceLines(editor, startLine, endLine, updated);
  }
  getSelectedLineRange(editor) {
    const from = editor.getCursor("from");
    const to = editor.getCursor("to");
    return {
      startLine: Math.min(from.line, to.line),
      endLine: Math.max(from.line, to.line)
    };
  }
  getLines(editor, startLine, endLine) {
    const lines = [];
    for (let line = startLine; line <= endLine; line += 1) {
      lines.push(editor.getLine(line));
    }
    return lines;
  }
  replaceLines(editor, startLine, endLine, lines) {
    editor.replaceRange(
      lines.join("\n"),
      { line: startLine, ch: 0 },
      { line: endLine, ch: editor.getLine(endLine).length }
    );
  }
  countTag(text, tag) {
    return text.split(tag).length - 1;
  }
  getFormattingEnvelope(text, fromCh, toCh) {
    const wrappers = [
      { mark: "bold", pre: "**", post: "**" },
      { mark: "strikethrough", pre: "~~", post: "~~" },
      { mark: "highlight", pre: "==", post: "==" },
      { mark: "italic", pre: "*", post: "*" },
      { mark: "underline", pre: "<u>", post: "</u>" }
    ];
    const marks = /* @__PURE__ */ new Set();
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
  applyMarkSet(text, marks) {
    const wrappers = [
      { mark: "italic", pre: "*", post: "*" },
      { mark: "bold", pre: "**", post: "**" },
      { mark: "strikethrough", pre: "~~", post: "~~" },
      { mark: "highlight", pre: "==", post: "==" },
      { mark: "underline", pre: "<u>", post: "</u>" }
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
  findMarkRegion(text, delimiter, fromCh, toCh, mode) {
    const positions = [];
    const delimiterChar = delimiter[0];
    for (let index = 0; index < text.length; index += 1) {
      if (text[index] !== delimiterChar) continue;
      if (index > 0 && text[index - 1] === "\\") continue;
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
      const matches = mode === "contain" ? fromCh >= innerStart && toCh <= close : fromCh < close && toCh > innerStart;
      if (matches) {
        return { open, close };
      }
    }
    return null;
  }
  splitMarkRegion(editor, line, region, delimiter, selectionFrom, selectionTo, transform) {
    const lineText = editor.getLine(line);
    const innerStart = region.open + delimiter.pre.length;
    const innerEnd = region.close;
    const from = Math.min(Math.max(selectionFrom, innerStart), innerEnd);
    const to = Math.min(Math.max(selectionTo, innerStart), innerEnd);
    const side = (part) => {
      const leadingWhitespace = part.match(/^\s*/)?.[0] ?? "";
      if (leadingWhitespace.length === part.length) return part;
      const trailingWhitespace = part.slice(leadingWhitespace.length).match(/\s*$/)?.[0] ?? "";
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
  findTagRegion(text, openTag, closeTag, fromCh, toCh, mode) {
    let searchFrom = 0;
    while (searchFrom < text.length) {
      const open = text.indexOf(openTag, searchFrom);
      if (open === -1) return null;
      const innerStart = open + openTag.length;
      const close = text.indexOf(closeTag, innerStart);
      if (close === -1) return null;
      const innerEnd = close;
      const matches = mode === "contain" ? fromCh >= innerStart && toCh <= innerEnd : fromCh < innerEnd && toCh > innerStart;
      if (matches) {
        return { open, close, innerStart, innerEnd };
      }
      searchFrom = close + closeTag.length;
    }
    return null;
  }
  splitTagRegion(editor, line, region, openTag, closeTag, selectionFrom, selectionTo, transform) {
    const lineText = editor.getLine(line);
    const from = Math.min(Math.max(selectionFrom, region.innerStart), region.innerEnd);
    const to = Math.min(Math.max(selectionTo, region.innerStart), region.innerEnd);
    const side = (part) => {
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
  stripInlineMarks(text) {
    return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/~~([^~]+)~~/g, "$1").replace(/==([^=]+)==/g, "$1").replace(/(^|[^*\\])\*([^*]+)\*(?!\*)/g, "$1$2").replace(/<u>(.*?)<\/u>/gi, "$1").replace(/<\/?u\s*>/gi, "").replace(/<(?:mark|span|font)\b[^>]*>/gi, "").replace(/<\/(?:mark|span|font)\s*>/gi, "");
  }
  hasText(editor, selection) {
    return editor.getRange(selection.from, selection.to).length > 0;
  }
  replaceAndSelect(editor, replaceFrom, replaceTo, replacement, selectionStart, selectionEnd, cursorOffset, restoreSelection = true) {
    editor.replaceRange(replacement, replaceFrom, replaceTo);
    if (!restoreSelection) return;
    if (cursorOffset !== void 0) {
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
  restoreEditorFocus(editor) {
    const focusable = editor;
    const focus = focusable.focus;
    if (typeof focus !== "function") return;
    const hadFocus = typeof focusable.hasFocus === "function" ? focusable.hasFocus.call(editor) : false;
    focus.call(editor);
    if (!hadFocus) {
      const schedule = typeof window !== "undefined" ? window.setTimeout : setTimeout;
      schedule(() => {
        if (typeof focusable.hasFocus === "function" && focusable.hasFocus.call(editor)) return;
        focus.call(editor);
      }, 0);
    }
  }
  positionAtOffset(start, text, offset) {
    const prefix = text.slice(0, Math.max(0, Math.min(offset, text.length)));
    const lines = prefix.split("\n");
    if (lines.length === 1) {
      return { line: start.line, ch: start.ch + prefix.length };
    }
    return { line: start.line + lines.length - 1, ch: lines[lines.length - 1].length };
  }
  expandedSelection(editor) {
    let from = editor.getCursor("from");
    let to = editor.getCursor("to");
    if (from.line > to.line || from.line === to.line && from.ch > to.ch) {
      [from, to] = [to, from];
    }
    if (from.line === to.line && from.ch === to.ch) {
      const word = editor.wordAt(from);
      if (word) {
        from = word.from;
        to = word.to;
      }
    } else if (from.line === to.line && from.ch !== to.ch) {
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
  requireFile(file) {
    if (file) return file;
    new import_obsidian2.Notice("Open a Markdown note first.");
    return null;
  }
};

// src/services/FontService.ts
var CURATED_FONTS = [
  "var(--font-text)",
  "Arial",
  "Calibri",
  "Cambria",
  "Cascadia Code",
  "Courier New",
  "Georgia",
  "Helvetica",
  "Inter",
  "JetBrains Mono",
  "Lato",
  "Merriweather",
  "Montserrat",
  "Noto Naskh Arabic",
  "Noto Sans",
  "Noto Sans Arabic",
  "Noto Serif",
  "Open Sans",
  "Poppins",
  "Roboto",
  "Scheherazade New",
  "Segoe UI",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
  "Amiri",
  "Traditional Arabic",
  "Simplified Arabic",
  "Cairo",
  "Tajawal"
];
var FontService = class {
  cache = null;
  pending = null;
  async getAvailableFonts() {
    if (this.cache) return this.cache;
    if (this.pending) return this.pending;
    this.pending = this.loadAvailableFonts();
    try {
      this.cache = await this.pending;
      return this.cache;
    } finally {
      this.pending = null;
    }
  }
  async loadAvailableFonts() {
    const families = /* @__PURE__ */ new Set();
    const queryLocalFonts = window.queryLocalFonts;
    if (typeof queryLocalFonts === "function") {
      try {
        const localFonts = await queryLocalFonts.call(window);
        for (const font of localFonts) {
          const family = font.family?.trim();
          if (family) families.add(family);
        }
      } catch {
      }
    }
    if (families.size === 0) {
      for (const family of CURATED_FONTS) {
        if (family.startsWith("var(")) {
          families.add(family);
          continue;
        }
        try {
          if (document.fonts.check(`12px "${family}"`)) {
            families.add(family);
          }
        } catch {
        }
      }
    }
    return [...families].sort((a, b) => a.localeCompare(b));
  }
  clearCache() {
    this.cache = null;
    this.pending = null;
  }
};

// src/core/types/settings.ts
var DEFAULT_SETTINGS = {
  enableSelectionToolbar: true,
  hideInlineStyleMarkup: true,
  showDocumentActions: true,
  showColorHeaderActions: true,
  activeTextColor: "#e11d48",
  activeHighlightColor: "#fef08a",
  highlightMode: "rich-smooth",
  defaultDocumentFont: "",
  defaultDocumentFontSize: "",
  defaultDocumentLineHeight: "1.6",
  defaultDocumentAlignment: ""
};

// src/services/SettingsService.ts
var SettingsService = class {
  settings = { ...DEFAULT_SETTINGS };
  saveCallback;
  listeners = /* @__PURE__ */ new Set();
  setSaveCallback(callback) {
    this.saveCallback = callback;
  }
  getSettings() {
    return { ...this.settings };
  }
  async load(data) {
    if (data && typeof data === "object") {
      this.settings = { ...DEFAULT_SETTINGS, ...data };
    } else {
      this.settings = { ...DEFAULT_SETTINGS };
    }
    this.notify();
  }
  async updateSettings(updates) {
    this.settings = { ...this.settings, ...updates };
    await this.persist();
    this.notify();
  }
  async resetToDefaults() {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.persist();
    this.notify();
  }
  onDidChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  async persist() {
    if (this.saveCallback) {
      await this.saveCallback(this.settings);
    }
  }
  notify() {
    const snapshot = this.getSettings();
    this.listeners.forEach((listener) => listener(snapshot));
  }
};

// src/ui/DocumentAppearanceModal.ts
var import_obsidian4 = require("obsidian");

// src/ui/FontPickerModal.ts
var import_obsidian3 = require("obsidian");
var MAX_FUZZY_CANDIDATES = 120;
var MAX_VISIBLE_RESULTS = 40;
function createFontSearchIndex(fonts) {
  return fonts.map((font) => ({ font, searchText: font.toLocaleLowerCase() }));
}
function searchFontCandidates(index, rawQuery, limit) {
  const query = rawQuery.trim().toLocaleLowerCase();
  if (!query) return index.slice(0, limit).map((entry) => entry.font);
  const prefixes = [];
  const wordPrefixes = [];
  const contains = [];
  const fuzzy = [];
  const add = (bucket, font) => {
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
function isSubsequence(query, value) {
  let queryIndex = 0;
  for (let index = 0; index < value.length && queryIndex < query.length; index += 1) {
    if (value[index] === query[queryIndex]) queryIndex += 1;
  }
  return queryIndex === query.length;
}
var FontPickerModal = class extends import_obsidian3.FuzzySuggestModal {
  constructor(app, fontService, onPick) {
    super(app);
    this.fontService = fontService;
    this.onPick = onPick;
    this.setPlaceholder("Search fonts on this device\u2026");
    this.setInstructions([
      { command: "\u2191\u2193", purpose: "navigate" },
      { command: "\u21B5", purpose: "apply font" },
      { command: "esc", purpose: "dismiss" }
    ]);
    this.limit = MAX_VISIBLE_RESULTS;
  }
  fontIndex = [];
  onOpen() {
    super.onOpen();
    void this.fontService.getAvailableFonts().then((fonts) => {
      this.fontIndex = createFontSearchIndex(fonts);
      this.inputEl.dispatchEvent(new Event("input"));
    }).catch(() => {
      this.fontIndex = [];
    });
  }
  getItems() {
    return searchFontCandidates(this.fontIndex, this.inputEl.value ?? "", MAX_FUZZY_CANDIDATES);
  }
  getItemText(font) {
    return font;
  }
  renderSuggestion(match, el) {
    super.renderSuggestion(match, el);
    el.addClass("rich-editor-font-suggestion");
    if (!match.item.startsWith("var(")) {
      el.setCssStyles({ fontFamily: `"${match.item}", var(--font-text)` });
    }
  }
  onChooseItem(font) {
    this.onPick(font);
  }
};

// src/ui/DocumentAppearanceModal.ts
var FONT_SIZE_OPTIONS = ["", "0.9em", "1em", "1.1em", "1.2em", "14px", "16px", "18px", "20px", "24px"];
var LINE_HEIGHT_OPTIONS = ["", "1", "1.2", "1.4", "1.6", "1.8", "2"];
var DocumentAppearanceModal = class extends import_obsidian4.Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
    this.draft = {
      fontFamily: options.appearance.fontFamily ?? "",
      fontSize: options.appearance.fontSize ?? "",
      lineHeight: options.appearance.lineHeight ?? "",
      alignment: options.appearance.alignment ?? ""
    };
  }
  draft;
  onOpen() {
    this.render();
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("rich-editor-appearance-modal");
    contentEl.createEl("h2", { text: "Document appearance" });
    contentEl.createEl("p", {
      cls: "setting-item-description",
      text: "Control how this note feels to read and edit. These choices are saved in the note frontmatter, so every device can reuse them."
    });
    new import_obsidian4.Setting(contentEl).setName("Font family").setDesc(this.draft.fontFamily || "Using plugin/default theme font").addButton(
      (button) => button.setButtonText("Choose font").setIcon("type").onClick(() => {
        new FontPickerModal(this.app, this.options.fontService, (font) => {
          this.draft.fontFamily = font;
          this.render();
        }).open();
      })
    ).addButton(
      (button) => button.setButtonText("Clear").setIcon("x").onClick(() => {
        this.draft.fontFamily = "";
        this.render();
      })
    );
    new import_obsidian4.Setting(contentEl).setName("Font size").setDesc("Leave empty to use the plugin/default font size.").addDropdown((dropdown) => {
      FONT_SIZE_OPTIONS.forEach((value) => dropdown.addOption(value, value || "Default"));
      dropdown.setValue(this.draft.fontSize).onChange((value) => {
        this.draft.fontSize = value;
      });
    }).addText(
      (text) => text.setPlaceholder("Example: 18px or 1.15em").setValue(this.draft.fontSize).onChange((value) => {
        this.draft.fontSize = value.trim();
      })
    );
    new import_obsidian4.Setting(contentEl).setName("Line height").setDesc("Increase this for comfortable long-form reading.").addDropdown((dropdown) => {
      LINE_HEIGHT_OPTIONS.forEach((value) => dropdown.addOption(value, value || "Default"));
      dropdown.setValue(this.draft.lineHeight).onChange((value) => {
        this.draft.lineHeight = value;
      });
    });
    new import_obsidian4.Setting(contentEl).setName("Text alignment").setDesc("Optional paragraph alignment for this note.").addDropdown(
      (dropdown) => dropdown.addOption("", "Default").addOption("left", "Left").addOption("center", "Center").addOption("right", "Right").addOption("justify", "Justify").setValue(this.draft.alignment).onChange((value) => {
        this.draft.alignment = value;
      })
    );
    contentEl.createEl("h3", { text: "Quick presets" });
    const presets = contentEl.createDiv({ cls: "rich-editor-preset-row" });
    this.addPresetButton(presets, "Clean typography", {
      fontFamily: "",
      fontSize: "",
      lineHeight: "1.6",
      alignment: ""
    });
    this.addPresetButton(presets, "Arabic typography", {
      fontFamily: "Amiri",
      fontSize: "1.15em",
      lineHeight: "1.9",
      alignment: "right"
    });
    this.addPresetButton(presets, "Large reading", {
      fontFamily: "",
      fontSize: "1.2em",
      lineHeight: "1.8",
      alignment: ""
    });
    new import_obsidian4.Setting(contentEl).addButton(
      (button) => button.setButtonText("Clear document appearance").setClass("mod-warning").onClick(() => {
        void this.clearAppearance();
      })
    ).addButton(
      (button) => button.setButtonText("Cancel").onClick(() => {
        this.close();
      })
    ).addButton(
      (button) => button.setButtonText("Apply").setCta().onClick(() => {
        void this.applyAppearance();
      })
    );
  }
  async clearAppearance() {
    try {
      await this.options.onApply({
        fontFamily: "",
        fontSize: "",
        lineHeight: "",
        alignment: void 0
      });
      this.close();
    } catch {
    }
  }
  async applyAppearance() {
    try {
      await this.options.onApply(this.toUpdate());
      this.close();
    } catch {
    }
  }
  addPresetButton(parent, label, preset) {
    const button = parent.createEl("button", { text: label, cls: "mod-cta" });
    button.addEventListener("click", () => {
      this.draft = { ...preset };
      this.render();
    });
  }
  toUpdate() {
    return {
      fontFamily: this.draft.fontFamily.trim(),
      fontSize: this.draft.fontSize.trim(),
      lineHeight: this.draft.lineHeight.trim(),
      alignment: this.draft.alignment || void 0
    };
  }
};

// src/ui/PassageAppearanceModal.ts
var import_obsidian5 = require("obsidian");
var POPULAR_FONTS = [
  { name: "Amiri (\u0623\u0645\u064A\u0631\u064A)", font: "Amiri" },
  { name: "Cairo (\u0627\u0644\u0642\u0627\u0647\u0631\u0629)", font: "Cairo" },
  { name: "Scheherazade", font: "Scheherazade New" },
  { name: "Tajawal (\u062A\u062C\u0648\u0627\u0644)", font: "Tajawal" },
  { name: "Almarai (\u0627\u0644\u0645\u0631\u0627\u0639\u064A)", font: "Almarai" },
  { name: "Inter (Sans)", font: "Inter" },
  { name: "Playfair (Serif)", font: "Playfair Display" },
  { name: "Monospace (Code)", font: "monospace" }
];
var POPULAR_SIZES = [
  { label: "Small", value: "0.88em" },
  { label: "Regular", value: "1em" },
  { label: "Medium", value: "1.2em" },
  { label: "Large", value: "1.4em" },
  { label: "Heading", value: "1.8em" }
];
var PassageAppearanceModal = class extends import_obsidian5.Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
    this.fontFamily = options.appearance.fontFamily ?? "";
    this.fontSize = options.appearance.fontSize ?? "";
  }
  fontFamily;
  fontSize;
  onOpen() {
    this.render();
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("rich-editor-passage-modal", "rich-editor-glass-modal");
    contentEl.createEl("h2", { text: "Passage Typography & Fonts" });
    contentEl.createEl("p", {
      cls: "setting-item-description",
      text: "Apply exquisite typography, custom fonts, or sizing to the selected passage with full Markdown compatibility."
    });
    const preview = contentEl.createDiv({ cls: "rich-editor-passage-preview rich-editor-glass-preview" });
    preview.setText("Selected passage preview \u2014 \u0628\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0631\u062D\u0645\u0646 \u0627\u0644\u0631\u062D\u064A\u0645 \u2014 The quick brown fox jumps");
    preview.setCssStyles({
      fontFamily: this.fontFamily ? `"${this.fontFamily}", var(--font-text)` : "",
      fontSize: this.fontSize
    });
    contentEl.createEl("h4", { text: "Popular Typefaces (Arabic & English)" });
    const fontChips = contentEl.createDiv({ cls: "rich-editor-preset-row" });
    for (const item of POPULAR_FONTS) {
      const isSelected = this.fontFamily.toLowerCase() === item.font.toLowerCase();
      const chip = fontChips.createEl("button", {
        cls: `rich-editor-chip ${isSelected ? "is-selected" : ""}`,
        text: item.name
      });
      chip.setCssStyles({ fontFamily: `"${item.font}", var(--font-text)` });
      chip.addEventListener("click", () => {
        this.fontFamily = item.font;
        this.render();
      });
    }
    new import_obsidian5.Setting(contentEl).setName("Font family").setDesc(this.fontFamily ? `Current: ${this.fontFamily}` : "Default note font").addButton(
      (button) => button.setButtonText("All system fonts\u2026").setIcon("search").onClick(() => {
        new FontPickerModal(this.app, this.options.fontService, (font) => {
          this.fontFamily = font;
          this.render();
        }).open();
      })
    ).addButton(
      (button) => button.setButtonText("Reset font").setIcon("rotate-ccw").onClick(() => {
        this.fontFamily = "";
        this.render();
      })
    );
    contentEl.createEl("h4", { text: "Font Sizing" });
    const sizeChips = contentEl.createDiv({ cls: "rich-editor-preset-row" });
    for (const item of POPULAR_SIZES) {
      const isSelected = this.fontSize === item.value;
      const chip = sizeChips.createEl("button", {
        cls: `rich-editor-chip ${isSelected ? "is-selected" : ""}`,
        text: `${item.label} (${item.value})`
      });
      chip.addEventListener("click", () => {
        this.fontSize = item.value;
        this.render();
      });
    }
    new import_obsidian5.Setting(contentEl).setName("Custom size").setDesc("Enter any CSS size such as 18px, 1.25em, or 130%").addText(
      (text) => text.setPlaceholder("Example: 18px").setValue(this.fontSize).onChange((value) => {
        this.fontSize = value.trim();
        preview.setCssStyles({ fontSize: this.fontSize });
      })
    ).addButton(
      (button) => button.setButtonText("Reset size").setIcon("rotate-ccw").onClick(() => {
        this.fontSize = "";
        this.render();
      })
    );
    new import_obsidian5.Setting(contentEl).addButton(
      (button) => button.setClass("mod-warning").setButtonText("Clear typography").onClick(() => {
        void this.clearTypography();
      })
    ).addButton((button) => button.setButtonText("Cancel").onClick(() => this.close())).addButton(
      (button) => button.setCta().setButtonText("Apply").onClick(() => {
        void this.applyTypography();
      })
    );
  }
  async clearTypography() {
    try {
      await this.options.onApply({ fontFamily: "", fontSize: "" });
      this.close();
    } catch {
      new import_obsidian5.Notice("OW-Tools: could not clear the passage typography.");
    }
  }
  async applyTypography() {
    const fontFamily = this.fontFamily.trim();
    const fontSize = this.fontSize.trim();
    if (fontFamily && !normalizeFontFamily(fontFamily)) {
      new import_obsidian5.Notice("That font family cannot be stored safely.");
      return;
    }
    if (fontSize && !normalizeFontSize(fontSize)) {
      new import_obsidian5.Notice("Use a font size such as 18px, 1.2em, or 120%.");
      return;
    }
    try {
      await this.options.onApply({ fontFamily, fontSize });
      this.close();
    } catch {
      new import_obsidian5.Notice("OW-Tools: could not apply the passage typography.");
    }
  }
};

// src/ui/QuickColorPopover.ts
var import_obsidian6 = require("obsidian");
var POPULAR_HIGHLIGHTS = [
  { name: "Canary Yellow", color: "#fef08a" },
  { name: "Peach Apricot", color: "#fed7aa" },
  { name: "Mint Green", color: "#bbf7d0" },
  { name: "Sky Blue", color: "#bae6fd" },
  { name: "Soft Lavender", color: "#e9d5ff" },
  { name: "Blush Rose", color: "#fbcfe8" },
  { name: "Golden Glow", color: "#854d0e66" },
  { name: "Emerald Glow", color: "#065f4666" },
  { name: "Sapphire Glow", color: "#1e40af66" },
  { name: "Amethyst Glow", color: "#6b21a866" },
  { name: "Ruby Glow", color: "#9f123966" },
  { name: "Teal Glow", color: "#115e5966" }
];
var POPULAR_TEXT_COLORS = [
  { name: "Ruby Red", color: "#e11d48" },
  { name: "Warm Orange", color: "#ea580c" },
  { name: "Golden Amber", color: "#d97706" },
  { name: "Emerald Green", color: "#059669" },
  { name: "Cyan Teal", color: "#0891b2" },
  { name: "Royal Blue", color: "#2563eb" },
  { name: "Indigo Violet", color: "#6366f1" },
  { name: "Purple", color: "#9333ea" },
  { name: "Hot Pink", color: "#db2777" },
  { name: "Coral Bright", color: "#fb7185" },
  { name: "Mint Bright", color: "#34d399" },
  { name: "Sky Bright", color: "#60a5fa" }
];
var QuickColorPopover = class {
  constructor(options) {
    this.options = options;
  }
  popoverEl = null;
  outsideClickListener = null;
  keydownListener = null;
  resizeListener = null;
  outsideClickTimer = null;
  open() {
    this.close();
    const popover = this.options.anchorEl.ownerDocument.body.createDiv({
      cls: "rich-editor-quick-popover rich-editor-color-popover rich-editor-glass-panel",
      attr: {
        role: "dialog",
        "aria-label": this.isText ? "Text color palette" : "Highlight color palette"
      }
    });
    this.popoverEl = popover;
    this.render();
    this.position();
    this.outsideClickListener = (event) => {
      if (!this.popoverEl) return;
      const target = event.target;
      if (!this.popoverEl.contains(target) && !this.options.anchorEl.contains(target)) {
        this.close();
      }
    };
    this.outsideClickTimer = this.ownerWindow.setTimeout(() => {
      if (this.outsideClickListener) {
        this.ownerWindow.addEventListener("mousedown", this.outsideClickListener);
      }
      this.outsideClickTimer = null;
    }, 0);
    this.keydownListener = (event) => {
      if (event.key === "Escape") this.close();
    };
    this.resizeListener = () => this.position();
    this.ownerWindow.addEventListener("keydown", this.keydownListener);
    this.ownerWindow.addEventListener("resize", this.resizeListener);
    this.ownerWindow.addEventListener("scroll", this.resizeListener, true);
  }
  close() {
    if (this.outsideClickTimer !== null) {
      this.ownerWindow.clearTimeout(this.outsideClickTimer);
      this.outsideClickTimer = null;
    }
    if (this.outsideClickListener) {
      this.ownerWindow.removeEventListener("mousedown", this.outsideClickListener);
      this.outsideClickListener = null;
    }
    if (this.keydownListener) {
      this.ownerWindow.removeEventListener("keydown", this.keydownListener);
      this.keydownListener = null;
    }
    if (this.resizeListener) {
      this.ownerWindow.removeEventListener("resize", this.resizeListener);
      this.ownerWindow.removeEventListener("scroll", this.resizeListener, true);
      this.resizeListener = null;
    }
    if (this.popoverEl) {
      this.popoverEl.remove();
      this.popoverEl = null;
      this.options.onClose?.();
    }
  }
  get isText() {
    return this.options.mode === "text";
  }
  get ownerWindow() {
    return this.options.anchorEl.ownerDocument.defaultView ?? window;
  }
  render() {
    if (!this.popoverEl) return;
    this.popoverEl.empty();
    const settings = this.options.settingsService.getSettings();
    const activeColor = this.isText ? settings.activeTextColor || "#e11d48" : settings.activeHighlightColor || "#fef08a";
    const palette = this.isText ? POPULAR_TEXT_COLORS : POPULAR_HIGHLIGHTS;
    const header = this.popoverEl.createDiv({ cls: "rich-editor-color-popover-header" });
    const icon = header.createSpan({ cls: "rich-editor-color-popover-icon" });
    (0, import_obsidian6.setIcon)(icon, this.isText ? "type" : "highlighter");
    const heading = header.createDiv({ cls: "rich-editor-color-popover-heading" });
    heading.createDiv({ cls: "rich-editor-color-popover-title", text: this.isText ? "Text color" : "Highlight" });
    heading.createDiv({
      cls: "rich-editor-color-popover-description",
      text: this.isText ? "Give the selected text a clear visual hierarchy." : "Choose a soft, readable passage highlight."
    });
    const grid = this.popoverEl.createDiv({ cls: "rich-editor-popover-grid" });
    for (const item of palette) {
      const isSelected = activeColor.toLowerCase() === item.color.toLowerCase();
      const swatch = grid.createEl("button", {
        cls: `rich-editor-popover-swatch ${isSelected ? "is-selected" : ""}`,
        attr: {
          type: "button",
          "aria-label": `${item.name} (${item.color})`,
          title: item.name
        }
      });
      swatch.setCssStyles({ backgroundColor: item.color });
      if (isSelected) {
        const checkIcon = swatch.createSpan({ cls: "rich-editor-swatch-check" });
        (0, import_obsidian6.setIcon)(checkIcon, "check");
      }
      swatch.addEventListener("click", () => void this.applyColor(item.color));
    }
    const actionRow = this.popoverEl.createDiv({ cls: "rich-editor-popover-custom-row" });
    const colorPickerWrapper = actionRow.createDiv({ cls: "rich-editor-popover-color-picker-wrap" });
    const pickerInput = colorPickerWrapper.createEl("input", {
      type: "color",
      cls: "rich-editor-popover-native-picker",
      value: /^#[\da-f]{6}$/i.test(activeColor) ? activeColor : this.isText ? "#e11d48" : "#fef08a"
    });
    const pickerLabel = colorPickerWrapper.createSpan({ cls: "rich-editor-popover-picker-label" });
    (0, import_obsidian6.setIcon)(pickerLabel, "pipette");
    pickerLabel.createSpan({ text: "Custom" });
    pickerInput.addEventListener("input", (event) => {
      const color = event.target.value;
      if (color) void this.applyColor(color);
    });
    const defaultBtn = actionRow.createEl("button", {
      cls: "rich-editor-popover-btn",
      attr: {
        type: "button",
        "aria-label": `Save ${activeColor} as the default ${this.isText ? "text" : "highlight"} color`
      }
    });
    (0, import_obsidian6.setIcon)(defaultBtn, "star");
    defaultBtn.createSpan({ text: "Set default" });
    defaultBtn.addEventListener("click", () => void this.setDefault(activeColor));
    const clearBtn = actionRow.createEl("button", {
      cls: "rich-editor-popover-btn rich-editor-popover-btn-danger",
      attr: { type: "button", "aria-label": `Clear ${this.isText ? "text color" : "highlight"} on the selection` }
    });
    (0, import_obsidian6.setIcon)(clearBtn, "eraser");
    clearBtn.createSpan({ text: "Clear" });
    clearBtn.addEventListener("click", () => void this.applyColor(""));
  }
  position() {
    if (!this.popoverEl || !this.options.anchorEl.isConnected) return;
    const anchorRect = this.options.anchorEl.getBoundingClientRect();
    const popoverRect = this.popoverEl.getBoundingClientRect();
    const padding = 10;
    let left = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2;
    let top = anchorRect.bottom + 8;
    left = Math.max(padding, Math.min(left, this.ownerWindow.innerWidth - popoverRect.width - padding));
    if (top + popoverRect.height > this.ownerWindow.innerHeight - padding) {
      top = Math.max(padding, anchorRect.top - popoverRect.height - 8);
    }
    this.popoverEl.setCssProps({
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`
    });
  }
  async setDefault(color) {
    if (this.isText) {
      await this.options.settingsService.updateSettings({ activeTextColor: color });
    } else {
      await this.options.settingsService.updateSettings({ activeHighlightColor: color });
    }
    new import_obsidian6.Notice(`Saved ${color} as the default ${this.isText ? "text" : "highlight"} color.`);
    this.close();
  }
  async applyColor(color) {
    if (color) {
      const valid = normalizeColor(color);
      if (!valid) return;
      this.options.controller.setInlineTypography(
        this.options.editor,
        this.isText ? { textColor: valid } : { backgroundColor: valid },
        this.options.selection
      );
      if (this.isText) {
        await this.options.settingsService.updateSettings({ activeTextColor: valid });
      } else {
        await this.options.settingsService.updateSettings({ activeHighlightColor: valid });
      }
    } else {
      this.options.controller.setInlineTypography(
        this.options.editor,
        this.isText ? { textColor: "" } : { backgroundColor: "" },
        this.options.selection
      );
    }
    this.close();
  }
};

// src/ui/QuickTypographyPopover.ts
var import_obsidian7 = require("obsidian");
var POPULAR_FONTS2 = [
  { name: "Amiri (\u0623\u0645\u064A\u0631\u064A)", font: "Amiri" },
  { name: "Cairo (\u0627\u0644\u0642\u0627\u0647\u0631\u0629)", font: "Cairo" },
  { name: "Scheherazade", font: "Scheherazade New" },
  { name: "Tajawal (\u062A\u062C\u0648\u0627\u0644)", font: "Tajawal" },
  { name: "Almarai (\u0627\u0644\u0645\u0631\u0627\u0639\u064A)", font: "Almarai" },
  { name: "Inter (Sans)", font: "Inter" },
  { name: "Playfair (Serif)", font: "Playfair Display" },
  { name: "Monospace (Code)", font: "monospace" }
];
var POPULAR_SIZES2 = [
  { label: "Small", value: "0.88em" },
  { label: "Regular", value: "1em" },
  { label: "Medium", value: "1.2em" },
  { label: "Large", value: "1.4em" },
  { label: "Huge", value: "1.8em" }
];
var QuickTypographyPopover = class {
  constructor(options) {
    this.options = options;
    this.tab = options.initialTab ?? "font";
  }
  popoverEl = null;
  tab;
  outsideClickListener = null;
  keydownListener = null;
  outsideClickTimer = null;
  open() {
    this.close();
    const popover = this.options.anchorEl.ownerDocument.body.createDiv({
      cls: "rich-editor-quick-popover rich-editor-glass-panel"
    });
    this.popoverEl = popover;
    this.render();
    this.position();
    this.outsideClickListener = (event) => {
      if (!this.popoverEl) return;
      const target = event.target;
      if (!this.popoverEl.contains(target) && !this.options.anchorEl.contains(target)) {
        this.close();
      }
    };
    this.outsideClickTimer = this.ownerWindow.setTimeout(() => {
      if (this.outsideClickListener) {
        this.ownerWindow.addEventListener("mousedown", this.outsideClickListener);
      }
      this.outsideClickTimer = null;
    }, 10);
    this.keydownListener = (event) => {
      if (event.key === "Escape") {
        this.close();
      }
    };
    this.ownerWindow.addEventListener("keydown", this.keydownListener);
  }
  close() {
    if (this.outsideClickTimer !== null) {
      this.ownerWindow.clearTimeout(this.outsideClickTimer);
      this.outsideClickTimer = null;
    }
    if (this.outsideClickListener) {
      this.ownerWindow.removeEventListener("mousedown", this.outsideClickListener);
      this.outsideClickListener = null;
    }
    if (this.keydownListener) {
      this.ownerWindow.removeEventListener("keydown", this.keydownListener);
      this.keydownListener = null;
    }
    if (this.popoverEl) {
      this.popoverEl.remove();
      this.popoverEl = null;
      this.options.onClose?.();
    }
  }
  render() {
    if (!this.popoverEl) return;
    this.popoverEl.empty();
    const activeTypography = this.options.controller.getInlineTypography(this.options.editor, this.options.selection);
    const currentFont = activeTypography.fontFamily ?? "";
    const currentSize = activeTypography.fontSize ?? "";
    const header = this.popoverEl.createDiv({ cls: "rich-editor-popover-header" });
    const tabGroup = header.createDiv({ cls: "rich-editor-popover-tabs" });
    const fontTab = tabGroup.createEl("button", {
      cls: `rich-editor-popover-tab ${this.tab === "font" ? "is-active" : ""}`,
      text: "Typefaces"
    });
    (0, import_obsidian7.setIcon)(fontTab.createSpan({ cls: "rich-editor-tab-icon" }), "case-sensitive");
    fontTab.addEventListener("click", () => {
      this.tab = "font";
      this.render();
      this.position();
    });
    const sizeTab = tabGroup.createEl("button", {
      cls: `rich-editor-popover-tab ${this.tab === "size" ? "is-active" : ""}`,
      text: "Font Size"
    });
    (0, import_obsidian7.setIcon)(sizeTab.createSpan({ cls: "rich-editor-tab-icon" }), "move-vertical");
    sizeTab.addEventListener("click", () => {
      this.tab = "size";
      this.render();
      this.position();
    });
    if (this.tab === "font") {
      const grid = this.popoverEl.createDiv({ cls: "rich-editor-popover-font-grid" });
      for (const item of POPULAR_FONTS2) {
        const isSelected = currentFont.toLowerCase() === item.font.toLowerCase();
        const btn = grid.createEl("button", {
          cls: `rich-editor-popover-font-btn ${isSelected ? "is-selected" : ""}`,
          text: item.name
        });
        btn.setCssStyles({ fontFamily: `"${item.font}", var(--font-text)` });
        btn.addEventListener("click", () => {
          this.applyFont(item.font);
        });
      }
      const actionRow = this.popoverEl.createDiv({ cls: "rich-editor-popover-custom-row" });
      const searchBtn = actionRow.createEl("button", {
        cls: "rich-editor-popover-btn",
        attr: { "aria-label": "Search all device fonts" }
      });
      (0, import_obsidian7.setIcon)(searchBtn, "search");
      searchBtn.createSpan({ text: "All fonts\u2026" });
      searchBtn.addEventListener("click", () => {
        this.close();
        new FontPickerModal(this.options.app, this.options.fontService, (font) => {
          this.applyFont(font);
        }).open();
      });
      const clearBtn = actionRow.createEl("button", {
        cls: "rich-editor-popover-btn rich-editor-popover-btn-danger",
        attr: { "aria-label": "Reset font family" }
      });
      (0, import_obsidian7.setIcon)(clearBtn, "eraser");
      clearBtn.createSpan({ text: "Reset" });
      clearBtn.addEventListener("click", () => {
        this.applyFont("");
      });
    } else {
      const sizeRow = this.popoverEl.createDiv({ cls: "rich-editor-popover-size-row" });
      for (const item of POPULAR_SIZES2) {
        const isSelected = currentSize === item.value;
        const sizeBtn = sizeRow.createEl("button", {
          cls: `rich-editor-popover-size-btn ${isSelected ? "is-selected" : ""}`,
          text: item.label
        });
        sizeBtn.addEventListener("click", () => {
          this.applyFontSize(item.value);
        });
      }
      const actionRow = this.popoverEl.createDiv({ cls: "rich-editor-popover-custom-row" });
      const sizeInputWrap = actionRow.createDiv({ cls: "rich-editor-popover-color-picker-wrap" });
      const input = sizeInputWrap.createEl("input", {
        type: "text",
        cls: "rich-editor-popover-size-input",
        placeholder: "e.g. 18px",
        value: currentSize
      });
      input.addEventListener("change", () => {
        if (input.value.trim()) {
          this.applyFontSize(input.value.trim());
        }
      });
      const clearSizeBtn = actionRow.createEl("button", {
        cls: "rich-editor-popover-btn rich-editor-popover-btn-danger",
        attr: { "aria-label": "Reset font size" }
      });
      (0, import_obsidian7.setIcon)(clearSizeBtn, "eraser");
      clearSizeBtn.createSpan({ text: "Reset" });
      clearSizeBtn.addEventListener("click", () => {
        this.applyFontSize("");
      });
    }
  }
  position() {
    if (!this.popoverEl) return;
    const anchorRect = this.options.anchorEl.getBoundingClientRect();
    const popoverRect = this.popoverEl.getBoundingClientRect();
    const padding = 8;
    let left = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2;
    let top = anchorRect.bottom + 6;
    if (left < padding) left = padding;
    if (left + popoverRect.width > this.ownerWindow.innerWidth - padding) {
      left = this.ownerWindow.innerWidth - popoverRect.width - padding;
    }
    if (top + popoverRect.height > this.ownerWindow.innerHeight - padding) {
      top = anchorRect.top - popoverRect.height - 6;
    }
    this.popoverEl.setCssProps({
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`
    });
  }
  get ownerWindow() {
    return this.options.anchorEl.ownerDocument.defaultView ?? window;
  }
  applyFont(fontFamily) {
    this.options.controller.setInlineTypography(this.options.editor, { fontFamily }, this.options.selection);
    this.close();
  }
  applyFontSize(fontSize) {
    this.options.controller.setInlineTypography(this.options.editor, { fontSize }, this.options.selection);
    this.close();
  }
};

// src/ui/TextColorModal.ts
var import_obsidian8 = require("obsidian");
var HIGHLIGHT_PRESETS = [
  // Soft, readable pastels for light mode & universal highlighting
  { name: "Canary Yellow", color: "#fef08a" },
  { name: "Peach Apricot", color: "#fed7aa" },
  { name: "Mint Green", color: "#bbf7d0" },
  { name: "Sky Blue", color: "#bae6fd" },
  { name: "Soft Lavender", color: "#e9d5ff" },
  { name: "Blush Rose", color: "#fbcfe8" },
  { name: "Coral Pink", color: "#fecdd3" },
  { name: "Soft Seafoam", color: "#a7f3d0" },
  { name: "Neutral Slate", color: "#e2e8f0" },
  { name: "Warm Cream", color: "#fef9c3" },
  // Subtle dark-mode compatible glowing highlights (translucent hex)
  { name: "Golden Glow", color: "#854d0e66" },
  { name: "Emerald Glow", color: "#065f4666" },
  { name: "Sapphire Glow", color: "#1e40af66" },
  { name: "Amethyst Glow", color: "#6b21a866" },
  { name: "Ruby Glow", color: "#9f123966" },
  { name: "Teal Glow", color: "#115e5966" }
];
var TEXT_COLOR_PRESETS = [
  { name: "Ruby Red", color: "#e11d48" },
  { name: "Warm Orange", color: "#ea580c" },
  { name: "Golden Amber", color: "#d97706" },
  { name: "Emerald Green", color: "#059669" },
  { name: "Cyan Teal", color: "#0891b2" },
  { name: "Royal Blue", color: "#2563eb" },
  { name: "Indigo Violet", color: "#6366f1" },
  { name: "Purple", color: "#9333ea" },
  { name: "Hot Pink", color: "#db2777" },
  { name: "Slate Gray", color: "#64748b" },
  // Bright accents for dark mode
  { name: "Coral Bright", color: "#fb7185" },
  { name: "Mint Bright", color: "#34d399" },
  { name: "Sky Bright", color: "#60a5fa" },
  { name: "Lavender Bright", color: "#c084fc" },
  { name: "Amber Bright", color: "#fbbf24" },
  { name: "Snow White", color: "#f8fafc" }
];
var TextColorModal = class extends import_obsidian8.Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
    this.mode = options.initialMode ?? "text";
    this.textColor = options.appearance.textColor ?? "";
    this.backgroundColor = options.appearance.backgroundColor ?? "";
  }
  mode;
  textColor;
  backgroundColor;
  onOpen() {
    this.render();
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("rich-editor-color-modal");
    contentEl.createEl("h2", { text: "Text and highlight color" });
    contentEl.createEl("p", {
      cls: "setting-item-description",
      text: "Select beautiful custom colors for text foreground or background highlight."
    });
    const preview = contentEl.createDiv({ cls: "rich-editor-color-preview" });
    preview.setText("Selected text preview \u2014 \u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0646\u0635 \u0627\u0644\u062C\u0645\u064A\u0644");
    const previewStyles = {};
    if (this.options.appearance.fontFamily) previewStyles.fontFamily = this.options.appearance.fontFamily;
    if (this.options.appearance.fontSize) previewStyles.fontSize = this.options.appearance.fontSize;
    if (this.textColor) previewStyles.color = this.textColor;
    if (this.backgroundColor) previewStyles.backgroundColor = this.backgroundColor;
    preview.setCssStyles(previewStyles);
    preview.toggleClass("has-background-color", Boolean(this.backgroundColor));
    new import_obsidian8.Setting(contentEl).setName("Color target").setDesc("Switch between customizing the text color and the highlight background.").addDropdown(
      (dropdown) => dropdown.addOption("text", "Text color").addOption("background", "Highlight background").setValue(this.mode).onChange((value) => {
        this.mode = value;
        this.render();
      })
    );
    const currentColor = this.mode === "text" ? this.textColor : this.backgroundColor;
    const isText = this.mode === "text";
    const colorSetting = new import_obsidian8.Setting(contentEl).setName(isText ? "Custom text color" : "Custom highlight color").setDesc(currentColor ? `Current: ${currentColor}` : "No custom color set").addColorPicker(
      (picker) => picker.setValue(this.toPickerColor(currentColor)).onChange((value) => {
        this.setCurrentColor(value);
        this.render();
      })
    ).addText(
      (text) => text.setPlaceholder(isText ? "#e11d48" : "#fef08a").setValue(currentColor).onChange((value) => {
        this.setCurrentColor(value.trim());
      })
    ).addButton(
      (button) => button.setButtonText("Reset").setIcon("rotate-ccw").setTooltip("Reset this color").onClick(() => {
        this.setCurrentColor("");
        this.render();
      })
    );
    if (currentColor && this.options.onSetDefaultQuickColor) {
      colorSetting.addButton(
        (button) => button.setButtonText("Set as 1-click default").setTooltip("Use this as the default color for note-header quick buttons").onClick(() => {
          void this.setDefaultQuickColor(currentColor, isText ? "text" : "background");
        })
      );
    }
    contentEl.createEl("h4", {
      text: isText ? "Recommended text colors" : "Beautiful highlight palettes (Light & Dark)"
    });
    const presets = contentEl.createDiv({ cls: "rich-editor-color-presets" });
    const palette = isText ? TEXT_COLOR_PRESETS : HIGHLIGHT_PRESETS;
    for (const preset of palette) {
      const button = presets.createEl("button", {
        cls: "rich-editor-color-swatch",
        attr: { "aria-label": preset.name, title: `${preset.name} (${preset.color})` }
      });
      button.setCssStyles({ backgroundColor: preset.color });
      button.toggleClass("is-soft", preset.color.endsWith("66") || preset.color.endsWith("88"));
      button.addEventListener("click", () => {
        this.setCurrentColor(preset.color);
        this.render();
      });
    }
    new import_obsidian8.Setting(contentEl).addButton(
      (button) => button.setClass("mod-warning").setButtonText("Clear custom colors").onClick(() => {
        void this.clearColors();
      })
    ).addButton((button) => button.setButtonText("Cancel").onClick(() => this.close())).addButton(
      (button) => button.setCta().setButtonText("Apply").onClick(() => {
        void this.applyColors();
      })
    );
  }
  async setDefaultQuickColor(color, type) {
    const valid = normalizeColor(color);
    if (!valid) {
      new import_obsidian8.Notice("Please select a valid hexadecimal color first.");
      return;
    }
    try {
      await this.options.onSetDefaultQuickColor?.(type, valid);
      new import_obsidian8.Notice(`Rich Editor: set default ${type === "text" ? "text" : "highlight"} color to ${valid}`);
    } catch {
      new import_obsidian8.Notice("Rich Editor: could not save the default color.");
    }
  }
  async clearColors() {
    try {
      await this.options.onApply({ textColor: "", backgroundColor: "" });
      this.close();
    } catch {
      new import_obsidian8.Notice("Rich Editor: could not clear the colors.");
    }
  }
  async applyColors() {
    const textColor = this.textColor.trim();
    const backgroundColor = this.backgroundColor.trim();
    if (textColor && !normalizeColor(textColor) || backgroundColor && !normalizeColor(backgroundColor)) {
      new import_obsidian8.Notice("Use a valid hexadecimal color such as #3b82f6 or #fef08a.");
      return;
    }
    try {
      await this.options.onApply({ textColor, backgroundColor });
      this.close();
    } catch {
      new import_obsidian8.Notice("Rich Editor: could not apply the colors.");
    }
  }
  setCurrentColor(value) {
    if (this.mode === "text") this.textColor = value;
    else this.backgroundColor = value;
  }
  toPickerColor(value) {
    if (/^#[\da-f]{6}$/i.test(value)) return value;
    if (/^#[\da-f]{3}$/i.test(value)) {
      return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }
    return this.mode === "text" ? "#e11d48" : "#fef08a";
  }
};

// src/ui/menu/EditorContextMenu.ts
function buildEditorContextMenu(deps, menu, editor, view) {
  menu.addSeparator();
  menu.addItem(
    (item) => item.setSection("rich-editor").setTitle("Bold").setIcon("bold").onClick(() => deps.controller.toggleMark(editor, "bold"))
  );
  menu.addItem(
    (item) => item.setSection("rich-editor").setTitle("Italic").setIcon("italic").onClick(() => deps.controller.toggleMark(editor, "italic"))
  );
  menu.addItem(
    (item) => item.setSection("rich-editor").setTitle("Underline").setIcon("underline").onClick(() => deps.controller.toggleMark(editor, "underline"))
  );
  menu.addItem(
    (item) => item.setSection("rich-editor").setTitle("Strikethrough").setIcon("strikethrough").onClick(() => deps.controller.toggleMark(editor, "strikethrough"))
  );
  menu.addItem(
    (item) => item.setSection("rich-editor").setTitle("Bullet list").setIcon("list").onClick(() => deps.controller.toggleBulletList(editor))
  );
  menu.addItem(
    (item) => item.setSection("rich-editor").setTitle("Numbered list").setIcon("list-ordered").onClick(() => deps.controller.toggleNumberedList(editor))
  );
  menu.addItem(
    (item) => item.setSection("rich-editor").setTitle("Blockquote").setIcon("quote").onClick(() => deps.controller.toggleBlockquote(editor))
  );
  menu.addItem(
    (item) => item.setSection("rich-editor").setTitle("Classic highlight").setIcon("highlighter").onClick(() => deps.controller.toggleMark(editor, "highlight"))
  );
  menu.addItem(
    (item) => item.setSection("rich-editor").setTitle("Text and highlight color\u2026").setIcon("palette").onClick(() => deps.openColorPicker(editor))
  );
  menu.addItem(
    (item) => item.setSection("rich-editor").setTitle("Passage font and size\u2026").setIcon("type").onClick(() => deps.openPassageAppearance(editor))
  );
  menu.addItem(
    (item) => item.setSection("rich-editor").setTitle("Clear formatting").setIcon("eraser").onClick(() => deps.controller.clearFormatting(editor))
  );
  menu.addSeparator();
  menu.addItem(
    (item) => item.setSection("rich-editor").setTitle("Document appearance\u2026").setIcon("sliders-horizontal").onClick(() => deps.openDocumentAppearance(view))
  );
  menu.addItem(
    (item) => item.setSection("rich-editor").setTitle("Choose document font\u2026").setIcon("type").onClick(() => deps.chooseDocumentFont(view))
  );
}
function openDocumentFontPicker(app, fontService, onPick) {
  new FontPickerModal(app, fontService, onPick).open();
}

// src/ui/settings/RichEditorSettingsTab.ts
var import_obsidian9 = require("obsidian");
var RichEditorSettingsTab = class extends import_obsidian9.PluginSettingTab {
  constructor(app, plugin, settingsService) {
    super(app, plugin);
    this.settingsService = settingsService;
  }
  /**
   * Obsidian 1.13+ uses this declarative path for settings rendering and
   * search. Older Obsidian versions ignore it and use display() below.
   */
  getSettingDefinitions() {
    return [
      {
        name: "Selection toolbar",
        desc: "Show a small floating toolbar when text is selected in the editor.",
        control: {
          type: "toggle",
          key: "enableSelectionToolbar",
          defaultValue: true
        }
      },
      {
        name: "Hide passage style markup",
        desc: "Hide style markup (<mark> tags) in Live Preview while seamlessly displaying the visual result.",
        control: {
          type: "toggle",
          key: "hideInlineStyleMarkup",
          defaultValue: true
        }
      },
      {
        name: "Document action buttons",
        desc: "Show the document appearance button in each Markdown note header.",
        control: {
          type: "toggle",
          key: "showDocumentActions",
          defaultValue: true
        }
      },
      {
        name: "Quick color header buttons",
        desc: "Show 1-click text color and highlight buttons in each note header.",
        control: {
          type: "toggle",
          key: "showColorHeaderActions",
          defaultValue: true
        }
      },
      {
        name: "Highlight style and mode",
        desc: "Choose smooth pastel, sharp, or classic Markdown highlighting.",
        control: {
          type: "dropdown",
          key: "highlightMode",
          defaultValue: "rich-smooth",
          options: {
            "rich-smooth": "Style Suite \u2014 Smooth (Rounded corners, padded) [Default]",
            "rich-sharp": "Style Suite \u2014 Sharp (Square edges)",
            "classic-markdown": "Classic Markdown (==highlight==)"
          }
        }
      },
      {
        name: "Quick text color",
        desc: "Color applied by the 1-click text color button.",
        control: {
          type: "color",
          key: "activeTextColor",
          defaultValue: "#e11d48"
        }
      },
      {
        name: "Quick highlight color",
        desc: "Color applied by the 1-click custom highlight button.",
        control: {
          type: "color",
          key: "activeHighlightColor",
          defaultValue: "#fef08a"
        }
      },
      {
        type: "group",
        heading: "Default document appearance",
        items: [
          {
            name: "Default font",
            desc: "Fallback font for notes that do not define their own document font.",
            control: {
              type: "text",
              key: "defaultDocumentFont",
              defaultValue: "",
              placeholder: "Example: Amiri"
            }
          },
          {
            name: "Default font size",
            desc: "Fallback font size, such as 16px or 1.05em.",
            control: {
              type: "text",
              key: "defaultDocumentFontSize",
              defaultValue: "",
              placeholder: "Example: 17px"
            }
          },
          {
            name: "Default line height",
            desc: "Comfortable spacing for long-form notes.",
            control: {
              type: "text",
              key: "defaultDocumentLineHeight",
              defaultValue: "1.6",
              placeholder: "Example: 1.6"
            }
          },
          {
            name: "Default alignment",
            desc: "Fallback paragraph alignment for notes without a document-specific value.",
            control: {
              type: "dropdown",
              key: "defaultDocumentAlignment",
              defaultValue: "",
              options: {
                "": "Theme/default",
                left: "Left",
                center: "Center",
                right: "Right",
                justify: "Justify"
              }
            }
          }
        ]
      },
      {
        name: "Reset settings",
        desc: "Restore the plugin settings to their defaults.",
        action: () => {
          void this.resetSettings();
        }
      }
    ];
  }
  getControlValue(key) {
    if (!isRichEditorSettingKey(key)) return void 0;
    return this.settingsService.getSettings()[key];
  }
  setControlValue(key, value) {
    const updates = createSettingUpdate(key, value);
    if (!updates) return;
    return this.settingsService.updateSettings(updates).catch(() => {
      new import_obsidian9.Notice("OW-Tools: could not save that setting.");
    });
  }
  display() {
    const { containerEl } = this;
    const settings = this.settingsService.getSettings();
    containerEl.empty();
    containerEl.createEl("p", {
      text: "A comprehensive styling and typography suite for Obsidian notes with aesthetic highlights, custom fonts, floating toolbar, and document appearance."
    });
    new import_obsidian9.Setting(containerEl).setName("Selection toolbar").setDesc("Show a small floating toolbar when text is selected in the editor.").addToggle(
      (toggle) => toggle.setValue(settings.enableSelectionToolbar).onChange((value) => {
        this.persistSettings({ enableSelectionToolbar: value });
      })
    );
    new import_obsidian9.Setting(containerEl).setName("Hide passage style markup").setDesc("Hide style markup (<mark> tags) in Live Preview while seamlessly displaying the visual result.").addToggle(
      (toggle) => toggle.setValue(settings.hideInlineStyleMarkup).onChange((value) => {
        this.persistSettings({ hideInlineStyleMarkup: value });
      })
    );
    new import_obsidian9.Setting(containerEl).setName("Document action buttons").setDesc("Show the document appearance button in each Markdown note header.").addToggle(
      (toggle) => toggle.setValue(settings.showDocumentActions).onChange((value) => {
        this.persistSettings({ showDocumentActions: value });
      })
    );
    new import_obsidian9.Setting(containerEl).setName("Quick color header buttons").setDesc("Show 1-click text color and highlight buttons in each note header.").addToggle(
      (toggle) => toggle.setValue(settings.showColorHeaderActions).onChange((value) => {
        this.persistSettings({ showColorHeaderActions: value });
      })
    );
    new import_obsidian9.Setting(containerEl).setName("Highlight style and mode").setDesc("Choose your highlight behavior: smooth pastel highlight, sharp modern highlight, or Obsidian classic Markdown (==text==).").addDropdown(
      (dropdown) => dropdown.addOption("rich-smooth", "Style Suite \u2014 Smooth (Rounded corners, padded) [Default]").addOption("rich-sharp", "Style Suite \u2014 Sharp (Square edges)").addOption("classic-markdown", "Classic Markdown (==highlight==)").setValue(settings.highlightMode || "rich-smooth").onChange((value) => {
        this.persistSettings({ highlightMode: value });
      })
    );
    new import_obsidian9.Setting(containerEl).setName("Quick text color").setDesc("Color applied by the 1-click text color button.").addColorPicker(
      (color) => color.setValue(settings.activeTextColor || "#e11d48").onChange((value) => {
        this.persistSettings({ activeTextColor: value });
      })
    );
    new import_obsidian9.Setting(containerEl).setName("Quick highlight color").setDesc("Color applied by the 1-click custom highlight button.").addColorPicker(
      (color) => color.setValue(settings.activeHighlightColor || "#fef08a").onChange((value) => {
        this.persistSettings({ activeHighlightColor: value });
      })
    );
    new import_obsidian9.Setting(containerEl).setName("Default document appearance").setHeading();
    new import_obsidian9.Setting(containerEl).setName("Default font").setDesc("Fallback font for notes that do not define their own document font.").addText(
      (text) => text.setPlaceholder("Example: Amiri").setValue(settings.defaultDocumentFont).onChange((value) => {
        this.persistSettings({ defaultDocumentFont: value.trim() });
      })
    );
    new import_obsidian9.Setting(containerEl).setName("Default font size").setDesc("Fallback font size, such as 16px or 1.05em. Leave empty to use Obsidian theme size.").addText(
      (text) => text.setPlaceholder("Example: 17px").setValue(settings.defaultDocumentFontSize).onChange((value) => {
        this.persistSettings({ defaultDocumentFontSize: value.trim() });
      })
    );
    new import_obsidian9.Setting(containerEl).setName("Default line height").setDesc("Comfortable spacing for long-form notes. Leave empty to use the theme default.").addText(
      (text) => text.setPlaceholder("Example: 1.6").setValue(settings.defaultDocumentLineHeight).onChange((value) => {
        this.persistSettings({ defaultDocumentLineHeight: value.trim() });
      })
    );
    new import_obsidian9.Setting(containerEl).setName("Default alignment").setDesc("Fallback paragraph alignment for notes without a document-specific value.").addDropdown(
      (dropdown) => dropdown.addOption("", "Theme/default").addOption("left", "Left").addOption("center", "Center").addOption("right", "Right").addOption("justify", "Justify").setValue(settings.defaultDocumentAlignment).onChange((value) => {
        this.persistSettings({ defaultDocumentAlignment: value });
      })
    );
    new import_obsidian9.Setting(containerEl).setName("Reset settings").setDesc("Restore the plugin settings to their defaults.").addButton(
      (button) => button.setClass("mod-warning").setButtonText("Reset").onClick(() => {
        void this.resetSettings();
      })
    );
  }
  async resetSettings() {
    try {
      await this.settingsService.resetToDefaults();
      this.refreshSettings();
    } catch {
      new import_obsidian9.Notice("OW-Tools: could not reset the settings.");
    }
  }
  persistSettings(updates) {
    void this.settingsService.updateSettings(updates).catch(() => {
      new import_obsidian9.Notice("OW-Tools: could not save that setting.");
    });
  }
  refreshSettings() {
    const modernTab = this;
    if (typeof modernTab.update === "function") {
      modernTab.update();
    } else {
      this.display();
    }
  }
};
var RICH_EDITOR_SETTING_KEYS = [
  "enableSelectionToolbar",
  "hideInlineStyleMarkup",
  "showDocumentActions",
  "showColorHeaderActions",
  "activeTextColor",
  "activeHighlightColor",
  "highlightMode",
  "defaultDocumentFont",
  "defaultDocumentFontSize",
  "defaultDocumentLineHeight",
  "defaultDocumentAlignment"
];
function isRichEditorSettingKey(key) {
  return RICH_EDITOR_SETTING_KEYS.includes(key);
}
function createSettingUpdate(key, value) {
  switch (key) {
    case "enableSelectionToolbar":
      return typeof value === "boolean" ? { enableSelectionToolbar: value } : null;
    case "hideInlineStyleMarkup":
      return typeof value === "boolean" ? { hideInlineStyleMarkup: value } : null;
    case "showDocumentActions":
      return typeof value === "boolean" ? { showDocumentActions: value } : null;
    case "showColorHeaderActions":
      return typeof value === "boolean" ? { showColorHeaderActions: value } : null;
    case "activeTextColor":
      return typeof value === "string" ? { activeTextColor: value } : null;
    case "activeHighlightColor":
      return typeof value === "string" ? { activeHighlightColor: value } : null;
    case "highlightMode":
      return value === "rich-smooth" || value === "rich-sharp" || value === "classic-markdown" ? { highlightMode: value } : null;
    case "defaultDocumentFont":
      return typeof value === "string" ? { defaultDocumentFont: value } : null;
    case "defaultDocumentFontSize":
      return typeof value === "string" ? { defaultDocumentFontSize: value } : null;
    case "defaultDocumentLineHeight":
      return typeof value === "string" ? { defaultDocumentLineHeight: value } : null;
    case "defaultDocumentAlignment":
      return value === "" || value === "left" || value === "center" || value === "right" || value === "justify" ? { defaultDocumentAlignment: value } : null;
    default:
      return null;
  }
}

// src/main.ts
var RichEditorPlugin = class extends import_obsidian10.Plugin {
  settingsService = new SettingsService();
  fontService = new FontService();
  quickColorPopover = null;
  quickColorPopoverTrigger = null;
  quickTypographyPopover = null;
  quickTypographyPopoverTrigger = null;
  lastDocumentActionSettings = null;
  formattingController;
  async onload() {
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
        isMarkupHidden: () => this.settingsService.getSettings().hideInlineStyleMarkup
      })
    );
    this.registerMarkdownPostProcessor((element) => {
      this.applyReadingViewDirection(element);
      const marks = element.querySelectorAll("mark[c], mark[b], mark[f], mark[s]");
      marks.forEach((mark) => {
        const c = mark.getAttribute("c");
        const b = mark.getAttribute("b");
        const f = mark.getAttribute("f");
        const s = mark.getAttribute("s");
        const styles = {
          backgroundColor: b ?? "transparent"
        };
        if (c) styles.color = c;
        if (f) styles.fontFamily = f;
        if (s) styles.fontSize = s;
        mark.setCssStyles(styles);
      });
    });
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        if (!(view instanceof import_obsidian10.MarkdownView)) return;
        buildEditorContextMenu(
          {
            controller: this.formattingController,
            openDocumentAppearance: (markdownView) => this.openAppearanceForView(markdownView),
            chooseDocumentFont: (markdownView) => this.chooseFontForView(markdownView),
            openPassageAppearance: (selectedEditor) => this.openPassageAppearance(selectedEditor),
            openColorPicker: (selectedEditor) => this.openColorPicker(selectedEditor)
          },
          menu,
          editor,
          view
        );
      })
    );
    this.registerEvent(this.app.workspace.on("layout-change", () => this.ensureDocumentActions()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.ensureDocumentActions()));
    this.registerEvent(this.app.workspace.on("file-open", () => this.refreshDocumentAppearance()));
    this.registerEvent(this.app.metadataCache.on("changed", () => this.refreshDocumentAppearance()));
    this.app.workspace.onLayoutReady(() => {
      this.ensureDocumentActions();
      this.refreshDocumentAppearance();
    });
    registerFormattingCommands(this);
    this.addSettingTab(new RichEditorSettingsTab(this.app, this, this.settingsService));
  }
  onunload() {
    this.closeQuickPopovers();
  }
  openAppearanceForActiveDocument() {
    const view = this.getActiveMarkdownView();
    if (!view) {
      new import_obsidian10.Notice("Open a Markdown note first.");
      return;
    }
    this.openAppearanceForView(view);
  }
  async chooseFontForActiveDocument() {
    const view = this.getActiveMarkdownView();
    if (!view) {
      new import_obsidian10.Notice("Open a Markdown note first.");
      return;
    }
    this.chooseFontForView(view);
  }
  async clearFontForActiveDocument() {
    const file = this.formattingController.requireFile(this.getActiveMarkdownFile());
    if (!file) return;
    await this.formattingController.setDocumentFont(file, "");
    this.refreshDocumentAppearance();
    const view = this.getActiveMarkdownView();
    if (view) this.formattingController.restoreEditorFocus(view.editor);
    new import_obsidian10.Notice("OW-Tools: cleared document font.");
  }
  openPassageAppearanceForActiveSelection() {
    const editor = this.formattingController.getActiveEditor();
    if (!editor) {
      new import_obsidian10.Notice("Open a Markdown note and select a passage first.");
      return;
    }
    this.openPassageAppearance(editor);
  }
  async clearAppearanceForActiveDocument() {
    const file = this.formattingController.requireFile(this.getActiveMarkdownFile());
    if (!file) return;
    await this.formattingController.setDocumentAppearance(file, {
      fontFamily: "",
      fontSize: "",
      lineHeight: "",
      alignment: void 0
    });
    this.refreshDocumentAppearance();
    new import_obsidian10.Notice("OW-Tools: cleared document appearance.");
  }
  getActiveMarkdownView() {
    return this.app.workspace.getActiveViewOfType(import_obsidian10.MarkdownView);
  }
  getActiveMarkdownFile() {
    return this.getViewFile(this.getActiveMarkdownView());
  }
  getViewFile(view) {
    if (!view) return null;
    const file = view.file;
    return file instanceof import_obsidian10.TFile ? file : null;
  }
  openAppearanceForView(view) {
    const file = this.formattingController.requireFile(this.getViewFile(view));
    if (!file) return;
    new DocumentAppearanceModal(this.app, {
      appearance: this.getAppearanceForView(view),
      fontService: this.fontService,
      onApply: async (appearance) => {
        await this.formattingController.setDocumentAppearance(file, appearance);
        this.refreshDocumentAppearance();
        this.formattingController.restoreEditorFocus(view.editor);
        new import_obsidian10.Notice("OW-Tools: document appearance updated.");
      }
    }).open();
  }
  chooseFontForView(view) {
    const file = this.formattingController.requireFile(this.getViewFile(view));
    if (!file) return;
    openDocumentFontPicker(this.app, this.fontService, (font) => {
      void this.applyDocumentFontSelection(file, font, view);
    });
  }
  async applyDocumentFontSelection(file, font, view) {
    try {
      await this.formattingController.setDocumentFont(file, font);
      this.refreshDocumentAppearance();
      this.formattingController.restoreEditorFocus(view.editor);
      new import_obsidian10.Notice(`OW-Tools: document font set to ${font}.`);
    } catch {
      new import_obsidian10.Notice("OW-Tools: could not save the document font.");
    }
  }
  openPassageAppearance(editor) {
    const current = this.formattingController.getSelectionRange(editor);
    const selection = { from: { ...current.from }, to: { ...current.to } };
    if (!editor.getRange(selection.from, selection.to)) {
      new import_obsidian10.Notice("Select a passage first.");
      return;
    }
    new PassageAppearanceModal(this.app, {
      appearance: this.formattingController.getInlineTypography(editor, selection),
      fontService: this.fontService,
      onApply: (appearance) => {
        this.formattingController.setInlineTypography(editor, appearance, selection);
      }
    }).open();
  }
  openColorPicker(editor, initialMode) {
    const current = this.formattingController.getSelectionRange(editor);
    const selection = { from: { ...current.from }, to: { ...current.to } };
    const hasSelection = !!editor.getRange(selection.from, selection.to);
    new TextColorModal(this.app, {
      appearance: hasSelection ? this.formattingController.getInlineTypography(editor, selection) : {},
      initialMode,
      onApply: async (colors) => {
        const updates = {};
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
        if (type === "text") {
          await this.settingsService.updateSettings({ activeTextColor: color });
        } else {
          await this.settingsService.updateSettings({ activeHighlightColor: color });
        }
        this.refreshActionState();
      }
    }).open();
  }
  snapshotSelection(editor) {
    const selection = this.formattingController.getSelectionRange(editor);
    return {
      from: { ...selection.from },
      to: { ...selection.to }
    };
  }
  openQuickColorPopover(view, anchorEl, mode, selection) {
    this.closeQuickPopovers();
    anchorEl.classList.add("is-active");
    anchorEl.setAttribute("aria-expanded", "true");
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
        anchorEl.classList.remove("is-active");
        anchorEl.setAttribute("aria-expanded", "false");
      }
    });
    this.quickColorPopover = popover;
    this.quickColorPopoverTrigger = anchorEl;
    popover.open();
  }
  openQuickTypographyPopover(view, anchorEl, selection) {
    this.closeQuickPopovers();
    anchorEl.classList.add("is-active");
    anchorEl.setAttribute("aria-expanded", "true");
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
        anchorEl.classList.remove("is-active");
        anchorEl.setAttribute("aria-expanded", "false");
      }
    });
    this.quickTypographyPopover = popover;
    this.quickTypographyPopoverTrigger = anchorEl;
    popover.open();
  }
  closeQuickPopovers() {
    this.closeQuickColorPopover();
    this.closeQuickTypographyPopover();
  }
  closeQuickColorPopover() {
    this.quickColorPopover?.close();
    this.quickColorPopover = null;
    if (this.quickColorPopoverTrigger) {
      this.quickColorPopoverTrigger.classList.remove("is-active");
      this.quickColorPopoverTrigger.setAttribute("aria-expanded", "false");
      this.quickColorPopoverTrigger = null;
    }
  }
  closeQuickTypographyPopover() {
    this.quickTypographyPopover?.close();
    this.quickTypographyPopover = null;
    if (this.quickTypographyPopoverTrigger) {
      this.quickTypographyPopoverTrigger.classList.remove("is-active");
      this.quickTypographyPopoverTrigger.setAttribute("aria-expanded", "false");
      this.quickTypographyPopoverTrigger = null;
    }
  }
  documentActionLayoutChanged(settings) {
    const next = {
      showDocumentActions: settings.showDocumentActions,
      showColorHeaderActions: settings.showColorHeaderActions
    };
    const changed = this.lastDocumentActionSettings === null || this.lastDocumentActionSettings.showDocumentActions !== next.showDocumentActions || this.lastDocumentActionSettings.showColorHeaderActions !== next.showColorHeaderActions;
    this.lastDocumentActionSettings = next;
    return changed;
  }
  ensureDocumentActions() {
    this.closeQuickPopovers();
    const settings = this.settingsService.getSettings();
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (!(view instanceof import_obsidian10.MarkdownView)) return;
      view.containerEl.querySelectorAll(".rich-editor-view-action").forEach((element) => element.remove());
      if (settings.showDocumentActions) {
        const appearanceButton = view.addAction("sliders-horizontal", "Document appearance", () => this.openAppearanceForView(view));
        appearanceButton.addClass("rich-editor-view-action", "rich-editor-view-action-appearance");
        let typographySelection = null;
        const typographyButton = view.addAction("case-sensitive", "Passage typography", () => {
          this.openQuickTypographyPopover(view, typographyButton, typographySelection ?? this.snapshotSelection(view.editor));
          typographySelection = null;
        });
        typographyButton.addClass("rich-editor-view-action", "rich-editor-view-action-typography");
        typographyButton.setAttribute("aria-haspopup", "dialog");
        typographyButton.setAttribute("aria-expanded", "false");
        typographyButton.addEventListener("mousedown", (event) => {
          event.preventDefault();
          typographySelection = this.snapshotSelection(view.editor);
        });
        typographyButton.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          this.openPassageAppearance(view.editor);
        });
      }
      if (settings.showColorHeaderActions) {
        let textSelection = null;
        const textColorButton = view.addAction("type", "Text color palette", () => {
          this.openQuickColorPopover(view, textColorButton, "text", textSelection ?? this.snapshotSelection(view.editor));
          textSelection = null;
        });
        textColorButton.addClass("rich-editor-view-action", "rich-editor-view-action-text-color");
        textColorButton.setAttribute("aria-haspopup", "dialog");
        textColorButton.setAttribute("aria-expanded", "false");
        textColorButton.addEventListener("mousedown", (event) => {
          event.preventDefault();
          textSelection = this.snapshotSelection(view.editor);
        });
        textColorButton.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          this.openColorPicker(view.editor, "text");
        });
        let highlightSelection = null;
        const highlightButton = view.addAction("highlighter", "Highlight palette", () => {
          this.openQuickColorPopover(view, highlightButton, "background", highlightSelection ?? this.snapshotSelection(view.editor));
          highlightSelection = null;
        });
        highlightButton.addClass("rich-editor-view-action", "rich-editor-view-action-highlight-color");
        highlightButton.setAttribute("aria-haspopup", "dialog");
        highlightButton.setAttribute("aria-expanded", "false");
        highlightButton.addEventListener("mousedown", (event) => {
          event.preventDefault();
          highlightSelection = this.snapshotSelection(view.editor);
        });
        highlightButton.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          this.openColorPicker(view.editor, "background");
        });
      }
    });
    this.refreshActionState();
  }
  async toggleInlineStyleMarkup() {
    const current = this.settingsService.getSettings().hideInlineStyleMarkup;
    await this.settingsService.updateSettings({ hideInlineStyleMarkup: !current });
    new import_obsidian10.Notice(`Inline style markup is now ${!current ? "hidden" : "visible"}.`);
  }
  refreshActionState() {
    const settings = this.settingsService.getSettings();
    document.body.classList.toggle("rich-editor-highlight-sharp", settings.highlightMode === "rich-sharp");
    document.body.classList.toggle("rich-editor-highlight-smooth", settings.highlightMode !== "rich-sharp");
    document.body.setCssProps({
      "--rich-editor-highlight-radius": settings.highlightMode === "rich-sharp" ? "0px" : "4px"
    });
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (!(view instanceof import_obsidian10.MarkdownView)) return;
      view.containerEl.querySelector(".rich-editor-view-action-appearance")?.classList.toggle("has-document-appearance", this.hasExplicitAppearance(view));
      const passageTypography = this.formattingController.getInlineTypography(view.editor);
      view.containerEl.querySelector(".rich-editor-view-action-typography")?.classList.toggle("has-passage-typography", !!(passageTypography.fontFamily || passageTypography.fontSize));
      const textColorBtn = view.containerEl.querySelector(".rich-editor-view-action-text-color");
      if (textColorBtn) {
        textColorBtn.setCssProps({
          "--rich-editor-active-text-color": settings.activeTextColor || "#e11d48"
        });
        textColorBtn.setAttribute(
          "aria-label",
          `Text color palette (${settings.activeTextColor || "#e11d48"})
Click to choose a color, right-click for advanced settings`
        );
      }
      const highlightBtn = view.containerEl.querySelector(".rich-editor-view-action-highlight-color");
      if (highlightBtn) {
        highlightBtn.setCssProps({
          "--rich-editor-active-highlight-color": settings.activeHighlightColor || "#fef08a"
        });
        highlightBtn.setAttribute(
          "aria-label",
          `Highlight palette (${settings.activeHighlightColor || "#fef08a"})
Click to choose a color, right-click for advanced settings`
        );
      }
    });
  }
  refreshDocumentAppearance() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (!(view instanceof import_obsidian10.MarkdownView)) return;
      this.applyAppearanceToView(view);
    });
    this.refreshActionState();
  }
  applyReadingViewDirection(element) {
    const blockSelector = "p, li, blockquote, h1, h2, h3, h4, h5, h6, td, th";
    const blocks = [];
    if (element.matches(blockSelector)) blocks.push(element);
    blocks.push(...Array.from(element.querySelectorAll(blockSelector)));
    for (const block of blocks) {
      const direction = detectContentDirection(block.textContent ?? "");
      if (direction === "rtl") {
        block.setAttribute("dir", "rtl");
        block.dataset.richEditorBidi = "rtl";
      } else if (block.dataset.richEditorBidi === "rtl") {
        block.removeAttribute("dir");
        delete block.dataset.richEditorBidi;
      }
    }
  }
  applyAppearanceToView(view) {
    applyDocumentAppearanceToElement(view.containerEl, this.getEffectiveAppearanceForView(view));
  }
  getEffectiveAppearanceForView(view) {
    const settings = this.settingsService.getSettings();
    const appearance = this.getAppearanceForView(view);
    return {
      fontFamily: appearance.fontFamily ?? this.normalizeOptional(settings.defaultDocumentFont),
      fontSize: appearance.fontSize ?? this.normalizeOptional(settings.defaultDocumentFontSize),
      lineHeight: appearance.lineHeight ?? this.normalizeOptional(settings.defaultDocumentLineHeight),
      alignment: (appearance.alignment ?? settings.defaultDocumentAlignment) || void 0
    };
  }
  getAppearanceForView(view) {
    const file = this.getViewFile(view);
    if (!file) return {};
    const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter ?? null;
    return readDocumentAppearanceFromFrontmatter(frontmatter);
  }
  hasExplicitAppearance(view) {
    const appearance = this.getAppearanceForView(view);
    return Object.values(appearance).some((value) => value !== void 0 && value !== "");
  }
  normalizeOptional(value) {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : void 0;
  }
};
module.exports = module.exports.default || module.exports;
