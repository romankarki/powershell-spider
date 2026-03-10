import React, { useCallback, useRef } from 'react';
import { SplitDirection } from '../types';

interface DividerProps {
  direction: SplitDirection;
  onResize: (ratio: number) => void;
  parentRef: React.RefObject<HTMLDivElement | null>;
}

export const Divider: React.FC<DividerProps> = ({ direction, onResize, parentRef }) => {
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;

      const parent = parentRef.current;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;

        let ratio: number;
        if (direction === 'horizontal') {
          ratio = (e.clientX - rect.left) / rect.width;
        } else {
          ratio = (e.clientY - rect.top) / rect.height;
        }

        onResize(Math.max(0.1, Math.min(0.9, ratio)));
      };

      const onMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [direction, onResize, parentRef]
  );

  return (
    <div
      className={`divider divider-${direction}`}
      onMouseDown={handleMouseDown}
      style={{
        position: 'relative',
        flexShrink: 0,
        background: 'var(--border)',
        zIndex: 10,
        ...(direction === 'horizontal'
          ? { width: '4px', cursor: 'col-resize' }
          : { height: '4px', cursor: 'row-resize' }),
      }}
    >
      <div
        style={{
          position: 'absolute',
          ...(direction === 'horizontal'
            ? { top: 0, bottom: 0, left: '-2px', right: '-2px' }
            : { left: 0, right: 0, top: '-2px', bottom: '-2px' }),
        }}
      />
    </div>
  );
};
