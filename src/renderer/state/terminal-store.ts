import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import {
  Workspace, TreeNode, SplitDirection, TerminalInfo, PaneGroup, Toast, DialogRequest, ContextMenuRequest,
} from '../types';
import { createLeaf, splitNode, removeNode, findAllTerminalIds, findNextTerminalId } from './split-tree';
import { destroyTerminal, setTerminalEvents, focusTerminal } from '../terminal/registry';
import { loadSession } from './session';

interface TerminalStore {
  workspaces: Workspace[];
  activeWorkspaceIndex: number;
  terminals: Map<string, TerminalInfo>;
  paneGroups: Map<string, PaneGroup>;
  terminalCounter: number;

  agentPanelOpen: boolean;
  commandPaletteOpen: boolean;
  searchOpenTerminalId: string | null;
  quickTerminalOpen: boolean;
  quickTerminalId: string | null;
  settingsOpen: boolean;
  shortcutsOpen: boolean;
  contextMenu: ContextMenuRequest | null;
  dialog: DialogRequest | null;
  toasts: Toast[];

  // Getters
  getActiveWorkspace: () => Workspace;
  getActiveTerminalId: () => string;
  /** The terminal (tab) that currently has focus in the active pane. */
  getFocusedTabId: () => string;
  getPaneGroup: (paneId: string) => PaneGroup;

  // Workspace actions
  addWorkspace: () => void;
  removeWorkspace: (index: number) => void;
  setActiveWorkspace: (index: number) => void;
  renameWorkspace: (index: number, name: string) => void;

  // Pane actions
  setActiveTerminal: (paneId: string) => void;
  splitTerminal: (direction: SplitDirection) => void;
  closeTerminal: (paneId: string) => void;
  closeActiveTab: () => void;
  toggleZoom: () => void;
  updateTree: (tree: TreeNode) => void;

  // Tab actions
  addTabToPane: (paneId: string) => void;
  switchTab: (paneId: string, tabId: string) => void;
  cycleTab: (delta: number) => void;
  closeTab: (paneId: string, tabId: string) => void;
  reorderTab: (paneId: string, fromIdx: number, toIdx: number) => void;
  renameTerminal: (id: string, label: string) => void;
  updateTerminalMeta: (id: string, meta: Partial<Pick<TerminalInfo, 'cwd' | 'title'>>) => void;
  handleTerminalExit: (id: string) => void;

  // UI actions
  toggleAgentPanel: () => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleSearch: () => void;
  closeSearch: () => void;
  toggleQuickTerminal: () => void;
  toggleSettings: () => void;
  toggleShortcuts: () => void;
  openContextMenu: (menu: ContextMenuRequest | null) => void;
  confirm: (req: Omit<DialogRequest, 'resolve'>) => Promise<boolean>;
  notify: (message: string) => void;
  focusActiveTerminal: () => void;
}

function newWorkspace(name: string, termId: string): Workspace {
  return {
    id: uuid(),
    name,
    tree: createLeaf(termId),
    activeTerminalId: termId,
  };
}

/** Locate the workspace and pane that hold a terminal tab. */
function findPaneOfTab(
  workspaces: Workspace[], paneGroups: Map<string, PaneGroup>, tabId: string
): { wsIndex: number; paneId: string } | null {
  for (let wsIndex = 0; wsIndex < workspaces.length; wsIndex++) {
    for (const paneId of findAllTerminalIds(workspaces[wsIndex].tree)) {
      const group = paneGroups.get(paneId);
      if (paneId === tabId || group?.tabIds.includes(tabId)) return { wsIndex, paneId };
    }
  }
  return null;
}

function findWorkspaceOfPane(workspaces: Workspace[], paneId: string): number {
  return workspaces.findIndex((ws) => findAllTerminalIds(ws.tree).includes(paneId));
}

function freshState() {
  const termId = uuid();
  return {
    workspaces: [newWorkspace('Workspace 1', termId)],
    activeWorkspaceIndex: 0,
    terminals: new Map([[termId, { id: termId, label: 'PS 1' }]]),
    paneGroups: new Map([[termId, { tabIds: [termId], activeTabId: termId }]]),
    terminalCounter: 1,
  };
}

