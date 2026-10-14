import { PromptConfig } from './prompt-presets';

// Fallback path-crumb colors, same set Void uses when no path_bg_N is configured.
const DEFAULT_PATH_COLORS = [
  '#6200ea', '#00b0ff', '#00bfa5', '#ff0097', '#aa00ff',
  '#00c853', '#ff6d00', '#304ffe', '#00e5ff', '#d500f9',
];

/** Escape a string as a single-quoted PowerShell literal. */
function psStr(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pathColors(palette: Record<string, string>): string[] {
  const steps: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const c = palette[`path_bg_${i}`];
    if (c) steps.push(c);
  }
  if (steps.length) return steps;
  const base = palette['path_bg'];
  if (base && /^#[0-9a-f]{6}$/i.test(base)) {
    return [base.toLowerCase(), ...shuffle(DEFAULT_PATH_COLORS.filter((c) => c !== base.toLowerCase()))];
  }
  return shuffle(DEFAULT_PATH_COLORS);
}

// Shared setup: UTF-8 I/O, and a hook that reports cwd (OSC 9;9, as Windows
// Terminal does) and sets the window title so tabs can label themselves.
const COMMON = String.raw`
$__sp_utf8 = New-Object System.Text.UTF8Encoding $false
try { [Console]::InputEncoding = $__sp_utf8; [Console]::OutputEncoding = $__sp_utf8 } catch {}
$OutputEncoding = $__sp_utf8
Remove-Variable __sp_utf8
$env:TERM_PROGRAM = 'PowerShellSpider'
function global:__spider_report {
  $loc = $executionContext.SessionState.Path.CurrentLocation
  if ($loc.Provider.Name -eq 'FileSystem') {
    $leaf = Split-Path -Leaf $loc.ProviderPath
    if (-not $leaf) { $leaf = $loc.ProviderPath }
    try { $Host.UI.RawUI.WindowTitle = $leaf } catch {}
    return "$([char]27)]9;9;` + '`"$($loc.ProviderPath)`"' + String.raw`$([char]27)\"
  }
  return ''
}
`;

