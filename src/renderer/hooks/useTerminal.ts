import { useEffect } from 'react';
import { attachTerminal, focusTerminal } from '../terminal/registry';

/**
 * Mount terminal `id` into `containerRef`. The terminal (and its PTY) is created
 * on first mount and survives remounts; only an explicit close destroys it.
 */
export function useTerminal(
  id: string,
  containerRef: React.RefObject<HTMLDivElement | null>,
  isActive: boolean,
  cwd?: string
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    return attachTerminal(id, container, cwd);
    // cwd only matters on first creation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Focus terminal when it becomes active
  useEffect(() => {
    if (isActive) focusTerminal(id);
  }, [isActive, id]);
}
