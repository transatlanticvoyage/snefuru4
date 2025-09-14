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
  
  // Medieval chamber visibility state for /bin34/tebnar2 (default to false/hide)
  const [medievalChamberVisible, setMedievalChamberVisible] = useState(false);
  
  // Folate chamber visibility state for /bin34/tebnar2 (default to false/hide)
  const [folateChamberVisible, setFolateChamberVisible] = useState(false);
  
  // New chamber visibility states for /bin34/tebnar2 (all default to true/visible)
  const [entrenchChamberVisible, setEntrenchChamberVisible] = useState(true);
  const [missileChamberVisible, setMissileChamberVisible] = useState(true);
  const [vesicleChamberVisible, setVesicleChamberVisible] = useState(true);
  const [rocketChamberVisible, setRocketChamberVisible] = useState(true);

  useEffect(() => {
    // Check if current page has bezel configuration
    const pagesWithConfig = ['/sitejar4', '/bin34/tebnar2'];
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
        const parsed = JSON.parse(savedVisibility);
        setCopperChamberVisible(parsed);
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

  // Initialize medieval chamber visibility from localStorage for /bin34/tebnar2
  useEffect(() => {
    if (pathname.startsWith('/bin34/tebnar2')) {
      const savedVisibility = localStorage.getItem('tebnar2_medievalChamberVisible');
      if (savedVisibility !== null) {
        setMedievalChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to false (hidden) and save it
        setMedievalChamberVisible(false);
        localStorage.setItem('tebnar2_medievalChamberVisible', JSON.stringify(false));
      }
    }
  }, [pathname]);

  // Initialize folate chamber visibility from localStorage for /bin34/tebnar2
  useEffect(() => {
    if (pathname.startsWith('/bin34/tebnar2')) {
      const savedVisibility = localStorage.getItem('tebnar2_folateChamberVisible');
      if (savedVisibility !== null) {
        setFolateChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to false (hidden) and save it
        setFolateChamberVisible(false);
        localStorage.setItem('tebnar2_folateChamberVisible', JSON.stringify(false));
      }
    }
  }, [pathname]);

  // Handle medieval chamber toggle
  const handleMedievalChamberToggle = (checked: boolean) => {
    setMedievalChamberVisible(checked);
    localStorage.setItem('tebnar2_medievalChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('medievalChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  // Handle folate chamber toggle
  const handleFolateChamberToggle = (checked: boolean) => {
    setFolateChamberVisible(checked);
    localStorage.setItem('tebnar2_folateChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('folateChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  // Initialize entrench chamber visibility from localStorage for /bin34/tebnar2
  useEffect(() => {
    if (pathname.startsWith('/bin34/tebnar2')) {
      const savedVisibility = localStorage.getItem('tebnar2_entrenchChamberVisible');
      if (savedVisibility !== null) {
        setEntrenchChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setEntrenchChamberVisible(true);
        localStorage.setItem('tebnar2_entrenchChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Initialize missile chamber visibility from localStorage for /bin34/tebnar2
  useEffect(() => {
    if (pathname.startsWith('/bin34/tebnar2')) {
      const savedVisibility = localStorage.getItem('tebnar2_missileChamberVisible');
      if (savedVisibility !== null) {
        setMissileChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setMissileChamberVisible(true);
        localStorage.setItem('tebnar2_missileChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Initialize vesicle chamber visibility from localStorage for /bin34/tebnar2
  useEffect(() => {
    if (pathname.startsWith('/bin34/tebnar2')) {
      const savedVisibility = localStorage.getItem('tebnar2_vesicleChamberVisible');
      if (savedVisibility !== null) {
        setVesicleChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setVesicleChamberVisible(true);
        localStorage.setItem('tebnar2_vesicleChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Handle entrench chamber toggle
  const handleEntrenchChamberToggle = (checked: boolean) => {
    setEntrenchChamberVisible(checked);
    localStorage.setItem('tebnar2_entrenchChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('entrenchChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  // Handle missile chamber toggle
  const handleMissileChamberToggle = (checked: boolean) => {
    setMissileChamberVisible(checked);
    localStorage.setItem('tebnar2_missileChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('missileChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  // Handle vesicle chamber toggle
  const handleVesicleChamberToggle = (checked: boolean) => {
    setVesicleChamberVisible(checked);
    localStorage.setItem('tebnar2_vesicleChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('vesicleChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  // Initialize rocket chamber visibility from localStorage for /bin34/tebnar2
  useEffect(() => {
    if (pathname.startsWith('/bin34/tebnar2')) {
      const savedVisibility = localStorage.getItem('tebnar2_rocketChamberVisible');
      if (savedVisibility !== null) {
        setRocketChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setRocketChamberVisible(true);
        localStorage.setItem('tebnar2_rocketChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Handle rocket chamber toggle
  const handleRocketChamberToggle = (checked: boolean) => {
    setRocketChamberVisible(checked);
    localStorage.setItem('tebnar2_rocketChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('rocketChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-start"
      style={{ backgroundColor: 'rgba(0, 0, 128, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-[800px] h-[800px] overflow-auto"
        style={{ marginLeft: '51px' }}
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
              
              {/* /bin34/tebnar2 page specific controls */}
              {pathname.startsWith('/bin34/tebnar2') && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Page Visibility Controls</h3>
                    
                    {/* Medieval Chamber Toggle */}
                    <div className="flex items-center space-x-4">
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={medievalChamberVisible}
                          onChange={(e) => handleMedievalChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      {/* Label Text */}
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        medieval_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the medieval chamber on the tebnar2 page.</p>
                      <p>Current state: <strong>{medievalChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Settings are automatically saved and synchronized across the page</p>
                    </div>

                    {/* Folate Chamber Toggle */}
                    <div className="flex items-center space-x-4 mt-6">
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={folateChamberVisible}
                          onChange={(e) => handleFolateChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      {/* Label Text */}
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        folate_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the folate chamber on the tebnar2 page.</p>
                      <p>Current state: <strong>{folateChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Settings are automatically saved and synchronized across the page</p>
                    </div>

                    {/* Horizontal Rule Separator */}
                    <hr className="my-6 border-gray-300" />

                    {/* Entrench Chamber Toggle */}
                    <div className="flex items-center space-x-4">
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={entrenchChamberVisible}
                          onChange={(e) => handleEntrenchChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      {/* Label Text */}
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        entrench_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the entrench chamber on the tebnar2 page.</p>
                      <p>Current state: <strong>{entrenchChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Settings are automatically saved and synchronized across the page</p>
                    </div>

                    {/* Missile Chamber Toggle */}
                    <div className="flex items-center space-x-4 mt-6">
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={missileChamberVisible}
                          onChange={(e) => handleMissileChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      {/* Label Text */}
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        missile_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the missile chamber on the tebnar2 page.</p>
                      <p>Current state: <strong>{missileChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Settings are automatically saved and synchronized across the page</p>
                    </div>

                    {/* Vesicle Chamber Toggle */}
                    <div className="flex items-center space-x-4 mt-6">
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={vesicleChamberVisible}
                          onChange={(e) => handleVesicleChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      {/* Label Text */}
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        vesicle_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the vesicle chamber on the tebnar2 page.</p>
                      <p>Current state: <strong>{vesicleChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Settings are automatically saved and synchronized across the page</p>
                    </div>

                    {/* Rocket Chamber Toggle */}
                    <div className="flex items-center space-x-4 mt-6">
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rocketChamberVisible}
                          onChange={(e) => handleRocketChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      {/* Label Text */}
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        rocket_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the rocket chamber on the tebnar2 page.</p>
                      <p>This controls the main table control interface with pagination, search, and column management.</p>
                      <p>Current state: <strong>{rocketChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
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