const VOID_PROMPT = String.raw`
function global:__spider_rgb([string]$layer, [string]$hex) {
  if ($hex -notmatch '^#[0-9a-fA-F]{6}$') { return '' }
  $r = [Convert]::ToInt32($hex.Substring(1, 2), 16)
  $g = [Convert]::ToInt32($hex.Substring(3, 2), 16)
  $b = [Convert]::ToInt32($hex.Substring(5, 2), 16)
  return "$([char]27)[$layer;2;$r;$g;${'$'}{b}m"
}
function global:__spider_segments($segs) {
  $e = [char]27
  $sb = New-Object System.Text.StringBuilder
  for ($i = 0; $i -lt $segs.Count; $i++) {
    $s = $segs[$i]
    $next = ''
    if ($i + 1 -lt $segs.Count) { $next = $segs[$i + 1].bg }
    $text = $s.text
    if ($s.bg) { $text = " $text " }
    [void]$sb.Append("$e[1m").Append((__spider_rgb 38 $s.fg)).Append((__spider_rgb 48 $s.bg)).Append($text).Append("$e[0m")
    if ($s.bg) {
      [void]$sb.Append((__spider_rgb 38 $s.bg)).Append((__spider_rgb 48 $next)).Append([char]0xE0B0).Append("$e[0m")
    } elseif ($i + 1 -lt $segs.Count) {
      [void]$sb.Append(' ')
    }
  }
  return $sb.ToString()
}
function global:__spider_trunc([string]$s) {
  $s = $s.Trim()
  if ($s.Length -le 6) { return $s }
  return $s.Substring(0, 6) + '...'
}
$global:__spider_has_git = [bool](Get-Command git -CommandType Application -ErrorAction SilentlyContinue)
function global:prompt {
  $ok = $?
  $savedCode = $global:LASTEXITCODE
  $code = 0
  if ($null -ne $savedCode) { $code = [int]$savedCode }
  if (-not $ok -and $code -eq 0) { $code = 1 }

  $cfg = $global:__SpiderPrompt
  $pal = $cfg.Palette
  $loc = $executionContext.SessionState.Path.CurrentLocation
  $isFs = $loc.Provider.Name -eq 'FileSystem'
  $wd = if ($isFs) { $loc.ProviderPath } else { $loc.Path }
  $segs = New-Object System.Collections.ArrayList

  foreach ($name in $cfg.Segments) {
    switch ($name) {
      'user' {
        $label = $env:VOID_ACTIVE_LABEL
        if (-not $label -and $env:VIRTUAL_ENV_PROMPT) { $label = ($env:VIRTUAL_ENV_PROMPT -replace '^\((.+?)\).*$', '$1') }
        if (-not $label) { $label = $env:CONDA_DEFAULT_ENV }
        if (-not $label -and $env:VIRTUAL_ENV) { $label = Split-Path -Leaf $env:VIRTUAL_ENV }
        if (-not $label) { $label = "$env:COMPUTERNAME\$env:USERNAME" }
        $fg = $pal['user_fg']; if (-not $fg) { $fg = '#ffffff' }
        [void]$segs.Add(@{ text = '> ' + (__spider_trunc $label.ToUpper()); fg = $fg; bg = $pal['user_bg'] })
      }
      'git' {
        if ($isFs -and $global:__spider_has_git) {
          $d = $wd; $inRepo = $false
          while ($d) {
            if (Test-Path -LiteralPath (Join-Path $d '.git')) { $inRepo = $true; break }
            $d = Split-Path -Parent $d
          }
          if ($inRepo) {
            $branch = (git -C $wd rev-parse --abbrev-ref HEAD 2>$null | Select-Object -First 1)
            if ($branch -and $branch -ne 'HEAD') {
              $dirty = git -C $wd --no-optional-locks status --porcelain 2>$null | Select-Object -First 1
              if ($dirty) { $branch = "$branch *" }
              $fg = $pal['git_fg']; if (-not $fg) { $fg = '#ffffff' }
              [void]$segs.Add(@{ text = [string][char]0x2387 + " $branch"; fg = $fg; bg = $pal['git_bg'] })
            }
          }
        }
      }
      'path' {
        $parts = @($wd -split '[\\/]' | Where-Object { $_ })
        $crumbs = New-Object System.Collections.ArrayList
        for ($i = 0; $i -lt $parts.Count; $i++) {
          $icon = if ($i -eq 0 -and $parts[0] -match ':$') { [char]0x25B8 } else { [char]0x25A0 }
          [void]$crumbs.Add("$icon $($parts[$i])")
        }
        if ($crumbs.Count -eq 0) { [void]$crumbs.Add([string][char]0x25A0) }
        if ($crumbs.Count -gt 6) {
          $crumbs = @($crumbs[0], [string][char]0x2026) + @($crumbs[($crumbs.Count - 4)..($crumbs.Count - 1)])
        }
        $colors = $cfg.PathColors
        for ($i = 0; $i -lt $crumbs.Count; $i++) {
          [void]$segs.Add(@{ text = $crumbs[$i]; fg = $pal['path_fg']; bg = $colors[$i % $colors.Count] })
        }
      }
      'time' {
        $t = (Get-Date).ToString('h:mm tt', [Globalization.CultureInfo]::InvariantCulture)
        [void]$segs.Add(@{ text = [string][char]0x25F7 + " $t"; fg = $pal['time_fg']; bg = $pal['time_bg'] })
      }
      'exit_code' {
        if ($code -ne 0) {
          $suffix = if ($code -eq 1) { 'error' } else { 'errors' }
          [void]$segs.Add(@{ text = [string][char]0x2715 + " $code $suffix"; fg = $pal['exit_code_fg']; bg = $pal['exit_code_bg'] })
        }
      }
    }
  }

  $symbol = __spider_segments @(@{ text = $cfg.Symbol; fg = $pal['symbol_fg']; bg = '' })
  $out = if ($segs.Count -eq 0) { "$symbol " } else {
    (__spider_segments $segs).TrimEnd() + [Environment]::NewLine + [char]0x2502 + " $symbol "
  }
  $global:LASTEXITCODE = $savedCode
  return (__spider_report) + $out
}
if (Get-Command Set-PSReadLineOption -ErrorAction SilentlyContinue) {
  try { Set-PSReadLineOption -ExtraPromptLineCount 1 } catch {}
}
`;

// Keep the user's own $PROFILE prompt, only adding cwd/title reporting.
// Calling the original first keeps $? intact for it.
const WRAP_PROFILE_PROMPT = String.raw`
$global:__spider_orig_prompt = $function:prompt
function global:prompt {
  $out = & $global:__spider_orig_prompt
  return (__spider_report) + "$out"
}
`;

/** Build the PowerShell script run at startup (after the user's profile loads). */
export function buildInitScript(prompt: PromptConfig | null): string {
  if (!prompt) return COMMON + WRAP_PROFILE_PROMPT;

  const palette = Object.entries(prompt.palette)
    .map(([k, v]) => `${psStr(k)} = ${psStr(v)}`)
    .join('; ');
  const config = [
    '$global:__SpiderPrompt = @{',
    `  Symbol = ${psStr(prompt.symbol)}`,
    `  Segments = @(${prompt.segments.map(psStr).join(', ')})`,
    `  Palette = @{ ${palette} }`,
    `  PathColors = @(${pathColors(prompt.palette).map(psStr).join(', ')})`,
    '}',
  ].join('\n');
  return COMMON + config + VOID_PROMPT;
}

/** Encode a script for `powershell -EncodedCommand` (base64 of UTF-16LE). Not subject to execution policy. */
export function encodeCommand(script: string): string {
  return Buffer.from(script, 'utf16le').toString('base64');
}
