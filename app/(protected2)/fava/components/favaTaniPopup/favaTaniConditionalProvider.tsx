'use client';

import React, { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { FavaTaniFeatureFlags, FAVA_TANI_DEFAULT_FLAGS } from '../../config/favaTaniFeatureFlags';
import { FavaTaniConfig, FavaTaniContextType, FavaTaniState, FavaTaniTabId } from './types';

/**
 * Conditional Provider for FavaTani System
 * 
 * This provider creates a conditional integration layer that can safely disable
 * all Tani functionality while preserving the pure Fava template experience.
 * 
 * When flags.enabled = false, this provider returns null or minimal components,
 * ensuring zero interference with the base Fava system.
 */

const FavaTaniContext = createContext<FavaTaniContextType | null>(null);

interface FavaTaniConditionalProviderProps {
  children: ReactNode;
  config: FavaTaniConfig;
  flags?: Partial<FavaTaniFeatureFlags>;
  disabled?: boolean; // Emergency override
}

export function FavaTaniConditionalProvider({
  children,
  config,
  flags = {},
  disabled = false
}: FavaTaniConditionalProviderProps) {
  // Merge flags with defaults
  const resolvedFlags: FavaTaniFeatureFlags = {
    ...FAVA_TANI_DEFAULT_FLAGS,
    ...flags
  };

  // Emergency disable or feature flag disable
  if (disabled || !resolvedFlags.enabled) {
    return <>{children}</>;
  }

  return (
    <FavaTaniProviderCore config={config} flags={resolvedFlags}>
      {children}
    </FavaTaniProviderCore>
  );
}

interface FavaTaniProviderCoreProps {
  children: ReactNode;
  config: FavaTaniConfig;
  flags: FavaTaniFeatureFlags;
}

function FavaTaniProviderCore({ children, config, flags }: FavaTaniProviderCoreProps) {
  const [state, setState] = useState<FavaTaniState>({
    isOpen: false,
    activeTab: 'tani1',
    config,
    flags
  });

  // URL parameter handling (conditional)
  useEffect(() => {
    if (!flags.components.urlSync) return;

    const handleUrlSync = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const popupParam = config.urlConfig?.popupParam || 'tanipop';
      const tabParam = config.urlConfig?.tabParam || 'tanitab';
      
      const shouldOpen = urlParams.get(popupParam) === 'open';
      const urlTab = urlParams.get(tabParam) as FavaTaniTabId;
      
      setState(prev => ({
        ...prev,
        isOpen: shouldOpen,
        activeTab: urlTab && config.tabs.find(t => t.id === urlTab) ? urlTab : prev.activeTab
      }));
    };

    handleUrlSync();
    window.addEventListener('popstate', handleUrlSync);
    
    return () => window.removeEventListener('popstate', handleUrlSync);
  }, [config, flags.components.urlSync]);

  // localStorage handling (conditional)
  useEffect(() => {
    if (!flags.components.localStorage || !flags.features.tabMemory) return;

    const storageKey = `${config.urlConfig?.storageKey || 'favaTani'}_lastTab`;
    const savedTab = localStorage.getItem(storageKey) as FavaTaniTabId;
    
    if (savedTab && config.tabs.find(t => t.id === savedTab)) {
      setState(prev => ({ ...prev, activeTab: savedTab }));
    }
  }, [config, flags.components.localStorage, flags.features.tabMemory]);

  // Keyboard shortcut handling (conditional)
  useEffect(() => {
    if (!flags.components.keyboardShortcuts) return;

    const handleKeyboard = (event: KeyboardEvent) => {
      // Handle escape key
      if (flags.features.escapeKeyClose && event.key === 'Escape' && state.isOpen) {
        actions.closePopup();
        return;
      }

      // Handle hotkey
      const hotkey = config.button?.hotkey;
      if (hotkey && event.key.toLowerCase() === hotkey.toLowerCase() && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Only if not in input field
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          event.preventDefault();
          actions.togglePopup();
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [state.isOpen, config.button?.hotkey, flags.components.keyboardShortcuts, flags.features.escapeKeyClose]);

  const actions = {
    openPopup: useCallback(() => {
      setState(prev => ({ ...prev, isOpen: true }));
      
      if (flags.components.urlSync) {
        const url = new URL(window.location.href);
        url.searchParams.set(config.urlConfig?.popupParam || 'tanipop', 'open');
        window.history.pushState({}, '', url.toString());
      }
    }, [config, flags.components.urlSync]),

    closePopup: useCallback(() => {
      setState(prev => ({ ...prev, isOpen: false }));
      
      if (flags.components.urlSync) {
        const url = new URL(window.location.href);
        url.searchParams.delete(config.urlConfig?.popupParam || 'tanipop');
        window.history.pushState({}, '', url.toString());
      }
    }, [config, flags.components.urlSync]),

    setActiveTab: useCallback((tabId: FavaTaniTabId) => {
      // Check if tab exists and is visible
      const tab = config.tabs.find(t => t.id === tabId);
      if (!tab || tab.visible === false || tab.disabled) return;

      setState(prev => ({ ...prev, activeTab: tabId }));
      
      // Save to localStorage
      if (flags.components.localStorage && flags.features.tabMemory) {
        const storageKey = `${config.urlConfig?.storageKey || 'favaTani'}_lastTab`;
        localStorage.setItem(storageKey, tabId);
      }

      // Update URL
      if (flags.components.urlSync) {
        const url = new URL(window.location.href);
        url.searchParams.set(config.urlConfig?.tabParam || 'tanitab', tabId);
        window.history.pushState({}, '', url.toString());
      }
    }, [config, flags.components.localStorage, flags.components.urlSync, flags.features.tabMemory]),

    togglePopup: useCallback(() => {
      if (state.isOpen) {
        actions.closePopup();
      } else {
        actions.openPopup();
      }
    }, [state.isOpen]),

    updateConfig: useCallback((newConfig: Partial<FavaTaniConfig>) => {
      setState(prev => ({
        ...prev,
        config: { ...prev.config, ...newConfig }
      }));
    }, []),

    updateFlags: useCallback((newFlags: Partial<FavaTaniFeatureFlags>) => {
      setState(prev => ({
        ...prev,
        flags: { ...prev.flags, ...newFlags }
      }));
    }, []),

    emergencyDisable: useCallback(() => {
      setState(prev => ({
        ...prev,
        isOpen: false,
        flags: { ...prev.flags, enabled: false }
      }));
      
      if (flags.debugging.consoleLogging) {
        console.warn('[FavaTani] Emergency disable activated');
      }
    }, [flags.debugging.consoleLogging])
  };

  const contextValue: FavaTaniContextType = {
    state,
    actions
  };

  return (
    <FavaTaniContext.Provider value={contextValue}>
      {children}
    </FavaTaniContext.Provider>
  );
}

export function useFavaTani(): FavaTaniContextType | null {
  return useContext(FavaTaniContext);
}

// Safe hook that returns null when system is disabled
export function useFavaTaniSafe(): FavaTaniContextType | null {
  const context = useContext(FavaTaniContext);
  
  if (!context || !context.state.flags.enabled) {
    return null;
  }
  
  return context;
}

export default FavaTaniConditionalProvider;