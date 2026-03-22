import { useEffect, useRef } from 'react';
import { Terminal, ITheme } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon, ISearchOptions } from '@xterm/addon-search';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { THEMES, DEFAULT_THEME, ThemeId } from '../themes';
import '@xterm/xterm/css/xterm.css';

declare global {
  interface Window {
    electronAPI: {
      createTerminal: (id: string, cwd?: string) => Promise<void>;
      writeTerminal: (id: string, data: string) => Promise<void>;
      resizeTerminal: (id: string, cols: number, rows: number) => Promise<void>;
      killTerminal: (id: string) => Promise<void>;
      writeAll: (ids: string[], data: string) => Promise<void>;
      onTerminalData: (id: string, cb: (data: string) => void) => () => void;
      onTerminalExit: (id: string, cb: () => void) => () => void;
      getCwd: (id: string) => Promise<string>;
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
    };
  }
}

// Current theme ID, updated by applyTheme()
let currentThemeId: ThemeId = DEFAULT_THEME;

function getTerminalTheme(): ITheme {
  return THEMES[currentThemeId]?.terminal ?? THEMES[DEFAULT_THEME].terminal;
}

// Persistent registry: terminal instances survive React unmount/remount cycles.
// This is critical for split operations — when a leaf becomes nested in a split node,
// React remounts the component, but the PTY session and xterm state must persist.
interface TerminalEntry {
  terminal: Terminal;
  fitAddon: FitAddon;
  searchAddon: SearchAddon;
  wrapper: HTMLDivElement;        // persistent DOM container that xterm renders into
  removeDataListener: () => void;
  onDataDispose: { dispose: () => void };
  resizeObserver: ResizeObserver | null;
}

const registry = new Map<string, TerminalEntry>();

/** Destroy a terminal and its PTY. Call only on explicit close. */
export function destroyTerminal(id: string): void {
  const entry = registry.get(id);
  if (entry) {
    entry.resizeObserver?.disconnect();
    entry.removeDataListener();
    entry.onDataDispose.dispose();
    entry.terminal.dispose();
    entry.wrapper.remove();
    registry.delete(id);
  }
  window.electronAPI.killTerminal(id);
}

export function useTerminal(
  id: string,
  containerRef: React.RefObject<HTMLDivElement | null>,
  isActive: boolean,
  onFocus: () => void,
  cwd?: string
) {
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let entry = registry.get(id);

    if (entry) {
      // Reattach existing terminal to new container
      container.appendChild(entry.wrapper);
      termRef.current = entry.terminal;
      fitRef.current = entry.fitAddon;

      // Refit after DOM move
      requestAnimationFrame(() => {
        try {
          entry!.fitAddon.fit();
          window.electronAPI.resizeTerminal(id, entry!.terminal.cols, entry!.terminal.rows);
        } catch { /* ignore */ }
      });

      // Update resize observer to new container
      entry.resizeObserver?.disconnect();
      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          try {
            entry!.fitAddon.fit();
            window.electronAPI.resizeTerminal(id, entry!.terminal.cols, entry!.terminal.rows);
          } catch { /* ignore */ }
        });
      });
      resizeObserver.observe(container);
      entry.resizeObserver = resizeObserver;
    } else {
      // First mount: create everything
      const wrapper = document.createElement('div');
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      container.appendChild(wrapper);

      const term = new Terminal({
        theme: getTerminalTheme(),
        fontFamily: "'JetBrainsMono Nerd Font', 'CaskaydiaCove Nerd Font', 'Hack Nerd Font', 'FiraCode Nerd Font', 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
        fontSize: 14,
        cursorBlink: true,
        cursorStyle: 'block',
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      const searchAddon = new SearchAddon();
      const unicodeAddon = new Unicode11Addon();
      term.loadAddon(fitAddon);
      term.loadAddon(searchAddon);
      term.loadAddon(unicodeAddon);
      term.unicode.activeVersion = '11';
      term.open(wrapper);

      termRef.current = term;
      fitRef.current = fitAddon;

      requestAnimationFrame(() => {
        fitAddon.fit();
      });

      // Create PTY in main process (with optional cwd from split source)
      window.electronAPI.createTerminal(id, cwd);

      // PTY -> xterm
      const removeDataListener = window.electronAPI.onTerminalData(id, (data) => {
        term.write(data);
      });

      // xterm -> PTY
      const onDataDispose = term.onData((data) => {
        window.electronAPI.writeTerminal(id, data);
      });

      // Focus handling
      term.textarea?.addEventListener('focus', onFocus);

      // Resize observer
      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          try {
            fitAddon.fit();
            window.electronAPI.resizeTerminal(id, term.cols, term.rows);
          } catch { /* ignore */ }
        });
      });
      resizeObserver.observe(container);

      // Store in registry
      entry = { terminal: term, fitAddon, searchAddon, wrapper, removeDataListener, onDataDispose, resizeObserver };
      registry.set(id, entry);
    }

    // Cleanup: just detach the wrapper from DOM. Don't destroy anything.
    return () => {
      const e = registry.get(id);
      if (e) {
        e.resizeObserver?.disconnect();
        e.resizeObserver = null;
        // Remove wrapper from this container but keep it alive
        if (e.wrapper.parentElement) {
          e.wrapper.parentElement.removeChild(e.wrapper);
        }
      }
    };
  }, [id]);

  // Focus terminal when it becomes active
  useEffect(() => {
    if (isActive && termRef.current) {
      termRef.current.focus();
    }
  }, [isActive]);

  return { termRef, fitRef };
}

