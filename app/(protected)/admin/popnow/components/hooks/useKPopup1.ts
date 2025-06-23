'use client';

import { useState, useEffect } from 'react';
import { KPopup1Config } from '../KPopup1Config';

export function useKPopup1(config: Partial<KPopup1Config> = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(config.tabs?.[0]?.id || 'kptab1');
  
  // Handle URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const popupParam = config.urlParam || 'kpop';
    
    if (urlParams.get(popupParam) === 'open') {
      setIsOpen(true);
      
      // Check for active tab in URL
      const tabPrefix = config.tabPrefix || 'kptab';
      const tabs = config.tabs || [];
      
      for (const tab of tabs) {
        if (urlParams.get(tab.id) === 'active') {
          setActiveTab(tab.id);
          break;
        }
      }
    }
  }, [config]);
  
  // Update URL when popup state changes
  const updateUrl = (open: boolean, tabId?: string) => {
    const url = new URL(window.location.href);
    const popupParam = config.urlParam || 'kpop';
    const tabPrefix = config.tabPrefix || 'kptab';
    
    if (open) {
      url.searchParams.set(popupParam, 'open');
      
      // Clear all tab params
      const tabs = config.tabs || [];
      tabs.forEach(tab => {
        url.searchParams.delete(tab.id);
      });
      
      // Set active tab
      if (tabId) {
        url.searchParams.set(tabId, 'active');
      }
    } else {
      url.searchParams.delete(popupParam);
      const tabs = config.tabs || [];
      tabs.forEach(tab => {
        url.searchParams.delete(tab.id);
      });
    }
    
    window.history.replaceState({}, '', url.toString());
    window.dispatchEvent(new Event('urlchange'));
  };
  
  const openPopup = () => {
    setIsOpen(true);
    
    // Check localStorage for last active tab
    const storageKey = config.storageKey || 'kpopup1_lastActiveTab';
    const lastTab = localStorage.getItem(storageKey);
    
    if (lastTab && config.tabs?.some(tab => tab.id === lastTab)) {
      setActiveTab(lastTab);
      updateUrl(true, lastTab);
    } else {
      updateUrl(true, activeTab);
    }
  };
  
  const closePopup = () => {
    setIsOpen(false);
    updateUrl(false);
  };
  
  const changeTab = (tabId: string) => {
    setActiveTab(tabId);
    
    // Save to localStorage
    const storageKey = config.storageKey || 'kpopup1_lastActiveTab';
    localStorage.setItem(storageKey, tabId);
    
    updateUrl(true, tabId);
  };
  
  return {
    isOpen,
    activeTab,
    openPopup,
    closePopup,
    changeTab,
    setIsOpen,
    setActiveTab
  };
}