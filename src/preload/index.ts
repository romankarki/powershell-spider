import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Terminal
  createTerminal: (id: string, cwd?: string) => ipcRenderer.invoke('terminal:create', id, cwd),
  writeTerminal: (id: string, data: string) => ipcRenderer.invoke('terminal:write', id, data),
  resizeTerminal: (id: string, cols: number, rows: number) => ipcRenderer.invoke('terminal:resize', id, cols, rows),
  killTerminal: (id: string) => ipcRenderer.invoke('terminal:kill', id),
  writeAll: (ids: string[], data: string) => ipcRenderer.invoke('terminal:write-all', ids, data),
  getCwd: (id: string) => ipcRenderer.invoke('terminal:get-cwd', id),
  onTerminalData: (id: string, callback: (data: string) => void) => {
    const channel = `terminal:data:${id}`;
    const listener = (_event: Electron.IpcRendererEvent, data: string) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => { ipcRenderer.removeListener(channel, listener); };
  },
  onTerminalExit: (id: string, callback: () => void) => {
    const channel = `terminal:exit:${id}`;
    const listener = () => callback();
    ipcRenderer.on(channel, listener);
    return () => { ipcRenderer.removeListener(channel, listener); };
  },

  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
});
