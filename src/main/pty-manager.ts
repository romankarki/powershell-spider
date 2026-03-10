import type { IPty } from 'node-pty';

let pty: typeof import('node-pty') | null = null;

function getPty() {
  if (!pty) {
    pty = require('node-pty');
  }
  return pty;
}

const ptys = new Map<string, IPty>();

export function createPty(id: string, onData: (data: string) => void, onExit: () => void): void {
  const shell = 'powershell.exe';
  const ptyProcess = getPty().spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: process.env.USERPROFILE || process.cwd(),
    env: process.env as Record<string, string>,
  });

  ptyProcess.onData(onData);
  ptyProcess.onExit(onExit);

  ptys.set(id, ptyProcess);
}

export function writePty(id: string, data: string): void {
  ptys.get(id)?.write(data);
}

export function resizePty(id: string, cols: number, rows: number): void {
  try {
    ptys.get(id)?.resize(cols, rows);
  } catch {
    // Ignore resize errors (can happen during rapid resizing)
  }
}

export function killPty(id: string): void {
  const p = ptys.get(id);
  if (p) {
    p.kill();
    ptys.delete(id);
  }
}

export function killAll(): void {
  for (const [id, p] of ptys) {
    p.kill();
    ptys.delete(id);
  }
}
