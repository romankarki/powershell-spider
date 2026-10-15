import type { ITheme } from '@xterm/xterm';

export interface SpiderTheme {
  name: string;
  /** Title-bar logo; defaults to the spider */
  logo?: string;
  terminal: ITheme;
  ui: {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    accent: string;
    accentDim: string;
    accentGlow: string;
    border: string;
    borderActive: string;
    textPrimary: string;
    textSecondary: string;
  };
}

export const THEMES: Record<string, SpiderTheme> = {
  spider: {
    name: 'Spider (Default)',
    terminal: {
      background: '#0a0a0a',
      foreground: '#e0e0e0',
      cursor: '#00ff41',
      cursorAccent: '#0a0a0a',
      selectionBackground: 'rgba(0, 255, 65, 0.2)',
      black: '#0a0a0a',
      red: '#ff0040',
      green: '#00ff41',
      yellow: '#ffea00',
      blue: '#00e5ff',
      magenta: '#ff00ff',
      cyan: '#00e5ff',
      white: '#e0e0e0',
      brightBlack: '#555555',
      brightRed: '#ff4466',
      brightGreen: '#66ff66',
      brightYellow: '#ffff66',
      brightBlue: '#66ffff',
      brightMagenta: '#ff66ff',
      brightCyan: '#66ffff',
      brightWhite: '#ffffff',
    },
    ui: {
      bgPrimary: '#0a0a0a',
      bgSecondary: '#111111',
      bgTertiary: '#1a1a1a',
      accent: '#00ff41',
      accentDim: '#00cc33',
      accentGlow: 'rgba(0, 255, 65, 0.3)',
      border: '#2a2a2a',
      borderActive: '#00ff41',
      textPrimary: '#e0e0e0',
      textSecondary: '#888888',
    },
  },

  ghostty: {
    name: 'Ghostty',
    terminal: {
      background: '#0d1117',
      foreground: '#c9d1d9',
      cursor: '#58a6ff',
      cursorAccent: '#0d1117',
      selectionBackground: 'rgba(88, 166, 255, 0.2)',
      black: '#0d1117',
      red: '#ff7b72',
      green: '#7ee787',
      yellow: '#d29922',
      blue: '#58a6ff',
      magenta: '#bc8cff',
      cyan: '#39d2e0',
      white: '#c9d1d9',
      brightBlack: '#484f58',
      brightRed: '#ffa198',
      brightGreen: '#a5f5b5',
      brightYellow: '#e3b341',
      brightBlue: '#79c0ff',
      brightMagenta: '#d2a8ff',
      brightCyan: '#56d4dd',
      brightWhite: '#f0f6fc',
    },
    ui: {
      bgPrimary: '#0d1117',
      bgSecondary: '#161b22',
      bgTertiary: '#21262d',
      accent: '#58a6ff',
      accentDim: '#388bfd',
      accentGlow: 'rgba(88, 166, 255, 0.3)',
      border: '#30363d',
      borderActive: '#58a6ff',
      textPrimary: '#c9d1d9',
      textSecondary: '#8b949e',
    },
  },

  dracula: {
    name: 'Dracula',
    terminal: {
      background: '#282a36',
      foreground: '#f8f8f2',
      cursor: '#f8f8f2',
      cursorAccent: '#282a36',
      selectionBackground: 'rgba(189, 147, 249, 0.2)',
      black: '#21222c',
      red: '#ff5555',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      blue: '#bd93f9',
      magenta: '#ff79c6',
      cyan: '#8be9fd',
      white: '#f8f8f2',
      brightBlack: '#6272a4',
      brightRed: '#ff6e6e',
      brightGreen: '#69ff94',
      brightYellow: '#ffffa5',
      brightBlue: '#d6acff',
      brightMagenta: '#ff92df',
      brightCyan: '#a4ffff',
      brightWhite: '#ffffff',
    },
    ui: {
      bgPrimary: '#282a36',
      bgSecondary: '#2d2f3d',
      bgTertiary: '#343746',
      accent: '#bd93f9',
      accentDim: '#9d79d9',
      accentGlow: 'rgba(189, 147, 249, 0.3)',
      border: '#44475a',
      borderActive: '#bd93f9',
      textPrimary: '#f8f8f2',
      textSecondary: '#6272a4',
    },
  },

  monokai: {
    name: 'Monokai',
    terminal: {
      background: '#272822',
      foreground: '#f8f8f2',
      cursor: '#f8f8f0',
      cursorAccent: '#272822',
      selectionBackground: 'rgba(249, 38, 114, 0.2)',
      black: '#272822',
      red: '#f92672',
      green: '#a6e22e',
      yellow: '#e6db74',
      blue: '#66d9ef',
      magenta: '#ae81ff',
      cyan: '#66d9ef',
      white: '#f8f8f2',
      brightBlack: '#75715e',
      brightRed: '#f44747',
      brightGreen: '#b5e853',
      brightYellow: '#feed6c',
      brightBlue: '#a1efe4',
      brightMagenta: '#ae81ff',
      brightCyan: '#a1efe4',
      brightWhite: '#f9f8f5',
    },
    ui: {
      bgPrimary: '#272822',
      bgSecondary: '#2e2f2a',
      bgTertiary: '#3e3d32',
      accent: '#a6e22e',
      accentDim: '#86c20e',
      accentGlow: 'rgba(166, 226, 46, 0.3)',
      border: '#49483e',
      borderActive: '#a6e22e',
      textPrimary: '#f8f8f2',
      textSecondary: '#75715e',
    },
  },

  cyberpunk: {
    name: 'Cyberpunk',
    terminal: {
      background: '#0a0014',
      foreground: '#e0d0ff',
      cursor: '#ff00ff',
      cursorAccent: '#0a0014',
      selectionBackground: 'rgba(255, 0, 255, 0.2)',
      black: '#0a0014',
      red: '#ff0055',
      green: '#00ff9f',
      yellow: '#ffb800',
      blue: '#00b8ff',
      magenta: '#ff00ff',
      cyan: '#00ffff',
      white: '#e0d0ff',
      brightBlack: '#554477',
      brightRed: '#ff3377',
      brightGreen: '#33ffb1',
      brightYellow: '#ffd033',
      brightBlue: '#33c9ff',
      brightMagenta: '#ff55ff',
      brightCyan: '#55ffff',
      brightWhite: '#ffffff',
    },
    ui: {
      bgPrimary: '#0a0014',
      bgSecondary: '#120020',
      bgTertiary: '#1a0030',
      accent: '#ff00ff',
      accentDim: '#cc00cc',
      accentGlow: 'rgba(255, 0, 255, 0.3)',
      border: '#2a1040',
      borderActive: '#ff00ff',
      textPrimary: '#e0d0ff',
      textSecondary: '#887799',
    },
  },

  solarized: {
    name: 'Solarized Dark',
    terminal: {
      background: '#002b36',
      foreground: '#839496',
      cursor: '#839496',
      cursorAccent: '#002b36',
      selectionBackground: 'rgba(38, 139, 210, 0.2)',
      black: '#073642',
      red: '#dc322f',
      green: '#859900',
      yellow: '#b58900',
      blue: '#268bd2',
      magenta: '#d33682',
      cyan: '#2aa198',
      white: '#eee8d5',
      brightBlack: '#586e75',
      brightRed: '#cb4b16',
      brightGreen: '#859900',
      brightYellow: '#b58900',
      brightBlue: '#268bd2',
      brightMagenta: '#6c71c4',
      brightCyan: '#2aa198',
      brightWhite: '#fdf6e3',
    },
    ui: {
      bgPrimary: '#002b36',
      bgSecondary: '#073642',
      bgTertiary: '#0a3f4c',
      accent: '#268bd2',
      accentDim: '#1a6da8',
      accentGlow: 'rgba(38, 139, 210, 0.3)',
      border: '#0d4a5a',
      borderActive: '#268bd2',
      textPrimary: '#839496',
      textSecondary: '#586e75',
    },
  },

  spiderman: {
    name: 'Spider-Man',
    logo: '/\\(oo)/\\',
    terminal: {
      background: '#0b0f1f',
      foreground: '#e8ecf5',
      cursor: '#e23636',
      cursorAccent: '#0b0f1f',
      selectionBackground: 'rgba(226, 54, 54, 0.28)',
      black: '#0b0f1f',
      red: '#e23636',
      green: '#4cd07d',
      yellow: '#ffcc33',
      blue: '#2f6bff',
      magenta: '#d63aa1',
      cyan: '#4fc3f7',
      white: '#dfe6f3',
      brightBlack: '#4a5578',
      brightRed: '#ff5a5a',
      brightGreen: '#7ee8a2',
      brightYellow: '#ffe066',
      brightBlue: '#5c8dff',
      brightMagenta: '#f06ac0',
      brightCyan: '#81d4fa',
      brightWhite: '#ffffff',
    },
    ui: {
      bgPrimary: '#0b0f1f',
      bgSecondary: '#111733',
      bgTertiary: '#182046',
      accent: '#e23636',
      accentDim: '#b82626',
      accentGlow: 'rgba(226, 54, 54, 0.35)',
      border: '#24305e',
      borderActive: '#e23636',
      textPrimary: '#e8ecf5',
      textSecondary: '#8090b8',
    },
  },

  batman: {
    name: 'Batman',
    logo: '^\\_/^',
    terminal: {
      background: '#0a0a0c',
      foreground: '#d6d6d6',
      cursor: '#ffd400',
      cursorAccent: '#0a0a0c',
      selectionBackground: 'rgba(255, 212, 0, 0.22)',
      black: '#0a0a0c',
      red: '#c0392b',
      green: '#8fbf3f',
      yellow: '#ffd400',
      blue: '#4a6fa5',
      magenta: '#8e6aa8',
      cyan: '#5fa8a8',
      white: '#cfcfcf',
      brightBlack: '#4a4a52',
      brightRed: '#e05244',
      brightGreen: '#a8d65a',
      brightYellow: '#ffe24d',
      brightBlue: '#6b8ec4',
      brightMagenta: '#a98bc4',
      brightCyan: '#7cc4c4',
      brightWhite: '#f2f2f2',
    },
    ui: {
      bgPrimary: '#0a0a0c',
      bgSecondary: '#121216',
      bgTertiary: '#1b1b21',
      accent: '#ffd400',
      accentDim: '#c9a800',
      accentGlow: 'rgba(255, 212, 0, 0.3)',
      border: '#2a2a33',
      borderActive: '#ffd400',
      textPrimary: '#d6d6d6',
      textSecondary: '#7d7d8a',
    },
  },

  onepiece: {
    name: 'One Piece',
    logo: '☠',
    terminal: {
      background: '#0a2233',
      foreground: '#f3ead7',
      cursor: '#f5c542',
      cursorAccent: '#0a2233',
      selectionBackground: 'rgba(245, 197, 66, 0.25)',
      black: '#0a2233',
      red: '#e63946',
      green: '#52b788',
      yellow: '#f5c542',
      blue: '#3a86ff',
      magenta: '#ff6fae',
      cyan: '#48cae4',
      white: '#f3ead7',
      brightBlack: '#3d6380',
      brightRed: '#ff5c69',
      brightGreen: '#74d3a5',
      brightYellow: '#ffd96a',
      brightBlue: '#6aa6ff',
      brightMagenta: '#ff95c5',
      brightCyan: '#7ddff0',
      brightWhite: '#ffffff',
    },
    ui: {
      bgPrimary: '#0a2233',
      bgSecondary: '#0d2b40',
      bgTertiary: '#13374f',
      accent: '#f5c542',
      accentDim: '#c99a1e',
      accentGlow: 'rgba(245, 197, 66, 0.32)',
      border: '#1d4561',
      borderActive: '#f5c542',
      textPrimary: '#f3ead7',
      textSecondary: '#86a6bd',
    },
  },
};

export type ThemeId = keyof typeof THEMES;
export const DEFAULT_THEME: ThemeId = 'spider';

function hexToRgb(hex: string): string {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return '0, 255, 65';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

/** Update the UI's CSS variables to match a theme. */
export function applyUiTheme(themeId: ThemeId): void {
  const theme = THEMES[themeId] ?? THEMES[DEFAULT_THEME];
  const root = document.documentElement.style;
  root.setProperty('--bg-primary', theme.ui.bgPrimary);
  root.setProperty('--bg-secondary', theme.ui.bgSecondary);
  root.setProperty('--bg-tertiary', theme.ui.bgTertiary);
  root.setProperty('--green', theme.ui.accent);
  root.setProperty('--green-dim', theme.ui.accentDim);
  root.setProperty('--green-glow', theme.ui.accentGlow);
  root.setProperty('--accent-rgb', hexToRgb(theme.ui.accent));
  root.setProperty('--border', theme.ui.border);
  root.setProperty('--border-active', theme.ui.borderActive);
  root.setProperty('--text-primary', theme.ui.textPrimary);
  root.setProperty('--text-secondary', theme.ui.textSecondary);
}
