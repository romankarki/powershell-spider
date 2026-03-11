import React, { useRef, useEffect, useState } from 'react';
import { useTerminal } from '../hooks/useTerminal';
import { useTerminalStore } from '../state/terminal-store';

export const QuickTerminal: React.FC = () => {
  const isOpen = useTerminalStore((s) => s.quickTerminalOpen);
  const terminalId = useTerminalStore((s) => s.quickTerminalId);
  const toggle = useTerminalStore((s) => s.toggleQuickTerminal);
  const containerRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  // Track visible state separately for animation
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      // Small delay so the DOM mounts before animation starts
      requestAnimationFrame(() => setVisible(true));
    } else if (visible) {
      // Trigger close animation
      setClosing(true);
      setVisible(false);
      const timer = setTimeout(() => setClosing(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleBackdropClick = () => {
    toggle();
  };

  if (!isOpen && !closing) return null;
  if (!terminalId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: visible ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
          transition: 'background 0.2s ease',
        }}
      />
      {/* Dropdown terminal */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '45vh',
          zIndex: 51,
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          borderBottom: '2px solid var(--green-dim)',
          boxShadow: '0 4px 24px rgba(0, 255, 65, 0.15), 0 0 1px var(--green)',
        }}
      >
        {/* Header bar */}
        <div style={{
          height: 28,
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              color: 'var(--green)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              textShadow: '0 0 8px var(--green-glow)',
              letterSpacing: 1,
            }}>
              QUICK TERMINAL
            </span>
            <span style={{
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
            }}>
              Ctrl+`
            </span>
          </div>
          <button
            onClick={toggle}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              lineHeight: 1,
              padding: '2px 4px',
              transition: 'color 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--red)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            &#x25B2;
          </button>
        </div>
        {/* Terminal body */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            background: 'var(--bg-primary)',
            overflow: 'hidden',
          }}
        />
        <QuickTerminalMount
          id={terminalId}
          containerRef={containerRef}
          isOpen={isOpen}
        />
      </div>
    </>
  );
};

/** Inner component that handles the useTerminal hook lifecycle */
const QuickTerminalMount: React.FC<{
  id: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
}> = ({ id, containerRef, isOpen }) => {
  // We always mount the terminal, but only focus when open
  useTerminal(id, containerRef, isOpen, () => {});
  return null;
};
