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
│  ├── index.ts        – App lifecycle, window│
│  ├── ipc-handlers.ts – IPC bridge           │
│  ├── pty-manager.ts  – node-pty instances   │
│  ├── shell-init.ts   – PS init + prompt     │
│  └── prompt-presets.ts – Void-style presets │
├─────────────────────────────────────────────┤
│  Preload (src/preload/index.ts)             │
│  └── contextBridge exposing electronAPI     │
├─────────────────────────────────────────────┤
│  Renderer Process (src/renderer/)           │
│  ├── App.tsx         – Root + key dispatch  │
│  ├── commands.ts     – Commands + shortcuts │
│  ├── terminal/       – xterm registry       │
│  ├── components/     – UI components        │
│  ├── hooks/          – useTerminal, useModal│
│  ├── state/          – stores, tree, session│
│  ├── styles/         – CSS files            │
│  └── types/          – TypeScript types     │
└─────────────────────────────────────────────┘
```

### Key Patterns

- **Split Tree**: Binary tree of `TerminalLeaf | SplitNode` for arbitrary pane layouts
- **Workspaces**: Tab-based workspace switching, each with its own split tree
- **Agent Panel**: Broadcast commands to multiple selected terminals simultaneously
- **Command Palette**: Ctrl+Shift+P fuzzy command search
- **Command registry** (`src/renderer/commands.ts`): single source of truth for keybindings, the palette and the F1 cheat sheet. Add shortcuts there, not in App.tsx. Clipboard keys are handled inside xterm's custom key handler (registry.ts)
- **Terminal registry** (`src/renderer/terminal/registry.ts`): xterm instances outlive React remounts; owns clipboard, links, search, WebGL, live settings. Reports to the store via `setTerminalEvents` callbacks (avoids a circular import)
- **Shell integration**: PowerShell starts as `-NoExit -EncodedCommand <script>` (built in `shell-init.ts`, not subject to execution policy). The script sets UTF-8, installs the Void-style prompt (or wraps the user's $PROFILE prompt), and reports cwd via OSC 9;9 and the title via OSC 0
- **Persistence**: settings (`settings-store.ts`) and session layout (`session.ts`) in localStorage; window bounds in userData/window-state.json
- **No app menu**: `Menu.setApplicationMenu(null)`, since default accelerators (Ctrl+R reload, Ctrl+W) would hijack terminal keys
- **Modals** use `useModal` (focus + capture-phase Escape) because xterm stops propagation of keys it handles
- **Theme flavor** (`themes.ts` → `ThemeFlavor`, read via `getFlavor()`): hero themes carry a tagline, workspace noun, quick-terminal/agent-panel names, a secondary (`--cyan`) color, an `ambient` scenery kind drawn by `AmbientLayer.tsx`, and a `prompt` preset that the "auto" prompt style follows. Add a theme's prompt in `src/main/prompt-presets.ts` and the `PromptStyle` union in both `prompt-presets.ts` and `types/electron.d.ts`
- **Workspace swipe** lives in `WorkspaceStage.tsx` (wheel-based gesture, page dots); `Ctrl+Alt+←/→` are the keyboard equivalents

## Development

```bash
# Install dependencies (requires native build tools for node-pty)
npm install

# Rebuild native modules for Electron
npx @electron/rebuild

# Start dev mode (custom script that handles vite + electron); extra args go to electron
npm run dev            # = node start-dev.js

npm run typecheck      # tsc --noEmit

# Installer (Squirrel Setup.exe) + portable zip into out/make
npm run make
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+D / Ctrl+Shift+N | New tab in pane |
| Ctrl+W | Close active tab (or pane if last tab) |
| Ctrl+PgUp/PgDn, Ctrl+(Shift+)Tab | Cycle pane tabs |
| Ctrl+Shift+H | Split horizontal (right) |
| Ctrl+Shift+B | Split vertical (down) |
| Ctrl+Shift+W | Close pane |
| Ctrl+Shift+Z | Zoom / unzoom pane |
| Alt+W/A/S/D | Navigate between panes |
| Alt+1-9 | Switch workspace by number |
| Ctrl+Shift+T | New workspace |
| Ctrl+C / Ctrl+Shift+C | Copy (Ctrl+C only with a selection, else interrupt) |
| Ctrl+V / Ctrl+Shift+V / Shift+Insert | Paste |
| Ctrl+Shift+F | Search terminal |
| Ctrl+Shift+K | Clear terminal |
| Ctrl+= / Ctrl+- / Ctrl+0 | Font size |
| Ctrl+` | Quick terminal |
| Ctrl+Shift+E | Toggle sidebar |
| Ctrl+, | Settings |
| Ctrl+Shift+A | Toggle agent panel |
| Ctrl+Shift+P | Command palette |
| F1 | Shortcut cheat sheet |
| F11 | Full screen |

## File Structure

- `src/main/` – Electron main process (Node.js context)
- `src/preload/` – Context bridge between main and renderer
- `src/renderer/` – React UI (browser context)
- `src/renderer/state/terminal-store.ts` – Central Zustand store
- `src/renderer/state/split-tree.ts` – Binary tree operations
- `src/renderer/hooks/useTerminal.ts` – mounts a registry terminal into a pane
- `src/renderer/terminal/registry.ts` – xterm instances, clipboard, search
- `src/renderer/commands.ts` – command + keybinding registry
- `src/main/shell-init.ts` – PowerShell init script / Void-style prompt
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
