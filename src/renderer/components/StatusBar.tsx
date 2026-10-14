import React from 'react';
import { useTerminalStore } from '../state/terminal-store';
import { useSettingsStore, DEFAULT_FONT_SIZE } from '../state/settings-store';
import { findAllTerminalIds } from '../state/split-tree';
import { terminalDisplayName } from '../types';

const Hint: React.FC<{ keys: string[]; label: string }> = ({ keys, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
    <span className="kbd">{keys.map((k) => <kbd key={k}>{k}</kbd>)}</span>
    <span>{label}</span>
  </span>
);

export const StatusBar: React.FC = () => {
  const workspace = useTerminalStore((s) => s.getActiveWorkspace());
  const terminals = useTerminalStore((s) => s.terminals);
  const paneGroups = useTerminalStore((s) => s.paneGroups);
  const toggleShortcuts = useTerminalStore((s) => s.toggleShortcuts);
  const shell = useSettingsStore((s) => s.shell);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const resetFont = useSettingsStore((s) => s.resetFont);

  const paneIds = findAllTerminalIds(workspace.tree);
  const tabCount = paneIds.reduce((n, id) => n + (paneGroups.get(id)?.tabIds.length ?? 1), 0);
  const focusedTab = paneGroups.get(workspace.activeTerminalId)?.activeTabId ?? workspace.activeTerminalId;
  const info = terminals.get(focusedTab);

  return (
    <div className="statusbar">
      <div className="statusbar-group" style={{ minWidth: 0 }}>
        <span style={{ color: 'var(--green)' }}>
          <span style={{ textShadow: '0 0 6px var(--green-glow)' }}>●</span> {shell === 'pwsh' ? 'pwsh' : 'powershell'}
        </span>
        <span className="statusbar-item" title="Focused terminal">
          <span style={{ color: 'var(--cyan)' }}>{terminalDisplayName(info)}</span>
        </span>
        {info?.cwd && (
          <span className="statusbar-item statusbar-cwd" title={info.cwd}>{info.cwd}</span>
        )}
      </div>
      <div className="statusbar-group" style={{ flexShrink: 0 }}>
        {workspace.zoomedPaneId && <span className="statusbar-badge">ZOOMED</span>}
        {fontSize !== DEFAULT_FONT_SIZE && (
          <button className="statusbar-btn" onClick={resetFont} title="Reset font size (Ctrl+0)">{fontSize}px</button>
        )}
        <span>{paneIds.length} pane{paneIds.length === 1 ? '' : 's'} · {tabCount} tab{tabCount === 1 ? '' : 's'}</span>
        <span className="statusbar-hints">
          <Hint keys={['Ctrl', 'D']} label="tab" />
          <Hint keys={['Ctrl', '⇧', 'H/B']} label="split" />
          <Hint keys={['Alt', 'WASD']} label="move" />
        </span>
        <button className="statusbar-btn" onClick={toggleShortcuts} title="All keyboard shortcuts">
          <Hint keys={['F1']} label="keys" />
        </button>
      </div>

      <style>{`
        .statusbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          height: 24px;
          flex-shrink: 0;
          padding: 0 10px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border);
          font-size: 11px;
          color: var(--text-secondary);
          user-select: none;
          white-space: nowrap;
        }
        .statusbar-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .statusbar-item {
          padding-left: 14px;
          border-left: 1px solid var(--border);
        }
        .statusbar-cwd {
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        .statusbar-hints {
          display: flex;
          gap: 12px;
          padding-left: 14px;
          border-left: 1px solid var(--border);
        }
        .statusbar .kbd kbd {
          padding: 0 4px;
          font-size: 9px;
          line-height: 13px;
          border-bottom-width: 1px;
        }
        .statusbar-btn {
          border: none;
          background: transparent;
          color: inherit;
          font-size: 11px;
          cursor: pointer;
          padding: 1px 4px;
          border-radius: 3px;
        }
        .statusbar-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .statusbar-badge {
          color: var(--bg-primary);
          background: var(--yellow);
          font-weight: 700;
          font-size: 9px;
          letter-spacing: 1px;
          padding: 1px 6px;
          border-radius: 3px;
        }
        @media (max-width: 1000px) {
          .statusbar-hints { display: none; }
        }
      `}</style>
    </div>
  );
};
