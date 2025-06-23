'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { KPopup1Config } from './KPopup1Config';
import { useKPopup1 } from './hooks/useKPopup1';

interface KPopup1ContextType {
  config: KPopup1Config;
  isOpen: boolean;
  activeTab: string;
  openPopup: () => void;
  closePopup: () => void;
  changeTab: (tabId: string) => void;
}

const KPopup1Context = createContext<KPopup1ContextType | undefined>(undefined);

export function useKPopup1Context() {
  const context = useContext(KPopup1Context);
  if (!context) {
    throw new Error('useKPopup1Context must be used within KPopup1Provider');
  }
  return context;
}

interface KPopup1ProviderProps {
  config: KPopup1Config;
  children: ReactNode;
}

export function KPopup1Provider({ config, children }: KPopup1ProviderProps) {
  const { isOpen, activeTab, openPopup, closePopup, changeTab } = useKPopup1(config);
  
  const value = {
    config,
    isOpen,
    activeTab,
    openPopup,
    closePopup,
    changeTab
  };
  
  return (
    <KPopup1Context.Provider value={value}>
      {children}
    </KPopup1Context.Provider>
  );
}