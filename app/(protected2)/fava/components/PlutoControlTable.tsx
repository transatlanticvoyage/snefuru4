'use client';

import React from 'react';
import PlutoToggleSwitch from './plutoToggleSwitch';
import { PlutoSettings } from '../hooks/usePlutoSettings';

// Mapping from internal chamber keys to CSS class names
const CHAMBER_CSS_CLASSES = {
  'ctc_buttons_ocean_classic': '.ocean-classic-chamber',
  'ctc_buttons_ocean_classic_2': '.ocean-classic-chamber-2',
  'ctc_buttons_ocean_enhanced': '.ocean-enhanced-chamber',
  'ctc_shendo_classic': '.shendo-classic-chamber',
  'ctc_shendo_enhanced': '.shendo-enhanced-chamber',
  'harpoon_preview': '.harpoon-preview-chamber',
  'harpoon_active': '.harpoon-active-chamber',
  'rowfilters_chamber': '.rowfilters-chamber',
  'searchbox': '.searchbox-chamber',
  'pagination_specificbar': '.pagination-chief-chamber'
};

const CHAMBER_LABELS = [
  'ctc_buttons_ocean_classic',
  'ctc_buttons_ocean_classic_2',
  'ctc_buttons_ocean_enhanced',
  'ctc_shendo_classic',
  'ctc_shendo_enhanced',
  'harpoon_preview',
  'harpoon_active',
  'rowfilters_chamber',
  'searchbox',
  'pagination_specificbar'
];

interface PlutoControlTableProps {
  settings: PlutoSettings;
  onToggleChange: (chamber: keyof PlutoSettings, value: boolean) => void;
  onMasterToggle: (showAll: boolean) => void;
  areAllVisible?: boolean;
  areAllHidden?: boolean;
}

export default function PlutoControlTable({
  settings,
  onToggleChange,
  onMasterToggle,
  areAllVisible = false,
  areAllHidden = false
}: PlutoControlTableProps) {
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
                  onChange={(value) => onMasterToggle(value)}
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
                  onChange={(value) => onToggleChange(chamber as keyof PlutoSettings, value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Export the constants for use in other components
export { CHAMBER_CSS_CLASSES, CHAMBER_LABELS };