import { contextBridge, ipcRenderer, webUtils } from 'electron';

function subscribe<T extends unknown[]>(channel: string, callback: (...args: T) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...(args as T));
  ipcRenderer.on(channel, listener);
  return () => { ipcRenderer.removeListener(channel, listener); };
}

contextBridge.exposeInMainWorld('electronAPI', {
  // Windows build number, used by xterm for ConPTY-specific behavior
  osBuild: Number(process.getSystemVersion().split('.')[2]) || 0,

  // Terminal
  createTerminal: (id: string, options?: unknown) => ipcRenderer.invoke('terminal:create', id, options),
  writeTerminal: (id: string, data: string) => ipcRenderer.invoke('terminal:write', id, data),
  resizeTerminal: (id: string, cols: number, rows: number) => ipcRenderer.invoke('terminal:resize', id, cols, rows),
  killTerminal: (id: string) => ipcRenderer.invoke('terminal:kill', id),
  writeAll: (ids: string[], data: string) => ipcRenderer.invoke('terminal:write-all', ids, data),
  getCwd: (id: string) => ipcRenderer.invoke('terminal:get-cwd', id),
  onTerminalData: (id: string, callback: (data: string) => void) =>
    subscribe<[string]>(`terminal:data:${id}`, callback),
  onTerminalExit: (id: string, callback: (exitCode: number) => void) =>
    subscribe<[number]>(`terminal:exit:${id}`, callback),

  // Clipboard & shell
  readClipboard: () => ipcRenderer.invoke('clipboard:read-text'),
  writeClipboard: (text: string) => ipcRenderer.invoke('clipboard:write-text', text),
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  close: () => ipcRenderer.invoke('window:close'),
  onWindowState: (callback: (state: { maximized: boolean; fullscreen: boolean }) => void) =>
    subscribe<[{ maximized: boolean; fullscreen: boolean }]>('window:state', callback),
});
