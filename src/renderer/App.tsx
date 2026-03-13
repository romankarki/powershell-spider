import React, { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { WorkspaceSidebar } from './components/WorkspaceSidebar';
import { SplitContainer } from './components/SplitContainer';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import { AgentPanel } from './components/AgentPanel';
import { QuickTerminal } from './components/QuickTerminal';
import { SettingsPanel } from './components/SettingsPanel';
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
  const addTabToPane = useTerminalStore((s) => s.addTabToPane);
  const switchTab = useTerminalStore((s) => s.switchTab);
  const toggleSettings = useTerminalStore((s) => s.toggleSettings);
  const setActiveTerminal = useTerminalStore((s) => s.setActiveTerminal);
  const closeTab = useTerminalStore((s) => s.closeTab);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+,: open settings
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === ',') {
        e.preventDefault();
        toggleSettings();
        return;
      }

      // Ctrl+D: new terminal tab in active pane (Ghostty-style)
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        addTabToPane(getActiveTerminalId());
        return;
      }

      // Ctrl+W: close active tab (closes pane if last tab)
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        const state = useTerminalStore.getState();
        const paneId = state.getActiveTerminalId();
        const group = state.getPaneGroup(paneId);
        if (group.tabIds.length > 1) {
          closeTab(paneId, group.activeTabId);
        } else {
          closeTerminal(paneId);
        }
        return;
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

      // Ctrl+PageUp/PageDown: cycle tabs within active pane
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (e.key === 'PageUp' || e.key === 'PageDown') {
          e.preventDefault();
          const state = useTerminalStore.getState();
          const paneId = state.getActiveTerminalId();
          const group = state.getPaneGroup(paneId);
          if (group.tabIds.length > 1) {
            const currentIdx = group.tabIds.indexOf(group.activeTabId);
            const delta = e.key === 'PageDown' ? 1 : -1;
            const nextIdx = (currentIdx + delta + group.tabIds.length) % group.tabIds.length;
            switchTab(paneId, group.tabIds[nextIdx]);
          }
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
          case 'F':
            e.preventDefault();
            toggleSearch();
            break;
        }
      }
    };

    // Use capture phase so we intercept before xterm processes the key
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [splitTerminal, closeTerminal, getActiveTerminalId, addWorkspace, toggleAgentPanel, toggleCommandPalette, toggleSearch, toggleQuickTerminal, addTabToPane, switchTab, toggleSettings, setActiveTerminal, closeTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TitleBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <WorkspaceSidebar />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <SplitContainer node={workspace.tree} />
        </div>
        {agentPanelOpen && <AgentPanel />}
      </div>
      <StatusBar />
      <CommandPalette />
      <QuickTerminal />
      <SettingsPanel />
    </div>
  );
};

export default App;
