'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface BezelPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BezelPopup({ isOpen, onClose }: BezelPopupProps) {
  const pathname = usePathname();
  const [hasConfig, setHasConfig] = useState(false);

  useEffect(() => {
    // Check if current page has bezel configuration
    // For now, no pages have config - this will be expanded later
    setHasConfig(false);
  }, [pathname]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-[800px] h-[800px] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <h2 className="text-xl font-semibold text-gray-800">Bezel Chamber</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">
          {hasConfig ? (
            <div>
              {/* Future: Page-specific toggle switches and controls will go here */}
              <p className="text-gray-600">Page-specific controls will appear here.</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500 text-center">
                No config set for this page in the bezel system
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 mt-6">
          <p className="text-xs text-gray-400">
            Current page: {pathname}
          </p>
        </div>
      </div>
    </div>
  );
}