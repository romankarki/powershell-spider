import { ipcMain, BrowserWindow, clipboard, shell, app } from 'electron';
import fs from 'fs';
import path from 'path';
import { createPty, writePty, resizePty, killPty, killAll, getCwd, getAvailableShells, CreatePtyOptions, PrewarmHint } from './pty-manager';

/** Where the renderer's hint for next startup's pre-warmed shell is stored. */
export const prewarmHintFile = () => path.join(app.getPath('userData'), 'prewarm.json');

export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  function safeSend(channel: string, ...args: unknown[]) {
    const win = getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, ...args);
    }
  }

  ipcMain.handle('terminal:create', (_event, id: string, options?: CreatePtyOptions) => {
    createPty(
      id,
      (data) => safeSend(`terminal:data:${id}`, data),
      (exitCode) => safeSend(`terminal:exit:${id}`, exitCode),
      options
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

  // Clipboard (main-process clipboard is reliable regardless of focus/permissions)
  ipcMain.handle('clipboard:read-text', () => clipboard.readText());
  ipcMain.handle('clipboard:write-text', (_event, text: string) => {
    clipboard.writeText(text);
  });

  ipcMain.handle('shell:open-external', (_event, url: string) => {
    if (/^https?:\/\//i.test(url)) {
      return shell.openExternal(url);
    }
  });

  ipcMain.handle('app:prewarm-hint', (_event, hint: PrewarmHint) => {
    fs.writeFile(prewarmHintFile(), JSON.stringify(hint), () => { /* best effort */ });
  });

  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    shells: getAvailableShells(),
  }));

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

  ipcMain.handle('window:toggle-fullscreen', () => {
    const win = getWindow();
    win?.setFullScreen(!win.isFullScreen());
  });

  ipcMain.handle('window:is-maximized', () => getWindow()?.isMaximized() ?? false);

  ipcMain.handle('window:close', () => {
    killAll();
    getWindow()?.close();
  });
}
