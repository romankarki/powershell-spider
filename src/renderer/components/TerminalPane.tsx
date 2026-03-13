import React, { useRef, useState } from 'react';
import { useTerminal } from '../hooks/useTerminal';
import { useTerminalStore } from '../state/terminal-store';
import { SearchBar } from './SearchBar';
import { PaneTabBar } from './PaneTabBar';

interface TerminalPaneProps {
  id: string; // pane ID (leaf ID in the split tree)
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({ id }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activePaneId = useTerminalStore((s) => s.getActiveWorkspace().activeTerminalId);
  const setActive = useTerminalStore((s) => s.setActiveTerminal);
  const terminals = useTerminalStore((s) => s.terminals);
  const renameTerminal = useTerminalStore((s) => s.renameTerminal);
  const addTabToPane = useTerminalStore((s) => s.addTabToPane);
  const paneGroup = useTerminalStore((s) => s.getPaneGroup(id));
  const isPaneActive = activePaneId === id;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const searchOpenTerminalId = useTerminalStore((s) => s.searchOpenTerminalId);
  const closeSearch = useTerminalStore((s) => s.closeSearch);

  // The active tab's terminal ID - this is what we render
  const activeTabId = paneGroup.activeTabId;
  const showSearch = searchOpenTerminalId === id || searchOpenTerminalId === activeTabId;
  const hasTabs = paneGroup.tabIds.length > 1;

  const termInfo = terminals.get(activeTabId);
  useTerminal(activeTabId, containerRef, isPaneActive, () => setActive(id), termInfo?.cwd);

  const label = termInfo?.label || activeTabId.slice(0, 8);

  const handleDoubleClick = () => {
    setEditValue(label);
    setIsEditing(true);
  };

  const commitRename = () => {
    if (editValue.trim()) {
      renameTerminal(activeTabId, editValue.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`terminal-pane ${isPaneActive ? 'active' : ''}`}
      onClick={() => setActive(id)}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
    >
      {showSearch && <SearchBar terminalId={activeTabId} onClose={closeSearch} />}

      {/* Show tab bar when multiple tabs, otherwise simple header */}
      {hasTabs ? (
        <PaneTabBar paneId={id} />
      ) : (
        <div className="terminal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isEditing ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--green)',
                  color: 'var(--green)',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  outline: 'none',
                  padding: '0 4px',
                  width: '120px',
                }}
              />
            ) : (
              <span className="terminal-label" onDoubleClick={handleDoubleClick}>
                {label}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={(e) => { e.stopPropagation(); addTabToPane(id); }}
              title="Add tab (Ctrl+D)"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                lineHeight: 1,
                padding: '0 2px',
                transition: 'color 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--green)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              +
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
              {activeTabId.slice(0, 8)}
            </span>
          </div>
        </div>
      )}

      {/* Terminal body fills remaining space */}
      <div className="terminal-body-flex" ref={containerRef} style={{
        flex: 1,
        overflow: 'hidden',
      }} />
    </div>
  );
};
