import React, { useState, useCallback } from 'react';
import { useTerminalStore } from '../state/terminal-store';
import { useSettingsStore } from '../state/settings-store';
import { findAllTerminalIds } from '../state/split-tree';
import { IconAgent, IconClose, IconKeyboard, IconPlus, IconSettings } from './Icons';

const MIN_WIDTH = 160;
const MAX_WIDTH = 420;
const RAIL_WIDTH = 48;

/** Shorten a path for display: home becomes ~, long paths keep the last two folders. */
function shortPath(p: string | undefined): string {
  if (!p) return '';
  const home = p.match(/^[A-Za-z]:\\Users\\[^\\]+/i)?.[0];
  let s = home && p.toLowerCase().startsWith(home.toLowerCase()) ? '~' + p.slice(home.length) : p;
  const parts = s.split('\\').filter(Boolean);
  if (parts.length > 3) s = `${parts[0]}\\…\\${parts.slice(-2).join('\\')}`;
  return s;
}

export const WorkspaceSidebar: React.FC = () => {
  const workspaces = useTerminalStore((s) => s.workspaces);
  const paneGroups = useTerminalStore((s) => s.paneGroups);
  const terminals = useTerminalStore((s) => s.terminals);
  const activeIndex = useTerminalStore((s) => s.activeWorkspaceIndex);
  const setActiveWorkspace = useTerminalStore((s) => s.setActiveWorkspace);
  const addWorkspace = useTerminalStore((s) => s.addWorkspace);
  const removeWorkspace = useTerminalStore((s) => s.removeWorkspace);
  const renameWorkspace = useTerminalStore((s) => s.renameWorkspace);
  const toggleAgentPanel = useTerminalStore((s) => s.toggleAgentPanel);
  const toggleSettings = useTerminalStore((s) => s.toggleSettings);
  const toggleShortcuts = useTerminalStore((s) => s.toggleShortcuts);
  const agentPanelOpen = useTerminalStore((s) => s.agentPanelOpen);
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const width = useSettingsStore((s) => s.sidebarWidth);
  const updateSettings = useSettingsStore((s) => s.update);

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const commitRename = () => {
    if (editIndex !== null && editValue.trim()) {
      renameWorkspace(editIndex, editValue.trim());
    }
    setEditIndex(null);
  };

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    const onMove = (ev: MouseEvent) => {
      updateSettings({ sidebarWidth: Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + ev.clientX - startX)) });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [width, updateSettings]);

  const footer = [
    { key: 'agent', icon: <IconAgent />, label: 'Agent', title: 'Agent panel (Ctrl+Shift+A)', onClick: toggleAgentPanel, active: agentPanelOpen },
    { key: 'keys', icon: <IconKeyboard />, label: 'Shortcuts', title: 'Keyboard shortcuts (F1)', onClick: toggleShortcuts, active: false },
    { key: 'settings', icon: <IconSettings />, label: 'Settings', title: 'Settings (Ctrl+,)', onClick: toggleSettings, active: false },
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{ width: collapsed ? RAIL_WIDTH : width }}>
      {!collapsed && (
        <div className="sidebar-header">
          <span>WORKSPACES</span>
          <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={addWorkspace} title="New workspace (Ctrl+Shift+T)">
            <IconPlus size={13} />
          </button>
        </div>
      )}

      <div className="sidebar-list">
        {workspaces.map((ws, i) => {
          const isActive = i === activeIndex;
          const paneIds = findAllTerminalIds(ws.tree);
          const tabCount = paneIds.reduce((n, id) => n + (paneGroups.get(id)?.tabIds.length ?? 1), 0);
          const focusedTab = paneGroups.get(ws.activeTerminalId)?.activeTabId ?? ws.activeTerminalId;
          const cwd = shortPath(terminals.get(focusedTab)?.cwd);
          const meta = `${paneIds.length} pane${paneIds.length === 1 ? '' : 's'}${tabCount > paneIds.length ? ` · ${tabCount} tabs` : ''}`;

          return (
            <div
              key={ws.id}
              className={`ws-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveWorkspace(i)}
              onDoubleClick={() => {
                if (collapsed) return;
                setEditValue(ws.name);
                setEditIndex(i);
              }}
              title={`${ws.name}${i < 9 ? ` (Alt+${i + 1})` : ''}\n${meta}${cwd ? `\n${cwd}` : ''}\nDouble-click to rename`}
            >
              <span className="ws-num">{i + 1}</span>
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editIndex === i ? (
                    <input
                      autoFocus
                      className="field"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitRename}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setEditIndex(null);
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: '100%', padding: '2px 6px' }}
                    />
                  ) : (
                    <>
                      <div className="ws-name">{ws.name}</div>
                      <div className="ws-meta">{cwd || meta}</div>
                    </>
                  )}
                </div>
              )}
              {!collapsed && workspaces.length > 1 && editIndex !== i && (
                <button
                  className="icon-btn danger ws-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWorkspace(i);
                  }}
                  title="Close workspace"
                >
                  <IconClose size={11} />
                </button>
              )}
            </div>
          );
        })}
        {collapsed && (
          <button className="icon-btn rail-btn" onClick={addWorkspace} title="New workspace (Ctrl+Shift+T)">
            <IconPlus />
          </button>
        )}
      </div>

      <div className="sidebar-footer">
        {footer.map((b) => (
          <button key={b.key} className={`side-btn ${b.active ? 'active' : ''}`} onClick={b.onClick} title={b.title}>
            {b.icon}
            {!collapsed && <span>{b.label}</span>}
          </button>
        ))}
      </div>

      {!collapsed && <div className="sidebar-resize" onMouseDown={handleResizeStart} onDoubleClick={() => updateSettings({ sidebarWidth: 220 })} />}

      <style>{`
        .sidebar {
          position: relative;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          user-select: none;
          overflow: hidden;
        }
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 8px 6px 14px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--text-secondary);
        }
        .sidebar-list {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 4px 6px;
        }
        .sidebar.collapsed .sidebar-list {
          padding: 8px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .ws-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 6px 7px 8px;
          margin-bottom: 2px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.1s;
        }
        .sidebar.collapsed .ws-item {
          padding: 0;
          margin: 0;
          justify-content: center;
        }
        .ws-item:hover {
          background: var(--bg-tertiary);
        }
        .ws-item.active {
          background: var(--accent-soft);
        }
        .ws-item.active::before {
          content: '';
          position: absolute;
          left: -6px;
          top: 8px;
          bottom: 8px;
          width: 3px;
          border-radius: 0 2px 2px 0;
          background: var(--green);
          box-shadow: 0 0 6px var(--green-glow);
        }
        .ws-num {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          border-radius: 5px;
          border: 1px solid var(--border);
          background: var(--bg-primary);
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 700;
        }
        .sidebar.collapsed .ws-num {
          width: 34px;
          height: 34px;
          font-size: 13px;
        }
        .ws-item.active .ws-num {
          color: var(--green);
          border-color: var(--green-dim);
          box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.2);
        }
        .ws-name {
          font-size: 13px;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ws-item.active .ws-name {
          color: var(--green);
        }
        .ws-meta {
          margin-top: 1px;
          font-size: 10px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ws-close {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          opacity: 0;
        }
        .ws-item:hover .ws-close {
          opacity: 0.8;
        }
        .rail-btn {
          width: 34px;
          height: 34px;
          border: 1px dashed var(--border);
          border-radius: 5px;
        }
        .sidebar-footer {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px 6px;
          border-top: 1px solid var(--border);
        }
        .side-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 30px;
          padding: 0 10px;
          border: none;
          border-radius: 5px;
          background: transparent;
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          transition: background 0.1s, color 0.1s;
        }
        .sidebar.collapsed .side-btn {
          justify-content: center;
          padding: 0;
        }
        .side-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .side-btn.active {
          color: var(--cyan);
          background: rgba(0, 229, 255, 0.08);
        }
        .sidebar-resize {
          position: absolute;
          top: 0;
          right: -3px;
          width: 6px;
          height: 100%;
          cursor: col-resize;
          z-index: 10;
        }
        .sidebar-resize:hover {
          background: linear-gradient(90deg, transparent 2px, var(--green-dim) 2px, var(--green-dim) 3px, transparent 3px);
        }
      `}</style>
    </div>
  );
};
