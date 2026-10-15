import type { ITheme } from '@xterm/xterm';

/** Decorative scenery drawn faintly over the terminal area (see AmbientLayer). */
export type Ambient = 'web' | 'batsignal' | 'ocean' | 'spark';

/** Personality on top of the colors: wording, scenery, secondary color, prompt. */
export interface ThemeFlavor {
  tagline?: string;
  /** What a workspace is called ("Workspace" → "Web", "Case", "Island") */
  workspaceNoun?: string;
  quickTerminalName?: string;
  agentPanelName?: string;
  ambient?: Ambient;
  /** Secondary (--cyan) color for agent/secondary accents */
  secondary?: string;
  /** Prompt preset to use when the prompt style is "auto" */
  prompt?: string;
}

export interface SpiderTheme {
  name: string;
  /** Title-bar logo; defaults to the spider */
  logo?: string;
  flavor?: ThemeFlavor;
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
    flavor: {
      tagline: 'With great power comes great responsibility',
      workspaceNoun: 'Web',
      quickTerminalName: 'WEB-SHOOTER',
      agentPanelName: 'SPIDER-VERSE',
      ambient: 'web',
      secondary: '#2f6bff',
      prompt: 'spiderman',
    },
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
    flavor: {
      tagline: 'I am the night',
      workspaceNoun: 'Case',
      quickTerminalName: 'BAT-SIGNAL',
      agentPanelName: 'BAT-COMPUTER',
      ambient: 'batsignal',
      secondary: '#8ab4f8',
      prompt: 'batman',
    },
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
    flavor: {
      tagline: 'Set sail for the Grand Line',
      workspaceNoun: 'Island',
      quickTerminalName: 'DEN DEN MUSHI',
      agentPanelName: 'THE CREW',
      ambient: 'ocean',
      secondary: '#48cae4',
      prompt: 'onepiece',
    },
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

  milesmorales: {
    name: 'Miles Morales',
    logo: '/\\(••)/\\',
    flavor: {
      tagline: 'Anyone can wear the mask',
      workspaceNoun: 'Web',
      quickTerminalName: 'VENOM STRIKE',
      agentPanelName: 'SPIDER-VERSE',
      ambient: 'web',
      secondary: '#a855f7',
      prompt: 'milesmorales',
    },
    terminal: {
      background: '#0c0810',
      foreground: '#ece6f5',
      cursor: '#ff2a4d',
      cursorAccent: '#0c0810',
      selectionBackground: 'rgba(168, 85, 247, 0.3)',
      black: '#0c0810',
      red: '#ff2a4d',
      green: '#3ddc84',
      yellow: '#ffe14d',
      blue: '#6b8cff',
      magenta: '#a855f7',
      cyan: '#36d6e7',
      white: '#e0d8ee',
      brightBlack: '#524866',
      brightRed: '#ff5c77',
      brightGreen: '#6ef0a6',
      brightYellow: '#fff17a',
      brightBlue: '#8fa8ff',
      brightMagenta: '#c084fc',
      brightCyan: '#67e8f9',
      brightWhite: '#ffffff',
    },
    ui: {
      bgPrimary: '#0c0810',
      bgSecondary: '#140d1b',
      bgTertiary: '#1d1327',
      accent: '#ff2a4d',
      accentDim: '#c41f3b',
      accentGlow: 'rgba(255, 42, 77, 0.35)',
      border: '#2c1f3a',
      borderActive: '#ff2a4d',
      textPrimary: '#ece6f5',
      textSecondary: '#8c7fa3',
    },
  },

