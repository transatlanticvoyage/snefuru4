'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useFavaTaniSafe } from '../components/favaTaniPopup/favaTaniConditionalProvider';

/**
 * Safe Listener Management Hooks for FavaTani
 * 
 * These hooks provide safe ways to add event listeners and side effects
 * that automatically clean up when the Tani system is disabled.
 * 
 * They ensure no lingering listeners or effects when system is turned off.
 */

interface SafeListenerOptions {
  enabled?: boolean;
  cleanup?: () => void;
  debug?: boolean;
}

/**
 * Safe event listener hook - only adds listeners when Tani is enabled
 */
export function useFavaTaniSafeEventListener<K extends keyof WindowEventMap>(
  eventType: K,
  handler: (event: WindowEventMap[K]) => void,
  options: SafeListenerOptions = {}
) {
  const tani = useFavaTaniSafe();
  const handlerRef = useRef(handler);
  const { enabled = true, cleanup, debug = false } = options;

  // Update handler reference
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    // Don't add listeners if Tani is disabled or option is disabled
    if (!tani || !enabled || !tani.state.flags.enabled) {
      if (debug && process.env.NODE_ENV === 'development') {
        console.log(`[FavaTani] Skipping event listener for ${eventType} - system disabled`);
      }
      return;
    }

    const eventHandler = (event: WindowEventMap[K]) => {
      handlerRef.current(event);
    };

    window.addEventListener(eventType, eventHandler);

    if (debug && process.env.NODE_ENV === 'development') {
      console.log(`[FavaTani] Added event listener for ${eventType}`);
    }

    return () => {
      window.removeEventListener(eventType, eventHandler);
      cleanup?.();
      
      if (debug && process.env.NODE_ENV === 'development') {
        console.log(`[FavaTani] Removed event listener for ${eventType}`);
      }
    };
  }, [eventType, tani, enabled, cleanup, debug]);
}

/**
 * Safe keyboard shortcut hook
 */
export function useFavaTaniSafeKeyboard(
  shortcut: string,
  handler: (event: KeyboardEvent) => void,
  options: SafeListenerOptions & { 
    preventDefault?: boolean;
    allowInInputs?: boolean;
  } = {}
) {
  const tani = useFavaTaniSafe();
  const { 
    enabled = true, 
    preventDefault = true, 
    allowInInputs = false,
    debug = false 
  } = options;

  const keyboardHandler = useCallback((event: KeyboardEvent) => {
    // Check if shortcut matches
    if (event.key.toLowerCase() !== shortcut.toLowerCase()) {
      return;
    }

    // Check if we should ignore input fields
    if (!allowInInputs) {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
    }

    if (preventDefault) {
      event.preventDefault();
    }

    handler(event);
  }, [shortcut, handler, preventDefault, allowInInputs]);

  useFavaTaniSafeEventListener('keydown', keyboardHandler, {
    enabled: enabled && tani?.state.flags.components.keyboardShortcuts,
    debug
  });
}

/**
 * Safe URL parameter watcher
 */
export function useFavaTaniSafeUrlParams(
  paramName: string,
  handler: (value: string | null) => void,
  options: SafeListenerOptions = {}
) {
  const tani = useFavaTaniSafe();
  const { enabled = true, debug = false } = options;

  const urlHandler = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get(paramName);
    handler(value);
  }, [paramName, handler]);

  // Initial check
  useEffect(() => {
    if (tani && enabled && tani.state.flags.components.urlSync) {
      urlHandler();
    }
  }, [tani, enabled, urlHandler]);

  // Listen for changes
  useFavaTaniSafeEventListener('popstate', urlHandler, {
    enabled: enabled && tani?.state.flags.components.urlSync,
    debug
  });
}

/**
 * Safe localStorage hook with automatic cleanup
 */
