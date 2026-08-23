export class Plugin {
  app: any;
  manifest: any;
  constructor(app: any, manifest: any) {
    this.app = app;
    this.manifest = manifest;
  }
}

export class PluginSettingTab {
  app: any;
  plugin: any;
  containerEl: HTMLElement;
  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }
  display() {}
  hide() {}
}

export class Modal {
  app: any;
  contentEl: HTMLElement;
  constructor(app: any) {
    this.app = app;
    this.contentEl = document.createElement('div');
  }
  open() {}
  close() {}
  onOpen() {}
  onClose() {}
}

export class SuggestModal<T> extends Modal {
  inputEl: HTMLInputElement;
  limit: number = 10;
  constructor(app: any) {
    super(app);
    this.inputEl = document.createElement('input');
  }
  setInstructions(_instructions: any[]) {}
  getItems(): T[] { return []; }
  getItemText(_item: T): string { return ''; }
  onChooseItem(_item: T, _evt: MouseEvent | KeyboardEvent) {}
  renderSuggestion(_item: T, _el: HTMLElement) {}
}

export class Notice {
  constructor(public message: string, public duration?: number) {}
}

export class Menu {
  items: any[] = [];
  addItem(cb: (item: any) => void) {
    const item = {
      setTitle: () => item,
      setIcon: () => item,
      setActive: () => item,
      setChecked: () => item,
      setDisabled: () => item,
      onClick: () => item,
    };
    cb(item);
    this.items.push(item);
    return this;
  }
  addSeparator() { return this; }
  showAtPosition() { return this; }
  showAtMouseEvent() { return this; }
}

export class Setting {
  settingEl: HTMLElement;
  constructor(public containerEl: HTMLElement) {
    this.settingEl = document.createElement('div');
    containerEl.appendChild(this.settingEl);
  }
  setName(_name: string) { return this; }
  setDesc(_desc: string) { return this; }
  setClass(_cls: string) { return this; }
  addToggle(cb: (toggle: any) => void) {
    const toggle = {
      setValue: () => toggle,
      onChange: () => toggle,
    };
    cb(toggle);
    return this;
  }
  addText(cb: (text: any) => void) {
    const text = {
      setValue: () => text,
      setPlaceholder: () => text,
      onChange: () => text,
    };
    cb(text);
    return this;
  }
  addDropdown(cb: (dropdown: any) => void) {
    const dropdown = {
      addOption: () => dropdown,
      setValue: () => dropdown,
      onChange: () => dropdown,
    };
    cb(dropdown);
    return this;
  }
  addButton(cb: (btn: any) => void) {
    const btn = {
      setButtonText: () => btn,
      setIcon: () => btn,
      setWarning: () => btn,
      setCta: () => btn,
      onClick: () => btn,
    };
    cb(btn);
    return this;
  }
}

export class MarkdownView {
  editor: any;
  containerEl: HTMLElement;
  constructor() {
    this.containerEl = document.createElement('div');
  }
}

export class TFile {
  path: string = '';
  basename: string = '';
  extension: string = '';
}

export interface EditorPosition {
  line: number;
  ch: number;
}

export interface EditorSelectionRange {
  from: EditorPosition;
  to: EditorPosition;
}

export interface Editor {
  getLine(line: number): string;
  lineCount(): number;
  getCursor(which?: string): EditorPosition;
  getSelection(): string;
  replaceRange(replacement: string, from: EditorPosition, to?: EditorPosition): void;
  replaceSelection(replacement: string): void;
  setSelection(from: EditorPosition, to?: EditorPosition): void;
  setCursor(pos: EditorPosition | number, ch?: number): void;
  wordAt(pos: EditorPosition): { from: EditorPosition; to: EditorPosition } | null;
}
