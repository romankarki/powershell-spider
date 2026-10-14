import React, { useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { WorkspaceSidebar } from './components/WorkspaceSidebar';
import { WorkspaceView } from './components/SplitContainer';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import { AgentPanel } from './components/AgentPanel';
import { QuickTerminal } from './components/QuickTerminal';
import { SettingsPanel } from './components/SettingsPanel';
import { ShortcutsHelp } from './components/ShortcutsHelp';
import { ContextMenu, Toasts, ConfirmDialog } from './components/Popups';
import { useTerminalStore } from './state/terminal-store';
import { useSettingsStore } from './state/settings-store';
import { commandForCombo } from './commands';
import { comboFromEvent } from './keys';
import { applyUiTheme } from './themes';
import { pasteText } from './terminal/registry';

const REPEATABLE = new Set(['tab.next', 'tab.prev', 'view.zoomIn', 'view.zoomOut', 'pane.up', 'pane.down', 'pane.left', 'pane.right']);

/** True for text fields other than xterm's hidden input textarea. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.classList.contains('xterm-helper-textarea')) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Quote a path for PowerShell if it contains characters that need it. */
function quotePath(p: string): string {
  return /[\s'"`$&(){}[\];,]/.test(p) ? `'${p.replace(/'/g, "''")}'` : p;
}

const App: React.FC = () => {
  const agentPanelOpen = useTerminalStore((s) => s.agentPanelOpen);
  const theme = useSettingsStore((s) => s.theme);
  const crtEffects = useSettingsStore((s) => s.crtEffects);

  useEffect(() => {
    applyUiTheme(theme);
  }, [theme]);

  useEffect(() => {
    document.getElementById('root')?.classList.toggle('crt', crtEffects);
  }, [crtEffects]);

  // Global keybindings (capture phase so we act before xterm sees the key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const cmd = commandForCombo(comboFromEvent(e));
      if (!cmd) return;
      const state = useTerminalStore.getState();
      const modalOpen = state.settingsOpen || state.shortcutsOpen || state.commandPaletteOpen;
      if (state.dialog) return;
      if (!cmd.global && (isEditableTarget(e.target) || modalOpen)) return;
      e.preventDefault();
      e.stopPropagation();
      // Holding a key shouldn't spawn dozens of splits/tabs
      if (e.repeat && !REPEATABLE.has(cmd.id)) return;
      cmd.run();
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // Return focus to the active terminal when overlays close
  useEffect(() => {
    return useTerminalStore.subscribe((s, prev) => {
      const open = (x: typeof s) =>
        x.commandPaletteOpen || x.settingsOpen || x.shortcutsOpen || x.dialog !== null ||
        x.contextMenu !== null || x.quickTerminalOpen || x.searchOpenTerminalId !== null;
      if (open(prev) && !open(s)) {
        requestAnimationFrame(() => useTerminalStore.getState().focusActiveTerminal());
      }
    });
  }, []);

  // Dropping files onto the window types their (quoted) paths into the focused terminal
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    };
    const onDrop = (e: DragEvent) => {
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (!files.length) return;
      e.preventDefault();
      const paths = files.map((f) => window.electronAPI.getPathForFile(f)).filter(Boolean);
      if (paths.length) pasteText(useTerminalStore.getState().getFocusedTabId(), paths.map(quotePath).join(' ') + ' ');
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TitleBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <WorkspaceSidebar />
        <main style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <WorkspaceView />
        </main>
        {agentPanelOpen && <AgentPanel />}
      </div>
      <StatusBar />
      <QuickTerminal />
      <CommandPalette />
      <SettingsPanel />
      <ShortcutsHelp />
      <ContextMenu />
      <ConfirmDialog />
      <Toasts />
    </div>
  );
};

export default App;
