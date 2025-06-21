'use client';

import { ReactNode } from 'react';
import { FPopup1Config } from './types';
import { FPopup1Template } from './FPopup1Template';
import { FPopup1Header } from './FPopup1Header';
import { FPopup1Tabs } from './FPopup1Tabs';
import { FPopup1Content } from './FPopup1Content';
import { useFPopup1State } from './hooks/useFPopup1State';
import { useFPopup1Url } from './hooks/useFPopup1Url';

interface FPopup1TemplateProviderProps {
  config: FPopup1Config;
  supabase?: any;
  children?: ReactNode;
}

export const FPopup1TemplateProvider = ({ 
  config, 
  supabase, 
  children 
}: FPopup1TemplateProviderProps) => {
  const {
    isOpen,
    activeTab,
    headerColors,
    currentUrl,
    setIsOpen,
    setActiveTab
  } = useFPopup1State({ config, supabase });

  useFPopup1Url({ 
    config: config.urlConfig, 
    isOpen, 
    activeTab 
  });

  const handleOpen = () => {
    setIsOpen(true);
    
    // Check if URL has specific tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const hasTabInUrl = config.tabs.some(tab => 
      urlParams.get(tab.id) === 'active'
    );
    
    if (!hasTabInUrl) {
      // No tab specified in URL, use last remembered tab from localStorage
      const lastTab = localStorage.getItem(config.urlConfig.storageKey) || 'ptab1';
      setActiveTab(lastTab as any);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
  };

  const { maxWidth = '95vw', maxHeight = '95vh' } = config.modalConfig || {};

  return (
    <>
      {/* Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div 
            className="bg-white w-full h-full rounded-lg shadow-xl relative overflow-hidden"
            style={{
              maxWidth,
              maxHeight
            }}
          >
            {/* Headers with close button */}
            <FPopup1Header
              config={config.headers}
              colors={headerColors}
              currentUrl={currentUrl}
              onClose={handleClose}
              closeButtonConfig={config.closeButtonConfig}
            />
            
            {/* Content area - adjusted to start below headers */}
            <div 
              className="h-full" 
              style={{ paddingTop: `${config.headers.length * 50}px` }}
            >
              {/* Tab Navigation */}
              <FPopup1Tabs
                tabs={config.tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
              
              {/* Tab Content */}
              <FPopup1Content
                tabs={config.tabs}
                activeTab={activeTab}
              >
                {children}
              </FPopup1Content>
            </div>
          </div>
        </div>
      )}
    </>
  );
};