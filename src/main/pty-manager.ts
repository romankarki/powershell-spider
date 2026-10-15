import type { IPty } from 'node-pty';
import { execFileSync } from 'child_process';
import fs from 'fs';
import { buildInitScript, encodeCommand } from './shell-init';
import { resolvePromptConfig, PromptStyle } from './prompt-presets';

let pty: typeof import('node-pty') | null = null;

function getPty() {
  if (!pty) {
    pty = require('node-pty');
  }
  return pty;
}

export type ShellId = 'powershell' | 'pwsh';

export interface CreatePtyOptions {
  cwd?: string;
  shell?: ShellId;
  promptStyle?: PromptStyle;
  promptFallback?: PromptStyle;
  cols?: number;
  rows?: number;
}

interface PtyEntry {
  process: IPty;
  cwd: string;
}

const ptys = new Map<string, PtyEntry>();
const shellPaths = new Map<ShellId, string | null>();
const timing = !!process.env.SPIDER_TIMING;

/** Standard install locations, checked before falling back to a PATH search. */
function knownShellPaths(shell: ShellId): string[] {
  const root = process.env.SystemRoot || 'C:\\Windows';
  if (shell === 'powershell') {
    return [`${root}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`];
  }
  return [
    `${process.env.ProgramFiles || 'C:\\Program Files'}\\PowerShell\\7\\pwsh.exe`,
    `${process.env.LOCALAPPDATA || ''}\\Microsoft\\WindowsApps\\pwsh.exe`,
  ];
}

/** Locate a shell executable (cached). Well-known paths first: spawning where.exe costs ~100 ms. */
function findShell(shell: ShellId): string | null {
  if (!shellPaths.has(shell)) {
    let found = knownShellPaths(shell).find((p) => {
      try { return fs.statSync(p).isFile(); } catch { return false; }
    }) ?? null;
    if (!found) {
      const exe = shell === 'pwsh' ? 'pwsh.exe' : 'powershell.exe';
      try {
        found = execFileSync('where.exe', [exe], { encoding: 'utf8', windowsHide: true })
          .split(/\r?\n/)[0].trim() || null;
      } catch {
        found = null;
      }
    }
    shellPaths.set(shell, found);
  }
  return shellPaths.get(shell) ?? null;
}

export function getAvailableShells(): ShellId[] {
  return (['powershell', 'pwsh'] as ShellId[]).filter((s) => findShell(s) !== null);
}

function resolveCwd(cwd?: string): string {
  if (cwd) {
    try {
      if (fs.statSync(cwd).isDirectory()) return cwd;
    } catch { /* fall through */ }
  }
  return process.env.USERPROFILE || process.cwd();
}

function spawnShell(options: CreatePtyOptions): { process: IPty; cwd: string } {
  const shellExe = findShell(options.shell ?? 'powershell') ?? 'powershell.exe';
  const startCwd = resolveCwd(options.cwd);
  const env = { ...process.env } as Record<string, string>;
  env['PYTHONIOENCODING'] = 'utf-8';
  env['COLORTERM'] = 'truecolor';
  env['TERM_PROGRAM'] = 'PowerShellSpider';

  const script = buildInitScript(resolvePromptConfig(options.promptStyle ?? 'auto', options.promptFallback));

  const ptyProcess = getPty()!.spawn(
    shellExe,
    ['-NoLogo', '-NoExit', '-EncodedCommand', encodeCommand(script)],
    {
      name: 'xterm-256color',
      cols: Math.max(2, options.cols ?? 80),
      rows: Math.max(2, options.rows ?? 24),
      cwd: startCwd,
      env,
    }
  );
  return { process: ptyProcess, cwd: startCwd };
}

// --- Pre-warming ---
// PowerShell takes ~1-2 s to reach its first prompt, longer than the window
// takes to appear. At startup one shell is spawned before the window loads;
// the first terminal with matching options adopts it instead of waiting.

export interface PrewarmHint {
  shell: ShellId;
  promptStyle: PromptStyle;
  promptFallback?: PromptStyle;
  cwd: string;
}

