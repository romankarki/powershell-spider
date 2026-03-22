import type { IPty } from 'node-pty';

let pty: typeof import('node-pty') | null = null;

function getPty() {
  if (!pty) {
    pty = require('node-pty');
  }
  return pty;
}

interface PtyEntry {
  process: IPty;
  cwd: string;
}

const ptys = new Map<string, PtyEntry>();

export function createPty(
  id: string,
  onData: (data: string) => void,
  onExit: () => void,
  cwd?: string
): void {
  const shell = 'powershell.exe';
  const startCwd = cwd || process.env.USERPROFILE || process.cwd();
  const env = { ...process.env } as Record<string, string>;
  // Force UTF-8 output so Unicode/emoji render correctly
  env['PYTHONIOENCODING'] = 'utf-8';
  env['LANG'] = 'en_US.UTF-8';

  const ptyProcess = getPty()!.spawn(shell, ['-NoLogo'], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: startCwd,
    env,
  });

  // Set UTF-8 encoding on the PowerShell session so emojis/unicode render correctly
  ptyProcess.write('chcp 65001 | Out-Null; $OutputEncoding = [System.Text.Encoding]::UTF8; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; cls\r');

  ptyProcess.onData(onData);
  ptyProcess.onExit(onExit);

  ptys.set(id, { process: ptyProcess, cwd: startCwd });
}

export function getCwd(id: string): string {
  return ptys.get(id)?.cwd || process.env.USERPROFILE || process.cwd();
}

export function writePty(id: string, data: string): void {
  ptys.get(id)?.process.write(data);
}

export function resizePty(id: string, cols: number, rows: number): void {
  try {
    ptys.get(id)?.process.resize(cols, rows);
  } catch {
    // Ignore resize errors (can happen during rapid resizing)
  }
}

export function killPty(id: string): void {
  const entry = ptys.get(id);
  if (entry) {
    entry.process.kill();
    ptys.delete(id);
  }
}

export function killAll(): void {
  for (const [id, entry] of ptys) {
    entry.process.kill();
    ptys.delete(id);
  }
}
