import React, { useState, useEffect, useRef } from 'react';
import { useTerminalStore } from '../state/terminal-store';

interface Command {
  label: string;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const isOpen = useTerminalStore((s) => s.commandPaletteOpen);
  const setOpen = useTerminalStore((s) => s.setCommandPaletteOpen);
  const splitTerminal = useTerminalStore((s) => s.splitTerminal);
  const addWorkspace = useTerminalStore((s) => s.addWorkspace);
  const toggleAgentPanel = useTerminalStore((s) => s.toggleAgentPanel);
  const closeTerminal = useTerminalStore((s) => s.closeTerminal);
  const getActiveTerminalId = useTerminalStore((s) => s.getActiveTerminalId);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { label: 'Split Horizontal', shortcut: 'Ctrl+Shift+H', action: () => splitTerminal('horizontal') },
    { label: 'Split Vertical', shortcut: 'Ctrl+Shift+V', action: () => splitTerminal('vertical') },
    { label: 'Close Pane', shortcut: 'Ctrl+Shift+W', action: () => closeTerminal(getActiveTerminalId()) },
    { label: 'New Workspace', shortcut: 'Ctrl+Shift+T', action: () => addWorkspace() },
    { label: 'Toggle Agent Panel', shortcut: 'Ctrl+Shift+A', action: () => toggleAgentPanel() },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const execute = (cmd: Command) => {
    setOpen(false);
    cmd.action();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      execute(filtered[selectedIndex]);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '80px',
      }}
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '450px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--green-dim)',
          borderRadius: '6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 16px var(--green-glow)',
          overflow: 'hidden',
          maxHeight: '300px',
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="> type a command..."
          style={{
            width: '100%',
            padding: '10px 14px',
            background: 'var(--bg-primary)',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            color: 'var(--green)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <div style={{ maxHeight: '230px', overflow: 'auto' }}>
          {filtered.map((cmd, i) => (
            <div
              key={cmd.label}
              onClick={() => execute(cmd)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 14px',
                cursor: 'pointer',
                background: i === selectedIndex ? 'var(--bg-tertiary)' : 'transparent',
                color: i === selectedIndex ? 'var(--green)' : 'var(--text-primary)',
                fontSize: '12px',
              }}
            >
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                  {cmd.shortcut}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
