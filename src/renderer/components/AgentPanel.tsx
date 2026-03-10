import React, { useState } from 'react';
import { useTerminalStore } from '../state/terminal-store';
import { findAllTerminalIds } from '../state/split-tree';

export const AgentPanel: React.FC = () => {
  const workspace = useTerminalStore((s) => s.getActiveWorkspace());
  const terminals = useTerminalStore((s) => s.terminals);
  const allIds = findAllTerminalIds(workspace.tree);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [command, setCommand] = useState('');
  const [sequenceMode, setSequenceMode] = useState(false);
  const [delay, setDelay] = useState(500);

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(allIds));
  const selectNone = () => setSelectedIds(new Set());

  const sendCommand = async () => {
    if (!command.trim() || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);

    const lines = command.split('\n').filter((l) => l.trim());

    if (sequenceMode && lines.length > 1) {
      for (const line of lines) {
        window.electronAPI.writeAll(ids, line + '\r');
        await new Promise((r) => setTimeout(r, delay));
      }
    } else {
      window.electronAPI.writeAll(ids, command + '\r');
    }
    setCommand('');
  };

  return (
    <div
      style={{
        width: '280px',
        height: '100%',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--cyan-dim)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        boxShadow: '-4px 0 16px rgba(0, 229, 255, 0.05)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          fontSize: '12px',
          color: 'var(--cyan)',
          fontWeight: 700,
          letterSpacing: '1px',
        }}
      >
        AGENT CONTROL
      </div>

      {/* Terminal selection */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>TARGETS</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span
              onClick={selectAll}
              style={{ fontSize: '10px', color: 'var(--cyan-dim)', cursor: 'pointer' }}
            >
              all
            </span>
            <span
              onClick={selectNone}
              style={{ fontSize: '10px', color: 'var(--cyan-dim)', cursor: 'pointer' }}
            >
              none
            </span>
          </div>
        </div>
        {allIds.map((id) => {
          const info = terminals.get(id);
          const label = info?.label || id.slice(0, 8);
          const isSelected = selectedIds.has(id);
          return (
            <div
              key={id}
              onClick={() => toggleId(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                cursor: 'pointer',
                borderRadius: '3px',
                background: isSelected ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                marginBottom: '2px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  border: `1px solid ${isSelected ? 'var(--cyan)' : 'var(--border)'}`,
                  borderRadius: '2px',
                  background: isSelected ? 'var(--cyan)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  color: 'var(--bg-primary)',
                }}
              >
                {isSelected && '✓'}
              </div>
              <span style={{ fontSize: '11px', color: isSelected ? 'var(--cyan)' : 'var(--text-secondary)' }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sequence mode toggle */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          onClick={() => setSequenceMode(!sequenceMode)}
          style={{
            width: '28px',
            height: '14px',
            borderRadius: '7px',
            background: sequenceMode ? 'var(--cyan)' : 'var(--border)',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--text-primary)',
              position: 'absolute',
              top: '2px',
              left: sequenceMode ? '16px' : '2px',
              transition: 'left 0.2s',
            }}
          />
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>SEQUENCE</span>
        {sequenceMode && (
          <input
            type="number"
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            style={{
              width: '50px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '10px',
              padding: '2px 4px',
              borderRadius: '2px',
              outline: 'none',
            }}
          />
        )}
        {sequenceMode && (
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>ms</span>
        )}
      </div>

      {/* Command input */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 12px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          COMMAND {sequenceMode && '(one per line)'}
        </span>
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !sequenceMode) {
              e.preventDefault();
              sendCommand();
            }
            if (e.key === 'Enter' && e.ctrlKey) {
              e.preventDefault();
              sendCommand();
            }
          }}
          placeholder="Enter command..."
          style={{
            flex: 1,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            color: 'var(--green)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            padding: '8px',
            borderRadius: '3px',
            resize: 'none',
            outline: 'none',
            minHeight: '60px',
          }}
        />
        <button
          onClick={sendCommand}
          disabled={!command.trim() || selectedIds.size === 0}
          style={{
            marginTop: '8px',
            padding: '6px 12px',
            background: selectedIds.size > 0 && command.trim() ? 'var(--cyan)' : 'var(--border)',
            color: selectedIds.size > 0 && command.trim() ? 'var(--bg-primary)' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '3px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: selectedIds.size > 0 && command.trim() ? 'pointer' : 'not-allowed',
            letterSpacing: '1px',
          }}
        >
          EXECUTE ({selectedIds.size})
        </button>
      </div>
    </div>
  );
};
