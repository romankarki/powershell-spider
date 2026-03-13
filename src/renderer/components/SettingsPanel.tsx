import React from 'react';
import { useTerminalStore } from '../state/terminal-store';
import { THEMES, ThemeId } from '../themes';

export const SettingsPanel: React.FC = () => {
  const isOpen = useTerminalStore((s) => s.settingsOpen);
  const toggle = useTerminalStore((s) => s.toggleSettings);
  const currentTheme = useTerminalStore((s) => s.currentTheme);
  const setTheme = useTerminalStore((s) => s.setTheme);

  if (!isOpen) return null;

  const themeEntries = Object.entries(THEMES) as [ThemeId, typeof THEMES[ThemeId]][];

  return (
    <div style={styles.overlay} onClick={toggle}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.headerTitle}>SETTINGS</span>
          <button
            onClick={toggle}
            style={styles.closeBtn}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            &#x2715;
          </button>
        </div>

        {/* Theme section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>THEME</div>
          <div style={styles.themeGrid}>
            {themeEntries.map(([id, theme]) => {
              const isActive = id === currentTheme;
              return (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  style={{
                    ...styles.themeCard,
                    borderColor: isActive ? theme.ui.accent : 'var(--border)',
                    boxShadow: isActive ? `0 0 12px ${theme.ui.accentGlow}` : 'none',
                  }}
                >
                  {/* Color preview bar */}
                  <div style={styles.previewRow}>
                    <div style={{ ...styles.colorDot, background: theme.terminal.background as string }} />
                    <div style={{ ...styles.colorDot, background: theme.terminal.red as string }} />
                    <div style={{ ...styles.colorDot, background: theme.terminal.green as string }} />
                    <div style={{ ...styles.colorDot, background: theme.terminal.yellow as string }} />
                    <div style={{ ...styles.colorDot, background: theme.terminal.blue as string }} />
                    <div style={{ ...styles.colorDot, background: theme.terminal.magenta as string }} />
                    <div style={{ ...styles.colorDot, background: theme.terminal.cyan as string }} />
                  </div>
                  {/* Terminal preview */}
                  <div style={{
                    ...styles.termPreview,
                    background: theme.terminal.background as string,
                    color: theme.terminal.foreground as string,
                  }}>
                    <span style={{ color: theme.terminal.green as string }}>$</span>
                    {' '}
                    <span style={{ color: theme.terminal.foreground as string }}>ls -la</span>
                    {'\n'}
                    <span style={{ color: theme.terminal.blue as string }}>src/</span>
                    {'  '}
                    <span style={{ color: theme.terminal.yellow as string }}>README</span>
                    {'  '}
                    <span style={{ color: theme.terminal.red as string }}>error</span>
                  </div>
                  {/* Name */}
                  <div style={{
                    ...styles.themeName,
                    color: isActive ? theme.ui.accent : 'var(--text-secondary)',
                  }}>
                    {isActive && <span style={styles.checkmark}>&#10003; </span>}
                    {theme.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(2px)',
  },
  panel: {
    width: 520,
    maxHeight: '80vh',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    animation: 'slide-in-down 0.15s ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid var(--border)',
  },
  headerTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 2,
    color: 'var(--green)',
    textShadow: '0 0 8px var(--green-glow)',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    padding: '2px 4px',
    transition: 'color 0.1s',
  },
  section: {
    padding: '16px 18px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 1.5,
    color: 'var(--text-secondary)',
    marginBottom: 12,
  },
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  themeCard: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: 10,
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'left' as const,
  },
  previewRow: {
    display: 'flex',
    gap: 4,
    marginBottom: 8,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 3,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  termPreview: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    lineHeight: 1.4,
    padding: '6px 8px',
    borderRadius: 3,
    marginBottom: 8,
    whiteSpace: 'pre' as const,
    overflow: 'hidden',
  },
  themeName: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  checkmark: {
    fontSize: 11,
  },
};