  joker: {
    name: 'Joker',
    logo: '>:)',
    flavor: {
      tagline: 'Why so serious?',
      workspaceNoun: 'Scheme',
      quickTerminalName: 'PUNCHLINE',
      agentPanelName: 'THE GANG',
      ambient: 'spark',
      secondary: '#b388ff',
      prompt: 'joker',
    },
    terminal: {
      background: '#110a18',
      foreground: '#e9e1f2',
      cursor: '#3ddc84',
      cursorAccent: '#110a18',
      selectionBackground: 'rgba(61, 220, 132, 0.25)',
      black: '#110a18',
      red: '#ff4d6d',
      green: '#3ddc84',
      yellow: '#ffd166',
      blue: '#7c6cff',
      magenta: '#c77dff',
      cyan: '#4dd0e1',
      white: '#e2d9ee',
      brightBlack: '#5a4a6e',
      brightRed: '#ff7a92',
      brightGreen: '#72f0a9',
      brightYellow: '#ffe08a',
      brightBlue: '#a094ff',
      brightMagenta: '#dca4ff',
      brightCyan: '#80e3ef',
      brightWhite: '#ffffff',
    },
    ui: {
      bgPrimary: '#110a18',
      bgSecondary: '#1a1024',
      bgTertiary: '#241733',
      accent: '#3ddc84',
      accentDim: '#2fae68',
      accentGlow: 'rgba(61, 220, 132, 0.32)',
      border: '#36254a',
      borderActive: '#3ddc84',
      textPrimary: '#e9e1f2',
      textSecondary: '#9484ab',
    },
  },

  wano: {
    name: 'One Piece · Wano',
    logo: '☠',
    flavor: {
      tagline: 'The Land of Wano awaits',
      workspaceNoun: 'Island',
      quickTerminalName: 'DEN DEN MUSHI',
      agentPanelName: 'THE CREW',
      ambient: 'spark',
      secondary: '#ff8fab',
      prompt: 'wano',
    },
    terminal: {
      background: '#160d12',
      foreground: '#f6e9e9',
      cursor: '#ff5c8a',
      cursorAccent: '#160d12',
      selectionBackground: 'rgba(255, 92, 138, 0.25)',
      black: '#160d12',
      red: '#e63946',
      green: '#6cc070',
      yellow: '#f5c542',
      blue: '#5b8def',
      magenta: '#ff5c8a',
      cyan: '#5fd3d3',
      white: '#f0e0e0',
      brightBlack: '#5c4650',
      brightRed: '#ff6b74',
      brightGreen: '#8fe094',
      brightYellow: '#ffd96a',
      brightBlue: '#86aaff',
      brightMagenta: '#ff8fab',
      brightCyan: '#8aeaea',
      brightWhite: '#ffffff',
    },
    ui: {
      bgPrimary: '#160d12',
      bgSecondary: '#1f131a',
      bgTertiary: '#2a1a23',
      accent: '#ff5c8a',
      accentDim: '#d1456f',
      accentGlow: 'rgba(255, 92, 138, 0.32)',
      border: '#3b2531',
      borderActive: '#ff5c8a',
      textPrimary: '#f6e9e9',
      textSecondary: '#a4868f',
    },
  },
};

export type ThemeId = keyof typeof THEMES;
export const DEFAULT_THEME: ThemeId = 'spider';

const DEFAULT_FLAVOR: Required<Omit<ThemeFlavor, 'ambient' | 'prompt' | 'tagline'>> &
  Pick<ThemeFlavor, 'ambient' | 'prompt' | 'tagline'> = {
  workspaceNoun: 'Workspace',
  quickTerminalName: 'QUICK TERMINAL',
  agentPanelName: 'AGENT CONTROL',
  secondary: '#00e5ff',
};

/** A theme's flavor with defaults filled in. */
export function getFlavor(themeId: ThemeId): typeof DEFAULT_FLAVOR {
  return { ...DEFAULT_FLAVOR, ...(THEMES[themeId]?.flavor ?? {}) };
}

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

  // Secondary accent (agent panel, focus labels) follows the theme's flavor
  const secondary = getFlavor(themeId).secondary;
  const rgb = hexToRgb(secondary);
  root.setProperty('--cyan', secondary);
  root.setProperty('--cyan-dim', `rgb(${rgb} / 0.75)`);
  root.setProperty('--cyan-glow', `rgba(${rgb}, 0.3)`);
  root.setProperty('--secondary-rgb', rgb);
}
