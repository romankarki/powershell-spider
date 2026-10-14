import React from 'react';
import { useModal } from '../hooks/useModal';
import { useTerminalStore } from '../state/terminal-store';
import { COMMANDS, CommandCategory } from '../commands';
import { KeyCombo } from './KeyCombo';
import { IconClose } from './Icons';

const SECTIONS: { title: string; categories: CommandCategory[] }[] = [
  { title: 'Tabs & Panes', categories: ['TAB', 'PANE'] },
  { title: 'Clipboard & Terminal', categories: ['EDIT'] },
  { title: 'Workspaces', categories: ['WORKSPACE'] },
  { title: 'View & App', categories: ['VIEW', 'AGENT', 'APP'] },
];

const EXTRA_TIPS = [
  'Right-click a terminal for copy / paste / split.',
  'Ctrl+click a URL to open it in your browser.',
  'Double-click a tab or workspace to rename it.',
  'Middle-click a tab to close it; drag tabs to reorder.',
  'Double-click a split divider to even it out.',
];

export const ShortcutsHelp: React.FC = () => {
  const isOpen = useTerminalStore((s) => s.shortcutsOpen);
  const toggle = useTerminalStore((s) => s.toggleShortcuts);

  const panelRef = useModal<HTMLDivElement>(isOpen, toggle);

  if (!isOpen) return null;

  // Collapse "Go to Workspace 1..9" into one row
  const commands = COMMANDS.filter((c) => !c.id.startsWith('ws.goto') || c.id === 'ws.goto1');

  return (
    <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseDown={toggle}>
      <div
        ref={panelRef}
        tabIndex={-1}
        className="panel"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ outline: 'none', width: 860, maxWidth: 'calc(100vw - 40px)', maxHeight: '86vh', overflow: 'auto', animation: 'slide-in-down 0.12s ease-out' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: 'var(--green)', textShadow: '0 0 8px var(--green-glow)' }}>
            KEYBOARD SHORTCUTS
          </span>
          <button className="icon-btn danger" style={{ width: 26, height: 26 }} onClick={toggle} title="Close (Esc)">
            <IconClose />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '6px 28px', padding: '14px 18px' }}>
          {SECTIONS.map((section) => (
            <div key={section.title} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-secondary)', margin: '6px 0 6px' }}>
                {section.title.toUpperCase()}
              </div>
              {commands.filter((c) => section.categories.includes(c.category) && c.keys?.length).map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '4px 0', fontSize: 12 }}>
                  <span>{c.id === 'ws.goto1' ? 'Go to Workspace 1–9' : c.label}</span>
                  <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {(c.id === 'ws.goto1' ? ['Alt+1…9'] : c.keys!).map((k) => <KeyCombo key={k} combo={k} />)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 18px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.9 }}>
          {EXTRA_TIPS.map((t) => <div key={t}>› {t}</div>)}
          <div>› Ctrl+C copies when text is selected; otherwise it interrupts the running command.</div>
        </div>
      </div>
    </div>
  );
};
