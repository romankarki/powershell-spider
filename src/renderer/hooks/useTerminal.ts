import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
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

const XTERM_THEME = {
  background: '#0a0a0a',
  foreground: '#e0e0e0',
  cursor: '#00ff41',
  cursorAccent: '#0a0a0a',
  selectionBackground: 'rgba(0, 255, 65, 0.2)',
  black: '#0a0a0a',
  red: '#ff0040',
  green: '#00ff41',
  yellow: '#ffea00',
  blue: '#00e5ff',
  magenta: '#ff00ff',
  cyan: '#00e5ff',
  white: '#e0e0e0',
  brightBlack: '#555555',
  brightRed: '#ff4466',
  brightGreen: '#66ff66',
  brightYellow: '#ffff66',
  brightBlue: '#66ffff',
  brightMagenta: '#ff66ff',
  brightCyan: '#66ffff',
  brightWhite: '#ffffff',
};

// Persistent registry: terminal instances survive React unmount/remount cycles.
// This is critical for split operations — when a leaf becomes nested in a split node,
// React remounts the component, but the PTY session and xterm state must persist.
interface TerminalEntry {
  terminal: Terminal;
  fitAddon: FitAddon;
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
  onFocus: () => void
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
        theme: XTERM_THEME,
        fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
        fontSize: 14,
        cursorBlink: true,
        cursorStyle: 'block',
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(wrapper);

      termRef.current = term;
      fitRef.current = fitAddon;

      requestAnimationFrame(() => {
        fitAddon.fit();
      });

      // Create PTY in main process
      window.electronAPI.createTerminal(id);

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
      entry = { terminal: term, fitAddon, wrapper, removeDataListener, onDataDispose, resizeObserver };
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
