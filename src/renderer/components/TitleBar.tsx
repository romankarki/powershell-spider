import React from 'react';

export const TitleBar: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '32px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        WebkitAppRegion: 'drag' as never,
        userSelect: 'none',
        padding: '0 8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '13px', letterSpacing: '1px' }}>
          {'>'}_SPIDER
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
          PowerShell Terminal Manager
        </span>
      </div>
      <div style={{ display: 'flex', gap: '4px', WebkitAppRegion: 'no-drag' as never }}>
        <button onClick={() => window.electronAPI.minimize()} className="title-btn">
          ─
        </button>
        <button onClick={() => window.electronAPI.maximize()} className="title-btn">
          □
        </button>
        <button onClick={() => window.electronAPI.close()} className="title-btn title-btn-close">
          ✕
        </button>
      </div>
      <style>{`
        .title-btn {
          width: 36px;
          height: 24px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          font-family: var(--font-mono);
        }
        .title-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .title-btn-close:hover {
          background: var(--red);
          color: white;
        }
      `}</style>
    </div>
  );
};
