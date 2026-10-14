import React from 'react';

const DISPLAY: Record<string, string> = {
  PageUp: 'PgUp',
  PageDown: 'PgDn',
  Insert: 'Ins',
  '`': '`',
};

/** Render a combo like "Ctrl+Shift+P" as keycaps. */
export const KeyCombo: React.FC<{ combo: string }> = ({ combo }) => {
  // Split on "+" but keep a literal "+" key ("Ctrl++")
  const parts = combo.split(/\+(?!$)/);
  return (
    <span className="kbd" style={{ flexShrink: 0 }}>
      {parts.map((p, i) => <kbd key={i}>{DISPLAY[p] ?? p}</kbd>)}
    </span>
  );
};
