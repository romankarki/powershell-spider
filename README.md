```
    /\../\
   SPIDER
```

# PowerShell Spider

A tmux / Ghostty-style multi-terminal manager for Windows PowerShell. Split panes, stack tabs, switch workspaces, and broadcast commands to many shells at once, all in one hacker-themed desktop app.

---

## Install (users)

Download from the [Releases](https://github.com/romankarki/powershell-spider/releases) page:

- **`PowerShell Spider-x.y.z Setup.exe`**: installer (adds a Start menu shortcut, auto-launches)
- **`PowerShell Spider-win32-x64-x.y.z.zip`**: portable; unzip anywhere and run `powershell-spider.exe`

Requires Windows 10 (1809+) or Windows 11. Uses Windows PowerShell by default; PowerShell 7 (`pwsh`) can be selected in Settings when it's installed.

> The app isn't code-signed yet, so Windows SmartScreen may warn on first launch: click **More info → Run anyway**.

## Features

- **Splits, tabs, workspaces**: arbitrary pane layouts, tabs inside each pane, workspaces in the sidebar
- **Real copy & paste**: Ctrl+C copies a selection (otherwise interrupts), Ctrl+V pastes, right-click menu, optional copy-on-select, safe multi-line paste
- **Shell-aware**: new tabs and splits open in the folder you're in; tabs title themselves after the current folder or running app
- **Powerline prompt** in the style of [Void](https://github.com/romankarki/void): user, git branch (with dirty marker), path breadcrumbs, last error and time. If you have `~/.void/config.toml`, its theme is used automatically.
- **Session restore**: workspaces, splits, tabs, names and folders come back on next launch
- **Agent panel**: broadcast a command to any set of terminals (optionally line by line)
- **Command palette** (Ctrl+Shift+P), **quick drop-down terminal** (Ctrl+\`), **search** (Ctrl+Shift+F)
- **Themes**: Spider, Ghostty, Dracula, Monokai, Cyberpunk, Solarized, plus **hero themes** (Spider-Man, Miles Morales, Batman, Joker, One Piece, Wano) that bring their own prompt, title-bar logo, tagline, wording (Webs / Cases / Islands, Bat-Computer, Den Den Mushi…) and faint ambient scenery (web, bat-signal, ocean waves). Adjustable font, size, cursor, CRT effects
- **Swipe between workspaces**: two-finger horizontal swipe on the touchpad (or Ctrl+Alt+←/→), with page dots
- GPU-accelerated rendering (WebGL); Ctrl+click opens links; drag files in to paste their paths

## Keyboard shortcuts

Press **F1** in the app for the full list.

| Shortcut | Action |
|---|---|
| `Ctrl+D` / `Ctrl+Shift+N` | New tab in pane |
| `Ctrl+W` | Close tab (closes the pane when it's the last tab) |
| `Ctrl+Tab` / `Ctrl+PgDn`, `Ctrl+Shift+Tab` / `Ctrl+PgUp` | Next / previous tab |
| `Ctrl+Shift+H` | Split right |
| `Ctrl+Shift+B` | Split down |
| `Ctrl+Shift+W` | Close pane |
| `Ctrl+Shift+Z` | Zoom / unzoom pane |
| `Alt+W/A/S/D` | Move focus up / left / down / right |
| `Ctrl+Shift+T` | New workspace |
| `Alt+1…9` | Switch workspace |
| `Ctrl+Alt+←` / `Ctrl+Alt+→` | Previous / next workspace (or swipe) |
| `Ctrl+Shift+Z` | Zoom / unzoom pane |
| `Ctrl+C` | Copy selection (or interrupt when nothing is selected) |
| `Ctrl+Shift+C`, `Ctrl+Insert` | Copy |
| `Ctrl+V`, `Ctrl+Shift+V`, `Shift+Insert` | Paste |
| `Ctrl+Shift+F` | Find in terminal |
| `Ctrl+Shift+K` | Clear terminal |
| `Ctrl+=` / `Ctrl+-` / `Ctrl+0` | Font size bigger / smaller / reset |
| `Ctrl+Shift+P` | Command palette |
| `` Ctrl+` `` | Quick terminal |
| `Ctrl+Shift+E` | Toggle sidebar |
| `Ctrl+Shift+A` | Toggle agent panel |
| `Ctrl+,` | Settings |
| `F11` | Full screen |
| `F1` | Shortcut cheat sheet |

Mouse: right-click a terminal for the context menu, double-click a tab or workspace to rename it (empty name restores the automatic title), middle-click a tab to close it, drag tabs to reorder, double-click a divider to even out a split.

## Prompt

Settings → **Prompt style**:

| Style | Description |
|---|---|
| Auto (default) | Matches a hero theme's prompt; otherwise your Void config (`~/.void/config.toml`) if present, else **Spider** |
| Spider | Green powerline prompt |
| Void · Cyberpunk / Hacker / Minimal | Void's built-in presets |
| Spider-Man / Miles Morales / Batman / Joker / One Piece / Wano | Hero prompts (used automatically by the matching theme) |
| My $PROFILE prompt | Leave whatever prompt your PowerShell profile defines (oh-my-posh, Starship, …) |

The prompt is pure PowerShell (no extra install), and the powerline arrows are drawn by the renderer, so no Nerd Font is required.

## Development

Prerequisites: Node.js 18+, and Visual Studio Build Tools with the **Desktop development with C++** workload (for the `node-pty` native module).

```bash
git clone https://github.com/romankarki/powershell-spider.git
cd powershell-spider
npm install
node scripts/patch-node-pty.js   # Spectre-mitigation fix for node-pty on Windows
npx @electron/rebuild            # build node-pty for Electron
npm run dev                      # vite dev server + electron
npm run typecheck
```

In dev, `Ctrl+Shift+I` opens DevTools. Extra args are forwarded to Electron, e.g. `npm run dev -- --remote-debugging-port=9222`.

## Build for distribution

```bash
npm run make
```

Artifacts land in `out/make/`:
- `squirrel.windows/x64/PowerShell Spider-<version> Setup.exe`: installer
- `zip/win32/x64/PowerShell Spider-win32-x64-<version>.zip`: portable build

Bump `version` in `package.json` before each release and attach both files to a GitHub release.

## Troubleshooting

**`node-pty` fails to build**: install VS Build Tools (C++ workload), run `node scripts/patch-node-pty.js`, then `npx @electron/rebuild --force`.

**Terminals are blank**: run `npx @electron/rebuild` so native modules match the Electron version.

**`MAIN_WINDOW_VITE_DEV_SERVER_URL is not defined`**: use `npm run dev` (not `npm start`) for development.

**Prompt looks wrong / want your own**: Settings → Prompt style → *My $PROFILE prompt*.

## Tech stack

| Layer | Technology |
|---|---|
| Desktop runtime | Electron 40 |
| Build system | Electron Forge + Vite |
| Language | TypeScript (strict) |
| UI | React 19 |
| State | Zustand (persisted settings + session) |
| Terminal emulator | xterm.js 6 (WebGL renderer) |
| PTY backend | node-pty (ConPTY) |
