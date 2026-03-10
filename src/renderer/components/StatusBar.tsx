import React from 'react';
import { useTerminalStore } from '../state/terminal-store';
import { findAllTerminalIds } from '../state/split-tree';

export const StatusBar: React.FC = () => {
  const workspace = useTerminalStore((s) => s.getActiveWorkspace());
  const terminals = useTerminalStore((s) => s.terminals);
  const paneCount = findAllTerminalIds(workspace.tree).length;
  const activeLabel = terminals.get(workspace.activeTerminalId)?.label || '—';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '22px',
        padding: '0 10px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        fontSize: '10px',
        color: 'var(--text-secondary)',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', gap: '16px' }}>
        <span>
          <span style={{ color: 'var(--green-dim)' }}>PANES</span> {paneCount}
        </span>
        <span>
          <span style={{ color: 'var(--cyan-dim)' }}>ACTIVE</span> {activeLabel}
        </span>
        <span>
          <span style={{ color: 'var(--green-dim)' }}>WS</span> {workspace.name}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <span>Ctrl+Shift+H/V split</span>
        <span>Ctrl+Shift+W close</span>
        <span>Ctrl+Shift+P palette</span>
      </div>
    </div>
  );
};
