'use client';

import React, { useState } from 'react';
import PlutoToggleSwitch from './plutoToggleSwitch';

// Sun row slot labels in the specified order
const SUNROWSLOT_LABELS = [
  'horomi',
  'horezno',
  'srs15',
  'srs14',
  'srs13',
  'srs12',
  'srs11',
  'srs10',
  'srs9',
  'srs8',
  'srs7',
  'srs6',
  'srs5',
  'srs4',
  'srs3',
  'srs2',
  'srs1'
];

interface JetstreamUtensilSettings {
  [key: string]: boolean;
}

interface JetstreamUtensilTableProps {
  // For now, no external props needed since there's no functionality
}

export default function JetstreamUtensilTable({}: JetstreamUtensilTableProps) {
  // Local state to manage toggle switches (no external effect for now)
  const [settings, setSettings] = useState<JetstreamUtensilSettings>(() => {
    // Initialize all sunrowslots as false
    const initialSettings: JetstreamUtensilSettings = {};
    SUNROWSLOT_LABELS.forEach(slot => {
      initialSettings[slot] = false;
    });
    return initialSettings;
  });

  const handleToggleChange = (sunrowslot: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [sunrowslot]: value
    }));
  };

  const handleMasterToggle = (showAll: boolean) => {
    const newSettings: JetstreamUtensilSettings = {};
    SUNROWSLOT_LABELS.forEach(slot => {
      newSettings[slot] = showAll;
    });
    setSettings(newSettings);
  };

  // Calculate if all are visible or all are hidden
  const allValues = Object.values(settings);
  const areAllVisible = allValues.every(value => value === true);
  const areAllHidden = allValues.every(value => value === false);

  return (
    <div style={{ border: '1px solid #000', padding: '16px' }}>
      <div style={{ 
        fontWeight: 'bold', 
        fontSize: '16px', 
        marginBottom: '16px' 
      }}>
        jetstream_show_hide_utensil
      </div>
      
      <div style={{
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto',
        border: '1px solid #ccc'
      }}>
        <table style={{ 
          borderCollapse: 'collapse',
          width: '100%'
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
              sunrowslot
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
          {SUNROWSLOT_LABELS.map((sunrowslot) => (
            <tr key={sunrowslot}>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px', 
                fontSize: '16px' 
              }}>
                {sunrowslot}
              </td>
              <td style={{ 
                border: '1px solid #000', 
                padding: '8px', 
                fontSize: '16px',
                textAlign: 'center'
              }}>
                <PlutoToggleSwitch 
                  isOn={settings[sunrowslot]}
                  onChange={(value) => handleToggleChange(sunrowslot, value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}

// Export the constants for potential future use
export { SUNROWSLOT_LABELS };