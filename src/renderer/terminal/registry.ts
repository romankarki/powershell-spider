import { Terminal, ITerminalOptions } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon, ISearchOptions } from '@xterm/addon-search';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebglAddon } from '@xterm/addon-webgl';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { THEMES, DEFAULT_THEME, getFlavor } from '../themes';
import type { PromptStyle } from '../types/electron';
import { useSettingsStore, getSettings, Settings } from '../state/settings-store';
import { comboFromEvent } from '../keys';
import '@xterm/xterm/css/xterm.css';

/**
 * Persistent registry: terminal instances survive React unmount/remount cycles.
 * This is critical for split operations — when a leaf becomes nested in a split
 * node, React remounts the component, but the PTY session and xterm state must persist.
 */
interface TerminalEntry {
  terminal: Terminal;
  fitAddon: FitAddon;
  searchAddon: SearchAddon;
  webgl: WebglAddon | null;
  wrapper: HTMLDivElement; // persistent DOM container that xterm renders into
  resizeObserver: ResizeObserver | null;
  disposers: (() => void)[];
  lastCols: number;
  lastRows: number;
}

/** Callbacks into app state, registered by the store (avoids a circular import). */
export interface TerminalEvents {
  onFocus: (id: string) => void;
  onExit: (id: string, exitCode: number) => void;
  onCwd: (id: string, cwd: string) => void;
  onTitle: (id: string, title: string) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  notify: (message: string) => void;
  confirmPaste: (text: string) => Promise<boolean>;
}

const noop = () => {};
let events: TerminalEvents = {
  onFocus: noop, onExit: noop, onCwd: noop, onTitle: noop, onContextMenu: noop, notify: noop,
  confirmPaste: async () => true,
};

export function setTerminalEvents(e: TerminalEvents): void {
  events = e;
}

const registry = new Map<string, TerminalEntry>();

function terminalOptions(s: Settings): ITerminalOptions {
  return {
    theme: (THEMES[s.theme] ?? THEMES[DEFAULT_THEME]).terminal,
    fontFamily: s.fontFamily,
    fontSize: s.fontSize,
    lineHeight: s.lineHeight,
    cursorStyle: s.cursorStyle,
    cursorBlink: s.cursorBlink,
    cursorInactiveStyle: 'outline',
    scrollback: s.scrollback,
  };
}

function fitAndResize(id: string, entry: TerminalEntry): void {
  const el = entry.wrapper;
  if (!el.isConnected || el.clientWidth === 0 || el.clientHeight === 0) return;
  try {
    entry.fitAddon.fit();
  } catch { return; }
  const { cols, rows } = entry.terminal;
  if (cols !== entry.lastCols || rows !== entry.lastRows) {
    entry.lastCols = cols;
    entry.lastRows = rows;
    window.electronAPI.resizeTerminal(id, cols, rows);
  }
}

function loadWebgl(entry: TerminalEntry): void {
  try {
    const webgl = new WebglAddon();
    // Falls back to the DOM renderer if the GPU context is lost
    webgl.onContextLoss(() => {
      webgl.dispose();
      entry.webgl = null;
    });
    entry.terminal.loadAddon(webgl);
    entry.webgl = webgl;
  } catch {
    entry.webgl = null;
  }
}

// --- Clipboard ---

export async function copySelection(id: string, opts: { clear?: boolean; silent?: boolean } = {}): Promise<boolean> {
  const term = registry.get(id)?.terminal;
  if (!term || !term.hasSelection()) return false;
  const text = term.getSelection();
  if (!text) return false;
  await window.electronAPI.writeClipboard(text);
  if (opts.clear) term.clearSelection();
  if (!opts.silent) events.notify(`Copied ${text.length} character${text.length === 1 ? '' : 's'}`);
  return true;
}

/**
 * Paste clipboard text. When the clipboard has no text (e.g. an image), the raw
 * Ctrl+V byte is forwarded so apps like Claude Code can read the clipboard themselves.
 */
export async function pasteClipboard(id: string, forwardCtrlVIfEmpty = false): Promise<void> {
  const term = registry.get(id)?.terminal;
  if (!term) return;
  const text = await window.electronAPI.readClipboard();
  if (!text) {
    if (forwardCtrlVIfEmpty) window.electronAPI.writeTerminal(id, '\x16');
    return;
  }
  // Without bracketed paste, a multi-line paste runs every line in the shell
  const multiline = /\r?\n./.test(text.trimEnd());
  if (multiline && !term.modes.bracketedPasteMode && getSettings().warnMultilinePaste) {
    const ok = await events.confirmPaste(text);
    if (!ok) {
      term.focus();
      return;
    }
  }
  term.paste(text);
  term.focus();
}

