# PowerShell Spider

A tmux-like multi-terminal manager for Windows PowerShell, built as a desktop app with a hacker aesthetic.

## Tech Stack

- **Runtime**: Electron 40 (Chromium + Node.js)
- **Build**: Electron Forge + Vite + TypeScript
- **Frontend**: React 19 + Zustand (state management)
- **Terminal**: xterm.js (@xterm/xterm 6) + node-pty (native PTY)
- **Styling**: CSS variables, inline styles, no CSS framework

## Architecture

```
┌─────────────────────────────────────────────┐
│  Main Process (src/main/)                   │
│  ├── index.ts       – App lifecycle, window │
│  ├── ipc-handlers.ts – IPC bridge           │
│  └── pty-manager.ts  – node-pty instances   │
├─────────────────────────────────────────────┤
│  Preload (src/preload/index.ts)             │
│  └── contextBridge exposing electronAPI     │
├─────────────────────────────────────────────┤
│  Renderer Process (src/renderer/)           │
│  ├── App.tsx         – Root + keybindings   │
│  ├── components/     – UI components        │
│  ├── hooks/          – useTerminal (xterm)  │
│  ├── state/          – Zustand store + tree │
│  ├── styles/         – CSS files            │
│  └── types/          – TypeScript types     │
└─────────────────────────────────────────────┘
```

### Key Patterns

- **Split Tree**: Binary tree of `TerminalLeaf | SplitNode` for arbitrary pane layouts
- **Workspaces**: Tab-based workspace switching, each with its own split tree
- **Agent Panel**: Broadcast commands to multiple selected terminals simultaneously
- **Command Palette**: Ctrl+Shift+P fuzzy command search

## Development

```bash
# Install dependencies (requires native build tools for node-pty)
npm install

# Rebuild native modules for Electron
npx @electron/rebuild

# Start dev mode (custom script that handles vite + electron)
node start-dev.js

# Package for distribution
npm run package
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+←/→ | Split horizontal |
| Ctrl+↑/↓ | Split vertical |
| Ctrl+Shift+W | Close pane |
| Ctrl+Shift+T | New workspace |
| Ctrl+Shift+A | Toggle agent panel |
| Ctrl+Shift+P | Command palette |

## File Structure

- `src/main/` – Electron main process (Node.js context)
- `src/preload/` – Context bridge between main and renderer
- `src/renderer/` – React UI (browser context)
- `src/renderer/state/terminal-store.ts` – Central Zustand store
- `src/renderer/state/split-tree.ts` – Binary tree operations
- `src/renderer/hooks/useTerminal.ts` – xterm.js lifecycle hook
- `forge.config.ts` – Electron Forge configuration
- `vite.*.config.ts` – Vite configs for main/preload/renderer
- `start-dev.js` – Custom dev script (vite dev server + electron)

## Coding Conventions

- TypeScript strict mode, no `any`
- React functional components with hooks
- Zustand for global state (no Redux, no Context)
- Inline styles for component-specific styling, CSS files for global/shared
- CSS variables defined in `global.css` for theming
- Color palette: green (#00ff41) for active/primary, cyan (#00e5ff) for agent/secondary, dark backgrounds
- node-pty is loaded lazily via `require()` to handle native module loading
- IPC channels follow `domain:action` naming (e.g., `terminal:create`, `window:minimize`)
