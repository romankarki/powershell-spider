import React, { useRef } from 'react';
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
  const paneGroup = useTerminalStore((s) => s.getPaneGroup(id));
  const isPaneActive = activePaneId === id;

  const searchOpenTerminalId = useTerminalStore((s) => s.searchOpenTerminalId);
  const closeSearch = useTerminalStore((s) => s.closeSearch);

  // The active tab's terminal ID - this is what we render
  const activeTabId = paneGroup.activeTabId;
  const showSearch = searchOpenTerminalId === id || searchOpenTerminalId === activeTabId;

  const termInfo = terminals.get(activeTabId);
  useTerminal(activeTabId, containerRef, isPaneActive, () => setActive(id), termInfo?.cwd);

  return (
    <div
      className={`terminal-pane ${isPaneActive ? 'active' : ''}`}
      onClick={() => setActive(id)}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
    >
      {showSearch && <SearchBar terminalId={activeTabId} onClose={closeSearch} />}

      {/* Always show tab bar for consistency */}
      <PaneTabBar paneId={id} />

      {/* Terminal body fills remaining space */}
      <div className="terminal-body-flex" ref={containerRef} style={{
        flex: 1,
        overflow: 'hidden',
      }} />
    </div>
  );
};
