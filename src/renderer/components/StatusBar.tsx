import React, { useState, useEffect } from 'react';
import { useTerminalStore } from '../state/terminal-store';
import { findAllTerminalIds } from '../state/split-tree';

export const StatusBar: React.FC = () => {
  const workspace = useTerminalStore((s) => s.getActiveWorkspace());
  const terminals = useTerminalStore((s) => s.terminals);
  const workspaces = useTerminalStore((s) => s.workspaces);
  const paneCount = findAllTerminalIds(workspace.tree).length;
  const activeLabel = terminals.get(workspace.activeTerminalId)?.label || '---';

  const [uptime, setUptime] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setUptime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '24px',
        padding: '0 12px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        fontSize: '10px',
        color: 'var(--text-secondary)',
        userSelect: 'none',
        letterSpacing: '0.5px',
      }}
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span>
          <span style={{ color: 'var(--green)', fontWeight: 700 }}>&#9679;</span>
          {' '}ACTIVE
        </span>
        <span>
          <span style={{ color: 'var(--green-dim)' }}>PANES</span>{' '}
          <span style={{ color: 'var(--green)' }}>{paneCount}</span>
        </span>
        <span>
          <span style={{ color: 'var(--cyan-dim)' }}>FOCUS</span>{' '}
          <span style={{ color: 'var(--cyan)' }}>{activeLabel}</span>
        </span>
        <span>
          <span style={{ color: 'var(--green-dim)' }}>WS</span>{' '}
          <span style={{ color: 'var(--text-primary)' }}>{workspace.name}</span>
          <span style={{ color: 'var(--text-secondary)' }}> [{workspaces.length}]</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
          UP {formatUptime(uptime)}
        </span>
        <span style={{ borderLeft: '1px solid var(--border)', paddingLeft: '12px' }}>
          <span style={{ color: 'var(--green-dim)' }}>^+&#8679;</span> H/V split
        </span>
        <span><span style={{ color: 'var(--green-dim)' }}>^+&#8679;</span> W close</span>
        <span><span style={{ color: 'var(--cyan-dim)' }}>^+&#8679;</span> P cmd</span>
      </div>
    </div>
  );
};
