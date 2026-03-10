import { ipcMain, BrowserWindow } from 'electron';
import { createPty, writePty, resizePty, killPty } from './pty-manager';

export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('terminal:create', (_event, id: string) => {
    const win = getWindow();
    createPty(
      id,
      (data) => {
        win?.webContents.send(`terminal:data:${id}`, data);
      },
      () => {
        win?.webContents.send(`terminal:exit:${id}`);
      }
    );
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
    getWindow()?.close();
  });
}
