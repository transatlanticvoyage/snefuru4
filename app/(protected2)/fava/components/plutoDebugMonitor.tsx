'use client';

import React, { useState, useEffect } from 'react';
import { PlutoSettings, DEFAULT_PLUTO_SETTINGS, usePlutoInstrumentControls } from '../hooks/usePlutoSettings';
import PlutoControlTable from './PlutoControlTable';

interface PlutoDebugMonitorProps {
  utg_id?: string | number;
}

type TabId = 'debug' | 'instrument' | 'sarno';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'debug', label: 'Debug' },
  { id: 'instrument', label: 'Instrument' },
  { id: 'sarno', label: 'Utensil (Jetstream)' }
];

export default function PlutoDebugMonitor({ utg_id }: PlutoDebugMonitorProps) {
  const [currentSettings, setCurrentSettings] = useState<PlutoSettings | null>(null);
  const [effectiveSettings, setEffectiveSettings] = useState<PlutoSettings>(DEFAULT_PLUTO_SETTINGS);
  const [storageKey, setStorageKey] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState<boolean>(true); // Default to minimized
  const [activeTab, setActiveTab] = useState<TabId>('debug');
  
  // Get instrument controls at the top level (hooks must be called at component top level)
  const instrumentControls = usePlutoInstrumentControls(utg_id);

  // Load minimized state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('pluto_debug_monitor_minimized');
    if (savedState !== null) {
      setIsMinimized(savedState === 'true');
    }
  }, []);

  // Save minimized state when it changes
  useEffect(() => {
    localStorage.setItem('pluto_debug_monitor_minimized', isMinimized.toString());
  }, [isMinimized]);

  useEffect(() => {
    const key = `fava_pluto_settings_${utg_id || 'default'}`;
    setStorageKey(key);
    
    const updateSettings = () => {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentSettings(parsed);
        setEffectiveSettings({ ...DEFAULT_PLUTO_SETTINGS, ...parsed });
      } else {
        setCurrentSettings(null);
        setEffectiveSettings(DEFAULT_PLUTO_SETTINGS);
      }
    };
    
    // Initial load
    updateSettings();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        updateSettings();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for manual refreshes
    const interval = setInterval(updateSettings, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [utg_id]);

  // Minimized view - top right corner
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#0056b3';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#007bff';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px', // Positioned in upper right corner
          width: '26px',
          height: '26px',
          background: '#007bff',
          border: 'none',
          borderRadius: '4px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 9999,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'all 0.2s ease',
          transform: 'scale(1)'
        }}
        title="Restore Pluto Debug Monitor"
      >
        🔍
      </button>
    );
  }

  const renderDebugContent = () => (
    <>
      <div><strong>Storage Key:</strong> {storageKey}</div>
      <div><strong>Current Settings:</strong></div>
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '5px', 
        borderRadius: '3px',
        fontSize: '10px',
        maxHeight: '200px',
        overflow: 'auto'
      }}>
        {currentSettings ? JSON.stringify(currentSettings, null, 2) : 'No settings found'}
      </pre>
      <div style={{ marginTop: '10px' }}>
        <strong>Chamber States:</strong>
        <div style={{ fontSize: '11px', marginTop: '5px' }}>
          <div>Ocean Classic: {effectiveSettings.ctc_buttons_ocean_classic ? '✅' : '❌'}</div>
          <div>Ocean Enhanced: {effectiveSettings.ctc_buttons_ocean_enhanced ? '✅' : '❌'}</div>
          <div>Shendo Classic: {effectiveSettings.ctc_shendo_classic ? '✅' : '❌'}</div>
          <div>Shendo Enhanced: {effectiveSettings.ctc_shendo_enhanced ? '✅' : '❌'}</div>
          <div>Harpoon Preview: {effectiveSettings.harpoon_preview ? '✅' : '❌'}</div>
          <div>Harpoon Active: {effectiveSettings.harpoon_active ? '✅' : '❌'}</div>
          <div>Row Filters: {effectiveSettings.rowfilters_chamber ? '✅' : '❌'}</div>
          <div>Search Box: {effectiveSettings.searchbox ? '✅' : '❌'}</div>
          <div>Pagination Chief: {effectiveSettings.pagination_specificbar ? '✅' : '❌'}</div>
        </div>
      </div>
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        Auto-refreshes every second
      </div>
    </>
  );

  const renderInstrumentContent = () => {
    return (
      <div style={{ padding: '0' }}> {/* Remove padding to let PlutoControlTable handle its own spacing */}
        <PlutoControlTable
          settings={instrumentControls.settings}
          onToggleChange={instrumentControls.handleToggleChange}
          onMasterToggle={instrumentControls.handleMasterToggle}
          areAllVisible={instrumentControls.areAllVisible}
          areAllHidden={instrumentControls.areAllHidden}
        />
      </div>
    );
  };

  const renderSarnoContent = () => (
    <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
      Utensil (Jetstream) content will be implemented here
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'debug':
        return renderDebugContent();
      case 'instrument':
        return renderInstrumentContent();
      case 'sarno':
        return renderSarnoContent();
      default:
        return renderDebugContent();
    }
  };

  // Full view - top right corner
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#fff', 
      border: '2px solid #007bff', 
      borderRadius: '5px',
      maxWidth: '500px',
      minWidth: '450px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      {/* Minimize button in top right corner */}
      <button
        onClick={() => setIsMinimized(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#0056b3';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#007bff';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          width: '26px',
          height: '26px',
          background: '#007bff',
          border: 'none',
          borderRadius: '4px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          lineHeight: '1',
          padding: '0',
          transition: 'all 0.2s ease',
          transform: 'scale(1)'
        }}
        title="Minimize Pluto Debug Monitor"
      >
        −
      </button>
      
      {/* Header */}
      <div style={{ 
        padding: '10px', 
        paddingRight: '40px',
        borderBottom: '1px solid #e0e0e0' 
      }}>
        <h4 style={{ margin: '0', color: '#007bff' }}>🔍 Pluto Debug Monitor</h4>
      </div>

      {/* Tab Bar */}
      <div style={{ 
        display: 'flex',
        borderBottom: '1px solid #e0e0e0',
        background: '#f8f9fa'
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              background: activeTab === tab.id ? '#007bff' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#007bff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              borderBottom: activeTab === tab.id ? '2px solid #007bff' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = '#e3f2fd';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '10px' }}>
        {renderTabContent()}
      </div>
    </div>
  );
}