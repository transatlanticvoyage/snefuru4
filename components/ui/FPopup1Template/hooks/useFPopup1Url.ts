import { useEffect } from 'react';
import { FPopup1TabId, UseFPopup1UrlProps } from '../types';

export const useFPopup1Url = ({ config, isOpen, activeTab }: UseFPopup1UrlProps) => {
  
  const updatePopupURL = (fpopOpen: boolean, tabActive?: FPopup1TabId) => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    
    if (fpopOpen) {
      url.searchParams.set(config.popupParam, 'open');
      
      // Clear all tab parameters first
      ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7'].forEach(tab => {
        url.searchParams.delete(tab);
      });
      
      // Set the active tab parameter
      if (tabActive) {
        url.searchParams.set(tabActive, 'active');
      } else {
        // Default to ptab1 if no specific tab provided
        url.searchParams.set('ptab1', 'active');
      }
    } else {
      // Remove popup and all tab parameters when popup is closed
      url.searchParams.delete(config.popupParam);
      ['ptab1', 'ptab2', 'ptab3', 'ptab4', 'ptab5', 'ptab6', 'ptab7'].forEach(tab => {
        url.searchParams.delete(tab);
      });
    }
    
    // Update URL without triggering page reload
    window.history.replaceState({}, '', url.toString());
    
    // Trigger custom event to update URL display
    window.dispatchEvent(new Event('urlchange'));
  };

  // Update URL when popup state changes
  useEffect(() => {
    updatePopupURL(isOpen, activeTab);
  }, [isOpen, activeTab]);

  return {
    updatePopupURL
  };
};