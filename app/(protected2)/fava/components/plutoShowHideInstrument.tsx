'use client';

import React, { useState, useEffect } from 'react';
import PlutoToggleSwitch from './plutoToggleSwitch';

interface PlutoSettings {
  ctc_buttons_ocean_classic: boolean;
  ctc_buttons_ocean_enhanced: boolean;
  ctc_shendo_classic: boolean;
  ctc_shendo_enhanced: boolean;
  harpoon_preview: boolean;
  harpoon_active: boolean;
  rowfilters_chamber: boolean;
  searchbox: boolean;
  pagination_specificbar: boolean;
  pagination_qtybar: boolean;
}

const DEFAULT_SETTINGS: PlutoSettings = {
  ctc_buttons_ocean_classic: true,
  ctc_buttons_ocean_enhanced: true,
  ctc_shendo_classic: true,
  ctc_shendo_enhanced: true,
  harpoon_preview: true,
  harpoon_active: true,
  rowfilters_chamber: true,
  searchbox: true,
  pagination_specificbar: true,
  pagination_qtybar: true
};

const CHAMBER_LABELS = [
  'ctc_buttons_ocean_classic',
  'ctc_buttons_ocean_enhanced',
  'ctc_shendo_classic',
  'ctc_shendo_enhanced',
  'harpoon_preview',
  'harpoon_active',
  'rowfilters_chamber',
  'searchbox',
  'pagination_specificbar',
  'pagination_qtybar'
];

// Mapping from internal chamber keys to CSS class names
const CHAMBER_CSS_CLASSES = {
  'ctc_buttons_ocean_classic': '.ocean-classic-chamber',
  'ctc_buttons_ocean_enhanced': '.ocean-enhanced-chamber',
  'ctc_shendo_classic': '.shendo-classic-chamber',
  'ctc_shendo_enhanced': '.shendo-enhanced-chamber',
  'harpoon_preview': '.harpoon-preview-chamber',
  'harpoon_active': '.harpoon-active-chamber',
  'rowfilters_chamber': '.rowfilters-chamber',
  'searchbox': '.searchbox-chamber',
  'pagination_specificbar': '.pagination-specific-chamber',
  'pagination_qtybar': '.pagination-qty-chamber'
};

interface PlutoShowHideInstrumentProps {
  utg_id?: string | number;
}

export default function PlutoShowHideInstrument({ utg_id }: PlutoShowHideInstrumentProps) {
  const [settings, setSettings] = useState<PlutoSettings>(DEFAULT_SETTINGS);
  
  console.log('🔍 [PlutoShowHideInstrument] Component mounted with utg_id:', utg_id, 'type:', typeof utg_id);

  // Generate storage key based on utg_id
  const getStorageKey = () => {
    return `fava_pluto_settings_${utg_id || 'default'}`;
  };

  // Load settings from localStorage on component mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem(getStorageKey());
        if (stored) {
          const parsedSettings = JSON.parse(stored);
          // Merge with defaults to ensure all keys exist
          setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
        }
      } catch (error) {
        console.error('Error loading pluto settings from localStorage:', error);
        setSettings(DEFAULT_SETTINGS);
      }
    };

    loadSettings();
  }, [utg_id]);

  // Save settings to localStorage
  const saveSettings = (newSettings: PlutoSettings) => {
    try {
      const storageKey = getStorageKey();
      console.log('🔍 PlutoShowHideInstrument - Saving to localStorage:', {
        storageKey,
        settings: newSettings,
        stringified: JSON.stringify(newSettings)
      });
      
      localStorage.setItem(storageKey, JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Verify the save worked
      const verification = localStorage.getItem(storageKey);
      console.log('🔍 PlutoShowHideInstrument - Verification after save:', verification);
      
      // Dispatch a storage event for cross-component communication
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(newSettings),
        oldValue: null,
        storageArea: localStorage
      }));
      
      // Dispatch custom event for same-tab communication
      window.dispatchEvent(new CustomEvent('pluto-settings-changed', {
        detail: {
          utg_id: utg_id,
          settings: newSettings,
          storageKey: storageKey
        }
      }));
      
    } catch (error) {
      console.error('Error saving pluto settings to localStorage:', error);
    }
  };

  // Handle toggle change
  const handleToggleChange = (chamber: keyof PlutoSettings, value: boolean) => {
    console.log('🔍 PlutoShowHideInstrument - Toggle changed:', {
      chamber,
      oldValue: settings[chamber],
      newValue: value,
      utg_id,
      storageKey: getStorageKey()
    });
    
    const newSettings = { ...settings, [chamber]: value };
    console.log('🔍 PlutoShowHideInstrument - New settings to save:', newSettings);
    
    saveSettings(newSettings);
  };

  // Handle master toggle (show all / hide all)
  const handleMasterToggle = (showAll: boolean) => {
    console.log('🔍 PlutoShowHideInstrument - Master toggle:', showAll ? 'SHOW ALL' : 'HIDE ALL');
    
    const newSettings: PlutoSettings = {
      ctc_buttons_ocean_classic: showAll,
      ctc_buttons_ocean_enhanced: showAll,
      ctc_shendo_classic: showAll,
      ctc_shendo_enhanced: showAll,
      harpoon_preview: showAll,
      harpoon_active: showAll,
      rowfilters_chamber: showAll,
      searchbox: showAll,
      pagination_specificbar: showAll,
      pagination_qtybar: showAll
    };
    
    console.log('🔍 PlutoShowHideInstrument - Master toggle new settings:', newSettings);
    saveSettings(newSettings);
  };

  // Check if all chambers are currently visible
  const areAllVisible = Object.values(settings).every(value => value === true);
  
  // Check if all chambers are currently hidden
  const areAllHidden = Object.values(settings).every(value => value === false);

  return (
    <div style={{ border: '1px solid #000', padding: '16px' }}>
      <div style={{ 
        fontWeight: 'bold', 
        fontSize: '16px', 
        marginBottom: '16px' 
      }}>
        pluto_show_hide_instrument
      </div>
      
      <table style={{ 
        borderCollapse: 'collapse'
      }}>
        <thead>
          <tr>
            <th style={{ 
              border: '1px solid #000', 
              padding: '8px', 
              fontWeight: 'bold', 
              fontSize: '16px',
              textAlign: 'left'
            }}>
              chamber
            </th>
            <th style={{ 
              border: '1px solid #000', 
              padding: '8px', 
              fontWeight: 'bold', 
              fontSize: '16px',
              textAlign: 'left'
            }}>
              show_hide_button
              <br />
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlutoToggleSwitch 
                  isOn={areAllVisible}
                  onChange={(value) => handleMasterToggle(value)}
                />
                <span style={{ fontSize: '12px', fontWeight: 'normal' }}>
                  {areAllVisible ? 'Show All' : areAllHidden ? 'Hide All' : 'Mixed'}
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {CHAMBER_LABELS.map((chamber) => (
            <tr key={chamber}>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px', 
                fontSize: '16px' 
              }}>
                {CHAMBER_CSS_CLASSES[chamber as keyof typeof CHAMBER_CSS_CLASSES] || chamber}
              </td>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px', 
                fontSize: '16px',
                textAlign: 'center'
              }}>
                <PlutoToggleSwitch 
                  isOn={settings[chamber as keyof PlutoSettings]}
                  onChange={(value) => handleToggleChange(chamber as keyof PlutoSettings, value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Export the settings type and default values for use in other components
export type { PlutoSettings };
export { DEFAULT_SETTINGS };