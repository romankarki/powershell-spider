import React, { useCallback, useState } from 'react';
import { SplitDirection } from '../types';

interface DividerProps {
  direction: SplitDirection;
  onResize: (ratio: number) => void;
  parentRef: React.RefObject<HTMLDivElement | null>;
}

export const Divider: React.FC<DividerProps> = ({ direction, onResize, parentRef }) => {
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const parent = parentRef.current;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      setDragging(true);

      const onMouseMove = (ev: MouseEvent) => {
        const ratio = direction === 'horizontal'
          ? (ev.clientX - rect.left) / rect.width
          : (ev.clientY - rect.top) / rect.height;
        onResize(Math.max(0.1, Math.min(0.9, ratio)));
      };

      const onMouseUp = () => {
        setDragging(false);
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

  // Double-click resets to an even split
  return (
    <div
      className={`divider divider-${direction} ${dragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={() => onResize(0.5)}
    />
  );
};
