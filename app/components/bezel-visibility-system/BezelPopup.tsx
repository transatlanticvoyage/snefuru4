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
  
  // Bloffer chamber visibility state for /sitejar4
  const [blofferChamberVisible, setBlofferChamberVisible] = useState(false);
  
  // Copper chamber visibility state for /sitejar4 (default to true/show)
  const [copperChamberVisible, setCopperChamberVisible] = useState(true);

  useEffect(() => {
    // Check if current page has bezel configuration
    const pagesWithConfig = ['/sitejar4'];
    setHasConfig(pagesWithConfig.includes(pathname));
  }, [pathname]);

  // Initialize bloffer chamber visibility from localStorage for /sitejar4
  useEffect(() => {
    if (pathname === '/sitejar4') {
      const savedVisibility = localStorage.getItem('sitejar4_blofferChamberVisible');
      if (savedVisibility !== null) {
        setBlofferChamberVisible(JSON.parse(savedVisibility));
      }
    }
  }, [pathname]);

  // Initialize copper chamber visibility from localStorage for /sitejar4
  useEffect(() => {
    if (pathname === '/sitejar4') {
      const savedVisibility = localStorage.getItem('sitejar4_copperChamberVisible');
      if (savedVisibility !== null) {
        setCopperChamberVisible(JSON.parse(savedVisibility));
      } else {
        // If no saved state, set default to true and save it
        setCopperChamberVisible(true);
        localStorage.setItem('sitejar4_copperChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Handle toggle change and save to localStorage
  const handleBlofferChamberToggle = (checked: boolean) => {
    setBlofferChamberVisible(checked);
    localStorage.setItem('sitejar4_blofferChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('blofferChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  // Handle copper chamber toggle
  const handleCopperChamberToggle = (checked: boolean) => {
    setCopperChamberVisible(checked);
    localStorage.setItem('sitejar4_copperChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('copperChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

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
              {/* /sitejar4 page specific controls */}
              {pathname === '/sitejar4' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Page Visibility Controls</h3>
                    
                    {/* Bloffer Chamber Toggle */}
                    <div className="flex items-center space-x-4">
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={blofferChamberVisible}
                          onChange={(e) => handleBlofferChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      {/* Label Text */}
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        div.bloffer_chamber_div
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the bloffer chamber div on the main page.</p>
                      <p>This controls the navigation links section (Sitedori, Drenjari) and chamber control buttons.</p>
                      <p>Current state: <strong>{blofferChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Settings are automatically saved and synchronized across the page</p>
                    </div>

                    {/* Copper Chamber Toggle */}
                    <div className="flex items-center space-x-4 mt-6">
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={copperChamberVisible}
                          onChange={(e) => handleCopperChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      {/* Label Text */}
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        copper_chamber_div
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the copper chamber div on the main page.</p>
                      <p>This controls the search and filter controls section.</p>
                      <p>Current state: <strong>{copperChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Settings are automatically saved and synchronized across the page</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Future: Other page configurations can be added here */}
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