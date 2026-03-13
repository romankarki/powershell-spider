import React, { useState } from 'react';
import { useTerminalStore } from '../state/terminal-store';

interface PaneTabBarProps {
  paneId: string;
}

export const PaneTabBar: React.FC<PaneTabBarProps> = ({ paneId }) => {
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
    <div style={styles.tabBar}>
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
              title={`${label} (double-click to rename)`}
            >
              {isActive && <div style={styles.activeTopLine} />}
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
              <button
                onClick={(e) => handleCloseTab(e, tabId)}
                style={styles.closeBtn}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
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
        title="New tab (Ctrl+D)"
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--green)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        +
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  tabBar: {
    display: 'flex',
    alignItems: 'center',
    height: 28,
    minHeight: 28,
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    overflow: 'hidden',
  },
  tabList: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '0 10px',
    height: 28,
    cursor: 'pointer',
    borderRight: '1px solid var(--border)',
    transition: 'background 0.1s',
    position: 'relative' as const,
    userSelect: 'none' as const,
    flexShrink: 0,
    maxWidth: 160,
  },
  tabActive: {
    background: 'rgba(0, 255, 65, 0.05)',
  },
  activeTopLine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: 'var(--green)',
    boxShadow: '0 0 4px var(--green-glow)',
  },
  tabLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
    width: 80,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 13,
    lineHeight: 1,
    padding: '0 2px',
    flexShrink: 0,
    transition: 'color 0.1s',
    opacity: 0.5,
  },
  addBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: 16,
    padding: '0 8px',
    height: 28,
    flexShrink: 0,
    transition: 'color 0.1s',
  },
};
