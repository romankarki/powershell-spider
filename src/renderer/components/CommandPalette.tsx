import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTerminalStore } from '../state/terminal-store';
import { paletteCommands, AppCommand } from '../commands';
import { IconSearch } from './Icons';
import { KeyCombo } from './KeyCombo';

/** Subsequence fuzzy score; higher is better, -1 means no match. */
function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 0;
  const idx = t.indexOf(q);
  if (idx >= 0) return 1000 - idx * 2 - (t.length - q.length) * 0.1;
  let score = 0;
  let ti = 0;
  let prev = -2;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found < 0) return -1;
    score += found === prev + 1 ? 8 : 1;
    // Bonus for matching at word starts
    if (found === 0 || /[\s:"(/]/.test(t[found - 1])) score += 6;
    prev = found;
    ti = found + 1;
  }
  return score;
}

export const CommandPalette: React.FC = () => {
  const isOpen = useTerminalStore((s) => s.commandPaletteOpen);
  const setOpen = useTerminalStore((s) => s.setCommandPaletteOpen);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const commands = useMemo(() => (isOpen ? paletteCommands() : []), [isOpen]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    return commands
      .map((c) => ({ c, score: Math.max(fuzzyScore(query, c.label), fuzzyScore(query, `${c.category} ${c.label}`) - 50) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.c);
  }, [commands, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => setSelectedIndex(0), [query]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  const execute = (cmd: AppCommand) => {
    setOpen(false);
    // Let the palette unmount (and focus return) before running the command
    requestAnimationFrame(() => cmd.run());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setSelectedIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setSelectedIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      execute(filtered[selectedIndex]);
    }
  };

  return (
    <div className="overlay" style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }} onMouseDown={() => setOpen(false)}>
      <div
        className="panel"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: 'calc(100vw - 40px)',
          height: 'fit-content',
          overflow: 'hidden',
          borderColor: 'var(--green-dim)',
          boxShadow: 'var(--shadow-pop), 0 0 24px rgba(var(--accent-rgb), 0.12)',
          animation: 'slide-in-down 0.08s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
          <IconSearch size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, theme or workspace…"
            spellCheck={false}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              outline: 'none',
              caretColor: 'var(--green)',
            }}
          />
          <span className="kbd"><kbd>Esc</kbd></span>
        </div>
        <div ref={listRef} style={{ maxHeight: 380, overflowY: 'auto', padding: 4 }}>
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              className={`menu-item ${i === selectedIndex ? 'selected' : ''}`}
              onClick={() => execute(cmd)}
              onMouseMove={() => setSelectedIndex(i)}
              style={{ padding: '8px 10px' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{
                  fontSize: 9,
                  width: 70,
                  flexShrink: 0,
                  color: cmd.category === 'AGENT' ? 'var(--cyan)' : 'var(--text-secondary)',
                  letterSpacing: 1,
                }}>
                  {cmd.category}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cmd.label}</span>
              </span>
              {cmd.keys?.[0] && <KeyCombo combo={cmd.keys[0]} />}
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '18px 14px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
              No matching commands
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
