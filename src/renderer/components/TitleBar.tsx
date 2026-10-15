import React, { useEffect, useState } from 'react';
import { useTerminalStore } from '../state/terminal-store';
import { useSettingsStore } from '../state/settings-store';
import { THEMES, getFlavor } from '../themes';
import { IconMinimize, IconMaximize, IconRestore, IconClose, IconSearch, IconSidebar } from './Icons';

const drag = { WebkitAppRegion: 'drag' } as React.CSSProperties;
const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;

export const TitleBar: React.FC = () => {
  const [maximized, setMaximized] = useState(false);
  const workspaceName = useTerminalStore((s) => s.getActiveWorkspace().name);
  const togglePalette = useTerminalStore((s) => s.toggleCommandPalette);
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const updateSettings = useSettingsStore((s) => s.update);
  const logo = useSettingsStore((s) => THEMES[s.theme]?.logo ?? '/\\../\\');
  const tagline = useSettingsStore((s) => getFlavor(s.theme).tagline);

  useEffect(() => {
    window.electronAPI.isMaximized().then(setMaximized);
    return window.electronAPI.onWindowState((s) => setMaximized(s.maximized));
  }, []);

  return (
    <div className="titlebar" style={drag}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        <button
          className={`icon-btn ${sidebarCollapsed ? '' : 'active'}`}
          style={{ ...noDrag, width: 28, height: 24, marginLeft: 4 }}
          onClick={() => updateSettings({ sidebarCollapsed: !sidebarCollapsed })}
          title="Toggle sidebar (Ctrl+Shift+E)"
        >
          <IconSidebar size={15} />
        </button>
        <span className="titlebar-logo">{logo}</span>
        <span className="titlebar-name">SPIDER</span>
        <span className="titlebar-ws">{workspaceName}</span>
        {tagline && <span className="titlebar-tagline">{tagline}</span>}
      </div>

      <button
        className="titlebar-search"
        style={noDrag}
        onClick={togglePalette}
        title="Command palette"
      >
        <IconSearch size={12} />
        <span style={{ flex: 1, textAlign: 'left' }}>Search commands…</span>
        <span className="kbd"><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>P</kbd></span>
      </button>

      <div style={{ display: 'flex', justifyContent: 'flex-end', flex: 1, height: '100%' }}>
        <div style={{ display: 'flex', height: '100%', ...noDrag }}>
          <button className="win-btn" onClick={() => window.electronAPI.minimize()} title="Minimize">
            <IconMinimize size={14} />
          </button>
          <button className="win-btn" onClick={() => window.electronAPI.maximize()} title={maximized ? 'Restore' : 'Maximize'}>
            {maximized ? <IconRestore size={13} /> : <IconMaximize size={12} />}
          </button>
          <button className="win-btn win-close" onClick={() => window.electronAPI.close()} title="Close">
            <IconClose size={14} />
          </button>
        </div>
      </div>

      <style>{`
        .titlebar {
          display: flex;
          align-items: center;
          height: 36px;
          flex-shrink: 0;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          user-select: none;
        }
        .titlebar-logo {
          white-space: nowrap;
          color: var(--green);
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 1px;
          text-shadow: 0 0 10px var(--green-glow);
        }
        .titlebar-name {
          color: var(--green);
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 3px;
          text-shadow: 0 0 10px var(--green-glow);
        }
        .titlebar-ws {
          color: var(--text-secondary);
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding-left: 10px;
          border-left: 1px solid var(--border);
        }
        .titlebar-tagline {
          color: var(--text-secondary);
          font-size: 11px;
          font-style: italic;
          opacity: 0.7;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        @media (max-width: 1150px) { .titlebar-tagline { display: none; } }
        .titlebar-search {
          display: flex;
          align-items: center;
          gap: 8px;
          width: min(420px, 40vw);
          height: 24px;
          padding: 0 6px 0 10px;
          border-radius: 5px;
          border: 1px solid var(--border);
          background: var(--bg-primary);
          color: var(--text-secondary);
          font-size: 11px;
          cursor: pointer;
          transition: border-color 0.12s, color 0.12s;
        }
        .titlebar-search:hover {
          border-color: var(--green-dim);
          color: var(--text-primary);
        }
        .titlebar-search .kbd kbd {
          padding: 0 4px;
          font-size: 9px;
          line-height: 13px;
        }
        .win-btn {
          width: 46px;
          height: 100%;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.12s, color 0.12s;
        }
        .win-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .win-close:hover {
          background: #e81123;
          color: #fff;
        }
      `}</style>
    </div>
  );
};
