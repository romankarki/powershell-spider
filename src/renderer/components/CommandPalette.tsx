import React, { useState, useEffect, useRef } from 'react';
import { useTerminalStore } from '../state/terminal-store';

interface Command {
  label: string;
  shortcut?: string;
  category: string;
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
    { label: 'Split Horizontal', shortcut: 'Ctrl+Shift+H', category: 'PANE', action: () => splitTerminal('horizontal') },
    { label: 'Split Vertical', shortcut: 'Ctrl+Shift+V', category: 'PANE', action: () => splitTerminal('vertical') },
    { label: 'Close Pane', shortcut: 'Ctrl+Shift+W', category: 'PANE', action: () => closeTerminal(getActiveTerminalId()) },
    { label: 'New Workspace', shortcut: 'Ctrl+Shift+T', category: 'WORKSPACE', action: () => addWorkspace() },
    { label: 'Toggle Agent Panel', shortcut: 'Ctrl+Shift+A', category: 'AGENT', action: () => toggleAgentPanel() },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
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
        paddingTop: '70px',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '480px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--green-dim)',
          borderRadius: '6px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 20px var(--green-glow), 0 0 60px rgba(0, 255, 65, 0.08)',
          overflow: 'hidden',
          maxHeight: '340px',
          animation: 'slide-in-down 0.15s ease-out',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{
            color: 'var(--green)',
            padding: '10px 0 10px 14px',
            fontSize: '13px',
            fontWeight: 700,
          }}>
            {'>'}
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="type a command..."
            style={{
              flex: 1,
              padding: '10px 14px 10px 6px',
              background: 'transparent',
              border: 'none',
              color: 'var(--green)',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ maxHeight: '270px', overflow: 'auto' }}>
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
                background: i === selectedIndex
                  ? 'linear-gradient(90deg, rgba(0, 255, 65, 0.1), transparent)'
                  : 'transparent',
                color: i === selectedIndex ? 'var(--green)' : 'var(--text-primary)',
                fontSize: '12px',
                borderLeft: i === selectedIndex ? '2px solid var(--green)' : '2px solid transparent',
                transition: 'all 0.1s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '9px',
                  color: 'var(--cyan-dim)',
                  background: 'rgba(0, 229, 255, 0.1)',
                  padding: '1px 5px',
                  borderRadius: '2px',
                  letterSpacing: '0.5px',
                }}>
                  {cmd.category}
                </span>
                <span>{cmd.label}</span>
              </div>
              {cmd.shortcut && (
                <span style={{
                  color: 'var(--text-secondary)',
                  fontSize: '10px',
                  background: 'var(--bg-tertiary)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: '1px solid var(--border)',
                }}>
                  {cmd.shortcut}
                </span>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{
              padding: '16px 14px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '12px',
            }}>
              No commands found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
