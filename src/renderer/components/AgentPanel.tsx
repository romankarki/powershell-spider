import React, { useState } from 'react';
import { useTerminalStore } from '../state/terminal-store';
import { findAllTerminalIds } from '../state/split-tree';

export const AgentPanel: React.FC = () => {
  const workspace = useTerminalStore((s) => s.getActiveWorkspace());
  const terminals = useTerminalStore((s) => s.terminals);
  const paneGroups = useTerminalStore((s) => s.paneGroups);
  // Expand pane IDs to all terminal IDs across all pane groups
  const paneIds = findAllTerminalIds(workspace.tree);
  const allIds = paneIds.flatMap((paneId) => {
    const group = paneGroups.get(paneId);
    return group ? group.tabIds : [paneId];
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [command, setCommand] = useState('');
  const [sequenceMode, setSequenceMode] = useState(false);
  const [delay, setDelay] = useState(500);
  const [history, setHistory] = useState<string[]>([]);

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

    setHistory((prev) => [command, ...prev.slice(0, 19)]);

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
        width: '300px',
        height: '100%',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--cyan-dim)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        boxShadow: '-4px 0 20px rgba(0, 229, 255, 0.08)',
        animation: 'slide-in-right 0.1s ease-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          fontSize: '12px',
          color: 'var(--cyan)',
          fontWeight: 700,
          letterSpacing: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.08), transparent)',
        }}
      >
        <span style={{ fontSize: '14px' }}>&#9881;</span>
        AGENT CONTROL
        <span style={{
          marginLeft: 'auto',
          fontSize: '9px',
          color: 'var(--green)',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}>
          &#9679; ONLINE
        </span>
      </div>

      {/* Terminal selection */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
            TARGETS [{selectedIds.size}/{allIds.length}]
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span
              onClick={selectAll}
              style={{ fontSize: '10px', color: 'var(--cyan-dim)', cursor: 'pointer', letterSpacing: '0.5px' }}
            >
              ALL
            </span>
            <span
              onClick={selectNone}
              style={{ fontSize: '10px', color: 'var(--cyan-dim)', cursor: 'pointer', letterSpacing: '0.5px' }}
            >
              NONE
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
                padding: '5px 8px',
                cursor: 'pointer',
                borderRadius: '3px',
                background: isSelected ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                marginBottom: '2px',
                border: `1px solid ${isSelected ? 'rgba(0, 229, 255, 0.2)' : 'transparent'}`,
                transition: 'all 0.15s ease',
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
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 6px var(--cyan-glow)' : 'none',
                }}
              >
                {isSelected && '\u2713'}
              </div>
              <span style={{
                fontSize: '11px',
                color: isSelected ? 'var(--cyan)' : 'var(--text-secondary)',
                fontWeight: isSelected ? 500 : 400,
              }}>
                {label}
              </span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '8px',
                color: 'var(--text-secondary)',
                opacity: 0.4,
              }}>
                {id.slice(0, 6)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sequence mode toggle */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          onClick={() => setSequenceMode(!sequenceMode)}
          style={{
            width: '30px',
            height: '16px',
            borderRadius: '8px',
            background: sequenceMode ? 'var(--cyan)' : 'var(--border)',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: sequenceMode ? '0 0 8px var(--cyan-glow)' : 'none',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'var(--text-primary)',
              position: 'absolute',
              top: '2px',
              left: sequenceMode ? '16px' : '2px',
              transition: 'left 0.2s',
            }}
          />
        </div>
        <span style={{ fontSize: '10px', color: sequenceMode ? 'var(--cyan)' : 'var(--text-secondary)', letterSpacing: '1px' }}>
          SEQ MODE
        </span>
        {sequenceMode && (
          <>
            <input
              type="number"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              style={{
                width: '50px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--cyan)',
                fontFamily: 'inherit',
                fontSize: '10px',
                padding: '2px 4px',
                borderRadius: '2px',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>ms</span>
          </>
        )}
      </div>

      {/* Command input */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 14px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '1px' }}>
          COMMAND {sequenceMode && '(LINE-BY-LINE)'}
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
          placeholder="> enter command..."
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
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--cyan-dim)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          onClick={sendCommand}
          disabled={!command.trim() || selectedIds.size === 0}
          style={{
            marginTop: '8px',
            padding: '8px 14px',
            background: selectedIds.size > 0 && command.trim()
              ? 'linear-gradient(90deg, var(--cyan-dim), var(--cyan))'
              : 'var(--border)',
            color: selectedIds.size > 0 && command.trim() ? 'var(--bg-primary)' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '3px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: selectedIds.size > 0 && command.trim() ? 'pointer' : 'not-allowed',
            letterSpacing: '2px',
            transition: 'all 0.15s ease',
            boxShadow: selectedIds.size > 0 && command.trim()
              ? '0 0 12px var(--cyan-glow)'
              : 'none',
          }}
        >
          EXECUTE [{selectedIds.size}]
        </button>

        {/* Command history */}
        {history.length > 0 && (
          <div style={{ marginTop: '10px', maxHeight: '100px', overflow: 'auto' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
              HISTORY
            </span>
            {history.slice(0, 5).map((cmd, i) => (
              <div
                key={i}
                onClick={() => setCommand(cmd)}
                style={{
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                  padding: '3px 6px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {'>'} {cmd}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
