import { useEffect, useRef } from 'react';

/**
 * Behavior shared by modal overlays: take keyboard focus away from the terminal
 * underneath, and close on Escape. Escape is caught in the capture phase because
 * xterm stops propagation of keys it handles.
 */
export function useModal<T extends HTMLElement>(isOpen: boolean, onClose: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!isOpen) return;
    const el = ref.current;
    if (el && !el.contains(document.activeElement)) el.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isOpen, onClose]);

  return ref;
}