export function useFavaTaniSafeLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: SafeListenerOptions & {
    serializer?: {
      parse: (value: string) => T;
      stringify: (value: T) => string;
    };
  } = {}
) {
  const tani = useFavaTaniSafe();
  const { 
    enabled = true, 
    serializer = {
      parse: JSON.parse,
      stringify: JSON.stringify
    },
    debug = false 
  } = options;

  const setValue = useCallback((value: T) => {
    if (!tani || !enabled || !tani.state.flags.components.localStorage) {
      if (debug && process.env.NODE_ENV === 'development') {
        console.log(`[FavaTani] localStorage write blocked for ${key} - system disabled`);
      }
      return;
    }

    try {
      localStorage.setItem(key, serializer.stringify(value));
      
      if (debug && process.env.NODE_ENV === 'development') {
        console.log(`[FavaTani] localStorage write: ${key}`, value);
      }
    } catch (error) {
      if (debug && process.env.NODE_ENV === 'development') {
        console.warn(`[FavaTani] localStorage write failed for ${key}:`, error);
      }
    }
  }, [tani, enabled, key, serializer, debug]);

  const getValue = useCallback((): T => {
    if (!tani || !enabled || !tani.state.flags.components.localStorage) {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      
      const parsed = serializer.parse(item);
      
      if (debug && process.env.NODE_ENV === 'development') {
        console.log(`[FavaTani] localStorage read: ${key}`, parsed);
      }
      
      return parsed;
    } catch (error) {
      if (debug && process.env.NODE_ENV === 'development') {
        console.warn(`[FavaTani] localStorage read failed for ${key}:`, error);
      }
      return defaultValue;
    }
  }, [tani, enabled, key, defaultValue, serializer, debug]);

  const removeValue = useCallback(() => {
    if (!tani || !enabled || !tani.state.flags.components.localStorage) {
      return;
    }

    try {
      localStorage.removeItem(key);
      
      if (debug && process.env.NODE_ENV === 'development') {
        console.log(`[FavaTani] localStorage remove: ${key}`);
      }
    } catch (error) {
      if (debug && process.env.NODE_ENV === 'development') {
        console.warn(`[FavaTani] localStorage remove failed for ${key}:`, error);
      }
    }
  }, [tani, enabled, key, debug]);

  return { getValue, setValue, removeValue };
}

/**
 * Safe effect hook that only runs when Tani is enabled
 */
export function useFavaTaniSafeEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
  options: SafeListenerOptions = {}
) {
  const tani = useFavaTaniSafe();
  const { enabled = true, debug = false } = options;

  useEffect(() => {
    if (!tani || !enabled || !tani.state.flags.enabled) {
      if (debug && process.env.NODE_ENV === 'development') {
        console.log('[FavaTani] Effect skipped - system disabled');
      }
      return;
    }

    if (debug && process.env.NODE_ENV === 'development') {
      console.log('[FavaTani] Effect running');
    }

    return effect();
  }, [tani, enabled, debug, ...deps]);
}

/**
 * Safe database query hook (when color fetching is enabled)
 */
export function useFavaTaniSafeColorFetch() {
  const tani = useFavaTaniSafe();

  const fetchColors = useCallback(async (colorScheme: string) => {
    if (!tani || !tani.state.flags.components.colorFetching) {
      return null;
    }

    try {
      // This would integrate with your existing color fetching logic
      // For now, return a placeholder structure
      return {
        backgroundColor: '#ffffff',
        textColor: '#000000'
      };
    } catch (error) {
      if (tani.state.flags.debugging.consoleLogging) {
        console.warn(`[FavaTani] Color fetch failed for ${colorScheme}:`, error);
      }
      return null;
    }
  }, [tani]);

  return { fetchColors };
}

export default {
  useFavaTaniSafeEventListener,
  useFavaTaniSafeKeyboard,
  useFavaTaniSafeUrlParams,
  useFavaTaniSafeLocalStorage,
  useFavaTaniSafeEffect,
  useFavaTaniSafeColorFetch
};