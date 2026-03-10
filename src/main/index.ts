import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { killAll } from './pty-manager';

// Handle Squirrel.Windows install/update/uninstall events.
// The app is launched by Squirrel during these phases — quit immediately
// so the installer can finish cleanly without the app interfering.
if (process.platform === 'win32') {
  const cmd = process.argv[1];
  if (
    cmd === '--squirrel-install' ||
    cmd === '--squirrel-updated' ||
    cmd === '--squirrel-uninstall' ||
    cmd === '--squirrel-obsolete'
  ) {
    app.quit();
  }
}

let mainWindow: BrowserWindow | null = null;

// Declare forge vite globals
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    show: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Show window as soon as content is ready — no white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

registerIpcHandlers(() => mainWindow);

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  killAll();
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
