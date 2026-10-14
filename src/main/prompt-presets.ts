import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Prompt configuration mirroring the Void shell's prompt renderer
 * (segments + palette). Rendered in pure PowerShell, so it works on any
 * machine without void.exe installed.
 */
export interface PromptConfig {
  symbol: string;
  segments: string[];
  palette: Record<string, string>;
}

export type PromptStyle = 'auto' | 'spider' | 'cyberpunk' | 'hacker' | 'minimal' | 'profile';

export const PROMPT_PRESETS: Record<Exclude<PromptStyle, 'auto' | 'profile'>, PromptConfig> = {
  spider: {
    symbol: '❯',
    segments: ['user', 'git', 'path', 'exit_code', 'time'],
    palette: {
      user_fg: '#0a0a0a', user_bg: '#00ff41',
      git_fg: '#0a0a0a', git_bg: '#00e5ff',
      path_fg: '#d6ffe0',
      path_bg_1: '#0b3d1d', path_bg_2: '#0e5227', path_bg_3: '#116631',
      path_bg_4: '#0e5227',
      exit_code_fg: '#ffffff', exit_code_bg: '#ff0040',
      time_fg: '#9aa4b8', time_bg: '#1c1c1c',
      symbol_fg: '#00ff41',
    },
  },
  // Matches void/presets/cyberpunk.toml
  cyberpunk: {
    symbol: '▶',
    segments: ['user', 'git', 'path', 'exit_code', 'time'],
    palette: {
      user_fg: '#ffffff', user_bg: '#1a1a2e',
      git_fg: '#ffffff', git_bg: '#00963b',
      path_fg: '#c0c0c0',
      path_bg_1: '#16213e', path_bg_2: '#1a1a2e', path_bg_3: '#0f3460',
      path_bg_4: '#16213e', path_bg_5: '#1a1a2e', path_bg_6: '#0f3460',
      exit_code_fg: '#ff6b6b', exit_code_bg: '#2d132c',
      time_fg: '#8892b0', time_bg: '#1a1a2e',
      symbol_fg: '#64ffda',
    },
  },
  // Matches void/presets/hacker.toml
  hacker: {
    symbol: '❯',
    segments: ['user', 'git', 'path', 'exit_code', 'time'],
    palette: {
      user_fg: '#ffffff', user_bg: '#6200ea',
      git_fg: '#ffffff', git_bg: '#00a844',
      path_fg: '#ffffff',
      path_bg_1: '#00b0ff', path_bg_2: '#00bfa5', path_bg_3: '#ff0097',
      path_bg_4: '#aa00ff', path_bg_5: '#00c853', path_bg_6: '#ff6d00',
      exit_code_fg: '#ffffff', exit_code_bg: '#d50000',
      time_fg: '#ffffff', time_bg: '#6200ea',
      symbol_fg: '#00e676',
    },
  },
  // Matches void/presets/minimal.toml
  minimal: {
    symbol: '▶',
    segments: ['path'],
    palette: { path_fg: '#a0a0a0', path_bg: '#1e1e1e', symbol_fg: '#808080' },
  },
};

/**
 * Minimal reader for the subset of TOML Void uses (`key = "value"`,
 * `key = ["a", "b"]`, `[section]`).
 */
function parseVoidToml(text: string): Record<string, Record<string, string | string[]>> {
  const out: Record<string, Record<string, string | string[]>> = { '': {} };
  let section = '';
  for (const raw of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const sec = line.match(/^\[([^\]]+)\]$/);
    if (sec) {
      section = sec[1].trim();
      out[section] ??= {};
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.+)$/);
    if (!kv) continue;
    const value = kv[2].trim();
    if (value.startsWith('[')) {
      out[section][kv[1]] = Array.from(value.matchAll(/"([^"]*)"/g), (m) => m[1]);
    } else {
      const str = value.match(/^"([^"]*)"/);
      out[section][kv[1]] = str ? str[1] : value;
    }
  }
  return out;
}

/** Load the user's Void config (~/.void/config.toml), applying its preset the same way Void does. */
export function loadVoidPromptConfig(): PromptConfig | null {
  const file = path.join(os.homedir(), '.void', 'config.toml');
  let text: string;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
  const toml = parseVoidToml(text);
  const prompt = toml['prompt'] ?? {};
  const palette: Record<string, string> = {};
  for (const [k, v] of Object.entries(toml['palette'] ?? {})) {
    if (typeof v === 'string') palette[k] = v;
  }
  const cfg: PromptConfig = {
    symbol: typeof prompt.symbol === 'string' ? prompt.symbol : '>',
    segments: Array.isArray(prompt.segments) ? prompt.segments : ['path'],
    palette,
  };

  // Void applies the preset on top of the config file (preset wins).
  const presetName = toml['']['preset'];
  if (typeof presetName === 'string' && presetName in PROMPT_PRESETS) {
    const preset = PROMPT_PRESETS[presetName as keyof typeof PROMPT_PRESETS];
    cfg.symbol = preset.symbol || cfg.symbol;
    if (preset.segments.length) cfg.segments = preset.segments;
    Object.assign(cfg.palette, preset.palette);
  }
  return cfg;
}

/** Resolve a prompt style to a concrete config, or null for "use the user's own profile prompt". */
export function resolvePromptConfig(style: PromptStyle): PromptConfig | null {
  if (style === 'profile') return null;
  if (style === 'auto') return loadVoidPromptConfig() ?? PROMPT_PRESETS.spider;
  return PROMPT_PRESETS[style] ?? PROMPT_PRESETS.spider;
}