let toastId = 0;

export const useTerminalStore = create<TerminalStore>((set, get) => {
  /** Create a terminal record, returning its id and the updated counter. */
  const makeTerminal = (terminals: Map<string, TerminalInfo>, counter: number, cwd?: string) => {
    const id = uuid();
    const next = counter + 1;
    terminals.set(id, { id, label: `PS ${next}`, cwd });
    return { id, counter: next };
  };

  /** Remove a pane (and all its tabs) from the given workspace. Returns null if it is the last pane. */
  const removePane = (state: TerminalStore, wsIndex: number, paneId: string) => {
    const ws = state.workspaces[wsIndex];
    const result = removeNode(ws.tree, paneId);
    if (!result) return null;

    const terminals = new Map(state.terminals);
    const paneGroups = new Map(state.paneGroups);
    const group = paneGroups.get(paneId);
    (group ? group.tabIds : [paneId]).forEach((tabId) => {
      destroyTerminal(tabId);
      terminals.delete(tabId);
    });
    paneGroups.delete(paneId);

    const nextActive = ws.activeTerminalId === paneId
      ? findNextTerminalId(ws.tree, paneId) ?? findAllTerminalIds(result)[0]
      : ws.activeTerminalId;

    const workspaces = [...state.workspaces];
    workspaces[wsIndex] = { ...ws, tree: result, activeTerminalId: nextActive, zoomedPaneId: null };
    const searchOpenTerminalId = state.searchOpenTerminalId && terminals.has(state.searchOpenTerminalId)
      ? state.searchOpenTerminalId : null;
    return { workspaces, terminals, paneGroups, searchOpenTerminalId };
  };

  const initial = loadSession() ?? freshState();

  return {
    ...initial,
    agentPanelOpen: false,
    commandPaletteOpen: false,
    searchOpenTerminalId: null,
    quickTerminalOpen: false,
    quickTerminalId: null,
    settingsOpen: false,
    shortcutsOpen: false,
    contextMenu: null,
    dialog: null,
    toasts: [],

    getActiveWorkspace: () => {
      const state = get();
      return state.workspaces[state.activeWorkspaceIndex] ?? state.workspaces[0];
    },

    getActiveTerminalId: () => get().getActiveWorkspace().activeTerminalId,

    getFocusedTabId: () => {
      const state = get();
      if (state.quickTerminalOpen && state.quickTerminalId) return state.quickTerminalId;
      return state.getPaneGroup(state.getActiveTerminalId()).activeTabId;
    },

    getPaneGroup: (paneId: string) => {
      const group = get().paneGroups.get(paneId);
      return group ?? { tabIds: [paneId], activeTabId: paneId };
    },

    addWorkspace: () => set((state) => {
      const terminals = new Map(state.terminals);
      const { id, counter } = makeTerminal(terminals, state.terminalCounter);
      const ws = newWorkspace(`Workspace ${state.workspaces.length + 1}`, id);
      const paneGroups = new Map(state.paneGroups);
      paneGroups.set(id, { tabIds: [id], activeTabId: id });
      return {
        workspaces: [...state.workspaces, ws],
        activeWorkspaceIndex: state.workspaces.length,
        terminals,
        paneGroups,
        terminalCounter: counter,
      };
    }),

    removeWorkspace: (index) => set((state) => {
      if (state.workspaces.length <= 1) return state;
      const ws = state.workspaces[index];
      if (!ws) return state;
      const terminals = new Map(state.terminals);
      const paneGroups = new Map(state.paneGroups);
      findAllTerminalIds(ws.tree).forEach((paneId) => {
        const group = paneGroups.get(paneId);
        (group ? group.tabIds : [paneId]).forEach((tabId) => {
          destroyTerminal(tabId);
          terminals.delete(tabId);
        });
        paneGroups.delete(paneId);
      });
      const workspaces = state.workspaces.filter((_, i) => i !== index);
      let activeWorkspaceIndex = state.activeWorkspaceIndex;
      if (index < activeWorkspaceIndex || activeWorkspaceIndex >= workspaces.length) activeWorkspaceIndex--;
      activeWorkspaceIndex = Math.max(0, Math.min(activeWorkspaceIndex, workspaces.length - 1));
      return { workspaces, activeWorkspaceIndex, terminals, paneGroups, searchOpenTerminalId: null };
    }),

    setActiveWorkspace: (index) => set((state) => {
      if (index < 0 || index >= state.workspaces.length || index === state.activeWorkspaceIndex) return state;
      return { activeWorkspaceIndex: index, searchOpenTerminalId: null };
    }),

    renameWorkspace: (index, name) => set((state) => {
      const workspaces = [...state.workspaces];
      workspaces[index] = { ...workspaces[index], name };
      return { workspaces };
    }),

    setActiveTerminal: (paneId) => set((state) => {
      const ws = state.workspaces[state.activeWorkspaceIndex];
      if (ws.activeTerminalId === paneId) return state;
      const workspaces = [...state.workspaces];
      workspaces[state.activeWorkspaceIndex] = {
        ...ws,
        activeTerminalId: paneId,
        // Moving focus out of a zoomed pane unzooms (tmux behavior)
        zoomedPaneId: ws.zoomedPaneId && ws.zoomedPaneId !== paneId ? null : ws.zoomedPaneId,
      };
      return { workspaces };
    }),

    splitTerminal: (direction) => set((state) => {
      const ws = state.workspaces[state.activeWorkspaceIndex];
      const sourceTab = state.getPaneGroup(ws.activeTerminalId).activeTabId;
      const terminals = new Map(state.terminals);
      const { id, counter } = makeTerminal(terminals, state.terminalCounter, state.terminals.get(sourceTab)?.cwd);
      const paneGroups = new Map(state.paneGroups);
      paneGroups.set(id, { tabIds: [id], activeTabId: id });
      const workspaces = [...state.workspaces];
      workspaces[state.activeWorkspaceIndex] = {
        ...ws,
        tree: splitNode(ws.tree, ws.activeTerminalId, id, direction),
        activeTerminalId: id,
        zoomedPaneId: null,
      };
      return { workspaces, terminals, paneGroups, terminalCounter: counter };
    }),

    closeTerminal: (paneId) => {
      const state = get();
      const wsIndex = findWorkspaceOfPane(state.workspaces, paneId);
      if (wsIndex < 0) return;
      const result = removePane(state, wsIndex, paneId);
      if (result) {
        set(result);
      } else if (state.workspaces.length > 1) {
        // Last pane of a workspace: close the workspace
        state.removeWorkspace(wsIndex);
      } else {
        state.notify('This is the last terminal — close the window to quit');
      }
    },

    closeActiveTab: () => {
      const state = get();
      if (state.quickTerminalOpen) {
        state.toggleQuickTerminal();
        return;
      }
      const paneId = state.getActiveTerminalId();
      const group = state.getPaneGroup(paneId);
      if (group.tabIds.length > 1) state.closeTab(paneId, group.activeTabId);
      else state.closeTerminal(paneId);
    },

    toggleZoom: () => set((state) => {
      const ws = state.workspaces[state.activeWorkspaceIndex];
      if (!ws.zoomedPaneId && ws.tree.type === 'terminal') return state;
      const workspaces = [...state.workspaces];
      workspaces[state.activeWorkspaceIndex] = {
        ...ws,
        zoomedPaneId: ws.zoomedPaneId ? null : ws.activeTerminalId,
      };
      return { workspaces };
    }),

    updateTree: (tree) => set((state) => {
      const workspaces = [...state.workspaces];
      workspaces[state.activeWorkspaceIndex] = {
        ...workspaces[state.activeWorkspaceIndex],
        tree,
      };
      return { workspaces };
    }),

    addTabToPane: (paneId: string) => set((state) => {
      const existing = state.getPaneGroup(paneId);
      const terminals = new Map(state.terminals);
      const { id, counter } = makeTerminal(terminals, state.terminalCounter, state.terminals.get(existing.activeTabId)?.cwd);
      const paneGroups = new Map(state.paneGroups);
      paneGroups.set(paneId, { tabIds: [...existing.tabIds, id], activeTabId: id });
      return { terminals, paneGroups, terminalCounter: counter };
    }),

    switchTab: (paneId: string, tabId: string) => set((state) => {
      const group = state.paneGroups.get(paneId);
      if (!group || !group.tabIds.includes(tabId) || group.activeTabId === tabId) return state;
      const paneGroups = new Map(state.paneGroups);
      paneGroups.set(paneId, { ...group, activeTabId: tabId });
      return { paneGroups };
    }),

    cycleTab: (delta: number) => {
      const state = get();
      const paneId = state.getActiveTerminalId();
      const group = state.getPaneGroup(paneId);
      if (group.tabIds.length < 2) return;
      const idx = group.tabIds.indexOf(group.activeTabId);
      const next = (idx + delta + group.tabIds.length) % group.tabIds.length;
      state.switchTab(paneId, group.tabIds[next]);
    },

    closeTab: (paneId: string, tabId: string) => {
      const state = get();
      const group = state.paneGroups.get(paneId);
      if (!group) return;
      // Last tab: close the whole pane instead
      if (group.tabIds.length <= 1) {
        state.closeTerminal(paneId);
        return;
      }
      set((s) => {
        const g = s.paneGroups.get(paneId);
        if (!g) return s;
        const newTabIds = g.tabIds.filter((id) => id !== tabId);
        const newActive = g.activeTabId === tabId
          ? newTabIds[Math.min(g.tabIds.indexOf(tabId), newTabIds.length - 1)]
          : g.activeTabId;
        const paneGroups = new Map(s.paneGroups);
        paneGroups.set(paneId, { tabIds: newTabIds, activeTabId: newActive });
        destroyTerminal(tabId);
        const terminals = new Map(s.terminals);
        terminals.delete(tabId);
        return {
          terminals,
          paneGroups,
          searchOpenTerminalId: s.searchOpenTerminalId === tabId ? null : s.searchOpenTerminalId,
        };
      });
    },

    reorderTab: (paneId: string, fromIdx: number, toIdx: number) => set((state) => {
      const group = state.paneGroups.get(paneId);
      if (!group) return state;
      const tabIds = [...group.tabIds];
      const [moved] = tabIds.splice(fromIdx, 1);
      tabIds.splice(toIdx, 0, moved);
      const paneGroups = new Map(state.paneGroups);
      paneGroups.set(paneId, { ...group, tabIds });
      return { paneGroups };
    }),

    renameTerminal: (id, label) => set((state) => {
      const info = state.terminals.get(id);
      if (!info) return state;
      const terminals = new Map(state.terminals);
      const trimmed = label.trim();
      // An empty name reverts to the automatic (shell-reported) title
      terminals.set(id, trimmed ? { ...info, label: trimmed, renamed: true } : { ...info, renamed: false });
      return { terminals };
    }),

    updateTerminalMeta: (id, meta) => set((state) => {
      const info = state.terminals.get(id);
      if (!info) return state;
      // Ignore the shell's startup title (full path of powershell.exe)
      if (meta.title !== undefined && /\.exe$/i.test(meta.title.trim())) delete meta.title;
      if ((meta.cwd === undefined || meta.cwd === info.cwd) && (meta.title === undefined || meta.title === info.title)) {
        return state;
      }
      const terminals = new Map(state.terminals);
      terminals.set(id, { ...info, ...meta });
      return { terminals };
    }),

    handleTerminalExit: (id) => {
      const state = get();
      if (id === state.quickTerminalId) {
        destroyTerminal(id);
        const terminals = new Map(state.terminals);
        terminals.delete(id);
        set({ terminals, quickTerminalId: null, quickTerminalOpen: false });
        return;
      }
      const loc = findPaneOfTab(state.workspaces, state.paneGroups, id);
      if (!loc) {
        destroyTerminal(id);
        return;
      }
      const group = state.getPaneGroup(loc.paneId);
      const isLastTerminal = group.tabIds.length === 1 &&
        state.workspaces.length === 1 &&
        state.workspaces[0].tree.type === 'terminal';
      if (isLastTerminal) {
        // Never leave the window empty: start a fresh shell in its place
        state.addTabToPane(loc.paneId);
        state.closeTab(loc.paneId, id);
        state.notify('Shell exited — started a new session');
      } else if (group.tabIds.length > 1) {
        state.closeTab(loc.paneId, id);
      } else {
        state.closeTerminal(loc.paneId);
      }
    },

    toggleAgentPanel: () => set((state) => ({ agentPanelOpen: !state.agentPanelOpen })),
    // Modal overlays are mutually exclusive: opening one closes the others
    toggleCommandPalette: () => set((state) => (state.commandPaletteOpen
      ? { commandPaletteOpen: false }
      : { commandPaletteOpen: true, settingsOpen: false, shortcutsOpen: false })),
    setCommandPaletteOpen: (open) => set(open
      ? { commandPaletteOpen: true, settingsOpen: false, shortcutsOpen: false }
      : { commandPaletteOpen: false }),
    toggleSearch: () => set((state) => {
      const activeTab = state.getFocusedTabId();
      if (activeTab === state.quickTerminalId) return state;
      return {
        searchOpenTerminalId: state.searchOpenTerminalId === activeTab ? null : activeTab,
      };
    }),
    closeSearch: () => set({ searchOpenTerminalId: null }),
    toggleQuickTerminal: () => set((state) => {
      if (state.quickTerminalOpen) {
        return { quickTerminalOpen: false };
      }
      // Create a quick terminal ID if we don't have one yet
      let qId = state.quickTerminalId;
      if (!qId || !state.terminals.has(qId)) {
        qId = uuid();
        const terminals = new Map(state.terminals);
        terminals.set(qId, { id: qId, label: 'QUICK' });
        return { quickTerminalOpen: true, quickTerminalId: qId, terminals };
      }
      return { quickTerminalOpen: true };
    }),
    toggleSettings: () => set((state) => (state.settingsOpen
      ? { settingsOpen: false }
      : { settingsOpen: true, commandPaletteOpen: false, shortcutsOpen: false })),
    toggleShortcuts: () => set((state) => (state.shortcutsOpen
      ? { shortcutsOpen: false }
      : { shortcutsOpen: true, commandPaletteOpen: false, settingsOpen: false })),
    openContextMenu: (menu) => set({ contextMenu: menu }),

    confirm: (req) => new Promise<boolean>((resolve) => {
      get().dialog?.resolve(false);
      set({
        dialog: {
          ...req,
          resolve: (ok) => {
            set({ dialog: null });
            resolve(ok);
          },
        },
      });
    }),

    notify: (message) => {
      const id = ++toastId;
      set((state) => ({ toasts: [...state.toasts.slice(-2), { id, message }] }));
      setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), 2200);
    },

    focusActiveTerminal: () => {
      focusTerminal(get().getFocusedTabId());
    },
  };
});

