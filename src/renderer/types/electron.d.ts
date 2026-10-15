export type ShellId = 'powershell' | 'pwsh';
export type PromptStyle =
  | 'auto' | 'spider' | 'cyberpunk' | 'hacker' | 'minimal'
  | 'ghostty' | 'spiderman' | 'batman' | 'onepiece' | 'milesmorales' | 'joker' | 'wano' | 'profile';

export interface CreateTerminalOptions {
  cwd?: string;
  shell?: ShellId;
  promptStyle?: PromptStyle;
  promptFallback?: PromptStyle;
  cols?: number;
  rows?: number;
}

export interface PrewarmHint {
  shell: ShellId;
  promptStyle: PromptStyle;
  promptFallback?: PromptStyle;
  cwd: string;
}

export interface AppInfo {
  version: string;
  shells: ShellId[];
}

export interface WindowStateInfo {
  maximized: boolean;
  fullscreen: boolean;
}

declare global {
  interface Window {
    electronAPI: {
      osBuild: number;
      createTerminal: (id: string, options?: CreateTerminalOptions) => Promise<void>;
      writeTerminal: (id: string, data: string) => Promise<void>;
      resizeTerminal: (id: string, cols: number, rows: number) => Promise<void>;
      killTerminal: (id: string) => Promise<void>;
      writeAll: (ids: string[], data: string) => Promise<void>;
      getCwd: (id: string) => Promise<string>;
      onTerminalData: (id: string, cb: (data: string) => void) => () => void;
      onTerminalExit: (id: string, cb: (exitCode: number) => void) => () => void;
      readClipboard: () => Promise<string>;
      writeClipboard: (text: string) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      getAppInfo: () => Promise<AppInfo>;
      setPrewarmHint: (hint: PrewarmHint) => Promise<void>;
      getPathForFile: (file: File) => string;
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      toggleFullscreen: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      close: () => Promise<void>;
      onWindowState: (cb: (state: WindowStateInfo) => void) => () => void;
    };
  }
}
