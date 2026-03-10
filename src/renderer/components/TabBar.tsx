import React, { useState } from 'react';
import { useTerminalStore } from '../state/terminal-store';

export const TabBar: React.FC = () => {
  const workspaces = useTerminalStore((s) => s.workspaces);
  const activeIndex = useTerminalStore((s) => s.activeWorkspaceIndex);
  const setActiveWorkspace = useTerminalStore((s) => s.setActiveWorkspace);
  const addWorkspace = useTerminalStore((s) => s.addWorkspace);
  const removeWorkspace = useTerminalStore((s) => s.removeWorkspace);
  const renameWorkspace = useTerminalStore((s) => s.renameWorkspace);
  const toggleAgentPanel = useTerminalStore((s) => s.toggleAgentPanel);
  const agentPanelOpen = useTerminalStore((s) => s.agentPanelOpen);

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const commitRename = () => {
    if (editIndex !== null && editValue.trim()) {
      renameWorkspace(editIndex, editValue.trim());
    }
    setEditIndex(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '28px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 4px',
        gap: '2px',
        overflow: 'hidden',
      }}
    >
      {workspaces.map((ws, i) => (
        <div
          key={ws.id}
          onClick={() => setActiveWorkspace(i)}
          onDoubleClick={() => {
            setEditValue(ws.name);
            setEditIndex(i);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 10px',
            height: '24px',
            background: i === activeIndex ? 'var(--bg-tertiary)' : 'transparent',
            border: `1px solid ${i === activeIndex ? 'var(--border)' : 'transparent'}`,
            borderBottom: i === activeIndex ? '1px solid var(--bg-tertiary)' : '1px solid var(--border)',
            borderRadius: '4px 4px 0 0',
            color: i === activeIndex ? 'var(--green)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '11px',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {editIndex === i ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditIndex(null);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--green)',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                outline: 'none',
                width: '80px',
              }}
            />
          ) : (
            <span>{ws.name}</span>
          )}
          {workspaces.length > 1 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                removeWorkspace(i);
              }}
              style={{
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '10px',
              }}
            >
              ✕
            </span>
          )}
        </div>
      ))}
      <button
        onClick={addWorkspace}
        style={{
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '0 8px',
          height: '22px',
          fontSize: '14px',
          fontFamily: 'var(--font-mono)',
          borderRadius: '3px',
          marginLeft: '4px',
        }}
      >
        +
      </button>
      <div style={{ flex: 1 }} />
      <button
        onClick={toggleAgentPanel}
        style={{
          background: agentPanelOpen ? 'var(--bg-tertiary)' : 'transparent',
          border: `1px solid ${agentPanelOpen ? 'var(--cyan-dim)' : 'var(--border)'}`,
          color: agentPanelOpen ? 'var(--cyan)' : 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '0 10px',
          height: '22px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          borderRadius: '3px',
          marginRight: '4px',
        }}
      >
        AGENT
      </button>
    </div>
  );
};
