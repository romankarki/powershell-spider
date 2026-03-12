import React, { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { TabBar } from './components/TabBar';
import { SplitContainer } from './components/SplitContainer';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import { AgentPanel } from './components/AgentPanel';
import { QuickTerminal } from './components/QuickTerminal';
import { useTerminalStore } from './state/terminal-store';
import { findTerminalInDirection, NavDirection } from './state/split-tree';

const App: React.FC = () => {
  const workspace = useTerminalStore((s) => s.getActiveWorkspace());
  const agentPanelOpen = useTerminalStore((s) => s.agentPanelOpen);
  const splitTerminal = useTerminalStore((s) => s.splitTerminal);
  const closeTerminal = useTerminalStore((s) => s.closeTerminal);
  const getActiveTerminalId = useTerminalStore((s) => s.getActiveTerminalId);
  const addWorkspace = useTerminalStore((s) => s.addWorkspace);
  const toggleAgentPanel = useTerminalStore((s) => s.toggleAgentPanel);
  const toggleCommandPalette = useTerminalStore((s) => s.toggleCommandPalette);
  const toggleSearch = useTerminalStore((s) => s.toggleSearch);
  const toggleQuickTerminal = useTerminalStore((s) => s.toggleQuickTerminal);
  const setActiveTerminal = useTerminalStore((s) => s.setActiveTerminal);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+WASD: split panes (A/D = horizontal, W/S = vertical)
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'a' || key === 'd') {
          e.preventDefault();
          splitTerminal('horizontal');
          return;
        }
        if (key === 'w' || key === 's') {
          e.preventDefault();
          splitTerminal('vertical');
          return;
        }
      }

      // Alt+WASD: spatial pane navigation
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const wasdMap: Record<string, NavDirection> = {
          a: 'left',
          d: 'right',
          w: 'up',
          s: 'down',
        };
        const navDir = wasdMap[e.key.toLowerCase()];
        if (navDir) {
          e.preventDefault();
          const ws = useTerminalStore.getState().getActiveWorkspace();
          const target = findTerminalInDirection(ws.tree, ws.activeTerminalId, navDir);
          if (target) setActiveTerminal(target);
          return;
        }
      }

      // Ctrl+`: toggle quick terminal
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === '`') {
        e.preventDefault();
        toggleQuickTerminal();
        return;
      }

      if (e.ctrlKey && e.shiftKey) {
        switch (e.key.toUpperCase()) {
          case 'W':
            e.preventDefault();
            closeTerminal(getActiveTerminalId());
            break;
          case 'T':
            e.preventDefault();
            addWorkspace();
            break;
          case 'A':
            e.preventDefault();
            toggleAgentPanel();
            break;
          case 'P':
            e.preventDefault();
            toggleCommandPalette();
            break;
          case 'F':
            e.preventDefault();
            toggleSearch();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [splitTerminal, closeTerminal, getActiveTerminalId, addWorkspace, toggleAgentPanel, toggleCommandPalette, toggleSearch, toggleQuickTerminal, setActiveTerminal]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TitleBar />
      <TabBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <SplitContainer node={workspace.tree} />
        </div>
        {agentPanelOpen && <AgentPanel />}
      </div>
      <StatusBar />
      <CommandPalette />
      <QuickTerminal />
    </div>
  );
};

export default App;
