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

// --- Spatial navigation (Alt+Ctrl+Arrow) ---

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Compute the normalized bounding rect (0-1 range) of every terminal leaf. */
function computeRects(
  node: TreeNode,
  rect: Rect = { x: 0, y: 0, w: 1, h: 1 }
): Map<string, Rect> {
  if (node.type === 'terminal') {
    return new Map([[node.id, rect]]);
  }

  const { direction, ratio, first, second } = node;
  let firstRect: Rect;
  let secondRect: Rect;

  if (direction === 'horizontal') {
    firstRect = { x: rect.x, y: rect.y, w: rect.w * ratio, h: rect.h };
    secondRect = { x: rect.x + rect.w * ratio, y: rect.y, w: rect.w * (1 - ratio), h: rect.h };
  } else {
    firstRect = { x: rect.x, y: rect.y, w: rect.w, h: rect.h * ratio };
    secondRect = { x: rect.x, y: rect.y + rect.h * ratio, w: rect.w, h: rect.h * (1 - ratio) };
  }

  const a = computeRects(first, firstRect);
  const b = computeRects(second, secondRect);
  for (const [k, v] of b) a.set(k, v);
  return a;
}

export type NavDirection = 'left' | 'right' | 'up' | 'down';

/** Find the best terminal to navigate to from `currentId` in the given direction. */
export function findTerminalInDirection(
  tree: TreeNode,
  currentId: string,
  direction: NavDirection
): string | null {
  const rects = computeRects(tree);
  const current = rects.get(currentId);
  if (!current) return null;

  // Center of the current pane
  const cx = current.x + current.w / 2;
  const cy = current.y + current.h / 2;

  let bestId: string | null = null;
  let bestDist = Infinity;

  for (const [id, rect] of rects) {
    if (id === currentId) continue;

    const tx = rect.x + rect.w / 2;
    const ty = rect.y + rect.h / 2;
    const dx = tx - cx;
    const dy = ty - cy;

    // Check if the target is in the correct direction
    let inDirection = false;
    switch (direction) {
      case 'left':  inDirection = dx < -0.001; break;
      case 'right': inDirection = dx > 0.001;  break;
      case 'up':    inDirection = dy < -0.001; break;
      case 'down':  inDirection = dy > 0.001;  break;
    }
    if (!inDirection) continue;

    // Distance: heavily weight the primary axis, lightly weight the cross axis
    let dist: number;
    if (direction === 'left' || direction === 'right') {
      dist = Math.abs(dx) + Math.abs(dy) * 0.5;
    } else {
      dist = Math.abs(dy) + Math.abs(dx) * 0.5;
    }

    if (dist < bestDist) {
      bestDist = dist;
      bestId = id;
    }
  }

  return bestId;
}
