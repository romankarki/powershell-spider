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
  label: string;
  cwd?: string; // starting directory for this terminal
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
}
