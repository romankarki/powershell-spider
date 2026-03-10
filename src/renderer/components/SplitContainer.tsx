import React, { useRef, useCallback } from 'react';
import { TreeNode, SplitNode } from '../types';
import { TerminalPane } from './TerminalPane';
import { Divider } from './Divider';
import { useTerminalStore } from '../state/terminal-store';
import { updateRatio } from '../state/split-tree';

interface SplitContainerProps {
  node: TreeNode;
}

export const SplitContainer: React.FC<SplitContainerProps> = ({ node }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tree = useTerminalStore((s) => s.getActiveWorkspace().tree);
  const updateTree = useTerminalStore((s) => s.updateTree);

  const handleResize = useCallback(
    (splitNode: SplitNode) => (ratio: number) => {
      const newTree = updateRatio(tree, splitNode, ratio);
      updateTree(newTree);
    },
    [tree, updateTree]
  );

  if (node.type === 'terminal') {
    return <TerminalPane id={node.id} />;
  }

  const { direction, ratio, first, second } = node;
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        width: '100%',
        height: '100%',
      }}
    >
      <div style={{ flex: `0 0 calc(${ratio * 100}% - 2px)`, overflow: 'hidden' }}>
        <SplitContainer node={first} />
      </div>
      <Divider direction={direction} onResize={handleResize(node)} parentRef={containerRef} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <SplitContainer node={second} />
      </div>
    </div>
  );
};
