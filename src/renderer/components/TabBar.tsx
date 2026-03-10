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
        height: '30px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 6px',
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
            padding: '0 12px',
            height: '26px',
            background: i === activeIndex
              ? 'linear-gradient(180deg, var(--bg-tertiary), var(--bg-secondary))'
              : 'transparent',
            border: `1px solid ${i === activeIndex ? 'var(--border)' : 'transparent'}`,
            borderBottom: i === activeIndex ? '1px solid var(--bg-secondary)' : '1px solid var(--border)',
            borderRadius: '4px 4px 0 0',
            color: i === activeIndex ? 'var(--green)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '11px',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            letterSpacing: '0.5px',
            transition: 'all 0.15s ease',
            position: 'relative',
          }}
        >
          {i === activeIndex && (
            <span style={{
              position: 'absolute',
              top: '-1px',
              left: '20%',
              right: '20%',
              height: '1px',
              background: 'var(--green)',
              boxShadow: '0 0 4px var(--green-glow)',
            }} />
          )}
          <span style={{
            fontSize: '8px',
            color: i === activeIndex ? 'var(--green-dim)' : 'var(--text-secondary)',
            opacity: 0.6,
          }}>
            {i + 1}
          </span>
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
                opacity: 0.5,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.color = 'var(--red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.5';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              \u2715
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
          padding: '0 10px',
          height: '22px',
          fontSize: '14px',
          fontFamily: 'var(--font-mono)',
          borderRadius: '3px',
          marginLeft: '4px',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--green-dim)';
          e.currentTarget.style.color = 'var(--green)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        +
      </button>
      <div style={{ flex: 1 }} />
      <button
        onClick={toggleAgentPanel}
        style={{
          background: agentPanelOpen
            ? 'linear-gradient(90deg, rgba(0, 229, 255, 0.15), rgba(0, 229, 255, 0.05))'
            : 'transparent',
          border: `1px solid ${agentPanelOpen ? 'var(--cyan-dim)' : 'var(--border)'}`,
          color: agentPanelOpen ? 'var(--cyan)' : 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '0 12px',
          height: '22px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          borderRadius: '3px',
          marginRight: '6px',
          letterSpacing: '2px',
          fontWeight: 700,
          transition: 'all 0.15s ease',
          boxShadow: agentPanelOpen ? '0 0 8px var(--cyan-glow)' : 'none',
        }}
      >
        {agentPanelOpen ? '\u25C0 AGENT' : 'AGENT \u25B6'}
      </button>
    </div>
  );
};
