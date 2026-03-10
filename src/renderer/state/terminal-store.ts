import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { Workspace, TreeNode, SplitDirection, TerminalInfo } from '../types';
import { createLeaf, splitNode, removeNode, findAllTerminalIds, findNextTerminalId } from './split-tree';

interface TerminalStore {
  workspaces: Workspace[];
  activeWorkspaceIndex: number;
  terminals: Map<string, TerminalInfo>;
  agentPanelOpen: boolean;
  commandPaletteOpen: boolean;

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
  splitTerminal: (direction: SplitDirection) => void;
  closeTerminal: (id: string) => void;
  renameTerminal: (id: string, label: string) => void;
  updateTree: (tree: TreeNode) => void;

  // UI actions
  toggleAgentPanel: () => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
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
  const initialWorkspace = createWorkspace('main');
  const initialTermId = (initialWorkspace.tree as { id: string }).id;

  return {
    workspaces: [initialWorkspace],
    activeWorkspaceIndex: 0,
    terminals: new Map([[initialTermId, { id: initialTermId, label: 'PS 1' }]]),
    agentPanelOpen: false,
    commandPaletteOpen: false,

    getActiveWorkspace: () => {
      const state = get();
      return state.workspaces[state.activeWorkspaceIndex];
    },

    getActiveTerminalId: () => {
      return get().getActiveWorkspace().activeTerminalId;
    },

    addWorkspace: () => set((state) => {
      const ws = createWorkspace(`workspace ${state.workspaces.length + 1}`);
      const termId = (ws.tree as { id: string }).id;
      const terminals = new Map(state.terminals);
      terminals.set(termId, { id: termId, label: `PS ${terminals.size + 1}` });
      return {
        workspaces: [...state.workspaces, ws],
        activeWorkspaceIndex: state.workspaces.length,
        terminals,
      };
    }),

    removeWorkspace: (index) => set((state) => {
      if (state.workspaces.length <= 1) return state;
      const ws = state.workspaces[index];
      const termIds = findAllTerminalIds(ws.tree);
      const terminals = new Map(state.terminals);
      termIds.forEach((id) => terminals.delete(id));
      const workspaces = state.workspaces.filter((_, i) => i !== index);
      const activeWorkspaceIndex = Math.min(state.activeWorkspaceIndex, workspaces.length - 1);
      return { workspaces, activeWorkspaceIndex, terminals };
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

    splitTerminal: (direction) => set((state) => {
      const ws = state.workspaces[state.activeWorkspaceIndex];
      const newId = uuid();
      const newTree = splitNode(ws.tree, ws.activeTerminalId, newId, direction);
      const terminals = new Map(state.terminals);
      terminals.set(newId, { id: newId, label: `PS ${terminals.size + 1}` });
      const workspaces = [...state.workspaces];
      workspaces[state.activeWorkspaceIndex] = {
        ...ws,
        tree: newTree,
        activeTerminalId: newId,
      };
      return { workspaces, terminals };
    }),

    closeTerminal: (id) => set((state) => {
      const ws = state.workspaces[state.activeWorkspaceIndex];
      const result = removeNode(ws.tree, id);
      if (!result) return state; // Don't close the last terminal

      const terminals = new Map(state.terminals);
      terminals.delete(id);

      const nextActive = ws.activeTerminalId === id
        ? findNextTerminalId(result, id) || findAllTerminalIds(result)[0]
        : ws.activeTerminalId;

      const workspaces = [...state.workspaces];
      workspaces[state.activeWorkspaceIndex] = {
        ...ws,
        tree: result,
        activeTerminalId: nextActive,
      };
      return { workspaces, terminals };
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

    toggleAgentPanel: () => set((state) => ({ agentPanelOpen: !state.agentPanelOpen })),
    toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
    setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  };
});
