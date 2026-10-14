import React, { useEffect, useState } from 'react';
import { useTerminalStore } from '../state/terminal-store';
import {
  useSettingsStore, FONT_FAMILIES, MIN_FONT_SIZE, MAX_FONT_SIZE, CursorStyle, RightClickAction,
} from '../state/settings-store';
import { THEMES, ThemeId } from '../themes';
import type { AppInfo, PromptStyle, ShellId } from '../types/electron';
import { IconClose } from './Icons';
import { useModal } from '../hooks/useModal';

const PROMPT_STYLES: { value: PromptStyle; label: string; hint: string }[] = [
  { value: 'auto', label: 'Auto', hint: 'Your Void config (~/.void/config.toml) if present, else Spider' },
  { value: 'spider', label: 'Spider', hint: 'Green powerline prompt' },
  { value: 'cyberpunk', label: 'Void · Cyberpunk', hint: 'Void cyberpunk preset' },
  { value: 'hacker', label: 'Void · Hacker', hint: 'Void hacker preset (vivid)' },
  { value: 'minimal', label: 'Void · Minimal', hint: 'Path only' },
  { value: 'profile', label: 'My $PROFILE prompt', hint: 'Keep the prompt defined by your PowerShell profile' },
];

const Row: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '8px 0' }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{label}</div>
      {hint && <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{hint}</div>}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
  <button
    role="switch"
    aria-checked={value}
    onClick={() => onChange(!value)}
    style={{
      width: 34,
      height: 18,
      borderRadius: 9,
      border: 'none',
      background: value ? 'var(--green)' : 'var(--border)',
      position: 'relative',
      cursor: 'pointer',
      transition: 'background 0.15s',
      boxShadow: value ? '0 0 8px var(--green-glow)' : 'none',
    }}
  >
    <span style={{
      position: 'absolute',
      top: 3,
      left: value ? 19 : 3,
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: value ? 'var(--bg-primary)' : 'var(--text-secondary)',
      transition: 'left 0.15s',
    }} />
  </button>
);

function Select<T extends string | number>({ value, options, onChange, width = 200 }: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  width?: number;
}) {
  return (
    <select
      className="field"
      value={String(value)}
      onChange={(e) => {
        const opt = options.find((o) => String(o.value) === e.target.value);
        if (opt) onChange(opt.value);
      }}
      style={{ width, cursor: 'pointer' }}
    >
      {options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
    </select>
  );
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--green-dim)', marginBottom: 6 }}>{title}</div>
    {children}
  </div>
);

