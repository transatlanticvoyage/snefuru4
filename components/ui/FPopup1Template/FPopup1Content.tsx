'use client';

import { ReactNode } from 'react';
import { FPopup1ContentProps } from './types';

export const FPopup1Content = ({ tabs, activeTab, children }: FPopup1ContentProps) => {
  // Find the active tab config
  const activeTabConfig = tabs.find(tab => tab.id === activeTab);
  
  return (
    <div className="p-8 h-full overflow-auto">
      {/* Render tab-specific content if defined in config */}
      {activeTabConfig?.content && activeTabConfig.content}
      
      {/* Render children content (for custom implementations) */}
      {children}
      
      {/* Default content if neither config content nor children provided */}
      {!activeTabConfig?.content && !children && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Content for {activeTab}</h3>
          <p className="text-gray-600">This is the content area for {activeTab}.</p>
        </div>
      )}
    </div>
  );
};