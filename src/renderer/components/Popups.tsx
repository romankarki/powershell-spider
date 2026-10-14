import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTerminalStore } from '../state/terminal-store';
import { copySelection, pasteClipboard, selectAll, clearTerminal, hasSelection, focusTerminal } from '../terminal/registry';
import { KeyCombo } from './KeyCombo';

/** Right-click menu for a terminal. */
export const ContextMenu: React.FC = () => {
  const menu = useTerminalStore((s) => s.contextMenu);
  const close = () => useTerminalStore.getState().openContextMenu(null);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // Keep the menu inside the window
  useLayoutEffect(() => {
    if (!menu || !ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    setPos({
      x: Math.min(menu.x, window.innerWidth - width - 6),
      y: Math.min(menu.y, window.innerHeight - height - 6),
    });
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        focusTerminal(menu.terminalId);
      }
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('blur', close);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('blur', close);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  if (!menu) return null;
  const id = menu.terminalId;
  const store = useTerminalStore.getState();
  const isQuick = id === store.quickTerminalId;
  const selected = hasSelection(id);

  const run = (fn: () => void) => () => {
    close();
    fn();
    focusTerminal(id);
  };

  const items: ({ label: string; combo?: string; action: () => void; disabled?: boolean } | 'sep')[] = [
    { label: 'Copy', combo: 'Ctrl+C', action: () => { copySelection(id, { clear: true }); }, disabled: !selected },
    { label: 'Paste', combo: 'Ctrl+V', action: () => { pasteClipboard(id); } },
    { label: 'Select All', action: () => selectAll(id) },
    { label: 'Clear Terminal', combo: 'Ctrl+Shift+K', action: () => clearTerminal(id) },
    { label: 'Find…', combo: 'Ctrl+Shift+F', action: () => store.toggleSearch(), disabled: isQuick },
  ];
  if (!isQuick) {
    items.push(
      'sep',
      { label: 'New Tab', combo: 'Ctrl+D', action: () => store.addTabToPane(store.getActiveTerminalId()) },
      { label: 'Split Right', combo: 'Ctrl+Shift+H', action: () => store.splitTerminal('horizontal') },
      { label: 'Split Down', combo: 'Ctrl+Shift+B', action: () => store.splitTerminal('vertical') },
      'sep',
      { label: 'Close Tab', combo: 'Ctrl+W', action: () => store.closeActiveTab() },
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100 }} onMouseDown={close} onContextMenu={(e) => { e.preventDefault(); close(); }}>
      <div
        ref={ref}
        className="panel"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: pos.x || menu.x,
          top: pos.y || menu.y,
          minWidth: 220,
          padding: 4,
          animation: 'fade-in 0.06s ease-out',
        }}
      >
        {items.map((item, i) => item === 'sep'
          ? <div key={`sep${i}`} className="menu-sep" />
          : (
            <button key={item.label} className="menu-item" disabled={item.disabled} onClick={run(item.action)}>
              <span>{item.label}</span>
              {item.combo && <KeyCombo combo={item.combo} />}
            </button>
          ))}
      </div>
    </div>
  );
};

/** Transient notifications in the bottom-right corner. */
export const Toasts: React.FC = () => {
  const toasts = useTerminalStore((s) => s.toasts);
  return (
    <div style={{ position: 'fixed', right: 16, bottom: 36, zIndex: 1200, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none' }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="panel"
          style={{
            padding: '8px 14px',
            fontSize: 12,
            borderColor: 'var(--green-dim)',
            borderLeft: '3px solid var(--green)',
            animation: 'slide-in-up 0.12s ease-out',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
};

/** Modal confirmation (e.g. multi-line paste). */
export const ConfirmDialog: React.FC = () => {
  const dialog = useTerminalStore((s) => s.dialog);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (dialog) requestAnimationFrame(() => confirmRef.current?.focus());
  }, [dialog]);

  if (!dialog) return null;

  return (
    <div
      className="overlay"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1150 }}
      onMouseDown={() => dialog.resolve(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          dialog.resolve(false);
        }
      }}
    >
      <div className="panel" onMouseDown={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: 'calc(100vw - 40px)', padding: 18, animation: 'slide-in-down 0.1s ease-out' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--yellow)', marginBottom: 8 }}>{dialog.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{dialog.message}</div>
        {dialog.detail && (
          <pre style={{
            marginTop: 12,
            padding: '8px 10px',
            maxHeight: 140,
            overflow: 'auto',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {dialog.detail}
          </pre>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="btn" onClick={() => dialog.resolve(false)}>Cancel</button>
          <button ref={confirmRef} className="btn primary" onClick={() => dialog.resolve(true)}>{dialog.confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};
