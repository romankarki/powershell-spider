import React, { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { TabBar } from './components/TabBar';
import { SplitContainer } from './components/SplitContainer';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import { AgentPanel } from './components/AgentPanel';
import { useTerminalStore } from './state/terminal-store';

const App: React.FC = () => {
  const workspace = useTerminalStore((s) => s.getActiveWorkspace());
  const agentPanelOpen = useTerminalStore((s) => s.agentPanelOpen);
  const splitTerminal = useTerminalStore((s) => s.splitTerminal);
  const closeTerminal = useTerminalStore((s) => s.closeTerminal);
  const getActiveTerminalId = useTerminalStore((s) => s.getActiveTerminalId);
  const addWorkspace = useTerminalStore((s) => s.addWorkspace);
  const toggleAgentPanel = useTerminalStore((s) => s.toggleAgentPanel);
  const toggleCommandPalette = useTerminalStore((s) => s.toggleCommandPalette);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key.toUpperCase()) {
          case 'H':
            e.preventDefault();
            splitTerminal('horizontal');
            break;
          case 'V':
            e.preventDefault();
            splitTerminal('vertical');
            break;
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
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [splitTerminal, closeTerminal, getActiveTerminalId, addWorkspace, toggleAgentPanel, toggleCommandPalette]);

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
    </div>
  );
};

export default App;
