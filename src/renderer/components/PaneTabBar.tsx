import React, { useState, useRef } from 'react';
import { useTerminalStore } from '../state/terminal-store';
import { terminalDisplayName } from '../types';
import { IconClose, IconPlus, IconSplitRight, IconSplitDown, IconZoom, IconUnzoom } from './Icons';

interface PaneTabBarProps {
  paneId: string;
  multiPane: boolean;
}

export const PaneTabBar: React.FC<PaneTabBarProps> = ({ paneId, multiPane }) => {
  const paneGroup = useTerminalStore((s) => s.getPaneGroup(paneId));
  const terminals = useTerminalStore((s) => s.terminals);
  const zoomed = useTerminalStore((s) => s.getActiveWorkspace().zoomedPaneId === paneId);
  const switchTab = useTerminalStore((s) => s.switchTab);
  const addTabToPane = useTerminalStore((s) => s.addTabToPane);
  const closeTab = useTerminalStore((s) => s.closeTab);
  const renameTerminal = useTerminalStore((s) => s.renameTerminal);
  const reorderTab = useTerminalStore((s) => s.reorderTab);
  const setActive = useTerminalStore((s) => s.setActiveTerminal);
  const splitTerminal = useTerminalStore((s) => s.splitTerminal);
  const toggleZoom = useTerminalStore((s) => s.toggleZoom);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragSrcIdx = useRef<number | null>(null);

  const commitRename = (tabId: string) => {
    renameTerminal(tabId, editValue);
    setEditingId(null);
  };

  /** Run a pane action with this pane focused first. */
  const inPane = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setActive(paneId);
    fn();
  };

  return (
    <div className="pane-tabbar">
      <div className="pane-tabs">
        {paneGroup.tabIds.map((tabId, idx) => {
          const info = terminals.get(tabId);
          const label = terminalDisplayName(info);
          const isActive = tabId === paneGroup.activeTabId;
          const classes = ['pane-tab', isActive ? 'active' : '', dragOverIdx === idx ? 'drag-over' : ''].filter(Boolean).join(' ');

          return (
            <div
              key={tabId}
              className={classes}
              draggable={editingId !== tabId}
              onClick={() => switchTab(paneId, tabId)}
              onDoubleClick={() => {
                setEditingId(tabId);
                setEditValue(info?.renamed ? info.label : label);
              }}
              onAuxClick={(e) => {
                // Middle-click closes, like a browser tab
                if (e.button === 1) closeTab(paneId, tabId);
              }}
              onDragStart={(e) => {
                dragSrcIdx.current = idx;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(idx));
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverIdx(idx);
              }}
              onDragLeave={() => setDragOverIdx((cur) => (cur === idx ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                const fromIdx = dragSrcIdx.current;
                if (fromIdx !== null && fromIdx !== idx) reorderTab(paneId, fromIdx, idx);
                dragSrcIdx.current = null;
                setDragOverIdx(null);
              }}
              onDragEnd={() => {
                dragSrcIdx.current = null;
                setDragOverIdx(null);
              }}
              title={`${label}${info?.cwd ? `\n${info.cwd}` : ''}\nDouble-click to rename · middle-click to close`}
            >
              {editingId === tabId ? (
                <input
                  autoFocus
                  className="field"
                  value={editValue}
                  placeholder="(automatic)"
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitRename(tabId)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(tabId);
                    if (e.key === 'Escape') setEditingId(null);
                    e.stopPropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '100%', padding: '1px 4px', fontSize: 12 }}
                />
              ) : (
                <span className="tab-label">{label}</span>
              )}
              <button
                className="icon-btn danger tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(paneId, tabId);
                }}
                title="Close tab (Ctrl+W)"
              >
                <IconClose size={11} />
              </button>
            </div>
          );
        })}
        <button className="icon-btn" onClick={inPane(() => addTabToPane(paneId))} title="New tab (Ctrl+D)" style={{ width: 30, flexShrink: 0 }}>
          <IconPlus size={13} />
        </button>
      </div>
      <div className="pane-actions">
        <button className="icon-btn" onClick={inPane(() => splitTerminal('horizontal'))} title="Split right (Ctrl+Shift+H)">
          <IconSplitRight />
        </button>
        <button className="icon-btn" onClick={inPane(() => splitTerminal('vertical'))} title="Split down (Ctrl+Shift+B)">
          <IconSplitDown />
        </button>
        {(multiPane || zoomed) && (
          <button className={`icon-btn ${zoomed ? 'active' : ''}`} onClick={inPane(toggleZoom)} title={zoomed ? 'Unzoom pane (Ctrl+Shift+Z)' : 'Zoom pane (Ctrl+Shift+Z)'}>
            {zoomed ? <IconUnzoom /> : <IconZoom />}
          </button>
        )}
      </div>
    </div>
  );
};
