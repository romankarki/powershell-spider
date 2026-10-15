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
  cols?: number;
  rows?: number;
}

interface PtyEntry {
  process: IPty;
  cwd: string;
}

const ptys = new Map<string, PtyEntry>();
const shellPaths = new Map<ShellId, string | null>();

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

export function createPty(
  id: string,
  onData: (data: string) => void,
  onExit: (exitCode: number) => void,
  options: CreatePtyOptions = {}
): void {
  if (ptys.has(id)) return;

  const shellExe = findShell(options.shell ?? 'powershell') ?? 'powershell.exe';
  const startCwd = resolveCwd(options.cwd);
  const env = { ...process.env } as Record<string, string>;
  env['PYTHONIOENCODING'] = 'utf-8';
  env['COLORTERM'] = 'truecolor';
  env['TERM_PROGRAM'] = 'PowerShellSpider';

  const script = buildInitScript(resolvePromptConfig(options.promptStyle ?? 'auto'));

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

  ptyProcess.onData(onData);
  ptyProcess.onExit(({ exitCode }) => {
    // Only report exits for PTYs we didn't kill ourselves
    if (ptys.get(id)?.process === ptyProcess) {
      ptys.delete(id);
      onExit(exitCode);
    }
  });

  ptys.set(id, { process: ptyProcess, cwd: startCwd });
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
  for (const id of [...ptys.keys()]) {
    killPty(id);
  }
}
