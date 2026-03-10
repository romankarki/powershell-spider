import { TreeNode, SplitNode, TerminalLeaf, SplitDirection } from '../types';

export function createLeaf(id: string): TerminalLeaf {
  return { type: 'terminal', id };
}

export function splitNode(
  tree: TreeNode,
  targetId: string,
  newId: string,
  direction: SplitDirection
): TreeNode {
  if (tree.type === 'terminal') {
    if (tree.id === targetId) {
      return {
        type: 'split',
        direction,
        ratio: 0.5,
        first: tree,
        second: createLeaf(newId),
      };
    }
    return tree;
  }

  return {
    ...tree,
    first: splitNode(tree.first, targetId, newId, direction),
    second: splitNode(tree.second, targetId, newId, direction),
  };
}

export function removeNode(tree: TreeNode, targetId: string): TreeNode | null {
  if (tree.type === 'terminal') {
    return tree.id === targetId ? null : tree;
  }

  const first = removeNode(tree.first, targetId);
  const second = removeNode(tree.second, targetId);

  if (first === null) return second;
  if (second === null) return first;

  return { ...tree, first, second };
}

export function updateRatio(tree: TreeNode, targetNode: SplitNode, newRatio: number): TreeNode {
  if (tree.type === 'terminal') return tree;

  if (tree === targetNode) {
    return { ...tree, ratio: Math.max(0.1, Math.min(0.9, newRatio)) };
  }

  return {
    ...tree,
    first: updateRatio(tree.first, targetNode, newRatio),
    second: updateRatio(tree.second, targetNode, newRatio),
  };
}

export function findAllTerminalIds(tree: TreeNode): string[] {
  if (tree.type === 'terminal') return [tree.id];
  return [...findAllTerminalIds(tree.first), ...findAllTerminalIds(tree.second)];
}

export function findNextTerminalId(tree: TreeNode, currentId: string): string | null {
  const ids = findAllTerminalIds(tree);
  const idx = ids.indexOf(currentId);
  if (idx === -1 || ids.length <= 1) return null;
  return ids[(idx + 1) % ids.length];
}

export function findPrevTerminalId(tree: TreeNode, currentId: string): string | null {
  const ids = findAllTerminalIds(tree);
  const idx = ids.indexOf(currentId);
  if (idx === -1 || ids.length <= 1) return null;
  return ids[(idx - 1 + ids.length) % ids.length];
}
