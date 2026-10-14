import { useTerminalStore } from './state/terminal-store';
import { useSettingsStore } from './state/settings-store';
import { findTerminalInDirection, NavDirection } from './state/split-tree';
import { copySelection, pasteClipboard, selectAll, clearTerminal, scrollTerminal } from './terminal/registry';
import { THEMES, ThemeId } from './themes';

export type CommandCategory = 'TAB' | 'PANE' | 'WORKSPACE' | 'EDIT' | 'VIEW' | 'AGENT' | 'APP' | 'THEME';

export interface AppCommand {
  id: string;
  label: string;
  category: CommandCategory;
  /** Key combos (see comboFromEvent). The first one is shown in menus. */
  keys?: string[];
  /** Keys handled inside the terminal (clipboard) — listed for reference, not bound globally. */
  terminalKeys?: boolean;
  /** Fire even when focus is in a text field (only for Ctrl+Shift / F-key combos). */
  global?: boolean;
  run: () => void;
}

const store = () => useTerminalStore.getState();
const settings = () => useSettingsStore.getState();

function navigate(dir: NavDirection) {
  const ws = store().getActiveWorkspace();
  const target = findTerminalInDirection(ws.tree, ws.activeTerminalId, dir);
  if (target) store().setActiveTerminal(target);
}

/** Static commands with their keyboard shortcuts. */
export const COMMANDS: AppCommand[] = [
  // Tabs
  { id: 'tab.new', label: 'New Tab', category: 'TAB', keys: ['Ctrl+D', 'Ctrl+Shift+N'], run: () => store().addTabToPane(store().getActiveTerminalId()) },
  { id: 'tab.close', label: 'Close Tab', category: 'TAB', keys: ['Ctrl+W'], run: () => store().closeActiveTab() },
  { id: 'tab.next', label: 'Next Tab', category: 'TAB', keys: ['Ctrl+PageDown', 'Ctrl+Tab'], run: () => store().cycleTab(1) },
  { id: 'tab.prev', label: 'Previous Tab', category: 'TAB', keys: ['Ctrl+PageUp', 'Ctrl+Shift+Tab'], run: () => store().cycleTab(-1) },

  // Panes
  { id: 'pane.splitH', label: 'Split Right', category: 'PANE', keys: ['Ctrl+Shift+H'], global: true, run: () => store().splitTerminal('horizontal') },
  { id: 'pane.splitV', label: 'Split Down', category: 'PANE', keys: ['Ctrl+Shift+B'], global: true, run: () => store().splitTerminal('vertical') },
  { id: 'pane.close', label: 'Close Pane', category: 'PANE', keys: ['Ctrl+Shift+W'], global: true, run: () => store().closeTerminal(store().getActiveTerminalId()) },
  { id: 'pane.zoom', label: 'Zoom / Unzoom Pane', category: 'PANE', keys: ['Ctrl+Shift+Z'], global: true, run: () => store().toggleZoom() },
  { id: 'pane.up', label: 'Focus Pane Above', category: 'PANE', keys: ['Alt+W'], run: () => navigate('up') },
  { id: 'pane.left', label: 'Focus Pane Left', category: 'PANE', keys: ['Alt+A'], run: () => navigate('left') },
  { id: 'pane.down', label: 'Focus Pane Below', category: 'PANE', keys: ['Alt+S'], run: () => navigate('down') },
  { id: 'pane.right', label: 'Focus Pane Right', category: 'PANE', keys: ['Alt+D'], run: () => navigate('right') },

  // Workspaces
  { id: 'ws.new', label: 'New Workspace', category: 'WORKSPACE', keys: ['Ctrl+Shift+T'], global: true, run: () => store().addWorkspace() },
  ...Array.from({ length: 9 }, (_, i): AppCommand => ({
    id: `ws.goto${i + 1}`,
    label: `Go to Workspace ${i + 1}`,
    category: 'WORKSPACE',
    keys: [`Alt+${i + 1}`],
    run: () => store().setActiveWorkspace(i),
  })),

  // Edit
  { id: 'edit.copy', label: 'Copy Selection', category: 'EDIT', keys: ['Ctrl+C', 'Ctrl+Shift+C', 'Ctrl+Insert'], terminalKeys: true, run: () => { copySelection(store().getFocusedTabId(), { clear: true }); } },
  { id: 'edit.paste', label: 'Paste', category: 'EDIT', keys: ['Ctrl+V', 'Ctrl+Shift+V', 'Shift+Insert'], terminalKeys: true, run: () => { pasteClipboard(store().getFocusedTabId()); } },
  { id: 'edit.selectAll', label: 'Select All', category: 'EDIT', run: () => selectAll(store().getFocusedTabId()) },
  { id: 'edit.find', label: 'Find in Terminal', category: 'EDIT', keys: ['Ctrl+Shift+F'], global: true, run: () => store().toggleSearch() },
  { id: 'edit.clear', label: 'Clear Terminal', category: 'EDIT', keys: ['Ctrl+Shift+K'], global: true, run: () => clearTerminal(store().getFocusedTabId()) },
  { id: 'edit.top', label: 'Scroll to Top', category: 'EDIT', keys: ['Ctrl+Shift+Home'], run: () => scrollTerminal(store().getFocusedTabId(), 'top') },
  { id: 'edit.bottom', label: 'Scroll to Bottom', category: 'EDIT', keys: ['Ctrl+Shift+End'], run: () => scrollTerminal(store().getFocusedTabId(), 'bottom') },

  // View
  { id: 'view.palette', label: 'Command Palette', category: 'VIEW', keys: ['Ctrl+Shift+P'], global: true, run: () => store().toggleCommandPalette() },
  { id: 'view.quick', label: 'Quick Terminal', category: 'VIEW', keys: ['Ctrl+`'], global: true, run: () => store().toggleQuickTerminal() },
  { id: 'view.sidebar', label: 'Toggle Sidebar', category: 'VIEW', keys: ['Ctrl+Shift+E'], global: true, run: () => settings().update({ sidebarCollapsed: !settings().sidebarCollapsed }) },
  { id: 'view.zoomIn', label: 'Increase Font Size', category: 'VIEW', keys: ['Ctrl+=', 'Ctrl+Shift+='], global: true, run: () => settings().zoomFont(1) },
  { id: 'view.zoomOut', label: 'Decrease Font Size', category: 'VIEW', keys: ['Ctrl+-'], global: true, run: () => settings().zoomFont(-1) },
  { id: 'view.zoomReset', label: 'Reset Font Size', category: 'VIEW', keys: ['Ctrl+0'], global: true, run: () => settings().resetFont() },
  { id: 'view.fullscreen', label: 'Toggle Full Screen', category: 'VIEW', keys: ['F11'], global: true, run: () => { window.electronAPI.toggleFullscreen(); } },

  // Agent
  { id: 'agent.toggle', label: 'Toggle Agent Panel', category: 'AGENT', keys: ['Ctrl+Shift+A'], global: true, run: () => store().toggleAgentPanel() },

  // App
  { id: 'app.settings', label: 'Settings', category: 'APP', keys: ['Ctrl+,'], global: true, run: () => store().toggleSettings() },
  { id: 'app.shortcuts', label: 'Keyboard Shortcuts', category: 'APP', keys: ['F1', 'Ctrl+Shift+/'], global: true, run: () => store().toggleShortcuts() },
];

