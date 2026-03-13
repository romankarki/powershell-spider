import React, { useState } from 'react';
import { useTerminalStore } from '../state/terminal-store';

interface PaneSidebarProps {
  paneId: string;
}

export const PaneSidebar: React.FC<PaneSidebarProps> = ({ paneId }) => {
  const paneGroup = useTerminalStore((s) => s.getPaneGroup(paneId));
  const terminals = useTerminalStore((s) => s.terminals);
  const switchTab = useTerminalStore((s) => s.switchTab);
  const addTabToPane = useTerminalStore((s) => s.addTabToPane);
  const closeTab = useTerminalStore((s) => s.closeTab);
  const closeTerminal = useTerminalStore((s) => s.closeTerminal);
  const renameTerminal = useTerminalStore((s) => s.renameTerminal);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleDoubleClick = (tabId: string, label: string) => {
    setEditingId(tabId);
    setEditValue(label);
  };

  const commitRename = (tabId: string) => {
    if (editValue.trim()) {
      renameTerminal(tabId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    if (paneGroup.tabIds.length <= 1) {
      closeTerminal(paneId);
    } else {
      closeTab(paneId, tabId);
    }
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.tabList}>
        {paneGroup.tabIds.map((tabId) => {
          const info = terminals.get(tabId);
          const label = info?.label || tabId.slice(0, 6);
          const isActive = tabId === paneGroup.activeTabId;

          return (
            <div
              key={tabId}
              onClick={() => switchTab(paneId, tabId)}
              onDoubleClick={() => handleDoubleClick(tabId, label)}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
              }}
              title={label}
            >
              <div style={styles.tabIndicator}>
                {isActive && <div style={styles.activeIndicator} />}
              </div>
              <div style={styles.tabContent}>
                {editingId === tabId ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitRename(tabId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(tabId);
                      if (e.key === 'Escape') setEditingId(null);
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={styles.renameInput}
                  />
                ) : (
                  <span style={{
                    ...styles.tabLabel,
                    color: isActive ? 'var(--green)' : 'var(--text-secondary)',
                  }}>
                    {label}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => handleCloseTab(e, tabId)}
                style={styles.closeBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--red)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => addTabToPane(paneId)}
        style={styles.addBtn}
        title="New tab in this pane"
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--green)';
          e.currentTarget.style.borderColor = 'var(--green-dim)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        +
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 130,
    minWidth: 130,
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  },
  tabList: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 6px 6px 0',
    cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.1s',
    userSelect: 'none' as const,
  },
  tabActive: {
    background: 'rgba(0, 255, 65, 0.05)',
  },
  tabIndicator: {
    width: 3,
    height: 20,
    flexShrink: 0,
  },
  activeIndicator: {
    width: 3,
    height: 20,
    background: 'var(--green)',
    borderRadius: '0 2px 2px 0',
    boxShadow: '0 0 6px var(--green-glow)',
  },
  tabContent: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  tabLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
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
    fontSize: 11,
    outline: 'none',
    padding: '0 2px',
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
    padding: '0 2px',
    flexShrink: 0,
    transition: 'color 0.1s',
    opacity: 0.6,
  },
  addBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderLeft: 'none',
    borderRight: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: 16,
    padding: '4px 0',
    transition: 'all 0.1s',
    flexShrink: 0,
  },
};
