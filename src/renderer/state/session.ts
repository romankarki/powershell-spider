import type { StoreApi, UseBoundStore } from 'zustand';
import { Workspace, TerminalInfo, PaneGroup, TreeNode } from '../types';
import { findAllTerminalIds } from './split-tree';
import { getSettings } from './settings-store';

const KEY = 'spider-session';

interface PersistedSession {
  version: 1;
  workspaces: Workspace[];
  activeWorkspaceIndex: number;
  terminals: TerminalInfo[];
  paneGroups: [string, PaneGroup][];
  terminalCounter: number;
}

interface SessionState {
  workspaces: Workspace[];
  activeWorkspaceIndex: number;
  terminals: Map<string, TerminalInfo>;
  paneGroups: Map<string, PaneGroup>;
  terminalCounter: number;
  quickTerminalId: string | null;
}

function validTree(node: unknown): node is TreeNode {
  if (!node || typeof node !== 'object') return false;
  const n = node as Record<string, unknown>;
  if (n.type === 'terminal') return typeof n.id === 'string';
  return n.type === 'split' &&
    (n.direction === 'horizontal' || n.direction === 'vertical') &&
    typeof n.ratio === 'number' && validTree(n.first) && validTree(n.second);
}

/** Restore the previous layout (workspaces, splits, tabs, names, cwds). Null when disabled or invalid. */
export function loadSession(): Omit<SessionState, 'quickTerminalId'> | null {
  if (!getSettings().restoreSession) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as PersistedSession;
    if (s.version !== 1 || !Array.isArray(s.workspaces) || s.workspaces.length === 0) return null;

    const terminals = new Map<string, TerminalInfo>();
    for (const t of s.terminals) {
      // The shell title is transient; it will be re-reported by the new shell
      terminals.set(t.id, { id: t.id, label: t.label, renamed: t.renamed, cwd: t.cwd });
    }
    const paneGroups = new Map(s.paneGroups);

    for (const ws of s.workspaces) {
      if (typeof ws.id !== 'string' || typeof ws.name !== 'string' || !validTree(ws.tree)) return null;
      const paneIds = findAllTerminalIds(ws.tree);
      for (const paneId of paneIds) {
        const group = paneGroups.get(paneId) ?? { tabIds: [paneId], activeTabId: paneId };
        if (group.tabIds.length === 0 || !group.tabIds.every((id) => terminals.has(id))) return null;
        if (!group.tabIds.includes(group.activeTabId)) group.activeTabId = group.tabIds[0];
        paneGroups.set(paneId, group);
      }
      if (!paneIds.includes(ws.activeTerminalId)) ws.activeTerminalId = paneIds[0];
      ws.zoomedPaneId = null;
    }

    return {
      workspaces: s.workspaces,
      activeWorkspaceIndex: Math.min(Math.max(0, s.activeWorkspaceIndex), s.workspaces.length - 1),
      terminals,
      paneGroups,
      terminalCounter: s.terminalCounter || terminals.size,
    };
  } catch {
    return null;
  }
}

function serialize(state: SessionState): string {
  const terminals = [...state.terminals.values()]
    .filter((t) => t.id !== state.quickTerminalId)
    .map(({ id, label, renamed, cwd }) => ({ id, label, renamed, cwd }));
  const session: PersistedSession = {
    version: 1,
    workspaces: state.workspaces.map((ws) => ({ ...ws, zoomedPaneId: null })),
    activeWorkspaceIndex: state.activeWorkspaceIndex,
    terminals,
    paneGroups: [...state.paneGroups.entries()],
    terminalCounter: state.terminalCounter,
  };
  return JSON.stringify(session);
}

/** Save the layout (debounced) whenever it changes. */
export function startSessionPersistence<T extends SessionState>(store: UseBoundStore<StoreApi<T>>): void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const save = () => {
    timer = null;
    try {
      localStorage.setItem(KEY, serialize(store.getState()));
    } catch { /* storage full or unavailable */ }
  };
  store.subscribe((s, prev) => {
    if (
      s.workspaces === prev.workspaces && s.terminals === prev.terminals &&
      s.paneGroups === prev.paneGroups && s.activeWorkspaceIndex === prev.activeWorkspaceIndex
    ) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(save, 400);
  });
  window.addEventListener('beforeunload', () => {
    if (timer) clearTimeout(timer);
    save();
  });
}