/** Type text into a terminal as a paste (used for dropped file paths). */
export function pasteText(id: string, text: string): void {
  const term = registry.get(id)?.terminal;
  if (!term) return;
  term.paste(text);
  term.focus();
}

export function selectAll(id: string): void {
  registry.get(id)?.terminal.selectAll();
}

export function clearTerminal(id: string): void {
  const term = registry.get(id)?.terminal;
  if (!term) return;
  term.clear();
  // Ask the shell to redraw its prompt
  window.electronAPI.writeTerminal(id, '\x0c');
}

export function focusTerminal(id: string): void {
  registry.get(id)?.terminal.focus();
}

export function hasSelection(id: string): boolean {
  return registry.get(id)?.terminal.hasSelection() ?? false;
}

export function scrollTerminal(id: string, where: 'top' | 'bottom'): void {
  const term = registry.get(id)?.terminal;
  if (where === 'top') term?.scrollToTop();
  else term?.scrollToBottom();
}

// --- Lifecycle ---

function createEntry(id: string, cwd?: string): TerminalEntry {
  const wrapper = document.createElement('div');
  wrapper.className = 'xterm-wrapper';

  const term = new Terminal({
    ...terminalOptions(getSettings()),
    allowProposedApi: true,
    rightClickSelectsWord: false,
    windowsPty: { backend: 'conpty', buildNumber: window.electronAPI.osBuild || undefined },
  });

  const fitAddon = new FitAddon();
  const searchAddon = new SearchAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(searchAddon);
  term.loadAddon(new Unicode11Addon());
  term.unicode.activeVersion = '11';
  // Ctrl+click opens links (plain clicks stay free for selection)
  term.loadAddon(new WebLinksAddon((event, uri) => {
    if (event.ctrlKey) window.electronAPI.openExternal(uri);
  }));

  const entry: TerminalEntry = {
    terminal: term,
    fitAddon,
    searchAddon,
    webgl: null,
    wrapper,
    resizeObserver: null,
    disposers: [],
    lastCols: 0,
    lastRows: 0,
  };

  // Clipboard & app keys that must be handled while the terminal has focus
  term.attachCustomKeyEventHandler((e) => {
    const combo = comboFromEvent(e);
    const isCopy = combo === 'Ctrl+Shift+C' || combo === 'Ctrl+Insert' || (combo === 'Ctrl+C' && term.hasSelection());
    const isPaste = combo === 'Ctrl+V' || combo === 'Ctrl+Shift+V' || combo === 'Shift+Insert';
    if (!isCopy && !isPaste) return true;
    e.preventDefault(); // also stops the browser's native paste event (no double paste)
    if (e.type === 'keydown') {
      if (isCopy) copySelection(id, { clear: combo === 'Ctrl+C' });
      else pasteClipboard(id, combo === 'Ctrl+V');
    }
    return false;
  });

  // Shell integration: cwd via OSC 9;9 (Windows Terminal convention), title via OSC 0/2
  const oscDispose = term.parser.registerOscHandler(9, (data) => {
    if (!data.startsWith('9;')) return false;
    const cwd = data.slice(2).replace(/^"(.*)"$/, '$1');
    if (cwd) events.onCwd(id, cwd);
    return true;
  });
  const titleDispose = term.onTitleChange((title) => events.onTitle(id, title));

  const selDispose = term.onSelectionChange(() => {
    if (getSettings().copyOnSelect && term.hasSelection()) {
      copySelection(id, { silent: true });
    }
  });

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (getSettings().rightClickAction === 'copyPaste') {
      if (term.hasSelection()) copySelection(id, { clear: true });
      else pasteClipboard(id);
    } else {
      events.onContextMenu(id, e.clientX, e.clientY);
    }
  };
  wrapper.addEventListener('contextmenu', onContextMenu);

  term.open(wrapper);
  loadWebgl(entry);

  // PTY -> xterm
  const removeDataListener = window.electronAPI.onTerminalData(id, (data) => term.write(data));
  const removeExitListener = window.electronAPI.onTerminalExit(id, (code) => events.onExit(id, code));
  // xterm -> PTY
  const dataDispose = term.onData((data) => window.electronAPI.writeTerminal(id, data));

  const onFocus = () => events.onFocus(id);
  term.textarea?.addEventListener('focus', onFocus);

  entry.disposers.push(
    removeDataListener,
    removeExitListener,
    () => dataDispose.dispose(),
    () => oscDispose.dispose(),
    () => titleDispose.dispose(),
    () => selDispose.dispose(),
    () => wrapper.removeEventListener('contextmenu', onContextMenu),
    () => term.textarea?.removeEventListener('focus', onFocus),
  );

  registry.set(id, entry);

  const s = getSettings();
  window.electronAPI.createTerminal(id, { cwd, shell: s.shell, promptStyle: effectivePromptStyle(s), promptFallback: promptFallback(s) });
  return entry;
}