export const SettingsPanel: React.FC = () => {
  const isOpen = useTerminalStore((s) => s.settingsOpen);
  const toggle = useTerminalStore((s) => s.toggleSettings);
  const s = useSettingsStore();
  const [info, setInfo] = useState<AppInfo | null>(null);

  const panelRef = useModal<HTMLDivElement>(isOpen, toggle);

  useEffect(() => {
    if (isOpen && !info) window.electronAPI.getAppInfo().then(setInfo).catch(() => {});
  }, [isOpen, info]);

  if (!isOpen) return null;

  const themeEntries = Object.entries(THEMES) as [ThemeId, typeof THEMES[ThemeId]][];
  const shells: ShellId[] = info?.shells.length ? info.shells : ['powershell'];

  return (
    <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseDown={toggle}>
      <div
        ref={panelRef}
        tabIndex={-1}
        className="panel"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ outline: 'none', width: 620, maxWidth: 'calc(100vw - 40px)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', animation: 'slide-in-down 0.12s ease-out' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: 'var(--green)', textShadow: '0 0 8px var(--green-glow)' }}>SETTINGS</span>
          <button className="icon-btn danger" style={{ width: 26, height: 26 }} onClick={toggle} title="Close (Esc)">
            <IconClose />
          </button>
        </div>

        <div style={{ overflowY: 'auto' }}>
          <Section title="THEME">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '4px 0' }}>
              {themeEntries.map(([id, theme]) => {
                const isActive = id === s.theme;
                const t = theme.terminal;
                return (
                  <button
                    key={id}
                    onClick={() => s.update({ theme: id })}
                    style={{
                      background: t.background,
                      border: `1px solid ${isActive ? theme.ui.accent : 'var(--border)'}`,
                      boxShadow: isActive ? `0 0 10px ${theme.ui.accentGlow}` : 'none',
                      borderRadius: 5,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <div style={{ fontSize: 10, lineHeight: 1.5, whiteSpace: 'pre', color: t.foreground }}>
                      <span style={{ color: t.green }}>❯</span> ls{'\n'}
                      <span style={{ color: t.blue }}>src/</span> <span style={{ color: t.yellow }}>app</span> <span style={{ color: t.red }}>err</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: isActive ? theme.ui.accent : theme.ui.textSecondary }}>
                      {isActive ? '✓ ' : ''}{theme.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="TEXT & CURSOR">
            <Row label="Font">
              <Select value={s.fontFamily} options={FONT_FAMILIES} onChange={(fontFamily) => s.update({ fontFamily })} width={240} />
            </Row>
            <Row label="Font size" hint="Ctrl+= / Ctrl+- / Ctrl+0">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button className="btn" style={{ padding: '3px 10px' }} onClick={() => s.zoomFont(-1)} disabled={s.fontSize <= MIN_FONT_SIZE}>−</button>
                <span style={{ width: 36, textAlign: 'center', fontSize: 12 }}>{s.fontSize}px</span>
                <button className="btn" style={{ padding: '3px 10px' }} onClick={() => s.zoomFont(1)} disabled={s.fontSize >= MAX_FONT_SIZE}>+</button>
              </div>
            </Row>
            <Row label="Line height">
              <Select value={s.lineHeight} onChange={(lineHeight) => s.update({ lineHeight })} width={110}
                options={[1, 1.1, 1.15, 1.2, 1.3, 1.4].map((v) => ({ value: v, label: String(v) }))} />
            </Row>
            <Row label="Cursor">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Select<CursorStyle> value={s.cursorStyle} onChange={(cursorStyle) => s.update({ cursorStyle })} width={110}
                  options={[{ value: 'block', label: 'Block' }, { value: 'bar', label: 'Bar' }, { value: 'underline', label: 'Underline' }]} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Blink</span>
                <Toggle value={s.cursorBlink} onChange={(cursorBlink) => s.update({ cursorBlink })} />
              </div>
            </Row>
          </Section>

          <Section title="SHELL & PROMPT">
            <Row label="Shell" hint={shells.includes('pwsh') ? 'Applies to new terminals' : 'PowerShell 7 (pwsh) not found on PATH'}>
              <Select<ShellId> value={s.shell} onChange={(shell) => s.update({ shell })} width={200}
                options={shells.map((v) => ({ value: v, label: v === 'pwsh' ? 'PowerShell 7 (pwsh)' : 'Windows PowerShell' }))} />
            </Row>
            <Row label="Prompt style" hint={`${PROMPT_STYLES.find((p) => p.value === s.promptStyle)?.hint ?? ''} · applies to new terminals`}>
              <Select<PromptStyle> value={s.promptStyle} onChange={(promptStyle) => s.update({ promptStyle })} width={200}
                options={PROMPT_STYLES.map(({ value, label }) => ({ value, label }))} />
            </Row>
            <Row label="Scrollback" hint="Lines kept per terminal">
              <Select value={s.scrollback} onChange={(scrollback) => s.update({ scrollback })} width={110}
                options={[1000, 5000, 10000, 25000, 50000].map((v) => ({ value: v, label: v.toLocaleString() }))} />
            </Row>
          </Section>

          <Section title="BEHAVIOR">
            <Row label="Copy on select" hint="Selecting text copies it immediately">
              <Toggle value={s.copyOnSelect} onChange={(copyOnSelect) => s.update({ copyOnSelect })} />
            </Row>
            <Row label="Right-click">
              <Select<RightClickAction> value={s.rightClickAction} onChange={(rightClickAction) => s.update({ rightClickAction })} width={200}
                options={[{ value: 'menu', label: 'Show menu' }, { value: 'copyPaste', label: 'Copy / paste (conhost)' }]} />
            </Row>
            <Row label="Warn before multi-line paste" hint="Only when the program can't receive a safe paste">
              <Toggle value={s.warnMultilinePaste} onChange={(warnMultilinePaste) => s.update({ warnMultilinePaste })} />
            </Row>
            <Row label="Restore workspaces on startup" hint="Reopens layouts, tabs and folders">
              <Toggle value={s.restoreSession} onChange={(restoreSession) => s.update({ restoreSession })} />
            </Row>
            <Row label="Dim inactive panes">
              <Toggle value={s.dimInactivePanes} onChange={(dimInactivePanes) => s.update({ dimInactivePanes })} />
            </Row>
            <Row label="CRT effects" hint="Scanlines and vignette">
              <Toggle value={s.crtEffects} onChange={(crtEffects) => s.update({ crtEffects })} />
            </Row>
          </Section>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', fontSize: 11, color: 'var(--text-secondary)' }}>
            <span>PowerShell Spider {info ? `v${info.version}` : ''}</span>
            <button className="btn" onClick={() => s.reset()}>Reset to defaults</button>
          </div>
        </div>
      </div>
    </div>
  );
};