// --- Theme API ---

/** Apply a theme to all existing terminals and update CSS variables. */
export function applyTheme(themeId: ThemeId): void {
  currentThemeId = themeId;
  const theme = THEMES[themeId];
  if (!theme) return;

  // Update all existing xterm instances
  for (const entry of registry.values()) {
    entry.terminal.options.theme = theme.terminal;
  }

  // Update CSS variables on :root
  const root = document.documentElement;
  root.style.setProperty('--bg-primary', theme.ui.bgPrimary);
  root.style.setProperty('--bg-secondary', theme.ui.bgSecondary);
  root.style.setProperty('--bg-tertiary', theme.ui.bgTertiary);
  root.style.setProperty('--green', theme.ui.accent);
  root.style.setProperty('--green-dim', theme.ui.accentDim);
  root.style.setProperty('--green-glow', theme.ui.accentGlow);
  root.style.setProperty('--border', theme.ui.border);
  root.style.setProperty('--border-active', theme.ui.borderActive);
  root.style.setProperty('--text-primary', theme.ui.textPrimary);
  root.style.setProperty('--text-secondary', theme.ui.textSecondary);
}

// --- Search API ---
// Exposes search operations for a terminal by ID, used by the SearchBar component.

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

// Per-terminal search result tracking, updated by onDidChangeResults listeners
const searchResults = new Map<string, SearchResult>();

/** Subscribe to search result changes for a terminal. Returns unsubscribe function. */
export function onSearchResults(id: string, cb: (result: SearchResult) => void): () => void {
  const entry = registry.get(id);
  if (!entry) return () => {};
  const dispose = entry.searchAddon.onDidChangeResults((e) => {
    const result: SearchResult = { resultIndex: e.resultIndex, resultCount: e.resultCount };
    searchResults.set(id, result);
    cb(result);
  });
  return () => dispose.dispose();
}

function buildSearchOpts(options: { regex?: boolean; caseSensitive?: boolean; wholeWord?: boolean }): ISearchOptions {
  return {
    regex: options.regex ?? false,
    caseSensitive: options.caseSensitive ?? false,
    wholeWord: options.wholeWord ?? false,
    decorations: SEARCH_DECORATIONS,
    incremental: false,
  };
}

export function searchNext(id: string, query: string, options: { regex?: boolean; caseSensitive?: boolean; wholeWord?: boolean } = {}): boolean {
  const entry = registry.get(id);
  if (!entry || !query) return false;
  return entry.searchAddon.findNext(query, buildSearchOpts(options));
}

export function searchPrevious(id: string, query: string, options: { regex?: boolean; caseSensitive?: boolean; wholeWord?: boolean } = {}): boolean {
  const entry = registry.get(id);
  if (!entry || !query) return false;
  return entry.searchAddon.findPrevious(query, buildSearchOpts(options));
}

export function clearSearch(id: string): void {
  const entry = registry.get(id);
  if (entry) {
    entry.searchAddon.clearDecorations();
    searchResults.delete(id);
  }
}
