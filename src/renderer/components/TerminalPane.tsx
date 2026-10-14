import React, { useRef } from 'react';
import { useTerminal } from '../hooks/useTerminal';
import { useTerminalStore } from '../state/terminal-store';
import { useSettingsStore } from '../state/settings-store';
import { SearchBar } from './SearchBar';
import { PaneTabBar } from './PaneTabBar';

interface TerminalPaneProps {
  id: string; // pane ID (leaf ID in the split tree)
  multiPane: boolean; // more than one pane visible in the workspace
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({ id, multiPane }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activePaneId = useTerminalStore((s) => s.getActiveWorkspace().activeTerminalId);
  const setActive = useTerminalStore((s) => s.setActiveTerminal);
  const activeTabId = useTerminalStore((s) => s.getPaneGroup(id).activeTabId);
  const startCwd = useTerminalStore((s) => s.terminals.get(s.getPaneGroup(id).activeTabId)?.cwd);
  const searchOpenTerminalId = useTerminalStore((s) => s.searchOpenTerminalId);
  const closeSearch = useTerminalStore((s) => s.closeSearch);
  const overlayOpen = useTerminalStore((s) => s.quickTerminalOpen);
  const dimInactive = useSettingsStore((s) => s.dimInactivePanes);

  const isPaneActive = activePaneId === id;
  const showSearch = searchOpenTerminalId === activeTabId;

  useTerminal(activeTabId, containerRef, isPaneActive && !overlayOpen, startCwd);

  const classes = [
    'terminal-pane',
    isPaneActive ? 'active' : '',
    multiPane ? 'show-focus' : '',
    multiPane && dimInactive && !isPaneActive ? 'dimmed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onMouseDown={() => setActive(id)}>
      <PaneTabBar paneId={id} multiPane={multiPane} />
      <div className="terminal-body">
        {showSearch && <SearchBar terminalId={activeTabId} onClose={closeSearch} />}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};
