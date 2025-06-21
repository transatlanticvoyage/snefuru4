'use client';

import { FPopup1Props } from './types';
import { FPopup1Header } from './FPopup1Header';
import { FPopup1Tabs } from './FPopup1Tabs';
import { FPopup1Content } from './FPopup1Content';
import { useFPopup1Url } from './hooks/useFPopup1Url';

export const FPopup1Template = ({ 
  config, 
  isOpen, 
  onClose, 
  children 
}: FPopup1Props) => {
  const { maxWidth = '95vw', maxHeight = '95vh' } = config.modalConfig || {};
  
  if (!isOpen) return null;

  return (
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
          colors={{}} // Will be populated by the parent component
          currentUrl={typeof window !== 'undefined' ? window.location.href : ''}
          onClose={onClose}
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
            activeTab={config.tabs[0]?.id || 'ptab1'}
            onTabChange={() => {}} // Will be handled by parent
          />
          
          {/* Tab Content */}
          <FPopup1Content
            tabs={config.tabs}
            activeTab={config.tabs[0]?.id || 'ptab1'}
          >
            {children}
          </FPopup1Content>
        </div>
      </div>
    </div>
  );
};