/** The prompt preset actually used for new shells: a hero theme's own prompt when the style is "auto". */
export function effectivePromptStyle(s: Settings): PromptStyle {
  const themePrompt = getFlavor(s.theme).prompt as PromptStyle | undefined;
  return s.promptStyle === 'auto' && themePrompt ? themePrompt : s.promptStyle;
}

/** Preset used by "auto" when there is no Void config: the theme's fallback (e.g. Ghostty's blue prompt). */
export function promptFallback(s: Settings): PromptStyle | undefined {
  return getFlavor(s.theme).fallbackPrompt as PromptStyle | undefined;
}

/** Mount (creating on first use) a terminal into a container. Returns a detach function. */
export function attachTerminal(id: string, container: HTMLElement, cwd?: string): () => void {
  const existing = registry.get(id);
  const entry = existing ?? createEntry(id, cwd);
  container.appendChild(entry.wrapper);

  if (existing) {
    // The WebGL canvas may be stale after a DOM move
    requestAnimationFrame(() => entry.terminal.refresh(0, entry.terminal.rows - 1));
  }

  entry.resizeObserver?.disconnect();
  let frame = 0;
  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => fitAndResize(id, entry));
  });
  resizeObserver.observe(container);
  entry.resizeObserver = resizeObserver;
  requestAnimationFrame(() => fitAndResize(id, entry));

  return () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    if (entry.resizeObserver === resizeObserver) entry.resizeObserver = null;
    // Keep the terminal alive, only remove it from this container
    if (entry.wrapper.parentElement === container) {
      container.removeChild(entry.wrapper);
    }
  };
}

/** Destroy a terminal and its PTY. Call only on explicit close. */
export function destroyTerminal(id: string): void {
  const entry = registry.get(id);
  if (entry) {
    entry.resizeObserver?.disconnect();
    entry.disposers.forEach((d) => d());
    entry.terminal.dispose();
    entry.wrapper.remove();
    registry.delete(id);
  }
  window.electronAPI.killTerminal(id);
}

// Apply settings changes live to every terminal
useSettingsStore.subscribe((s, prev) => {
  if (
    s.theme === prev.theme && s.fontFamily === prev.fontFamily && s.fontSize === prev.fontSize &&
    s.lineHeight === prev.lineHeight && s.cursorStyle === prev.cursorStyle &&
    s.cursorBlink === prev.cursorBlink && s.scrollback === prev.scrollback
  ) return;
  const opts = terminalOptions(s);
  for (const [id, entry] of registry) {
    entry.terminal.options = opts;
    requestAnimationFrame(() => fitAndResize(id, entry));
  }
});

// --- Search API ---

const SEARCH_DECORATIONS = {
  matchBackground: '#ffea0033',
  matchBorder: '#ffea0066',
  matchOverviewRuler: '#ffea00',
  activeMatchBackground: '#00ff4155',
  activeMatchBorder: '#00ff41',
  activeMatchColorOverviewRuler: '#00ff41',
};

export interface SearchResult {
  resultIndex: number;
  resultCount: number;
}

export interface SearchOptions {
  regex?: boolean;
  caseSensitive?: boolean;
  wholeWord?: boolean;
}

/** Subscribe to search result changes for a terminal. Returns unsubscribe function. */
export function onSearchResults(id: string, cb: (result: SearchResult) => void): () => void {
  const entry = registry.get(id);
  if (!entry) return () => {};
  const dispose = entry.searchAddon.onDidChangeResults((e) => {
    cb({ resultIndex: e.resultIndex, resultCount: e.resultCount });
  });
  return () => dispose.dispose();
}

function buildSearchOpts(options: SearchOptions): ISearchOptions {
  return {
    regex: options.regex ?? false,
    caseSensitive: options.caseSensitive ?? false,
    wholeWord: options.wholeWord ?? false,
    decorations: SEARCH_DECORATIONS,
  };
}

export function searchNext(id: string, query: string, options: SearchOptions = {}): boolean {
  const entry = registry.get(id);
  if (!entry || !query) return false;
  return entry.searchAddon.findNext(query, buildSearchOpts(options));
}

export function searchPrevious(id: string, query: string, options: SearchOptions = {}): boolean {
  const entry = registry.get(id);
  if (!entry || !query) return false;
  return entry.searchAddon.findPrevious(query, buildSearchOpts(options));
}

export function clearSearch(id: string): void {
  const entry = registry.get(id);
  if (entry) {
    entry.searchAddon.clearDecorations();
    entry.terminal.clearSelection();
  }
}
