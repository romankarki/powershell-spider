import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { Workspace, TreeNode, SplitDirection, TerminalInfo, PaneGroup } from '../types';
import { createLeaf, splitNode, removeNode, findAllTerminalIds, findNextTerminalId } from './split-tree';
import { destroyTerminal, applyTheme } from '../hooks/useTerminal';
import { ThemeId, DEFAULT_THEME } from '../themes';

interface TerminalStore {
  workspaces: Workspace[];
  activeWorkspaceIndex: number;
  terminals: Map<string, TerminalInfo>;
  paneGroups: Map<string, PaneGroup>;
  agentPanelOpen: boolean;
  commandPaletteOpen: boolean;
  searchOpenTerminalId: string | null;
  quickTerminalOpen: boolean;
  quickTerminalId: string | null;
  currentTheme: ThemeId;
  settingsOpen: boolean;

  // Getters
  getActiveWorkspace: () => Workspace;
  getActiveTerminalId: () => string;

  // Workspace actions
  addWorkspace: () => void;
  removeWorkspace: (index: number) => void;
  setActiveWorkspace: (index: number) => void;
  renameWorkspace: (index: number, name: string) => void;

  // Terminal actions
  setActiveTerminal: (id: string) => void;
  splitTerminal: (direction: SplitDirection) => Promise<void>;
  closeTerminal: (id: string) => void;
  renameTerminal: (id: string, label: string) => void;
  updateTree: (tree: TreeNode) => void;

  // Pane group actions
  addTabToPane: (paneId: string) => Promise<void>;
  switchTab: (paneId: string, tabId: string) => void;
  closeTab: (paneId: string, tabId: string) => void;
  getPaneGroup: (paneId: string) => PaneGroup;
  reorderTab: (paneId: string, fromIdx: number, toIdx: number) => void;

  // UI actions
  toggleAgentPanel: () => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleSearch: () => void;
  closeSearch: () => void;
  toggleQuickTerminal: () => void;
  setTheme: (themeId: ThemeId) => void;
  toggleSettings: () => void;
}

function createWorkspace(name: string): Workspace {
  const termId = uuid();
  return {
    id: uuid(),
    name,
    tree: createLeaf(termId),
    activeTerminalId: termId,
  };
}

