export type SplitDirection = 'horizontal' | 'vertical';

export interface TerminalLeaf {
  type: 'terminal';
  id: string;
}

export interface SplitNode {
  type: 'split';
  direction: SplitDirection;
  ratio: number; // 0-1, first child gets ratio, second gets 1-ratio
  first: TreeNode;
  second: TreeNode;
}

export type TreeNode = TerminalLeaf | SplitNode;

export interface TerminalInfo {
  id: string;
  label: string;      // default ("PS 3") or user-chosen name
  renamed?: boolean;  // true when the user picked the label; otherwise the shell title is shown
  title?: string;     // latest title reported by the shell (folder name, running app, ...)
  cwd?: string;       // starting directory, then kept in sync with the shell
}

export interface PaneGroup {
  tabIds: string[];      // terminal IDs stacked in this pane
  activeTabId: string;   // currently visible terminal
}

export interface Workspace {
  id: string;
  name: string;
  tree: TreeNode;
  activeTerminalId: string; // the focused pane's leaf ID
  zoomedPaneId?: string | null; // pane temporarily filling the whole workspace
}

export interface Toast {
  id: number;
  message: string;
}

export interface DialogRequest {
  title: string;
  message: string;
  detail?: string;
  confirmLabel: string;
  resolve: (ok: boolean) => void;
}

export interface ContextMenuRequest {
  x: number;
  y: number;
  terminalId: string;
}

/** Name to show for a terminal: user's name if renamed, else the shell-reported title. */
export function terminalDisplayName(info: TerminalInfo | undefined): string {
  if (!info) return '---';
  if (info.renamed) return info.label;
  return info.title?.trim() || info.label;
}
