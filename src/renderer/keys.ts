const CODE_KEYS: Record<string, string> = {
  Backquote: '`', Comma: ',', Period: '.', Slash: '/', Backslash: '\\',
  Equal: '=', Minus: '-', NumpadAdd: '=', NumpadSubtract: '-', Numpad0: '0',
  BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: "'",
};

/**
 * Normalize a keyboard event to a combo string such as "Ctrl+Shift+H".
 * Letters use the layout-aware `key`; digits and punctuation use the physical
 * `code` so Shift doesn't change them (Shift+1 stays "1", not "!").
 */
export function comboFromEvent(e: KeyboardEvent): string {
  let key: string;
  if (/^Digit\d$/.test(e.code)) key = e.code.slice(5);
  else if (CODE_KEYS[e.code]) key = CODE_KEYS[e.code];
  else if (e.key.length === 1) key = e.key.toUpperCase();
  else key = e.key; // PageUp, Tab, F1, Insert, Escape, ...

  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Meta');
  parts.push(key);
  return parts.join('+');
}
