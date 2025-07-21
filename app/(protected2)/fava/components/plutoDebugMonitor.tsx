'use client';

import React, { useState, useEffect } from 'react';
import { PlutoSettings, DEFAULT_PLUTO_SETTINGS } from '../hooks/usePlutoSettings';

interface PlutoDebugMonitorProps {
  utg_id?: string | number;
}

export default function PlutoDebugMonitor({ utg_id }: PlutoDebugMonitorProps) {
  const [currentSettings, setCurrentSettings] = useState<PlutoSettings | null>(null);
  const [effectiveSettings, setEffectiveSettings] = useState<PlutoSettings>(DEFAULT_PLUTO_SETTINGS);
  const [storageKey, setStorageKey] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

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

  // Minimized view - top left corner
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
          left: '36px', // 10px + 26px margin to avoid overlap with nav toggle
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

  // Full view - top right corner
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#fff', 
      border: '2px solid #007bff', 
      padding: '10px',
      borderRadius: '5px',
      maxWidth: '400px',
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
      
      <h4 style={{ margin: '0 0 10px 0', color: '#007bff', paddingRight: '30px' }}>🔍 Pluto Debug Monitor</h4>
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
          <div>Pagination Specific: {effectiveSettings.pagination_specificbar ? '✅' : '❌'}</div>
          <div>Pagination Qty: {effectiveSettings.pagination_qtybar ? '✅' : '❌'}</div>
        </div>
      </div>
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        Auto-refreshes every second
      </div>
    </div>
  );
}