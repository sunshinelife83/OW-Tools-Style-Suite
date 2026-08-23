/**
 * Minimal plugin settings for the simplified Rich Editor.
 */

import type { DocumentAlignment } from '../../editor/DocumentAppearance.js';


export type HighlightMode = 'rich-smooth' | 'rich-sharp' | 'classic-markdown';

export interface RichEditorSettings {
  enableSelectionToolbar: boolean;
  hideInlineStyleMarkup: boolean;
  showDocumentActions: boolean;
  showColorHeaderActions: boolean;
  activeTextColor: string;
  activeHighlightColor: string;
  highlightMode: HighlightMode;
  defaultDocumentFont: string;
  defaultDocumentFontSize: string;
  defaultDocumentLineHeight: string;
  defaultDocumentAlignment: DocumentAlignment | '';
}

export const DEFAULT_SETTINGS: RichEditorSettings = {
  enableSelectionToolbar: true,
  hideInlineStyleMarkup: true,
  showDocumentActions: true,
  showColorHeaderActions: true,
  activeTextColor: '#e11d48',
  activeHighlightColor: '#fef08a',
  highlightMode: 'rich-smooth',
  defaultDocumentFont: '',
  defaultDocumentFontSize: '',
  defaultDocumentLineHeight: '1.6',
  defaultDocumentAlignment: '',
};