// Wire terminal registry events into the store
setTerminalEvents({
  onFocus: (tabId) => {
    const state = useTerminalStore.getState();
    if (tabId === state.quickTerminalId) return;
    const loc = findPaneOfTab(state.workspaces, state.paneGroups, tabId);
    if (loc && loc.wsIndex === state.activeWorkspaceIndex) state.setActiveTerminal(loc.paneId);
  },
  onExit: (id) => useTerminalStore.getState().handleTerminalExit(id),
  onCwd: (id, cwd) => useTerminalStore.getState().updateTerminalMeta(id, { cwd }),
  onTitle: (id, title) => useTerminalStore.getState().updateTerminalMeta(id, { title }),
  onContextMenu: (id, x, y) => useTerminalStore.getState().openContextMenu({ x, y, terminalId: id }),
  notify: (message) => useTerminalStore.getState().notify(message),
  confirmPaste: (text) => {
    const lines = text.trimEnd().split(/\r?\n/);
    return useTerminalStore.getState().confirm({
      title: 'Paste multiple lines?',
      message: `You are about to paste ${lines.length} lines. Each line will run as a command.`,
      detail: lines.slice(0, 6).join('\n') + (lines.length > 6 ? '\n…' : ''),
      confirmLabel: 'Paste',
    });
  },
});
