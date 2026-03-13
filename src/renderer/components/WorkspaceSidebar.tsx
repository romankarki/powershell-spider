import React, { useState } from 'react';
import { useTerminalStore } from '../state/terminal-store';

export const WorkspaceSidebar: React.FC = () => {
  const workspaces = useTerminalStore((s) => s.workspaces);
  const activeIndex = useTerminalStore((s) => s.activeWorkspaceIndex);
  const setActiveWorkspace = useTerminalStore((s) => s.setActiveWorkspace);
  const addWorkspace = useTerminalStore((s) => s.addWorkspace);
  const removeWorkspace = useTerminalStore((s) => s.removeWorkspace);
  const renameWorkspace = useTerminalStore((s) => s.renameWorkspace);
  const toggleAgentPanel = useTerminalStore((s) => s.toggleAgentPanel);
  const toggleSettings = useTerminalStore((s) => s.toggleSettings);
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
    <div style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerLabel}>SPACES</span>
      </div>

      {/* Workspace list */}
      <div style={styles.list}>
        {workspaces.map((ws, i) => {
          const isActive = i === activeIndex;
          return (
            <div
              key={ws.id}
              onClick={() => setActiveWorkspace(i)}
              onDoubleClick={() => {
                setEditValue(ws.name);
                setEditIndex(i);
              }}
              style={{
                ...styles.item,
                ...(isActive ? styles.itemActive : {}),
              }}
              title={`${ws.name} (double-click to rename)`}
            >
              <div style={styles.indicator}>
                {isActive && <div style={styles.activeBar} />}
              </div>
              <span style={styles.itemNumber}>{i + 1}</span>
              <div style={styles.itemContent}>
                {editIndex === i ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditIndex(null);
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={styles.renameInput}
                  />
                ) : (
                  <span style={{
                    ...styles.itemLabel,
                    color: isActive ? 'var(--green)' : 'var(--text-secondary)',
                  }}>
                    {ws.name}
                  </span>
                )}
              </div>
              {workspaces.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWorkspace(i);
                  }}
                  style={styles.closeBtn}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--red)';
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.opacity = '0.4';
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add workspace button */}
      <button
        onClick={addWorkspace}
        style={styles.addBtn}
        title="New workspace (Ctrl+Shift+T)"
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--green)';
          e.currentTarget.style.borderColor = 'var(--green-dim)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        + workspace
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom controls */}
      <div style={styles.bottomControls}>
        <button
          onClick={toggleAgentPanel}
          style={{
            ...styles.controlBtn,
            color: agentPanelOpen ? 'var(--cyan)' : 'var(--text-secondary)',
            background: agentPanelOpen ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
            borderColor: agentPanelOpen ? 'var(--cyan-dim)' : 'var(--border)',
            boxShadow: agentPanelOpen ? '0 0 6px var(--cyan-glow)' : 'none',
          }}
          title="Toggle Agent Panel (Ctrl+Shift+A)"
        >
          &#9881; AGENT
        </button>
        <button
          onClick={toggleSettings}
          style={styles.controlBtn}
          title="Settings (Ctrl+,)"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--green)';
            e.currentTarget.style.borderColor = 'var(--green-dim)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          &#9881; SETTINGS
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 180,
    minWidth: 180,
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
    userSelect: 'none' as const,
  },
  header: {
    padding: '10px 12px 8px',
    borderBottom: '1px solid var(--border)',
  },
  headerLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    color: 'var(--text-secondary)',
  },
  list: {
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 8px 8px 0',
    cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.1s',
  },
  itemActive: {
    background: 'rgba(0, 255, 65, 0.05)',
  },
  indicator: {
    width: 3,
    flexShrink: 0,
    height: 22,
  },
  activeBar: {
    width: 3,
    height: 22,
    background: 'var(--green)',
    borderRadius: '0 2px 2px 0',
    boxShadow: '0 0 6px var(--green-glow)',
  },
  itemNumber: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: 'var(--text-secondary)',
    opacity: 0.5,
    width: 12,
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  itemLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
    letterSpacing: 0.3,
  },
  renameInput: {
    background: 'transparent',
    border: '1px solid var(--green)',
    color: 'var(--green)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    outline: 'none',
    padding: '0 4px',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    padding: '0 4px',
    flexShrink: 0,
    transition: 'all 0.1s',
    opacity: 0.4,
  },
  addBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderLeft: 'none',
    borderRight: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    padding: '8px 12px',
    textAlign: 'left' as const,
    transition: 'all 0.1s',
    flexShrink: 0,
    letterSpacing: 0.5,
  },
  bottomControls: {
    padding: '8px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  controlBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 1,
    padding: '6px 8px',
    borderRadius: 3,
    textAlign: 'left' as const,
    transition: 'all 0.15s',
  },
};
