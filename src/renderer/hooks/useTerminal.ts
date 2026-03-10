import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

declare global {
  interface Window {
    electronAPI: {
      createTerminal: (id: string) => Promise<void>;
      writeTerminal: (id: string, data: string) => Promise<void>;
      resizeTerminal: (id: string, cols: number, rows: number) => Promise<void>;
      killTerminal: (id: string) => Promise<void>;
      writeAll: (ids: string[], data: string) => Promise<void>;
      onTerminalData: (id: string, cb: (data: string) => void) => () => void;
      onTerminalExit: (id: string, cb: () => void) => () => void;
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
    term.open(container);

    termRef.current = term;
    fitRef.current = fitAddon;

    // Fit after a tick to ensure DOM is ready
    requestAnimationFrame(() => {
      fitAddon.fit();
    });

    // Create PTY
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

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        try {
          fitAddon.fit();
          window.electronAPI.resizeTerminal(id, term.cols, term.rows);
        } catch {
          // ignore
        }
      });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      removeDataListener();
      onDataDispose.dispose();
      term.dispose();
      window.electronAPI.killTerminal(id);
    };
  }, [id]); // Only re-run if terminal ID changes

  // Focus the terminal when it becomes active
  useEffect(() => {
    if (isActive && termRef.current) {
      termRef.current.focus();
    }
  }, [isActive]);

  return { termRef, fitRef };
}
