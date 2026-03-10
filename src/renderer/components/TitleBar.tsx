import React, { useState, useEffect } from 'react';

export const TitleBar: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString('en-US', { hour12: false });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '34px',
        background: 'linear-gradient(90deg, var(--bg-secondary), var(--bg-primary), var(--bg-secondary))',
        borderBottom: '1px solid var(--border)',
        // @ts-expect-error Electron-specific CSS property
        WebkitAppRegion: 'drag',
        userSelect: 'none',
        padding: '0 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          color: 'var(--green)',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '2px',
          textShadow: '0 0 10px var(--green-glow), 0 0 20px rgba(0, 255, 65, 0.15)',
          animation: 'flicker 8s infinite',
        }}>
          /\../\
        </span>
        <span style={{
          color: 'var(--green)',
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '2px',
          textShadow: '0 0 10px var(--green-glow)',
        }}>
          SPIDER
        </span>
        <span style={{
          color: 'var(--text-secondary)',
          fontSize: '10px',
          letterSpacing: '1px',
          opacity: 0.6,
        }}>
          PS TERMINAL MANAGER
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          color: 'var(--green-dim)',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '1px',
          opacity: 0.7,
        }}>
          {timeStr}
        </span>

        {/* @ts-expect-error Electron-specific CSS property */}
        <div style={{ display: 'flex', gap: '2px', WebkitAppRegion: 'no-drag' }}>
          <button onClick={() => window.electronAPI.minimize()} className="title-btn">
            <span style={{ fontSize: '16px', lineHeight: 1 }}>&#x2500;</span>
          </button>
          <button onClick={() => window.electronAPI.maximize()} className="title-btn">
            <span style={{ fontSize: '11px' }}>&#x25A1;</span>
          </button>
          <button onClick={() => window.electronAPI.close()} className="title-btn title-btn-close">
            <span style={{ fontSize: '12px' }}>&#x2715;</span>
          </button>
        </div>
      </div>

      <style>{`
        .title-btn {
          width: 38px;
          height: 26px;
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
          transition: all 0.15s ease;
        }
        .title-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .title-btn-close:hover {
          background: var(--red);
          color: white;
          box-shadow: 0 0 8px rgba(255, 0, 64, 0.4);
        }
      `}</style>
    </div>
  );
};