export const useTerminalStore = create<TerminalStore>((set, get) => {
  const initialWorkspace = createWorkspace('PS 1');
  const initialTermId = (initialWorkspace.tree as { id: string }).id;

  return {
    workspaces: [initialWorkspace],
    activeWorkspaceIndex: 0,
    terminals: new Map([[initialTermId, { id: initialTermId, label: 'PS 1' }]]),
    paneGroups: new Map([[initialTermId, { tabIds: [initialTermId], activeTabId: initialTermId }]]),
    agentPanelOpen: false,
    commandPaletteOpen: false,
    searchOpenTerminalId: null,
    quickTerminalOpen: false,
    quickTerminalId: null,
    currentTheme: DEFAULT_THEME,
    settingsOpen: false,

    getActiveWorkspace: () => {
      const state = get();
      return state.workspaces[state.activeWorkspaceIndex];
    },

    getActiveTerminalId: () => {
      return get().getActiveWorkspace().activeTerminalId;
    },

    addWorkspace: () => set((state) => {
      const ws = createWorkspace(`PS ${state.workspaces.length + 1}`);
      const termId = (ws.tree as { id: string }).id;
      const terminals = new Map(state.terminals);
      terminals.set(termId, { id: termId, label: `PS ${terminals.size + 1}` });
      const paneGroups = new Map(state.paneGroups);
      paneGroups.set(termId, { tabIds: [termId], activeTabId: termId });
      return {
        workspaces: [...state.workspaces, ws],
        activeWorkspaceIndex: state.workspaces.length,
        terminals,
        paneGroups,
      };
    }),

    removeWorkspace: (index) => set((state) => {
      if (state.workspaces.length <= 1) return state;
      const ws = state.workspaces[index];
      const leafIds = findAllTerminalIds(ws.tree);
      const terminals = new Map(state.terminals);
      const paneGroups = new Map(state.paneGroups);
      // Destroy all terminals in all pane groups of the removed workspace
      leafIds.forEach((paneId) => {
        const group = paneGroups.get(paneId);
        if (group) {
          group.tabIds.forEach((tabId) => {
            destroyTerminal(tabId);
            terminals.delete(tabId);
          });
          paneGroups.delete(paneId);
        } else {
          destroyTerminal(paneId);
          terminals.delete(paneId);
        }
      });
      const workspaces = state.workspaces.filter((_, i) => i !== index);
      const activeWorkspaceIndex = Math.min(state.activeWorkspaceIndex, workspaces.length - 1);
      return { workspaces, activeWorkspaceIndex, terminals, paneGroups };
    }),

    setActiveWorkspace: (index) => set({ activeWorkspaceIndex: index }),

    renameWorkspace: (index, name) => set((state) => {
      const workspaces = [...state.workspaces];
      workspaces[index] = { ...workspaces[index], name };
      return { workspaces };
    }),

    setActiveTerminal: (id) => set((state) => {
      const workspaces = [...state.workspaces];
      const ws = { ...workspaces[state.activeWorkspaceIndex], activeTerminalId: id };
      workspaces[state.activeWorkspaceIndex] = ws;
      return { workspaces };
    }),

    splitTerminal: async (direction) => {
      // Fetch cwd from the active terminal's PTY before splitting
      const activePaneId = get().getActiveTerminalId();
      const group = get().paneGroups.get(activePaneId);
      const activeTabId = group?.activeTabId ?? activePaneId;
      let cwd: string | undefined;
      try {
        cwd = await window.electronAPI.getCwd(activeTabId);
      } catch { /* use default */ }

      set((state) => {
        const ws = state.workspaces[state.activeWorkspaceIndex];
        const newId = uuid();
        const newTree = splitNode(ws.tree, ws.activeTerminalId, newId, direction);
        const terminals = new Map(state.terminals);
        terminals.set(newId, { id: newId, label: `PS ${terminals.size + 1}`, cwd });
        const paneGroups = new Map(state.paneGroups);
        paneGroups.set(newId, { tabIds: [newId], activeTabId: newId });
        const workspaces = [...state.workspaces];
        workspaces[state.activeWorkspaceIndex] = {
          ...ws,
          tree: newTree,
          activeTerminalId: newId,
        };
        return { workspaces, terminals, paneGroups };
      });
    },

    closeTerminal: (id) => set((state) => {
      const ws = state.workspaces[state.activeWorkspaceIndex];
      const result = removeNode(ws.tree, id);
      if (!result) return state; // Don't close the last terminal

      // Destroy all terminals in this pane's group
      const terminals = new Map(state.terminals);
      const paneGroups = new Map(state.paneGroups);
      const group = paneGroups.get(id);
      if (group) {
        group.tabIds.forEach((tabId) => {
          destroyTerminal(tabId);
          terminals.delete(tabId);
        });
        paneGroups.delete(id);
      } else {
        destroyTerminal(id);
        terminals.delete(id);
      }

      const nextActive = ws.activeTerminalId === id
        ? findNextTerminalId(result, id) || findAllTerminalIds(result)[0]
        : ws.activeTerminalId;

      const workspaces = [...state.workspaces];
      workspaces[state.activeWorkspaceIndex] = {
        ...ws,
        tree: result,
        activeTerminalId: nextActive,
      };
      return { workspaces, terminals, paneGroups };
    }),

    renameTerminal: (id, label) => set((state) => {
      const terminals = new Map(state.terminals);
      const info = terminals.get(id);
      if (info) terminals.set(id, { ...info, label });
      return { terminals };
    }),

    updateTree: (tree) => set((state) => {
      const workspaces = [...state.workspaces];
      workspaces[state.activeWorkspaceIndex] = {
        ...workspaces[state.activeWorkspaceIndex],
        tree,
      };
      return { workspaces };
    }),

    getPaneGroup: (paneId: string) => {
      const group = get().paneGroups.get(paneId);
      return group ?? { tabIds: [paneId], activeTabId: paneId };
    },

    addTabToPane: async (paneId: string) => {
      // Get cwd from the currently active tab in this pane
      const group = get().paneGroups.get(paneId);
      const activeTabId = group?.activeTabId ?? paneId;
      let cwd: string | undefined;
      try {
        cwd = await window.electronAPI.getCwd(activeTabId);
      } catch { /* use default */ }

      set((state) => {
        const newId = uuid();
        const terminals = new Map(state.terminals);
        terminals.set(newId, { id: newId, label: `PS ${terminals.size + 1}`, cwd });

        const paneGroups = new Map(state.paneGroups);
        const existing = paneGroups.get(paneId) ?? { tabIds: [paneId], activeTabId: paneId };
        paneGroups.set(paneId, {
          tabIds: [...existing.tabIds, newId],
          activeTabId: newId,
        });

        return { terminals, paneGroups };
      });
    },

    switchTab: (paneId: string, tabId: string) => set((state) => {
      const paneGroups = new Map(state.paneGroups);
      const group = paneGroups.get(paneId);
      if (!group || !group.tabIds.includes(tabId)) return state;
      paneGroups.set(paneId, { ...group, activeTabId: tabId });
      return { paneGroups };
    }),

    closeTab: (paneId: string, tabId: string) => set((state) => {
      const paneGroups = new Map(state.paneGroups);
      const group = paneGroups.get(paneId);
      if (!group) return state;

      // If it's the last tab, close the entire pane instead
      if (group.tabIds.length <= 1) {
        // Delegate to closeTerminal which handles tree removal
        // We can't call closeTerminal from within set, so just return state
        // and let the caller handle it
        return state;
      }

      // Remove the tab
      const newTabIds = group.tabIds.filter((id) => id !== tabId);
      const newActive = group.activeTabId === tabId
        ? newTabIds[Math.min(group.tabIds.indexOf(tabId), newTabIds.length - 1)]
        : group.activeTabId;

      paneGroups.set(paneId, { tabIds: newTabIds, activeTabId: newActive });

      // Destroy the terminal
      destroyTerminal(tabId);
      const terminals = new Map(state.terminals);
      terminals.delete(tabId);

      return { terminals, paneGroups };
    }),

    reorderTab: (paneId: string, fromIdx: number, toIdx: number) => set((state) => {
      const paneGroups = new Map(state.paneGroups);
      const group = paneGroups.get(paneId);
      if (!group) return state;
      const tabIds = [...group.tabIds];
      const [moved] = tabIds.splice(fromIdx, 1);
      tabIds.splice(toIdx, 0, moved);
      paneGroups.set(paneId, { ...group, tabIds });
      return { paneGroups };
    }),

    toggleAgentPanel: () => set((state) => ({ agentPanelOpen: !state.agentPanelOpen })),
    toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
    setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    toggleSearch: () => set((state) => {
      const activeId = state.getActiveWorkspace().activeTerminalId;
      return {
        searchOpenTerminalId: state.searchOpenTerminalId === activeId ? null : activeId,
      };
    }),
    closeSearch: () => set({ searchOpenTerminalId: null }),
    toggleQuickTerminal: () => set((state) => {
      if (state.quickTerminalOpen) {
        return { quickTerminalOpen: false };
      }
      // Create a quick terminal ID if we don't have one yet
      let qId = state.quickTerminalId;
      const terminals = new Map(state.terminals);
      if (!qId || !terminals.has(qId)) {
        qId = uuid();
        terminals.set(qId, { id: qId, label: 'QUICK' });
        return { quickTerminalOpen: true, quickTerminalId: qId, terminals };
      }
      return { quickTerminalOpen: true };
    }),
    setTheme: (themeId: ThemeId) => {
      applyTheme(themeId);
      set({ currentTheme: themeId });
    },
    toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  };
});
