import React, { useRef, useCallback } from 'react';
import { TreeNode } from '../types';
import { TerminalPane } from './TerminalPane';
import { Divider } from './Divider';
import { useTerminalStore } from '../state/terminal-store';
import { updateRatioAtPath } from '../state/split-tree';

interface SplitContainerProps {
  node: TreeNode;
  multiPane: boolean;
  path?: string; // location of this node in the tree ('f'/'s' steps from the root)
}

export const SplitContainer: React.FC<SplitContainerProps> = ({ node, multiPane, path = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const updateTree = useTerminalStore((s) => s.updateTree);

  const handleResize = useCallback(
    (ratio: number) => {
      // Address the split by path: node objects are replaced on every update
      const tree = useTerminalStore.getState().getActiveWorkspace().tree;
      updateTree(updateRatioAtPath(tree, path, ratio));
    },
    [updateTree, path]
  );

  if (node.type === 'terminal') {
    return <TerminalPane id={node.id} multiPane={multiPane} />;
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
      <div style={{ flex: `0 0 calc(${ratio * 100}% - 0.5px)`, overflow: 'hidden', minWidth: 0, minHeight: 0 }}>
        <SplitContainer node={first} multiPane={multiPane} path={path + 'f'} />
      </div>
      <Divider direction={direction} onResize={handleResize} parentRef={containerRef} />
      <div style={{ flex: 1, overflow: 'hidden', minWidth: 0, minHeight: 0 }}>
        <SplitContainer node={second} multiPane={multiPane} path={path + 's'} />
      </div>
    </div>
  );
};

/** Root of a workspace's pane layout; renders only the zoomed pane when one is zoomed. */
export const WorkspaceView: React.FC = () => {
  const tree = useTerminalStore((s) => s.getActiveWorkspace().tree);
  const zoomedPaneId = useTerminalStore((s) => s.getActiveWorkspace().zoomedPaneId);

  if (zoomedPaneId) {
    return <TerminalPane id={zoomedPaneId} multiPane={false} />;
  }
  return <SplitContainer node={tree} multiPane={tree.type === 'split'} />;
};
