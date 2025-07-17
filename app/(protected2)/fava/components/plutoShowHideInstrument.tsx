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

interface PlutoShowHideInstrumentProps {
  utg_id?: string | number;
}

export default function PlutoShowHideInstrument({ utg_id }: PlutoShowHideInstrumentProps) {
  const [settings, setSettings] = useState<PlutoSettings>(DEFAULT_SETTINGS);

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
      localStorage.setItem(getStorageKey(), JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving pluto settings to localStorage:', error);
    }
  };

  // Handle toggle change
  const handleToggleChange = (chamber: keyof PlutoSettings, value: boolean) => {
    const newSettings = { ...settings, [chamber]: value };
    saveSettings(newSettings);
  };

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
                {chamber}
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