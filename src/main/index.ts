import { app, BrowserWindow, Menu, shell, screen } from 'electron';
import path from 'path';
import fs from 'fs';
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

// Shows up in the taskbar/notifications instead of "electron.app.*"
app.setAppUserModelId('com.romankarki.powershell-spider');

// Keep dev data (settings, session) separate from an installed copy, which
// would otherwise hold the same profile locked.
if (!app.isPackaged) {
  app.setPath('userData', `${app.getPath('userData')}-dev`);
}

let mainWindow: BrowserWindow | null = null;

// One instance per profile: a second launch would block on the locked
// storage, so focus the existing window instead.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
}

// Declare forge vite globals
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

// --- Window state persistence ---

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  maximized: boolean;
}

const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState(): WindowState {
  const fallback: WindowState = { width: 1280, height: 820, maximized: false };
  try {
    const s = JSON.parse(fs.readFileSync(stateFile(), 'utf8')) as WindowState;
    if (typeof s.width !== 'number' || typeof s.height !== 'number') return fallback;
    // Drop the saved position if it is no longer on any connected display
    if (typeof s.x === 'number' && typeof s.y === 'number') {
      const visible = screen.getAllDisplays().some(({ workArea: a }) =>
        s.x! < a.x + a.width - 100 && s.x! + s.width > a.x + 100 &&
        s.y! >= a.y - 10 && s.y! < a.y + a.height - 50
      );
      if (!visible) { delete s.x; delete s.y; }
    }
    return s;
  } catch {
    return fallback;
  }
}

function saveWindowState(win: BrowserWindow): void {
  try {
    const b = win.getNormalBounds();
    const state: WindowState = { ...b, maximized: win.isMaximized() };
    fs.writeFileSync(stateFile(), JSON.stringify(state));
  } catch { /* non-fatal */ }
}

const createWindow = () => {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 640,
    minHeight: 400,
    frame: false,
    show: false,
    title: 'PowerShell Spider',
    backgroundColor: '#0a0a0a',
    // Packaged builds use the exe's embedded icon
    icon: app.isPackaged ? undefined : path.join(__dirname, '../../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
    },
  });

  if (state.maximized) mainWindow.maximize();

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

  const win = mainWindow;

  // Never navigate the app window away; open web links in the default browser.
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win.webContents.getURL()) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // DevTools only in development (there is no app menu, so add the shortcut here)
  if (!app.isPackaged) {
    win.webContents.on('before-input-event', (_event, input) => {
      if (input.type === 'keyDown' && input.control && input.shift && input.key.toLowerCase() === 'i') {
        win.webContents.toggleDevTools();
      }
    });
  }

  const sendWindowState = () => {
    if (!win.isDestroyed()) win.webContents.send('window:state', { maximized: win.isMaximized(), fullscreen: win.isFullScreen() });
  };
  win.on('maximize', sendWindowState);
  win.on('unmaximize', sendWindowState);
  win.on('enter-full-screen', sendWindowState);
  win.on('leave-full-screen', sendWindowState);

  // Kill all PTY processes before the window object is destroyed
  // to prevent "Object has been destroyed" errors from lingering data events
  win.on('close', () => {
    saveWindowState(win);
    killAll();
  });

  win.on('closed', () => {
    mainWindow = null;
  });
};

// The default menu carries accelerators (Ctrl+R reload, Ctrl+W close, ...) that
// would hijack terminal keys and could reload the UI, orphaning every shell.
Menu.setApplicationMenu(null);

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
