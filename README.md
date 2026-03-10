```
    /\../\
   SPIDER
```

# PowerShell Spider

A tmux-like multi-terminal manager for Windows PowerShell. Open, split, and orchestrate multiple PowerShell sessions from a single hacker-themed desktop app.

---

## Prerequisites

- **Node.js** v18+ — [Download](https://nodejs.org/)
- **Windows 10/11** (PowerShell is Windows-only)
- **Visual Studio Build Tools** — required for compiling `node-pty` native module
  - Install via: `npm install -g windows-build-tools` (run as Administrator)
  - Or install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) manually with the **"Desktop development with C++"** workload
- **Python 3.x** — needed by `node-gyp` (usually bundled with Build Tools)

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/romankarki/powershell-spider.git
cd powershell-spider

# 2. Install dependencies
npm install

# 3. Patch node-pty for Windows (fixes Spectre mitigation build issues)
node scripts/patch-node-pty.js

# 4. Rebuild native modules for Electron
npx @electron/rebuild

# 5. Run the app
node start-dev.js
```

> If step 4 fails, make sure Visual Studio Build Tools are installed with the C++ workload.

## Usage

### Pane Management

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+H` | Split pane horizontally |
| `Ctrl+Shift+V` | Split pane vertically |
| `Ctrl+Shift+W` | Close active pane |
| `Ctrl+Shift+P` | Open command palette |

- Click on a pane to focus it (active pane has a green border glow)
- Drag the dividers between panes to resize
- Double-click a pane's header label to rename it

### Workspaces (Tabs)

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+T` | New workspace tab |

- Click tabs to switch workspaces
- Double-click a tab to rename it
- Each workspace has its own independent pane layout

### Agent Panel

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+A` | Toggle agent panel |

The Agent Panel lets you broadcast commands to multiple terminals at once:

1. Open the agent panel (`Ctrl+Shift+A`)
2. Select target terminals using the checkboxes (or click **ALL**)
3. Type a command and hit **Enter** or click **EXECUTE**
4. The command runs in all selected terminals simultaneously

**Sequence Mode** — toggle it on to send multi-line commands one line at a time with a configurable delay between each.

## Build for Distribution

```bash
# Package the app
npm run package

# Create installer
npm run make
```

Output will be in the `out/` directory.

## Troubleshooting

**`node-pty` fails to build**
- Ensure Visual Studio Build Tools with C++ workload are installed
- Run `node scripts/patch-node-pty.js` before rebuilding
- Try `npx @electron/rebuild --force`

**App opens but terminals are blank**
- Run `npx @electron/rebuild` to ensure native modules match the Electron version

**`MAIN_WINDOW_VITE_DEV_SERVER_URL is not defined`**
- Use `node start-dev.js` instead of `npm start` for development

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop runtime | Electron 40 |
| Build system | Electron Forge + Vite |
| Language | TypeScript (strict) |
| UI | React 19 |
| State | Zustand |
| Terminal emulator | xterm.js 6 |
| PTY backend | node-pty |