interface Prewarmed {
  process: IPty;
  cwd: string;
  hint: PrewarmHint;
  buffered: string[];
  alive: boolean;
  timer: ReturnType<typeof setTimeout>;
}

let prewarmed: Prewarmed | null = null;

export function prewarmPty(hint: PrewarmHint): void {
  if (prewarmed) return;
  try {
    const { process: proc, cwd } = spawnShell({ shell: hint.shell, promptStyle: hint.promptStyle, promptFallback: hint.promptFallback, cwd: hint.cwd });
    const entry: Prewarmed = {
      process: proc,
      cwd,
      hint: { ...hint, cwd },
      buffered: [],
      alive: true,
      // Nobody asked for it (e.g. the window never opened): don't leave a stray shell
      timer: setTimeout(() => discardPrewarmed(), 30000),
    };
    proc.onData((d) => entry.buffered.push(d));
    proc.onExit(() => { entry.alive = false; });
    prewarmed = entry;
    if (timing) console.log(`[timing] prewarm spawned at ${process.uptime().toFixed(2)}s`);
  } catch {
    prewarmed = null;
  }
}

function discardPrewarmed(): void {
  if (!prewarmed) return;
  clearTimeout(prewarmed.timer);
  if (prewarmed.alive) {
    try { prewarmed.process.kill(); } catch { /* already gone */ }
  }
  prewarmed = null;
}

function takePrewarmed(options: CreatePtyOptions): Prewarmed | null {
  const p = prewarmed;
  if (!p) return null;
  const matches = p.alive &&
    (options.shell ?? 'powershell') === p.hint.shell &&
    (options.promptStyle ?? 'auto') === p.hint.promptStyle &&
    (options.promptStyle !== 'auto' || options.promptFallback === p.hint.promptFallback) &&
    resolveCwd(options.cwd).toLowerCase() === p.cwd.toLowerCase();
  if (!matches) {
    discardPrewarmed();
    return null;
  }
  clearTimeout(p.timer);
  prewarmed = null;
  return p;
}

export function createPty(
  id: string,
  onData: (data: string) => void,
  onExit: (exitCode: number) => void,
  options: CreatePtyOptions = {}
): void {
  if (ptys.has(id)) return;

  let firstPrompt = timing;
  const handleData = (data: string) => {
    if (firstPrompt && data.includes('\x1b]9;9;')) {
      firstPrompt = false;
      console.log(`[timing] first prompt for ${id.slice(0, 8)} at ${process.uptime().toFixed(2)}s`);
    }
    onData(data);
  };

  const warm = takePrewarmed(options);
  const { process: ptyProcess, cwd: startCwd } = warm ?? spawnShell(options);
  ptys.set(id, { process: ptyProcess, cwd: startCwd });

  if (warm) {
    if (timing) console.log(`[timing] adopted prewarmed shell for ${id.slice(0, 8)} at ${process.uptime().toFixed(2)}s`);
    // The shell drew its prompt at the default size; the renderer resizes right after this
    for (const chunk of warm.buffered) handleData(chunk);
  }

  ptyProcess.onData(handleData);
  ptyProcess.onExit(({ exitCode }) => {
    // Only report exits for PTYs we didn't kill ourselves
    if (ptys.get(id)?.process === ptyProcess) {
      ptys.delete(id);
      onExit(exitCode);
    }
  });
}

export function getCwd(id: string): string {
  return ptys.get(id)?.cwd || process.env.USERPROFILE || process.cwd();
}

export function writePty(id: string, data: string): void {
  ptys.get(id)?.process.write(data);
}

export function resizePty(id: string, cols: number, rows: number): void {
  if (!Number.isFinite(cols) || !Number.isFinite(rows) || cols < 2 || rows < 2) return;
  try {
    ptys.get(id)?.process.resize(cols, rows);
  } catch {
    // Ignore resize errors (can happen during rapid resizing)
  }
}

export function killPty(id: string): void {
  const entry = ptys.get(id);
  if (entry) {
    ptys.delete(id);
    try { entry.process.kill(); } catch { /* already gone */ }
  }
}

export function killAll(): void {
  discardPrewarmed();
  for (const id of [...ptys.keys()]) {
    killPty(id);
  }
}
