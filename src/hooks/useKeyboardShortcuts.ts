import { useEffect } from 'react';

type ShortcutHandler = () => void;

interface ShortcutMap {
  [key: string]: ShortcutHandler;
}

/**
 * Hook for handling keyboard shortcuts
 *
 * Supports shortcuts like:
 * - 'cmd+k' or 'ctrl+k' (both map to meta/ctrl + key)
 * - 'escape' (single key)
 *
 * @example
 * useKeyboardShortcuts({
 *   'cmd+k': () => setIsSearchOpen(true),
 *   'escape': () => setIsSearchOpen(false),
 * });
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.isContentEditable;

      // Build the shortcut key from the event
      const parts: string[] = [];

      if (event.metaKey || event.ctrlKey) {
        parts.push('cmd');
      }
      if (event.shiftKey) {
        parts.push('shift');
      }
      if (event.altKey) {
        parts.push('alt');
      }

      // Add the actual key
      const key = event.key.toLowerCase();
      if (key !== 'control' && key !== 'meta' && key !== 'shift' && key !== 'alt') {
        parts.push(key);
      }

      const shortcutKey = parts.join('+');

      // Check for matching shortcut
      const handler = shortcuts[shortcutKey];

      if (handler) {
        // For cmd+k, we want it to work even in inputs (it's a global shortcut)
        if (shortcutKey === 'cmd+k' || !isInput) {
          event.preventDefault();
          handler();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
