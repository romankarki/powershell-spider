import { ipcMain, BrowserWindow } from 'electron';
import { createPty, writePty, resizePty, killPty, killAll, getCwd } from './pty-manager';

export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  function safeSend(channel: string, data?: string) {
    const win = getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  }

  ipcMain.handle('terminal:create', (_event, id: string, cwd?: string) => {
    createPty(
      id,
      (data) => safeSend(`terminal:data:${id}`, data),
      () => safeSend(`terminal:exit:${id}`),
      cwd
    );
  });

  ipcMain.handle('terminal:get-cwd', (_event, id: string) => {
    return getCwd(id);
  });

  ipcMain.handle('terminal:write', (_event, id: string, data: string) => {
    writePty(id, data);
  });

  ipcMain.handle('terminal:resize', (_event, id: string, cols: number, rows: number) => {
    resizePty(id, cols, rows);
  });

  ipcMain.handle('terminal:kill', (_event, id: string) => {
    killPty(id);
  });

  ipcMain.handle('terminal:write-all', (_event, ids: string[], data: string) => {
    for (const id of ids) {
      writePty(id, data);
    }
  });

  // Window controls
  ipcMain.handle('window:minimize', () => {
    getWindow()?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    const win = getWindow();
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    killAll();
    getWindow()?.close();
  });
}