/** Static commands plus dynamic ones (themes, workspaces by name) for the palette. */
export function paletteCommands(): AppCommand[] {
  const themes = (Object.keys(THEMES) as ThemeId[]).map((id): AppCommand => ({
    id: `theme.${id}`,
    label: `Theme: ${THEMES[id].name}`,
    category: 'THEME',
    run: () => settings().update({ theme: id }),
  }));
  const workspaces = store().workspaces.map((ws, i): AppCommand => ({
    id: `ws.switch.${ws.id}`,
    label: `Switch to "${ws.name}"`,
    category: 'WORKSPACE',
    keys: i < 9 ? [`Alt+${i + 1}`] : undefined,
    run: () => store().setActiveWorkspace(i),
  }));
  const toggles: AppCommand[] = [
    { id: 'toggle.copyOnSelect', label: `${settings().copyOnSelect ? 'Disable' : 'Enable'} Copy on Select`, category: 'EDIT', run: () => settings().update({ copyOnSelect: !settings().copyOnSelect }) },
    { id: 'toggle.crt', label: `${settings().crtEffects ? 'Disable' : 'Enable'} CRT Effects`, category: 'VIEW', run: () => settings().update({ crtEffects: !settings().crtEffects }) },
  ];
  return [
    ...COMMANDS.filter((c) => !c.id.startsWith('ws.goto')),
    ...workspaces,
    ...toggles,
    ...themes,
  ];
}

const bindings = new Map<string, AppCommand>();
for (const cmd of COMMANDS) {
  if (cmd.terminalKeys) continue;
  for (const key of cmd.keys ?? []) bindings.set(key, cmd);
}

export function commandForCombo(combo: string): AppCommand | undefined {
  return bindings.get(combo);
}
