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
  
  // Chamber visibility states for /serpjar (default to true/visible)
  const [mandibleChamberVisible, setMandibleChamberVisible] = useState(true);
  const [sinusChamberVisible, setSinusChamberVisible] = useState(true);
  const [serpjarProtozoicChamberVisible, setSerpjarProtozoicChamberVisible] = useState(true);
  const [serpjarMesozoicChamberVisible, setSerpjarMesozoicChamberVisible] = useState(true);
  
  // Chamber visibility states for /kwjar (default to true/visible)
  const [kwjarMandibleChamberVisible, setKwjarMandibleChamberVisible] = useState(true);
  const [kwjarSinusChamberVisible, setKwjarSinusChamberVisible] = useState(true);
  const [kwjarProtozoicChamberVisible, setKwjarProtozoicChamberVisible] = useState(true);
  const [kwjarMesozoicChamberVisible, setKwjarMesozoicChamberVisible] = useState(true);
  
  // Chamber visibility states for /cnjar1 (default to true/visible)
  const [cnjar1MandibleChamberVisible, setCnjar1MandibleChamberVisible] = useState(true);
  const [cnjar1SinusChamberVisible, setCnjar1SinusChamberVisible] = useState(true);
  const [cnjar1ProtozoicChamberVisible, setCnjar1ProtozoicChamberVisible] = useState(true);
  const [cnjar1MesozoicChamberVisible, setCnjar1MesozoicChamberVisible] = useState(true);

  useEffect(() => {
    // Check if current page has bezel configuration
    const pagesWithConfig = ['/sitejar4', '/bin34/tebnar2', '/serpjar', '/kwjar', '/cnjar1'];
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

  // Initialize mandible chamber visibility from localStorage for /serpjar
  useEffect(() => {
    if (pathname === '/serpjar') {
      const savedVisibility = localStorage.getItem('serpjar_mandibleChamberVisible');
      if (savedVisibility !== null) {
        setMandibleChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setMandibleChamberVisible(true);
        localStorage.setItem('serpjar_mandibleChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Initialize sinus chamber visibility from localStorage for /serpjar
  useEffect(() => {
    if (pathname === '/serpjar') {
      const savedVisibility = localStorage.getItem('serpjar_sinusChamberVisible');
      if (savedVisibility !== null) {
        setSinusChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setSinusChamberVisible(true);
        localStorage.setItem('serpjar_sinusChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Initialize protozoic chamber visibility from localStorage for /serpjar
  useEffect(() => {
    if (pathname === '/serpjar') {
      const savedVisibility = localStorage.getItem('serpjar_protozoicChamberVisible');
      if (savedVisibility !== null) {
        setSerpjarProtozoicChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setSerpjarProtozoicChamberVisible(true);
        localStorage.setItem('serpjar_protozoicChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Initialize mesozoic chamber visibility from localStorage for /serpjar
  useEffect(() => {
    if (pathname === '/serpjar') {
      const savedVisibility = localStorage.getItem('serpjar_mesozoicChamberVisible');
      if (savedVisibility !== null) {
        setSerpjarMesozoicChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setSerpjarMesozoicChamberVisible(true);
        localStorage.setItem('serpjar_mesozoicChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Handle mandible chamber toggle
  const handleMandibleChamberToggle = (checked: boolean) => {
    setMandibleChamberVisible(checked);
    localStorage.setItem('serpjar_mandibleChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('mandibleChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  // Handle sinus chamber toggle
  const handleSinusChamberToggle = (checked: boolean) => {
    setSinusChamberVisible(checked);
    localStorage.setItem('serpjar_sinusChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('sinusChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  // Handle serpjar protozoic chamber toggle
  const handleSerpjarProtozoicChamberToggle = (checked: boolean) => {
    setSerpjarProtozoicChamberVisible(checked);
    localStorage.setItem('serpjar_protozoicChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('serpjarProtozoicChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  // Handle serpjar mesozoic chamber toggle
  const handleSerpjarMesozoicChamberToggle = (checked: boolean) => {
    setSerpjarMesozoicChamberVisible(checked);
    localStorage.setItem('serpjar_mesozoicChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('serpjarMesozoicChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  // Initialize kwjar mandible chamber visibility from localStorage
  useEffect(() => {
    if (pathname === '/kwjar') {
      const savedVisibility = localStorage.getItem('kwjar_mandibleChamberVisible');
      if (savedVisibility !== null) {
        setKwjarMandibleChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setKwjarMandibleChamberVisible(true);
        localStorage.setItem('kwjar_mandibleChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Initialize kwjar sinus chamber visibility from localStorage
  useEffect(() => {
    if (pathname === '/kwjar') {
      const savedVisibility = localStorage.getItem('kwjar_sinusChamberVisible');
      if (savedVisibility !== null) {
        setKwjarSinusChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setKwjarSinusChamberVisible(true);
        localStorage.setItem('kwjar_sinusChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Initialize kwjar protozoic chamber visibility from localStorage
  useEffect(() => {
    if (pathname === '/kwjar') {
      const savedVisibility = localStorage.getItem('kwjar_protozoicChamberVisible');
      if (savedVisibility !== null) {
        setKwjarProtozoicChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setKwjarProtozoicChamberVisible(true);
        localStorage.setItem('kwjar_protozoicChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Initialize kwjar mesozoic chamber visibility from localStorage
  useEffect(() => {
    if (pathname === '/kwjar') {
      const savedVisibility = localStorage.getItem('kwjar_mesozoicChamberVisible');
      if (savedVisibility !== null) {
        setKwjarMesozoicChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setKwjarMesozoicChamberVisible(true);
        localStorage.setItem('kwjar_mesozoicChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Initialize cnjar1 mandible chamber visibility from localStorage
  useEffect(() => {
    if (pathname === '/cnjar1') {
      const savedVisibility = localStorage.getItem('cnjar1_mandibleChamberVisible');
      if (savedVisibility !== null) {
        setCnjar1MandibleChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setCnjar1MandibleChamberVisible(true);
        localStorage.setItem('cnjar1_mandibleChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Initialize cnjar1 sinus chamber visibility from localStorage
  useEffect(() => {
    if (pathname === '/cnjar1') {
      const savedVisibility = localStorage.getItem('cnjar1_sinusChamberVisible');
      if (savedVisibility !== null) {
        setCnjar1SinusChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setCnjar1SinusChamberVisible(true);
        localStorage.setItem('cnjar1_sinusChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Initialize cnjar1 protozoic chamber visibility from localStorage
  useEffect(() => {
    if (pathname === '/cnjar1') {
      const savedVisibility = localStorage.getItem('cnjar1_protozoicChamberVisible');
      if (savedVisibility !== null) {
        setCnjar1ProtozoicChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setCnjar1ProtozoicChamberVisible(true);
        localStorage.setItem('cnjar1_protozoicChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Initialize cnjar1 mesozoic chamber visibility from localStorage
  useEffect(() => {
    if (pathname === '/cnjar1') {
      const savedVisibility = localStorage.getItem('cnjar1_mesozoicChamberVisible');
      if (savedVisibility !== null) {
        setCnjar1MesozoicChamberVisible(JSON.parse(savedVisibility));
      } else {
        // Default to true (visible) and save it
        setCnjar1MesozoicChamberVisible(true);
        localStorage.setItem('cnjar1_mesozoicChamberVisible', JSON.stringify(true));
      }
    }
  }, [pathname]);

  // Handle kwjar mandible chamber toggle
  const handleKwjarMandibleChamberToggle = (checked: boolean) => {
    setKwjarMandibleChamberVisible(checked);
    localStorage.setItem('kwjar_mandibleChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('kwjarMandibleChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  // Handle kwjar sinus chamber toggle
  const handleKwjarSinusChamberToggle = (checked: boolean) => {
    setKwjarSinusChamberVisible(checked);
    localStorage.setItem('kwjar_sinusChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('kwjarSinusChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  // Handle kwjar protozoic chamber toggle
  const handleKwjarProtozoicChamberToggle = (checked: boolean) => {
    setKwjarProtozoicChamberVisible(checked);
    localStorage.setItem('kwjar_protozoicChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('kwjarProtozoicChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  // Handle kwjar mesozoic chamber toggle
  const handleKwjarMesozoicChamberToggle = (checked: boolean) => {
    setKwjarMesozoicChamberVisible(checked);
    localStorage.setItem('kwjar_mesozoicChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('kwjarMesozoicChamberVisibilityChange', { 
      detail: { visible: checked } 
    }));
  };

  // Handle cnjar1 mandible chamber toggle
  const handleCnjar1MandibleChamberToggle = (checked: boolean) => {
    setCnjar1MandibleChamberVisible(checked);
    localStorage.setItem('cnjar1_mandibleChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('cnjar1-chamber-toggle', { 
      detail: { chamber: 'mandible_chamber', visible: checked } 
    }));
  };

  // Handle cnjar1 sinus chamber toggle
  const handleCnjar1SinusChamberToggle = (checked: boolean) => {
    setCnjar1SinusChamberVisible(checked);
    localStorage.setItem('cnjar1_sinusChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('cnjar1-chamber-toggle', { 
      detail: { chamber: 'sinus_chamber', visible: checked } 
    }));
  };

  // Handle cnjar1 protozoic chamber toggle
  const handleCnjar1ProtozoicChamberToggle = (checked: boolean) => {
    setCnjar1ProtozoicChamberVisible(checked);
    localStorage.setItem('cnjar1_protozoicChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('cnjar1-chamber-toggle', { 
      detail: { chamber: 'protozoic_chamber', visible: checked } 
    }));
  };

  // Handle cnjar1 mesozoic chamber toggle
  const handleCnjar1MesozoicChamberToggle = (checked: boolean) => {
    setCnjar1MesozoicChamberVisible(checked);
    localStorage.setItem('cnjar1_mesozoicChamberVisible', JSON.stringify(checked));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('cnjar1-chamber-toggle', { 
      detail: { chamber: 'mesozoic_chamber', visible: checked } 
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
              
              {/* /serpjar page specific controls */}
              {pathname === '/serpjar' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">SERP Page Visibility Controls</h3>
                    
                    {/* Mandible Chamber Toggle */}
                    <div className="flex items-center space-x-4">
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mandibleChamberVisible}
                          onChange={(e) => handleMandibleChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      {/* Label Text */}
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        mandible_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the mandible chamber on the SERP page.</p>
                      <p>This controls the F400/F410 buttons and mode toggle section.</p>
                      <p>Current state: <strong>{mandibleChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Settings are automatically saved and synchronized across the page</p>
                    </div>

                    {/* Sinus Chamber Toggle */}
                    <div className="flex items-center space-x-4 mt-6">
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sinusChamberVisible}
                          onChange={(e) => handleSinusChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      {/* Label Text */}
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        sinus_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the sinus chamber on the SERP page.</p>
                      <p>This controls the SERP Results header and keyword data table.</p>
                      <p>Current state: <strong>{sinusChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Settings are automatically saved and synchronized across the page</p>
                    </div>

                    {/* Protozoic Chamber Toggle */}
                    <div className="flex items-center space-x-4 mt-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={serpjarProtozoicChamberVisible}
                          onChange={(e) => handleSerpjarProtozoicChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        protozoic_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the protozoic chamber on the SERP page.</p>
                      <p>Current state: <strong>{serpjarProtozoicChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                    </div>

                    {/* Mesozoic Chamber Toggle */}
                    <div className="flex items-center space-x-4 mt-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={serpjarMesozoicChamberVisible}
                          onChange={(e) => handleSerpjarMesozoicChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        mesozoic_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the mesozoic chamber on the SERP page.</p>
                      <p>This controls the pagination info and controls section.</p>
                      <p>Current state: <strong>{serpjarMesozoicChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Settings are automatically saved and synchronized across the page</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* /kwjar page specific controls */}
              {pathname === '/kwjar' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Keywords Hub Page Visibility Controls</h3>
                    
                    {/* Mandible Chamber Toggle */}
                    <div className="flex items-center space-x-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={kwjarMandibleChamberVisible}
                          onChange={(e) => handleKwjarMandibleChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        mandible_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the mandible chamber on the Keywords Hub page.</p>
                      <p>Current state: <strong>{kwjarMandibleChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Settings are automatically saved and synchronized across the page</p>
                    </div>

                    {/* Sinus Chamber Toggle */}
                    <div className="flex items-center space-x-4 mt-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={kwjarSinusChamberVisible}
                          onChange={(e) => handleKwjarSinusChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        sinus_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the sinus chamber on the Keywords Hub page.</p>
                      <p>Current state: <strong>{kwjarSinusChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Settings are automatically saved and synchronized across the page</p>
                    </div>

                    {/* Protozoic Chamber Toggle */}
                    <div className="flex items-center space-x-4 mt-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={kwjarProtozoicChamberVisible}
                          onChange={(e) => handleKwjarProtozoicChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        protozoic_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the protozoic chamber on the Keywords Hub page.</p>
                      <p>Current state: <strong>{kwjarProtozoicChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Settings are automatically saved and synchronized across the page</p>
                    </div>

                    {/* Mesozoic Chamber Toggle */}
                    <div className="flex items-center space-x-4 mt-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={kwjarMesozoicChamberVisible}
                          onChange={(e) => handleKwjarMesozoicChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        mesozoic_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the mesozoic chamber on the Keywords Hub page.</p>
                      <p>Current state: <strong>{kwjarMesozoicChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                      <p className="text-xs text-gray-500 mt-1">Settings are automatically saved and synchronized across the page</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* /cnjar1 page specific controls */}
              {pathname === '/cnjar1' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">CNJar1 Page Visibility Controls</h3>
                    
                    {/* Mandible Chamber Toggle */}
                    <div className="flex items-center space-x-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cnjar1MandibleChamberVisible}
                          onChange={(e) => handleCnjar1MandibleChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        mandible_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the mandible chamber on the CNJar1 page.</p>
                      <p>Current state: <strong>{cnjar1MandibleChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                    </div>

                    {/* Sinus Chamber Toggle */}
                    <div className="flex items-center space-x-4 mt-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cnjar1SinusChamberVisible}
                          onChange={(e) => handleCnjar1SinusChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        sinus_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the sinus chamber on the CNJar1 page.</p>
                      <p>Current state: <strong>{cnjar1SinusChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                    </div>

                    {/* Protozoic Chamber Toggle */}
                    <div className="flex items-center space-x-4 mt-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cnjar1ProtozoicChamberVisible}
                          onChange={(e) => handleCnjar1ProtozoicChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        protozoic_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the protozoic chamber on the CNJar1 page.</p>
                      <p>Current state: <strong>{cnjar1ProtozoicChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
                    </div>

                    {/* Mesozoic Chamber Toggle */}
                    <div className="flex items-center space-x-4 mt-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cnjar1MesozoicChamberVisible}
                          onChange={(e) => handleCnjar1MesozoicChamberToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      
                      <div className="font-bold text-black" style={{ fontSize: '16px' }}>
                        mesozoic_chamber
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Toggle visibility of the mesozoic chamber on the CNJar1 page.</p>
                      <p>Current state: <strong>{cnjar1MesozoicChamberVisible ? 'Visible' : 'Hidden'}</strong></p>
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