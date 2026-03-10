import React, { useRef, useState } from 'react';
import { useTerminal } from '../hooks/useTerminal';
import { useTerminalStore } from '../state/terminal-store';

interface TerminalPaneProps {
  id: string;
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({ id }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeId = useTerminalStore((s) => s.getActiveWorkspace().activeTerminalId);
  const setActive = useTerminalStore((s) => s.setActiveTerminal);
  const terminals = useTerminalStore((s) => s.terminals);
  const renameTerminal = useTerminalStore((s) => s.renameTerminal);
  const isActive = activeId === id;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const termInfo = terminals.get(id);
  useTerminal(id, containerRef, isActive, () => setActive(id), termInfo?.cwd);

  const label = termInfo?.label || id.slice(0, 8);

  const handleDoubleClick = () => {
    setEditValue(label);
    setIsEditing(true);
  };

  const commitRename = () => {
    if (editValue.trim()) {
      renameTerminal(id, editValue.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`terminal-pane ${isActive ? 'active' : ''}`}
      onClick={() => setActive(id)}
    >
      <div className="terminal-header">
        {isEditing ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            style={{
              background: 'transparent',
              border: '1px solid var(--green)',
              color: 'var(--green)',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              outline: 'none',
              padding: '0 4px',
              width: '120px',
            }}
          />
        ) : (
          <span className="terminal-label" onDoubleClick={handleDoubleClick}>
            {label}
          </span>
        )}
        <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
          {id.slice(0, 8)}
        </span>
      </div>
      <div className="terminal-body" ref={containerRef} />
    </div>
  );
};
