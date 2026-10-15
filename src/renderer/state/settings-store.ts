import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeId, DEFAULT_THEME, THEMES } from '../themes';
import type { ShellId, PromptStyle } from '../types/electron';

export type CursorStyle = 'block' | 'bar' | 'underline';
export type RightClickAction = 'menu' | 'copyPaste';

export const FONT_FAMILIES: { label: string; value: string }[] = [
  {
    label: 'Auto (Nerd Font if installed)',
    value: "'JetBrainsMono Nerd Font', 'CaskaydiaCove Nerd Font', 'MesloLGLDZ Nerd Font Mono', 'MesloLGS Nerd Font', 'Hack Nerd Font', 'FiraCode Nerd Font', '0xProto Nerd Font Mono', 'Cascadia Mono', 'Cascadia Code', 'Consolas', monospace",
  },
  { label: 'Cascadia Mono', value: "'Cascadia Mono', 'Cascadia Code', 'Consolas', monospace" },
  { label: 'Consolas', value: "'Consolas', monospace" },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', 'JetBrainsMono Nerd Font', 'Consolas', monospace" },
  { label: 'Fira Code', value: "'Fira Code', 'FiraCode Nerd Font', 'Consolas', monospace" },
];

export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 32;
export const DEFAULT_FONT_SIZE = 14;

export interface Settings {
  theme: ThemeId;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  cursorStyle: CursorStyle;
  cursorBlink: boolean;
  scrollback: number;
  copyOnSelect: boolean;
  rightClickAction: RightClickAction;
  warnMultilinePaste: boolean;
  crtEffects: boolean;
  dimInactivePanes: boolean;
  restoreSession: boolean;
  ambience: boolean;
  swipeWorkspaces: boolean;
  shell: ShellId;
  promptStyle: PromptStyle;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: DEFAULT_THEME,
  fontFamily: FONT_FAMILIES[0].value,
  fontSize: DEFAULT_FONT_SIZE,
  lineHeight: 1.15,
  cursorStyle: 'block',
  cursorBlink: true,
  scrollback: 10000,
  copyOnSelect: false,
  rightClickAction: 'menu',
  warnMultilinePaste: true,
  crtEffects: true,
  dimInactivePanes: true,
  restoreSession: true,
  ambience: true,
  swipeWorkspaces: true,
  shell: 'powershell',
  promptStyle: 'auto',
  sidebarCollapsed: false,
  sidebarWidth: 220,
};

interface SettingsStore extends Settings {
  update: (patch: Partial<Settings>) => void;
  zoomFont: (delta: number) => void;
  resetFont: () => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
      zoomFont: (delta) => set((s) => ({
        fontSize: Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, s.fontSize + delta)),
      })),
      resetFont: () => set({ fontSize: DEFAULT_FONT_SIZE }),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'spider-settings',
      version: 2,
      // v2: the default theme changed from Spider to Ghostty; move settings that
      // still have the old default along (only the theme, nothing else).
      migrate: (persisted, version) => {
        const s = persisted as Partial<Settings>;
        if (version < 2 && s.theme === 'spider') s.theme = 'ghostty';
        return s;
      },
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<Settings>) };
        // Guard against stale values from older versions
        if (!(merged.theme in THEMES)) merged.theme = DEFAULT_THEME;
        return merged;
      },
    }
  )
);

export function getSettings(): Settings {
  return useSettingsStore.getState();
}
